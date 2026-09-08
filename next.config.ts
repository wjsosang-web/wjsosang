import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  /**
   * Server Action 으로 보낼 수 있는 크기.
   *
   * 사진은 브라우저에서 저장소로 바로 올리고 폼에는 주소만 담기 때문에(ImageInput)
   * 평소에는 이 값에 걸릴 일이 없다. 배포 환경 자체가 요청 본문을 4.5MB 로 막기
   * 때문에 여기서 아무리 키워도 파일을 폼에 담아 보내는 방식은 통하지 않는다.
   * 자바스크립트가 막힌 환경에서 파일이 그대로 넘어오는 경우를 위해 남겨 둔다.
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
