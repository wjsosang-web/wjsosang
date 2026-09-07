/** 로컬 시간 기준 YYYY-MM-DD. toISOString 은 UTC 라 날짜가 하루 밀릴 수 있다. */
export function toDateKey(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}
