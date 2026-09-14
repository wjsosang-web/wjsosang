/**
 * 퓨니코드 도메인을 한글로 되돌린다.
 *
 * "원주청년소상공인협회.com" 은 실제 통신에서
 * "xn--ob0bs5f49qgxas6q62aq1f9zklywf9a.com" 으로 바뀐다.
 * 브라우저도, Vercel 설정 화면도, 요청에 실려 오는 호스트도 모두 이 형태다.
 * 그래서 우리가 만드는 주소에 그 글자가 섞여 들어가기 쉽다.
 *
 * 회원 눈에는 한글이어야 한다. 단톡방에 xn-- 로 시작하는 주소를 올리면
 * 피싱 링크로 오해받고, 로그인한 뒤 주소창에 박혀 있으면 남의 사이트 같다.
 *
 * 설정값에 어느 형태를 넣어 두었든 한글로 보여줄 수 있도록 여기서 되돌린다.
 * 사람이 설정을 정확히 넣어야만 제대로 나오는 구조는 언젠가 어긋난다.
 *
 * 알고리즘은 RFC 3492(Punycode) 의 복호 절차 그대로다.
 * Node 의 punycode 모듈은 오래전에 지원이 끊겨서 직접 둔다.
 */

const BASE = 36;
const TMIN = 1;
const TMAX = 26;
const SKEW = 38;
const DAMP = 700;
const INITIAL_BIAS = 72;
const INITIAL_N = 128;

/** a~z → 0~25, 0~9 → 26~35. 그 밖의 글자는 범위 밖 값을 돌려준다. */
function digitOf(code: number): number {
  if (code >= 0x30 && code <= 0x39) return code - 0x30 + 26; // 0-9
  if (code >= 0x61 && code <= 0x7a) return code - 0x61; // a-z
  if (code >= 0x41 && code <= 0x5a) return code - 0x41; // A-Z
  return BASE;
}

function adapt(delta: number, numPoints: number, firstTime: boolean): number {
  let d = firstTime ? Math.floor(delta / DAMP) : delta >> 1;
  d += Math.floor(d / numPoints);

  let k = 0;
  while (d > ((BASE - TMIN) * TMAX) >> 1) {
    d = Math.floor(d / (BASE - TMIN));
    k += BASE;
  }

  return k + Math.floor(((BASE - TMIN + 1) * d) / (d + SKEW));
}

/** "ob0bs5f49..." 한 조각을 원래 글자로. 못 풀면 예외를 던진다. */
function decodeLabel(input: string): string {
  const output: number[] = [];
  let n = INITIAL_N;
  let i = 0;
  let bias = INITIAL_BIAS;

  const delimiter = input.lastIndexOf("-");
  if (delimiter > 0) {
    for (let j = 0; j < delimiter; j += 1) output.push(input.charCodeAt(j));
  }

  let index = delimiter > 0 ? delimiter + 1 : 0;

  while (index < input.length) {
    const oldi = i;
    let w = 1;

    for (let k = BASE; ; k += BASE) {
      if (index >= input.length) throw new Error("퓨니코드가 중간에 끊겼습니다");

      const digit = digitOf(input.charCodeAt(index));
      index += 1;
      if (digit >= BASE) throw new Error("퓨니코드에 쓸 수 없는 글자가 있습니다");

      i += digit * w;

      const t = k <= bias ? TMIN : k >= bias + TMAX ? TMAX : k - bias;
      if (digit < t) break;

      w *= BASE - t;
    }

    const outLength = output.length + 1;
    bias = adapt(i - oldi, outLength, oldi === 0);
    n += Math.floor(i / outLength);
    i %= outLength;

    output.splice(i, 0, n);
    i += 1;
  }

  return String.fromCodePoint(...output);
}

/** 도메인 전체를 한글로. 되돌릴 수 없는 조각은 그대로 둔다. */
export function toUnicodeHost(host: string): string {
  if (!host.includes("xn--")) return host;

  return host
    .split(".")
    .map((label) => {
      if (!label.toLowerCase().startsWith("xn--")) return label;
      try {
        return decodeLabel(label.slice(4));
      } catch {
        // 못 풀면 원래 글자를 그대로 둔다. 주소가 깨지는 것보다 낫다.
        return label;
      }
    })
    .join(".");
}

/** 주소 전체에서 도메인 부분만 한글로 바꾼다. */
export function toUnicodeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const unicodeHost = toUnicodeHost(parsed.hostname);
    if (unicodeHost === parsed.hostname) return url;
    return url.replace(parsed.hostname, unicodeHost);
  } catch {
    return url;
  }
}
