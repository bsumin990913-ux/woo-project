import type { NextConfig } from "next";

/**
 * 이미지는 Supabase Storage 의 퍼블릭 URL 을 <img> 로 그대로 띄운다.
 * (관리자가 외부 이미지 주소를 직접 붙여넣는 것도 허용하기 위해
 *  next/image 의 remotePatterns 화이트리스트를 사용하지 않는다)
 */
const nextConfig: NextConfig = {
  // 같은 폴더에서 dev 서버를 두 개 띄우면 .next 를 서로 덮어써서 깨진다.
  // NEXT_DIST_DIR 을 주면 빌드 산출물 폴더를 분리할 수 있다. (평소엔 .next 그대로)
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default nextConfig;
