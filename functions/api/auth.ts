import { Context } from 'hono';
import { Env } from './types';

// Session management constants
const SESSION_DURATION = 2 * 24 * 60 * 60; // 2 days in seconds
const RATE_LIMIT_WINDOW = 60 * 60; // 1 hour in seconds
const MAX_LOGIN_ATTEMPTS = 20;

export interface SessionData {
  email: string;
  createdAt: number;
  expiresAt: number;
}

export interface RateLimitData {
  attempts: number;
  resetAt: number;
}

/**
 * Simple password hash verification using Web Crypto API
 * For production, use bcrypt. This is a simplified version.
 */
export async function verifyPassword(
  inputPassword: string,
  storedHash: string
): Promise<boolean> {
  try {
    // For now, we'll use a simple comparison
    // In production, you should use bcrypt with:
    // const bcrypt = await import('bcryptjs');
    // return bcrypt.compare(inputPassword, storedHash);
    
    // Generate hash of input password
    const encoder = new TextEncoder();
    const data = encoder.encode(inputPassword);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return hashHex === storedHash;
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
}

/**
 * Generate a secure random session token
 */
export function generateSessionToken(): string {
  return crypto.randomUUID();
}

/**
 * Get client IP address from request
 */
export function getClientIP(c: Context): string {
  return c.req.header('cf-connecting-ip') || 
         c.req.header('x-forwarded-for')?.split(',')[0] || 
         'unknown';
}

/**
 * Check rate limit for login attempts
 */
export async function checkRateLimit(
  env: Env,
  ip: string
): Promise<{ allowed: boolean; remaining: number }> {
  const key = `ratelimit:${ip}`;
  const now = Date.now() / 1000;
  
  const stored = await env.RATE_LIMIT_STORE.get(key);
  
  if (!stored) {
    // First attempt
    const data: RateLimitData = {
      attempts: 1,
      resetAt: now + RATE_LIMIT_WINDOW
    };
    await env.RATE_LIMIT_STORE.put(key, JSON.stringify(data), {
      expirationTtl: RATE_LIMIT_WINDOW
    });
    return { allowed: true, remaining: MAX_LOGIN_ATTEMPTS - 1 };
  }
  
  const rateLimitData: RateLimitData = JSON.parse(stored);
  
  // Check if window has expired
  if (now > rateLimitData.resetAt) {
    // Reset the counter
    const data: RateLimitData = {
      attempts: 1,
      resetAt: now + RATE_LIMIT_WINDOW
    };
    await env.RATE_LIMIT_STORE.put(key, JSON.stringify(data), {
      expirationTtl: RATE_LIMIT_WINDOW
    });
    return { allowed: true, remaining: MAX_LOGIN_ATTEMPTS - 1 };
  }
  
  // Check if limit exceeded
  if (rateLimitData.attempts >= MAX_LOGIN_ATTEMPTS) {
    return { allowed: false, remaining: 0 };
  }
  
  // Increment attempts
  rateLimitData.attempts++;
  await env.RATE_LIMIT_STORE.put(key, JSON.stringify(rateLimitData), {
    expirationTtl: Math.ceil(rateLimitData.resetAt - now)
  });
  
  return { 
    allowed: true, 
    remaining: MAX_LOGIN_ATTEMPTS - rateLimitData.attempts 
  };
}

/**
 * Create a new session
 */
export async function createSession(
  env: Env,
  email: string
): Promise<string> {
  const token = generateSessionToken();
  const now = Date.now() / 1000;
  
  const sessionData: SessionData = {
    email,
    createdAt: now,
    expiresAt: now + SESSION_DURATION
  };
  
  await env.AUTH_STORE.put(
    `session:${token}`,
    JSON.stringify(sessionData),
    { expirationTtl: SESSION_DURATION }
  );
  
  return token;
}

/**
 * Validate a session token
 */
export async function validateSession(
  env: Env,
  token: string | undefined
): Promise<SessionData | null> {
  if (!token) return null;
  
  const key = `session:${token}`;
  const stored = await env.AUTH_STORE.get(key);
  
  if (!stored) return null;
  
  const sessionData: SessionData = JSON.parse(stored);
  const now = Date.now() / 1000;
  
  // Check if session has expired
  if (now > sessionData.expiresAt) {
    await env.AUTH_STORE.delete(key);
    return null;
  }
  
  return sessionData;
}

/**
 * Delete a session
 */
export async function deleteSession(
  env: Env,
  token: string
): Promise<void> {
  await env.AUTH_STORE.delete(`session:${token}`);
}

/**
 * Middleware to require authentication
 */
export async function requireAuth(c: Context<{ Bindings: Env }>): Promise<Response | void> {
  const cookieHeader = c.req.header('cookie');
  const token = cookieHeader
    ?.split(';')
    .find(c => c.trim().startsWith('session='))
    ?.split('=')[1];
  
  const session = await validateSession(c.env, token);
  
  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  // Store session data in context for use in handlers
  c.set('session', session);
}

/**
 * Get session token from cookie
 */
export function getSessionToken(c: Context): string | undefined {
  const cookieHeader = c.req.header('cookie');
  return cookieHeader
    ?.split(';')
    .find(c => c.trim().startsWith('session='))
    ?.split('=')[1];
}

/**
 * Set session cookie
 */
export function setSessionCookie(token: string): string {
  const maxAge = SESSION_DURATION;
  // Note: In production with HTTPS, add Secure flag
  return `session=${token}; HttpOnly; SameSite=Strict; Max-Age=${maxAge}; Path=/`;
}

/**
 * Clear session cookie
 */
export function clearSessionCookie(): string {
  return 'session=; HttpOnly; SameSite=Strict; Max-Age=0; Path=/';
}
