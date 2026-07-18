import type { AuthProvider, AuthUser } from './provider';

// ⚠️ DEVELOPMENT ONLY. Stores a fake session in localStorage so we can
// build and click through the UI (login/register/profile/admin guards)
// before real Appwrite Authentication is connected in the final step.
// There is NO real password check, NO server verification, and NO
// protection against tampering. Never deploy this to production and
// never store real user data with it.

const KEY = 'goolzon_dev_session';
const listeners: ((user: AuthUser | null) => void)[] = [];

function read(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function write(user: AuthUser | null) {
  if (typeof window === 'undefined') return;
  if (user) localStorage.setItem(KEY, JSON.stringify(user));
  else localStorage.removeItem(KEY);
  listeners.forEach((cb) => cb(user));
}

export const mockAuth: AuthProvider = {
  async getCurrentUser() {
    return read();
  },
  async signIn(email) {
    // Dev-mode only: any email/password combo "succeeds" so the UI can
    // be tested. This will be replaced by a real Appwrite sign-in call.
    const user: AuthUser = {
      id: `dev-${email}`,
      name: email.split('@')[0],
      username: email.split('@')[0],
      email,
      role: email.includes('admin') ? 'admin' : 'user',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
      joinDate: new Date().toISOString(),
    };
    write(user);
    return { user, error: null };
  },
  async signUp(name, username, email) {
    const user: AuthUser = {
      id: `dev-${email}`,
      name,
      username,
      email,
      role: 'user',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
      joinDate: new Date().toISOString(),
    };
    write(user);
    return { user, error: null };
  },
  async signOut() {
    write(null);
  },
  onChange(callback) {
    listeners.push(callback);
    callback(read());
    return () => {
      const i = listeners.indexOf(callback);
      if (i > -1) listeners.splice(i, 1);
    };
  },
};
