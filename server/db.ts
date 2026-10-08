import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { supabaseService } from './supabase.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface DbUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  salt: string;
  createdAt: number;
}

export interface DbSession {
  id: string;
  userId: string;
  createdAt: number;
  request: {
    roughMessage: string;
    recipient: string;
    situation: string;
    intention: string;
    desiredTone: string;
    medium?: string;
  };
  result: any;
  isFavorite?: boolean;
}

export interface DbAuthToken {
  token: string;
  userId: string;
  createdAt: number;
  expiresAt: number;
}

interface DatabaseSchema {
  version: number;
  users: DbUser[];
  sessions: DbSession[];
  tokens: DbAuthToken[];
}

const DATA_DIR = path.resolve(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// In-memory cached database state with disk persistence
let dbState: DatabaseSchema = {
  version: 1,
  users: [],
  sessions: [],
  tokens: [],
};

// Safe atomic file write
function persistToDisk() {
  try {
    const tempFile = `${DB_FILE}.${Date.now()}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(dbState, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  } catch (error) {
    console.error('[Database] Failed to write database to disk:', error);
  }
}

// Load existing database or seed default demo account
function initDatabase() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      dbState = JSON.parse(content);
      console.log(`[Database] Connected successfully. Loaded ${dbState.users.length} users and ${dbState.sessions.length} sessions.`);
    } else {
      console.log('[Database] Initializing fresh persistent database...');
      // Seed default demo user
      const demoSalt = crypto.randomBytes(16).toString('hex');
      const demoHash = crypto.scryptSync('demo123', demoSalt, 64).toString('hex');
      
      dbState.users.push({
        id: 'usr_demo_guest',
        name: 'Prem',
        email: 'prem@example.com',
        passwordHash: demoHash,
        salt: demoSalt,
        createdAt: Date.now()
      });
      persistToDisk();
      console.log('[Database] Seeded demo user account in database.');
    }
  } catch (error) {
    console.error('[Database] Error initializing database, initializing fallback:', error);
  }
}

initDatabase();

// Cryptographic helpers
function hashPassword(password: string): { salt: string; hash: string } {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { salt, hash };
}

function verifyPassword(password: string, salt: string, expectedHash: string): boolean {
  try {
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(expectedHash, 'hex'));
  } catch {
    return false;
  }
}

export const db = {
  /**
   * Find a user by email
   */
  findUserByEmail(email: string): DbUser | undefined {
    const cleanEmail = email.trim().toLowerCase();
    return dbState.users.find((u) => u.email.toLowerCase() === cleanEmail);
  },

  /**
   * Find a user by ID
   */
  findUserById(id: string): DbUser | undefined {
    return dbState.users.find((u) => u.id === id);
  },

  /**
   * Create a new user with securely hashed password
   */
  createUser(name: string, email: string, pass: string): { user: Omit<DbUser, 'passwordHash' | 'salt'>; token: string } {
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const { salt, hash } = hashPassword(pass.trim());

    const newUser: DbUser = {
      id: 'usr_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex'),
      name: cleanName,
      email: cleanEmail,
      passwordHash: hash,
      salt,
      createdAt: Date.now(),
    };

    dbState.users.push(newUser);
    const token = this.createSessionToken(newUser.id);
    persistToDisk();

    // Async sync to Supabase project if configured
    supabaseService.syncUser(newUser).catch(() => {});

    return {
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        createdAt: newUser.createdAt,
      },
      token,
    };
  },

  /**
   * Authenticate a user by email and password
   */
  authenticateUser(email: string, pass: string): { user: Omit<DbUser, 'passwordHash' | 'salt'>; token: string } | null {
    const user = this.findUserByEmail(email);
    if (!user) return null;

    const isValid = verifyPassword(pass.trim(), user.salt, user.passwordHash);
    if (!isValid) return null;

    const token = this.createSessionToken(user.id);
    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
      token,
    };
  },

  /**
   * Issue session token
   */
  createSessionToken(userId: string): string {
    const token = 'tok_' + crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days

    dbState.tokens.push({
      token,
      userId,
      createdAt: Date.now(),
      expiresAt,
    });
    persistToDisk();
    return token;
  },

  /**
   * Validate token and return user
   */
  validateSessionToken(token: string): Omit<DbUser, 'passwordHash' | 'salt'> | null {
    if (!token) return null;
    const tokenEntry = dbState.tokens.find((t) => t.token === token && t.expiresAt > Date.now());
    if (!tokenEntry) return null;

    const user = this.findUserById(tokenEntry.userId);
    if (!user) return null;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    };
  },

  /**
   * Revoke token
   */
  revokeSessionToken(token: string): void {
    dbState.tokens = dbState.tokens.filter((t) => t.token !== token);
    persistToDisk();
  },

  /**
   * Get user's saved message sessions
   */
  getUserSessions(userId: string): DbSession[] {
    return dbState.sessions
      .filter((s) => s.userId === userId)
      .sort((a, b) => b.createdAt - a.createdAt);
  },

  /**
   * Save or update a message session
   */
  saveUserSession(userId: string, sessionData: { id?: string; request: any; result: any; createdAt?: number; isFavorite?: boolean }): DbSession {
    const id = sessionData.id || 'sess_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex');
    const existingIndex = dbState.sessions.findIndex((s) => s.id === id && s.userId === userId);

    const sessionRecord: DbSession = {
      id,
      userId,
      createdAt: sessionData.createdAt || Date.now(),
      request: sessionData.request,
      result: sessionData.result,
      isFavorite: !!sessionData.isFavorite,
    };

    if (existingIndex >= 0) {
      dbState.sessions[existingIndex] = sessionRecord;
    } else {
      dbState.sessions.unshift(sessionRecord);
    }

    persistToDisk();

    // Async sync to Supabase project if configured
    supabaseService.syncSession(sessionRecord).catch(() => {});

    return sessionRecord;
  },

  /**
   * Delete a saved session
   */
  deleteUserSession(userId: string, sessionId: string): boolean {
    const prevLength = dbState.sessions.length;
    dbState.sessions = dbState.sessions.filter((s) => !(s.id === sessionId && s.userId === userId));
    const deleted = dbState.sessions.length < prevLength;
    if (deleted) {
      persistToDisk();
      // Async sync deletion to Supabase project
      supabaseService.deleteSession(sessionId).catch(() => {});
    }
    return deleted;
  },

  /**
   * Get Database stats and health status
   */
  getDatabaseStats() {
    let fileSize = 0;
    try {
      if (fs.existsSync(DB_FILE)) {
        fileSize = fs.statSync(DB_FILE).size;
      }
    } catch {
      fileSize = 0;
    }

    const supabaseConfig = supabaseService.getConfig();

    return {
      connected: true,
      storageEngine: 'SayItRight Persistent Server DB + Supabase',
      filePath: DB_FILE,
      relativeFilePath: 'server/data/database.json',
      fileSizeBytes: fileSize,
      totalUsers: dbState.users.length,
      totalSessions: dbState.sessions.length,
      activeTokens: dbState.tokens.length,
      lastUpdated: Date.now(),
      supabase: {
        url: supabaseConfig.url,
        connected: supabaseConfig.connected,
        hasKey: !!supabaseConfig.anonKey,
        maskedKey: supabaseConfig.maskedAnonKey,
        projectRef: supabaseConfig.projectRef,
      },
    };
  },

  /**
   * Get full sanitized database dump for inspector UI
   */
  getDatabaseData() {
    const stats = this.getDatabaseStats();

    // Map users without sensitive password hashes and salts, but include session count
    const safeUsers = dbState.users.map((u) => {
      const userSessions = dbState.sessions.filter((s) => s.userId === u.id);
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        createdAt: u.createdAt,
        sessionsCount: userSessions.length,
        hasPasswordSet: true,
      };
    });

    // Map sessions with user email context
    const enrichedSessions = dbState.sessions.map((s) => {
      const user = dbState.users.find((u) => u.id === s.userId);
      return {
        ...s,
        userEmail: user?.email || 'Unknown',
        userName: user?.name || 'Anonymous',
      };
    });

    return {
      stats,
      users: safeUsers,
      sessions: enrichedSessions,
      tokensSummary: {
        activeTokensCount: dbState.tokens.length,
      },
      raw: {
        version: dbState.version,
        storageFile: 'server/data/database.json',
        users: safeUsers,
        sessions: enrichedSessions,
      },
    };
  },
};
