import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  /**
   * src/lib/assets.ts 가 public/logo 안에 실제 로고 파일이 있는지 fs 로 확인한다.
   * Vercel 같은 서버리스 환경은 필요한 파일만 골라 담기 때문에,
   * 명시하지 않으면 public 폴더가 함수 번들에 들어가지 않아
   * 로고가 있는데도 없는 것으로 판단해 임시 마크가 나온다.
   */
  outputFileTracingIncludes: {
    "/**": ["./public/logo/**"],
  },
};

export default nextConfig;
