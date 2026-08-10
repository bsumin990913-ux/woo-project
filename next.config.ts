import type { NextConfig } from "next";

/**
 * 이미지는 Supabase Storage 의 퍼블릭 URL 을 <img> 로 그대로 띄운다.
 * (관리자가 외부 이미지 주소를 직접 붙여넣는 것도 허용하기 위해
 *  next/image 의 remotePatterns 화이트리스트를 사용하지 않는다)
 */
const nextConfig: NextConfig = {};

export default nextConfig;
