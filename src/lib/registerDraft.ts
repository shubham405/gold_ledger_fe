export interface RegisterDraft {
  shopName: string;
  ownerName: string;
  phone?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

const KEY = 'goldledger_register_draft';

export function saveRegisterDraft(draft: RegisterDraft): void {
  sessionStorage.setItem(KEY, JSON.stringify(draft));
}

export function mergeRegisterDraft(patch: Partial<RegisterDraft>): void {
  const current = getRegisterDraft();
  saveRegisterDraft({
    shopName: current?.shopName ?? '',
    ownerName: current?.ownerName ?? '',
    phone: current?.phone,
    email: current?.email,
    password: current?.password,
    confirmPassword: current?.confirmPassword,
    ...patch,
  });
}

export function getRegisterDraft(): RegisterDraft | null {
  const raw = sessionStorage.getItem(KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as RegisterDraft;
    if (!parsed.shopName && !parsed.ownerName && !parsed.email) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearRegisterDraft(): void {
  sessionStorage.removeItem(KEY);
}
