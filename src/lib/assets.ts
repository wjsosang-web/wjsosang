import fs from "node:fs";
import path from "node:path";

/**
 * public/logo 안에 실제 로고 파일이 있는지 확인한다.
 *
 * 파일을 넣기만 하면 홈페이지에 반영되고, 없으면 임시 마크가 대신 나온다.
 * 빌드 시점에 한 번만 확인하면 되므로 서버 컴포넌트에서만 호출한다.
 */

const LOGO_DIR = path.join(process.cwd(), "public", "logo");

/** 같은 이름의 svg → png → jpg 순으로 찾는다. */
function resolve(basename: string): string | null {
  for (const ext of [".svg", ".png", ".jpg", ".jpeg", ".webp"]) {
    const file = `${basename}${ext}`;
    if (fs.existsSync(path.join(LOGO_DIR, file))) return `/logo/${file}`;
  }
  return null;
}

export interface LogoAssets {
  horizontal: string | null;
  symbol: string | null;
  vertical: string | null;
  wonjuCity: string | null;
}

export function getLogoAssets(): LogoAssets {
  return {
    horizontal: resolve("wj-horizontal"),
    symbol: resolve("wj-symbol"),
    vertical: resolve("wj-vertical"),
    wonjuCity: resolve("wonju-city"),
  };
}

/** public 아래에 파일이 실제로 있는지 확인한다. (예: "/logo/wonju-city.png") */
export function publicFileExists(publicPath: string): boolean {
  const rel = publicPath.replace(/^\//, "");
  return fs.existsSync(path.join(process.cwd(), "public", rel));
}
