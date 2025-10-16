export interface User {
  id: string;
  email: string;
  name: string;
  loginMethod: 'email' | 'google';
}

const AUTH_KEY = 'ai_assistant_user';
const USERS_KEY = 'ai_assistant_users';

export const authService = {
  // Get current user
  getCurrentUser(): User | null {
    const userStr = localStorage.getItem(AUTH_KEY);
    if (!userStr) return null;
    return JSON.parse(userStr);
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
      name,
      loginMethod: 'email'
    };

    users.push({ ...newUser, password });
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    localStorage.setItem(AUTH_KEY, JSON.stringify(newUser));
    
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
    localStorage.setItem(AUTH_KEY, JSON.stringify(userWithoutPassword));
    
    return { success: true };
  },

  // Sign in with Google (mock)
  signInWithGoogle(email: string, name: string): { success: boolean } {
    const user: User = {
      id: Date.now().toString(),
      email,
      name,
      loginMethod: 'google'
    };

    localStorage.setItem(AUTH_KEY, JSON.stringify(user));
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
