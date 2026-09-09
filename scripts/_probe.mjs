const UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
const BS = String.fromCharCode(92);
for (const sid of ["1176686884", "1932395894", "11577297"]) {
  const r = await fetch(`https://m.place.naver.com/place/${sid}`, { headers: { "user-agent": UA, "accept-language": "ko-KR,ko;q=0.9" } });
  let h = (await r.text()).split(BS + "u002F").join("/");
  const keys = ['"description":"', '"microReview', '"introduction', '"bookingDisplayName'];
  console.log(`\n=== ${sid}`);
  for (const k of keys) {
    const i = h.indexOf(k);
    if (i > 0) console.log(`  [${k}] ${h.slice(i, i+180).replace(/\s+/g," ")}`);
  }
  const og = h.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i)?.[1];
  console.log("  og:description →", og ? og.slice(0,150) : "없음");
}
