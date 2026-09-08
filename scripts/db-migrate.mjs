/**
 * 마이그레이션 SQL 을 DB 에 직접 적용한다.
 *
 *   npm run db:migrate            supabase/schema.sql 전체 실행
 *   npm run db:migrate -- 파일경로  특정 파일 실행
 *
 * SUPABASE_DB_URL 이 .env.local 에 있어야 한다.
 */

import pg from "pg";
import { readFileSync } from "node:fs";
import { config } from "dotenv";

config({ path: ".env.local", quiet: true });

const url = process.env.SUPABASE_DB_URL;
if (!url) {
  console.error("SUPABASE_DB_URL 이 .env.local 에 없습니다.");
  process.exit(1);
}

const file = process.argv[2] ?? "supabase/schema.sql";
const sql = readFileSync(file, "utf8");

const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });

// DB 가 보내는 notice(예: storage 권한 안내)를 그대로 보여준다.
client.on("notice", (n) => console.log(`  [알림] ${n.message}`));

await client.connect();
console.log(`${file} 실행 중...`);

try {
  await client.query(sql);
  console.log("완료");
} catch (e) {
  console.error(`실패: ${e.message}`);
  if (e.position) console.error(`  위치: ${e.position}번째 글자 부근`);
  process.exitCode = 1;
} finally {
  await client.end();
}
