import fs from 'fs';
import path from 'path';
import { prisma } from './prisma';

export interface User {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  role: 'KASIR' | 'ADMIN_AKUNTANSI' | 'MANAJER_OWNER';
  is_email_verified: boolean;
  verification_token: string | null;
  token_expires_at: Date | null;
  created_at: Date;
}

const MOCK_DB_PATH = path.join(process.cwd(), 'prisma', 'mock_users_db.json');

// Initialize local JSON file db if not exists
function getLocalUsers(): User[] {
  if (!fs.existsSync(MOCK_DB_PATH)) {
    fs.writeFileSync(MOCK_DB_PATH, JSON.stringify([], null, 2), 'utf-8');
    return [];
  }
  try {
    const data = fs.readFileSync(MOCK_DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading mock users DB, resetting:', err);
    return [];
  }
}

function saveLocalUsers(users: User[]) {
  try {
    fs.writeFileSync(MOCK_DB_PATH, JSON.stringify(users, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write mock users DB:', err);
  }
}

// Check if PostgreSQL database is configured and ready
async function isDbReady(): Promise<boolean> {
  if (!process.env.DATABASE_URL) {
    return false;
  }
  try {
    // Try a simple count query to verify connectivity and table existence
    await prisma.user.count();
    return true;
  } catch (e) {
    console.warn('⚠️ Koneksi ke PostgreSQL/Prisma gagal atau tabel User belum dimigrasi. Beralih ke penyimpanan lokal JSON (prisma/mock_users_db.json).');
    return false;
  }
}

export const userDb = {
  async findFirst(where: { OR: Array<{ username?: string; email?: string }> }): Promise<User | null> {
    const useRealDb = await isDbReady();
    if (useRealDb) {
      const condition = where.OR.map(cond => {
        if (cond.username) return { username: cond.username };
        if (cond.email) return { email: cond.email };
        return {};
      });
      const dbUser = await prisma.user.findFirst({
        where: {
          OR: condition
        }
      });
      return dbUser as User | null;
    } else {
      const users = getLocalUsers();
      for (const cond of where.OR) {
        const match = users.find(u => 
          (cond.username && u.username === cond.username) || 
          (cond.email && u.email === cond.email)
        );
        if (match) {
          return {
            ...match,
            token_expires_at: match.token_expires_at ? new Date(match.token_expires_at) : null,
            created_at: new Date(match.created_at)
          };
        }
      }
      return null;
    }
  },

  async create(data: {
    username: string;
    email: string;
    password_hash: string;
    role: string;
    is_email_verified: boolean;
    verification_token: string;
    token_expires_at: Date;
  }): Promise<User> {
    const useRealDb = await isDbReady();
    if (useRealDb) {
      const dbUser = await prisma.user.create({
        data: {
          username: data.username,
          email: data.email,
          password_hash: data.password_hash,
          role: data.role,
          is_email_verified: data.is_email_verified,
          verification_token: data.verification_token,
          token_expires_at: data.token_expires_at
        }
      });
      return dbUser as User;
    } else {
      const users = getLocalUsers();
      const newUser: User = {
        id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
        username: data.username,
        email: data.email,
        password_hash: data.password_hash,
        role: data.role as any,
        is_email_verified: data.is_email_verified,
        verification_token: data.verification_token,
        token_expires_at: data.token_expires_at,
        created_at: new Date()
      };
      users.push(newUser);
      saveLocalUsers(users);
      return newUser;
    }
  },

  async update(id: number, data: {
    is_email_verified?: boolean;
    verification_token?: string | null;
    token_expires_at?: Date | null;
  }): Promise<User> {
    const useRealDb = await isDbReady();
    if (useRealDb) {
      const dbUser = await prisma.user.update({
        where: { id },
        data: {
          is_email_verified: data.is_email_verified,
          verification_token: data.verification_token,
          token_expires_at: data.token_expires_at
        }
      });
      return dbUser as User;
    } else {
      const users = getLocalUsers();
      const idx = users.findIndex(u => u.id === id);
      if (idx === -1) {
        throw new Error('User not found in mock DB');
      }
      
      const updatedUser = {
        ...users[idx],
        ...data,
        token_expires_at: data.token_expires_at !== undefined ? data.token_expires_at : users[idx].token_expires_at
      };
      
      users[idx] = updatedUser as User;
      saveLocalUsers(users);
      return updatedUser as User;
    }
  }
};
