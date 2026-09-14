/**
 * 가이드북 엑셀 만들기.
 *
 *   node 가이드북/build.mjs
 *
 * 내용은 data-1 ~ data-3 에 나눠 두었다. 한 파일에 다 넣으면 고칠 때 찾기 어렵다.
 */

import ExcelJS from "exceljs";
import { 시작, 기획질문, 메뉴구성 } from "./data-1.mjs";
import { 기능목록, 관리자 } from "./data-2.mjs";
import { 연동절차, 환경변수, DB설계, 함정노트, 일정표, 의뢰문 } from "./data-3.mjs";

const FONT = "맑은 고딕";
const 머리색 = "FF16413A"; // 짙은 초록
const 채울칸색 = "FFFFF6D6"; // 옅은 노랑 — 대표님이 채우실 칸
const 줄무늬색 = "FFF7F9F8";

const wb = new ExcelJS.Workbook();
wb.creator = "원주청년소상공인협회";
wb.created = new Date();

/** 모든 시트에 공통으로 거는 모양 */
function makeSheet(name, spec, { title, intro }) {
  const ws = wb.addWorksheet(name, {
    views: [{ state: "frozen", ySplit: 3 }],
    properties: { defaultRowHeight: 18 },
  });

  ws.columns = spec.columns.map((c) => ({ key: c.key, width: c.width }));

  // 1줄 — 제목
  ws.mergeCells(1, 1, 1, spec.columns.length);
  const titleCell = ws.getCell(1, 1);
  titleCell.value = title;
  titleCell.font = { name: FONT, size: 15, bold: true, color: { argb: "FFFFFFFF" } };
  titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: 머리색 } };
  titleCell.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  ws.getRow(1).height = 30;

  // 2줄 — 설명
  ws.mergeCells(2, 1, 2, spec.columns.length);
  const introCell = ws.getCell(2, 1);
  introCell.value = intro;
  introCell.font = { name: FONT, size: 10, color: { argb: "FF5B6B65" } };
  introCell.alignment = { vertical: "middle", horizontal: "left", indent: 1, wrapText: true };
  ws.getRow(2).height = 26;

  // 3줄 — 칸 이름
  const head = ws.getRow(3);
  spec.columns.forEach((c, i) => {
    const cell = head.getCell(i + 1);
    cell.value = c.header;
    cell.font = { name: FONT, size: 10.5, bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2F5D52" } };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cell.border = { bottom: { style: "thin", color: { argb: "FF16413A" } } };
  });
  head.height = 24;

  // 내용
  spec.rows.forEach((row, r) => {
    const line = ws.getRow(4 + r);
    // 내용이 없는 칸까지 돌아야 한다. 채우실 칸(노란 칸)은 원래 비어 있어서,
    // 값이 있는 칸만 돌면 정작 채울 자리에 표시가 안 붙는다.
    spec.columns.forEach((_, i) => {
      const value = row[i] ?? "";
      const cell = line.getCell(i + 1);
      cell.value = value;
      cell.font = { name: FONT, size: 10 };
      cell.alignment = { vertical: "top", wrapText: true, horizontal: "left" };
      cell.border = { bottom: { style: "hair", color: { argb: "FFDDE5E1" } } };

      if (r % 2 === 1) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: 줄무늬색 } };
      }
      // 대표님이 채우실 칸은 노랗게
      if (spec.columns[i]?.input) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: 채울칸색 } };
        cell.border = {
          ...cell.border,
          left: { style: "thin", color: { argb: "FFE0B94A" } },
          right: { style: "thin", color: { argb: "FFE0B94A" } },
        };
      }
      // 필요도가 '필수' 면 눈에 띄게
      if (spec.columns[i]?.key === "need" && value === "필수") {
        cell.font = { name: FONT, size: 10, bold: true, color: { argb: "FFB83227" } };
      }
    });
  });

  ws.autoFilter = {
    from: { row: 3, column: 1 },
    to: { row: 3 + spec.rows.length, column: spec.columns.length },
  };

  // 메모가 있으면 표 아래에 붙인다
  if (spec.note) {
    const start = 3 + spec.rows.length + 2;
    spec.note.forEach((line, i) => {
      ws.mergeCells(start + i, 1, start + i, Math.min(4, spec.columns.length));
      const cell = ws.getCell(start + i, 1);
      cell.value = line;
      cell.font = {
        name: FONT,
        size: 10,
        bold: i === 0,
        color: { argb: i === 0 ? "FF16413A" : "FF3A4A44" },
      };
      cell.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
    });
  }

  return ws;
}

/* ------------------------------------------------------------------ */

makeSheet("00_시작", 시작, {
  title: "홈페이지 만들기 가이드북",
  intro:
    "원주청년소상공인협회 홈페이지를 만들며 실제로 겪은 것을 정리했습니다. 노란 칸을 채워서 그대로 주시면 됩니다.",
});

