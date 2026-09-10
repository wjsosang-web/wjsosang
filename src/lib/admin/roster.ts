import * as XLSX from "xlsx";

/**
 * 관리국이 쓰는 회원 엑셀을 읽는다.
 *
 * 해마다 1월에 갱신하면서 들어오는 분과 나가는 분이 한꺼번에 바뀐다.
 * 그때 엑셀을 통째로 올리면 명단을 맞춰주는 것이 목적이다.
 *
 * 엑셀 서식은 해마다 조금씩 달라진다. 그래서 칸 위치를 정해두지 않고
 * 머리글 이름으로 찾는다. "이름"이든 "성명"이든 "회원명"이든 받아준다.
 * 머리글 줄이 몇 번째인지도 모르므로, 이름 칸이 있는 줄을 찾아 그 아래부터 읽는다.
 */

export interface RosterRow {
  name: string;
  phone: string | null;
  shop: string | null;
  industry: string | null;
  district: string | null;
  email: string | null;
  /** 엑셀에서 몇 번째 줄이었는지 — 문제가 있을 때 알려주려고 */
  line: number;
}

/** 같은 뜻으로 쓰이는 머리글들. 앞에 있을수록 우선한다. */
const HEADERS: Record<keyof Omit<RosterRow, "line">, string[]> = {
  name: ["성함", "성명", "회원명", "대표자명", "대표자", "대표님", "이름"],
  phone: ["연락처", "전화번호", "휴대폰", "핸드폰", "전화", "번호"],
  shop: ["업장명", "상호", "상호명", "업체명", "사업장", "회사명"],
  industry: ["업종", "분류", "업태", "종목"],
  district: ["법정동", "지역", "동", "주소"],
  email: ["이메일", "메일", "email"],
};

const clean = (v: unknown): string => String(v ?? "").replace(/\s+/g, " ").trim();

/** 전화번호를 010-0000-0000 꼴로 맞춘다. 엑셀에서 앞의 0이 날아간 것도 되살린다. */
export function normalizePhone(raw: unknown): string | null {
  let digits = clean(raw).replace(/[^0-9]/g, "");
  if (!digits) return null;

  // 엑셀이 숫자로 읽어 앞의 0 이 사라진 경우 (1012345678)
  if (digits.length === 10 && digits.startsWith("10")) digits = "0" + digits;
  if (digits.length < 9 || digits.length > 11) return clean(raw) || null;

  if (digits.length === 11) return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  if (digits.length === 10) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  return digits;
}

export interface ParseResult {
  rows: RosterRow[];
  /** 어떤 칸을 무엇으로 읽었는지 — 화면에서 확인시켜 준다 */
  mapping: Record<string, string>;
  warnings: string[];
}

