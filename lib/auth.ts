import { verifyToken, isTokenExpired, type TokenPayload } from "@/lib/token";

const TOKEN_KEY = "traceeye_token";
const USER_KEY = "traceeye_user";
const OLD_SESSION_KEY = "traceeye_session";

export function setAuth(token: string, user: any) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  // Clear old session for backward compatibility
  localStorage.removeItem(OLD_SESSION_KEY);
}

export function getAuth(): { token: string | null; user: any } {
  const token = localStorage.getItem(TOKEN_KEY);
  const userStr = localStorage.getItem(USER_KEY);
  
  if (!token || !userStr) {
    return { token: null, user: null };
  }
  
  // Check if token is expired
  if (isTokenExpired(token)) {
    clearAuth();
    return { token: null, user: null };
  }
  
  return {
    token,
    user: JSON.parse(userStr)
  };
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(OLD_SESSION_KEY);
}

export function getUserId(): string | null {
  const { user } = getAuth();
  return user?.id || null;
}

export function isAuthenticated(): boolean {
  const { token } = getAuth();
  return token !== null;
}

// Check if user has old session and migrate it
export function migrateOldSession(): boolean {
  const oldSession = localStorage.getItem(OLD_SESSION_KEY);
  if (oldSession) {
    try {
      const session = JSON.parse(oldSession);
      // Create a simple token from old session data
      const token = btoa(JSON.stringify({
        id: session.id || session.email,
        email: session.email,
        exp: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
      }));
      
      const user = {
        id: session.id || session.email,
        email: session.email,
        full_name: session.full_name || session.name || "TraceEye member",
        auth_provider: session.auth_provider || "email"
      };
      
      setAuth(token, user);
      return true;
    } catch {
      clearAuth();
      return false;
    }
  }
  return false;
}