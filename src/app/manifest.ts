import type { MetadataRoute } from "next";
import { getLogoAssets } from "@/lib/assets";

/**
 * 홈화면에 추가했을 때 앱처럼 열리게 하는 설정.
 *
 * 아이콘은 public/logo 의 심볼을 쓴다. 파일이 없으면 아이콘 없이 동작한다.
 * 푸시 알림은 여기까지로는 되지 않는다 — 별도 작업이 필요하다.
 */
export default function manifest(): MetadataRoute.Manifest {
  const logo = getLogoAssets();
  const icon = logo.symbol ?? logo.horizontal;

  return {
    name: "원주청년소상공인협회",
    short_name: "원청협",
    description: "원주에서 청년으로, 소상공인으로 살아가는 사람들.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0f9e80",
    lang: "ko",
    icons: icon
      ? [
          { src: icon, sizes: "192x192", type: "image/png", purpose: "any" },
          { src: icon, sizes: "512x512", type: "image/png", purpose: "any" },
        ]
      : [],
  };
}
