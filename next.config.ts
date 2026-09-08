import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  /**
   * Server Action 으로 보낼 수 있는 크기.
   * 기본값 1MB 로는 사진 몇 장만 올려도 걸린다.
   * 브라우저에서 미리 줄여 보내지만(ImageInput), 원본이 큰 경우를 감안해 넉넉히 잡는다.
   */
  experimental: {
    serverActions: { bodySizeLimit: "20mb" },
  },

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
