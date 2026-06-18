// Utility file to initialize and get the Supabase Client on the client side (browser)
// using the CDN SDK loaded via window.supabase, along with PBKDF2 SHA-512 helpers.

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dmghvsdnfsqvlvdanzyd.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtZ2h2c2RuZnNxdmx2ZGFuenlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzNTE4NjQsImV4cCI6MjA5NjkyNzg2NH0.FXqjgshSj_zwyj2xpQPJ2McnLbVDiV0EQ6svHTzuBu4';

let supabaseInstance: any = null;

export function getSupabaseClient() {
  if (typeof window !== 'undefined') {
    if (supabaseInstance) return supabaseInstance;
    const globalSupabase = (window as any).supabase;
    if (globalSupabase) {
      supabaseInstance = globalSupabase.createClient(SUPABASE_URL, SUPABASE_KEY);
      return supabaseInstance;
    }
  }
  return null;
}

/**
 * Hash a password using PBKDF2 with SHA-512 in the browser (Web Crypto API).
 * Matches Node's crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').
 */
export async function hashPasswordBrowser(password: string): Promise<string> {
  if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
    throw new Error('Web Crypto API is not available (must run in browser context)');
  }

  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);
  
  // Generate a random 16-byte salt
  const saltBytes = window.crypto.getRandomValues(new Uint8Array(16));
  const saltHex = Array.from(saltBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  // Import the password as a CryptoKey
  const baseKey = await window.crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  // Derive 64 bytes (512 bits) of key material
  const derivedBits = await window.crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBytes,
      iterations: 10000,
      hash: 'SHA-512'
    },
    baseKey,
    64 * 8 // 512 bits
  );

  const hashHex = Array.from(new Uint8Array(derivedBits))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return `${saltHex}:${hashHex}`;
}

/**
 * Verify a password against a hash using PBKDF2 with SHA-512 in the browser (Web Crypto API).
 */
export async function verifyPasswordBrowser(password: string, passwordHash: string): Promise<boolean> {
  if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
    return false;
  }

  try {
    const [saltHex, originalHashHex] = passwordHash.split(':');
    if (!saltHex || !originalHashHex) return false;

    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);
    
    // Convert hex salt back to bytes
    const saltBytes = new Uint8Array(
      saltHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
    );

    // Import the password as a CryptoKey
    const baseKey = await window.crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    // Derive bits using same parameters
    const derivedBits = await window.crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: saltBytes,
        iterations: 10000,
        hash: 'SHA-512'
      },
      baseKey,
      64 * 8
    );

    const hashHex = Array.from(new Uint8Array(derivedBits))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    return hashHex === originalHashHex;
  } catch (error) {
    console.error('Password verification failed in Web Crypto:', error);
    return false;
  }
}
