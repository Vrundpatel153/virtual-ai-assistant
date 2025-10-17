export interface User {
  id: string;
  email: string;
  name: string;
  loginMethod: 'email' | 'google';
}
import { metricsManager } from "./historyManager";

const AUTH_KEY = 'ai_assistant_user';
const USERS_KEY = 'ai_assistant_users';

function deriveNameFromEmail(email: string): string {
  const local = (email || '').split('@')[0] || '';
  const parts = local.split(/[._-]+/).filter(Boolean);
  if (parts.length === 0) return email || 'User';
  const title = parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
  return title;
}

export const authService = {
  // Get current user
  getCurrentUser(): User | null {
    const userStr = localStorage.getItem(AUTH_KEY);
    if (!userStr) return null;
    const u = JSON.parse(userStr) as User;
    // Ensure name exists; if missing/empty, derive from email and persist back
    if (!u.name || !u.name.trim()) {
      const fixed = { ...u, name: deriveNameFromEmail(u.email) };
      localStorage.setItem(AUTH_KEY, JSON.stringify(fixed));
      return fixed;
    }
    return u;
  },

  // Check if user is logged in
  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  },

  // Sign up with email
  signUp(email: string, password: string, name: string): { success: boolean; error?: string } {
    const users = this.getAllUsers();
    
    if (users.find(u => u.email === email)) {
      return { success: false, error: 'Email already exists' };
    }

    const newUser: User = {
      id: Date.now().toString(),
      email,
      name: (name && name.trim()) ? name.trim() : deriveNameFromEmail(email),
      loginMethod: 'email'
    };

    users.push({ ...newUser, password });
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    localStorage.setItem(AUTH_KEY, JSON.stringify(newUser));
    // Track session
    metricsManager.incrementSession();
    
    return { success: true };
  },

  // Sign in with email
  signIn(email: string, password: string): { success: boolean; error?: string } {
    const users = this.getAllUsers();
    const user = users.find(u => u.email === email && u.password === password);

    if (!user) {
      return { success: false, error: 'Invalid email or password' };
    }

    const { password: _, ...userWithoutPassword } = user;
    // Ensure name presence
    const namedUser: User = {
      ...(userWithoutPassword as User),
      name: (userWithoutPassword as User).name && (userWithoutPassword as User).name.trim()
        ? (userWithoutPassword as User).name
        : deriveNameFromEmail(email)
    };
    // Persist corrected name in current session
    localStorage.setItem(AUTH_KEY, JSON.stringify(namedUser));
    // Also update stored users list if changed
    const idx = users.findIndex(u => u.email === email);
    if (idx !== -1 && (!users[idx].name || !users[idx].name.trim())) {
      users[idx].name = namedUser.name;
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }
    // Track session
    metricsManager.incrementSession();
    
    return { success: true };
  },

  // Sign in with Google (mock)
  signInWithGoogle(email: string, name: string): { success: boolean } {
    const user: User = {
      id: Date.now().toString(),
      email,
      name: (name && name.trim()) ? name.trim() : deriveNameFromEmail(email),
      loginMethod: 'google'
    };

    localStorage.setItem(AUTH_KEY, JSON.stringify(user));
    // Track session
    metricsManager.incrementSession();
    return { success: true };
  },

  // Logout
  logout(): void {
    localStorage.removeItem(AUTH_KEY);
  },

  // Get all users (internal)
  getAllUsers(): any[] {
    const usersStr = localStorage.getItem(USERS_KEY);
    return usersStr ? JSON.parse(usersStr) : [];
  }
};
