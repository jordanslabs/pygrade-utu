export type UserRole = 'mahasiswa' | 'dosen';

export interface MahasiswaUser {
  role: 'mahasiswa';
  nama: string;
  nim: string;
}

export interface DosenUser {
  role: 'dosen';
  nama: string;
  email: string;
}

export type AuthUser = MahasiswaUser | DosenUser;

const AUTH_STORAGE_KEY = 'pygrade_auth_user';

export function getStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveStoredUser(user: AuthUser | null): void {
  try {
    if (user) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  } catch {
    // Ignore storage exceptions
  }
}
