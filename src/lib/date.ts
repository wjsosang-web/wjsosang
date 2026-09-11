/**
 * 한국 시간 기준 YYYY-MM-DD.
 *
 * 서버(Vercel)는 UTC 로 돌아간다. 그대로 두면 "오늘"이 바뀌는 시점이
 * 한국 시간 오전 9시가 되어, 매일 새로 섞이는 회원업장 순서나 오늘 행사 알림이
 * 아침 9시에야 바뀐다. 그래서 9시간을 더해 한국 달력 날짜를 쓴다.
 * (브라우저에서 불러도 같은 값이 나와 서버와 어긋나지 않는다.)
 */
export function toDateKey(d: Date): string {
  const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  const m = String(kst.getUTCMonth() + 1).padStart(2, "0");
  const day = String(kst.getUTCDate()).padStart(2, "0");
  return `${kst.getUTCFullYear()}-${m}-${day}`;
}
