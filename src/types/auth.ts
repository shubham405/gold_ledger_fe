export interface AuthUser {
  shopUserId: number;
  email: string;
  shopName: string;
  ownerName: string;
  phone?: string;
  active: boolean;
}

export interface AuthResponse {
  token: string;
  tokenType: string;
  expiresInMs: number;
  shopUserId: number;
  email: string;
  shopName: string;
  ownerName: string;
  phone?: string;
  active: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  shopName: string;
  ownerName: string;
  phone?: string;
}
