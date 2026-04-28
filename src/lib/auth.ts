const TOKEN_KEY = 'garagex_token';
const REFRESH_TOKEN_KEY = 'garagex_refresh_token';
const USER_KEY = 'garagex_user';
const MY_CUSTOMER_IDS_KEY = 'garagex_my_customer_ids';

export interface StoredUser {
  userName: string;
  email: string;
  fullName: string;
  roles: string[];
}

// ── JWT decode ────────────────────────────────────────────────────────────────
function parseJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64).split('').map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
    );
    return JSON.parse(json);
  } catch { return null; }
}

const ROLE_CLAIM = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';

function extractRolesFromToken(token: string): string[] {
  const payload = parseJwtPayload(token);
  if (!payload) return [];
  const raw = payload[ROLE_CLAIM] ?? payload['role'] ?? payload['roles'];
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(String);
  return [String(raw)];
}
// ─────────────────────────────────────────────────────────────────────────────

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function getUser(): StoredUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw) as StoredUser; } catch { return null; }
}

export function getRoles(): string[] {
  const user = getUser();
  if (user?.roles?.length) return user.roles;
  const token = getToken();
  if (token) return extractRolesFromToken(token);
  return [];
}

export function isAdmin(): boolean {
  return getRoles().some((r) => r.toLowerCase() === 'admin');
}

export function hasRole(role: string): boolean {
  return getRoles().some((r) => r.toLowerCase() === role.toLowerCase());
}

// My customer IDs (set after login by fetching customer list)
export function getMyCustomerIds(): number[] {
  try {
    const raw = localStorage.getItem(MY_CUSTOMER_IDS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function setMyCustomerIds(ids: number[]): void {
  localStorage.setItem(MY_CUSTOMER_IDS_KEY, JSON.stringify(ids));
}

export function setAuth(
  token: string,
  refreshToken: string,
  user: Omit<StoredUser, 'roles'> & { roles?: string[] }
): void {
  const rolesFromToken = extractRolesFromToken(token);
  const roles = rolesFromToken.length > 0 ? rolesFromToken : (user.roles ?? []);
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  localStorage.setItem(USER_KEY, JSON.stringify({ ...user, roles }));
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(MY_CUSTOMER_IDS_KEY);
}
