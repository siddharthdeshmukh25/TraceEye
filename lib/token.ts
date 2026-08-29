import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'traceeye-secret-key-change-in-production';
const TOKEN_EXPIRY = '24h'; // Token expires in 24 hours

export interface TokenPayload {
  id: string;
  email?: string;
  phone?: string;
  full_name?: string;
  auth_provider: string;
  exp?: number;
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    // Try JWT verification first
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    // If JWT fails, try simple base64 decoding (for Firebase tokens)
    try {
      const decoded = JSON.parse(atob(token));
      if (decoded.id && decoded.email) {
        // Check if token is expired
        if (decoded.exp && Date.now() >= decoded.exp) {
          return null;
        }
        return decoded as TokenPayload;
      }
      return null;
    } catch {
      return null;
    }
  }
}

export function isTokenExpired(token: string): boolean {
  try {
    // Try JWT decode first
    const jwtDecoded = jwt.decode(token) as { exp: number };
    if (jwtDecoded && jwtDecoded.exp) {
      return Date.now() >= jwtDecoded.exp * 1000;
    }
    
    // Try base64 decode
    const decoded = JSON.parse(atob(token)) as { exp: number };
    if (decoded && decoded.exp) {
      return Date.now() >= decoded.exp;
    }
    
    return true;
  } catch {
    return true;
  }
}