export function parseRoster(buffer: ArrayBuffer): ParseResult {
  const book = XLSX.read(buffer, { type: "array" });
  const sheet = book.Sheets[book.SheetNames[0]];

  if (!sheet) return { rows: [], mapping: {}, warnings: ["엑셀에서 시트를 찾지 못했습니다."] };

  const grid = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    blankrows: false,
    defval: "",
  });

  // 이름 칸이 들어 있는 줄을 머리글로 본다.
  //
  // 머리글이 "이름" 한 단어가 아닌 경우가 많다. 설문 도구로 받은 표는
  // "참석하신 대표님 성함" 처럼 문장으로 되어 있다.
  // 그래서 정확히 같은 줄을 먼저 찾고, 없으면 이름 낱말을 품은 줄을 찾는다.
  const hasCell = (row: unknown[], test: (cell: string) => boolean) =>
    row.filter((c) => clean(c)).length >= 2 && row.some((c) => test(clean(c)));

  let headerLine = grid.findIndex((row) =>
    hasCell(row, (cell) => HEADERS.name.includes(cell)),
  );

  if (headerLine < 0) {
    headerLine = grid.findIndex((row) =>
      hasCell(row, (cell) => HEADERS.name.some((n) => cell.includes(n))),
    );
  }

  if (headerLine < 0) {
    return {
      rows: [],
      mapping: {},
      warnings: [
        "이름 칸을 찾지 못했습니다. 첫 줄에 '이름' 또는 '성명' 이 들어간 표인지 확인해 주세요.",
      ],
    };
  }

  const header = grid[headerLine].map(clean);
  const mapping: Record<string, string> = {};
  const columnOf: Partial<Record<keyof typeof HEADERS, number>> = {};
  const used = new Set<number>();

  /**
   * 머리글을 칸에 맞춘다.
   *
   * 조심할 점이 두 가지 있다.
   *
   * 하나. 낱말이 여러 칸에 걸린다. "사업장 이름은??" 에도 '이름'이 들어 있어서
   * 그냥 찾으면 상호가 사람 이름으로 잡힌다. 그래서 뜻이 분명한 낱말(성함)을
   * 먼저 보고, 애매한 낱말은 나중에 본다. 이미 쓴 칸은 다시 쓰지 않는다.
   *
   * 둘. 설문 표에는 동의서 문단이 통째로 머리글에 들어 있다. 거기에 '휴대폰번호'
   * 같은 말이 섞여 연락처 칸으로 잡힌다. 그래서 긴 머리글은 낱말 포함으로
   * 맞추지 않는다.
   */
  const MAX_FUZZY_HEADER = 30;

  const FIELD_ORDER: (keyof typeof HEADERS)[] = [
    "name",
    "shop",
    "phone",
    "email",
    "industry",
    "district",
  ];

  for (const field of FIELD_ORDER) {
    const names = HEADERS[field];

    // 1단계: 머리글이 낱말과 정확히 같은 칸
    let index = header.findIndex((h, i) => !used.has(i) && names.includes(h));

    // 2단계: 낱말을 품은 칸. 앞에 적힌 낱말일수록 먼저 본다.
    if (index < 0) {
      for (const word of names) {
        index = header.findIndex(
          (h, i) => !used.has(i) && h.length > 0 && h.length <= MAX_FUZZY_HEADER && h.includes(word),
        );
        if (index >= 0) break;
      }
    }

    if (index >= 0) {
      columnOf[field] = index;
      mapping[field] = header[index];
      used.add(index);
    }
  }

  const warnings: string[] = [];
  if (columnOf.phone === undefined) {
    warnings.push("연락처 칸을 찾지 못했습니다. 이름만 읽습니다.");
  }

  const rows: RosterRow[] = [];
  const seen = new Set<string>();

  for (let i = headerLine + 1; i < grid.length; i += 1) {
    const row = grid[i];
    const pick = (f: keyof typeof HEADERS) =>
      columnOf[f] === undefined ? null : clean(row[columnOf[f] as number]) || null;

    const name = pick("name");
    if (!name) continue;

    // 같은 사람이 두 줄에 있으면 뒤엣것을 무시한다
    const key = name + "|" + (normalizePhone(pick("phone")) ?? "");
    if (seen.has(key)) {
      warnings.push(`${i + 1}번째 줄: ${name} 이 중복되어 건너뛰었습니다.`);
      continue;
    }
    seen.add(key);

    rows.push({
      name,
      phone: normalizePhone(pick("phone")),
      shop: pick("shop"),
      industry: pick("industry"),
      district: pick("district")?.split(" ")[0] ?? null,
      email: pick("email"),
      line: i + 1,
    });
  }

  if (rows.length === 0) warnings.push("읽을 수 있는 회원이 없습니다.");

  return { rows, mapping, warnings };
}

/** 회원 명단을 엑셀로 내보낸다 */
export function buildRosterExcel(
  rows: Record<string, string | number | null>[],
): Uint8Array {
  const sheet = XLSX.utils.json_to_sheet(rows);
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, "회원명단");
  return XLSX.write(book, { type: "array", bookType: "xlsx" }) as Uint8Array;
}
