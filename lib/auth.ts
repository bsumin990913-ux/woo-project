import "server-only";

import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const COOKIE_NAME = "woo_admin";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30일

function adminPassword(): string | null {
  const pw = process.env.ADMIN_PASSWORD;
  return pw && pw.length > 0 ? pw : null;
}

function secret(): string {
  return process.env.AUTH_SECRET || process.env.ADMIN_PASSWORD || "woo-links-dev-secret";
}

/** 비밀번호가 바뀌면 기존 세션이 자동으로 무효화되도록 지문을 섞는다. */
function passwordFingerprint(): string {
  return crypto.createHash("sha256").update(adminPassword() ?? "").digest("hex").slice(0, 16);
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", secret()).update(payload).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export function verifyPassword(input: string): boolean {
  const pw = adminPassword();
  if (!pw) return false;
  return safeEqual(input, pw);
}

function makeToken(): string {
  const exp = String(Date.now() + MAX_AGE_SECONDS * 1000);
  const payload = `${exp}.${passwordFingerprint()}`;
  return `${exp}.${sign(payload)}`;
}

function verifyToken(token: string | undefined): boolean {
  if (!token) return false;
  const [exp, sig] = token.split(".");
  if (!exp || !sig) return false;
  if (!/^\d+$/.test(exp) || Number(exp) < Date.now()) return false;
  return safeEqual(sig, sign(`${exp}.${passwordFingerprint()}`));
}

/** 서버 액션 / 라우트 핸들러 안에서만 호출 가능 */
export async function createSession(): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, makeToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function isAuthenticated(): Promise<boolean> {
  if (!adminPassword()) return false;
  const store = await cookies();
  return verifyToken(store.get(COOKIE_NAME)?.value);
}

/** 관리자 전용 화면/액션 진입점에서 호출. 미인증이면 /login 으로 보낸다. */
export async function requireAdmin(): Promise<void> {
  if (!(await isAuthenticated())) redirect("/login");
}

export function isAdminPasswordSet(): boolean {
  return adminPassword() !== null;
}