makeSheet("01_기획질문", 기획질문, {
  title: "① 먼저 정할 것",
  intro: "만들기 전에 답해야 할 것들입니다. 여기서 정하지 않으면 만들다가 갈아엎게 됩니다.",
});

makeSheet("02_메뉴구성", 메뉴구성, {
  title: "② 메뉴와 화면 구성",
  intro: "메뉴별로 어떤 구역이 들어가는지. [넣을까?] 칸에 O / X / 나중에 를 적으세요.",
});

makeSheet("03_기능목록", 기능목록, {
  title: "③ 기능 고르기 — 이 탭이 곧 발주서입니다",
  intro:
    "넣을 것에 O, 뺄 것에 X. 예상시간을 더하면 전체 기간이 나옵니다. 맨 아래 빈 줄에 직접 추가하셔도 됩니다.",
});

makeSheet("04_관리자", 관리자, {
  title: "④ 관리자 화면",
  intro: "누가 무엇을 직접 고칠 수 있어야 하는지. 자주 바뀌는 것만 고르는 편이 좋습니다.",
});

makeSheet("05_연동절차", 연동절차, {
  title: "⑤ 계정 만들고 연결하기",
  intro: "위에서부터 차례로. 처음이면 여기가 제일 막히는 곳입니다. 끝낸 것은 [완료] 칸에 O.",
});

makeSheet("06_환경변수", 환경변수, {
  title: "⑥ 열쇠값(환경변수)",
  intro: "Vercel 에 넣는 값들입니다. 빠뜨리면 그 기능만 조용히 안 돕니다.",
});

makeSheet("07_DB설계", DB설계, {
  title: "⑦ 자료 표 구조",
  intro: "나중에 바꾸기 제일 어려운 부분입니다. 처음에 잘 잡아야 합니다.",
});

makeSheet("08_함정노트", 함정노트, {
  title: "⑧ 실제로 겪은 문제와 해결",
  intro:
    "이 탭이 시간을 가장 많이 아껴줍니다. 원청협 홈페이지를 만들며 실제로 막혔던 것들입니다.",
});

makeSheet("09_일정표", 일정표, {
  title: "⑨ 1~2일 작업 순서",
  intro: "시작 전 준비가 끝나 있으면 이틀이면 됩니다. 준비가 안 되면 일주일이 걸립니다.",
});

makeSheet("10_의뢰문", 의뢰문, {
  title: "⑩ 한 번에 말하기",
  intro: "이 칸을 채워서 파일과 함께 주시면 되묻는 일이 거의 없어집니다.",
});

/* 기능 고른 개수를 00_시작 에 요약으로 붙인다 */
{
  const ws = wb.getWorksheet("00_시작");
  const 끝 = 3 + 기능목록.rows.length;
  const base = 3 + 시작.rows.length + 2 + 시작.note.length + 2;

  ws.mergeCells(base, 1, base, 4);
  const head = ws.getCell(base, 1);
  head.value = "지금까지 고른 기능 (03_기능목록 탭을 채우면 자동으로 셉니다)";
  head.font = { name: FONT, size: 11, bold: true, color: { argb: "FF16413A" } };
  head.alignment = { indent: 1 };

  // 아직 아무것도 안 채운 상태의 값. 엑셀에서 여시면 이 값이 보이고,
  // 03_기능목록 을 채우는 순간 수식이 다시 계산된다.
  const 고를수있는기능 = 기능목록.rows.filter((r) =>
    ["필수", "권장", "선택"].includes(r[3]),
  ).length;

  const 셀 = (col) => `'03_기능목록'!$${col}$4:$${col}$${끝}`;
  const 정한기능 = `COUNTIF(${셀("I")},"O")+COUNTIF(${셀("I")},"X")`;

  const 항목 = [
    ["넣기로 한 기능", `COUNTIF(${셀("I")},"O")`, 0],
    ["빼기로 한 기능", `COUNTIF(${셀("I")},"X")`, 0],
    [
      "아직 안 정한 기능",
      `COUNTIF(${셀("D")},"필수")+COUNTIF(${셀("D")},"권장")+COUNTIF(${셀("D")},"선택")-(${정한기능})`,
      고를수있는기능,
    ],
  ];

  항목.forEach(([label, formula, result], i) => {
    const r = base + 1 + i;
    const a = ws.getCell(r, 1);
    a.value = label;
    a.font = { name: FONT, size: 10 };
    a.alignment = { indent: 1 };

    const b = ws.getCell(r, 2);
    b.value = { formula, result };
    b.font = { name: FONT, size: 11, bold: true, color: { argb: "FF0F7A63" } };
    b.alignment = { horizontal: "left", indent: 1 };
    b.numFmt = '0"개"';
  });
}

const out = "가이드북/홈페이지_구축_가이드북.xlsx";
await wb.xlsx.writeFile(out);
console.log("만들었습니다:", out);
console.log("탭:", wb.worksheets.map((w) => w.name).join(" · "));
