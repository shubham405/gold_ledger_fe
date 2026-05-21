export interface RegisterDraft {
  shopName: string;
  ownerName: string;
  phone?: string;
}

const KEY = 'goldledger_register_draft';

export function saveRegisterDraft(draft: RegisterDraft): void {
  sessionStorage.setItem(KEY, JSON.stringify(draft));
}

export function getRegisterDraft(): RegisterDraft | null {
  const raw = sessionStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as RegisterDraft;
  } catch {
    return null;
  }
}

export function clearRegisterDraft(): void {
  sessionStorage.removeItem(KEY);
}
