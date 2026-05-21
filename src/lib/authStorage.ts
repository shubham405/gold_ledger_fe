import type { AuthUser } from '../types/auth';

const TOKEN_KEY = 'goldledger_token';
const USER_KEY = 'goldledger_user';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function getStoredUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function setStoredUser(user: AuthUser): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearStoredUser(): void {
  localStorage.removeItem(USER_KEY);
}

export function clearAuth(): void {
  clearToken();
  clearStoredUser();
}

/** True only when both token and user profile exist in storage. */
export function hasStoredSession(): boolean {
  return Boolean(getToken() && getStoredUser());
}

const PUBLIC_PATHS = ['/login', '/register', '/register/account'];

export function isPublicPath(path: string): boolean {
  return PUBLIC_PATHS.some((p) => path === p || path.startsWith(`${p}/`));
}

export function authUserFromResponse(res: {
  shopUserId: number;
  email: string;
  shopName: string;
  ownerName: string;
  phone?: string;
  active?: boolean;
}): AuthUser {
  return {
    shopUserId: res.shopUserId,
    email: res.email,
    shopName: res.shopName,
    ownerName: res.ownerName,
    phone: res.phone,
    active: res.active ?? false,
  };
}
