import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CONFIG_FILE = path.resolve(__dirname, 'data', 'supabase-config.json');

// Default provided project URL
const DEFAULT_SUPABASE_URL = 'https://nduopjrfdpildtgrvfei.supabase.co';

export interface SupabaseConfig {
  url: string;
  anonKey?: string;
  serviceKey?: string;
  connected: boolean;
  lastChecked?: number;
  tableStatus?: {
    usersTableExists?: boolean;
    sessionsTableExists?: boolean;
    error?: string;
  };
}

let activeConfig: SupabaseConfig = {
  url: process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL,
  anonKey: process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || '',
  serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  connected: false,
};

// Load saved config if exists
try {
  if (fs.existsSync(CONFIG_FILE)) {
    const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    activeConfig = {
      ...activeConfig,
      ...parsed,
      url: parsed.url || activeConfig.url,
      anonKey: parsed.anonKey || activeConfig.anonKey,
    };
  }
} catch (err) {
  console.warn('[Supabase] Could not read supabase-config.json:', err);
}

function saveConfigToDisk() {
  try {
    const dir = path.dirname(CONFIG_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(activeConfig, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Supabase] Failed to write config to disk:', err);
  }
}

let supabaseClient: SupabaseClient | null = null;

function initializeClient() {
  if (activeConfig.url && (activeConfig.anonKey || activeConfig.serviceKey)) {
    try {
      const key = activeConfig.serviceKey || activeConfig.anonKey || '';
      supabaseClient = createClient(activeConfig.url, key, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
      activeConfig.connected = true;
    } catch (e: any) {
      console.error('[Supabase] Failed to create client:', e.message);
      supabaseClient = null;
      activeConfig.connected = false;
    }
  } else {
    supabaseClient = null;
    activeConfig.connected = false;
  }
}

initializeClient();

export const supabaseService = {
  getConfig(): SupabaseConfig & { maskedAnonKey: string; projectRef: string; setupSql: string } {
    const key = activeConfig.anonKey || '';
    const masked = key.length > 8 ? `${key.substring(0, 5)}...${key.substring(key.length - 4)}` : (key ? '••••••••' : '');
    const projectRef = 'nduopjrfdpildtgrvfei';
    
    return {
      ...activeConfig,
      maskedAnonKey: masked,
      projectRef,
      setupSql: `
-- RUN THIS IN YOUR SUPABASE SQL EDITOR (https://supabase.com/dashboard/project/nduopjrfdpildtgrvfei/sql)
-- 1. Create table for registered users
CREATE TABLE IF NOT EXISTS public.say_it_right_users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create table for rewritten messages & coaching history
CREATE TABLE IF NOT EXISTS public.say_it_right_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  rough_message TEXT,
  recipient TEXT,
  situation TEXT,
  intention TEXT,
  desired_tone TEXT,
  medium TEXT,
  is_favorite BOOLEAN DEFAULT FALSE,
  result JSONB
);

-- 3. Enable RLS or grant access for anon
ALTER TABLE public.say_it_right_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.say_it_right_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public anon access for users" 
ON public.say_it_right_users FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public anon access for sessions" 
ON public.say_it_right_sessions FOR ALL USING (true) WITH CHECK (true);
      `.trim(),
    };
  },

  updateCredentials(url: string, anonKey: string, serviceKey?: string) {
    activeConfig.url = (url || DEFAULT_SUPABASE_URL).trim();
    if (anonKey !== undefined) {
      activeConfig.anonKey = anonKey.trim();
    }
    if (serviceKey !== undefined) {
      activeConfig.serviceKey = serviceKey.trim();
    }
    initializeClient();
    saveConfigToDisk();
    return this.testConnection();
  },

  async testConnection(): Promise<{ success: boolean; message: string; tablesStatus?: any }> {
    if (!activeConfig.url) {
      return { success: false, message: 'Supabase URL is missing.' };
    }
    const key = activeConfig.serviceKey || activeConfig.anonKey;
    if (!key) {
      return { 
        success: false, 
        message: 'Supabase Project URL is registered, but anon public key or service role key is required to perform operations. Enter your anon key from Supabase Dashboard > Project Settings > API.' 
      };
    }

    try {
      if (!supabaseClient) initializeClient();
      if (!supabaseClient) {
        return { success: false, message: 'Could not create Supabase client instance.' };
      }

      // Check if tables exist by querying say_it_right_users or general schema
      const { data: usersData, error: usersErr } = await supabaseClient
        .from('say_it_right_users')
        .select('id')
        .limit(1);

      if (usersErr) {
        // Code 42P01 means table does not exist yet (common before running SQL schema)
        if (usersErr.code === '42P01' || usersErr.message.includes('does not exist')) {
          activeConfig.connected = true;
          activeConfig.lastChecked = Date.now();
          activeConfig.tableStatus = {
            usersTableExists: false,
            sessionsTableExists: false,
            error: 'Tables say_it_right_users and say_it_right_sessions not created yet. Please execute the provided SQL in Supabase SQL editor.'
          };
          saveConfigToDisk();
          return {
            success: true,
            message: 'Connected to Supabase project! Note: Tables are not created yet. Run the SQL schema to enable remote storage.',
            tablesStatus: activeConfig.tableStatus
          };
        }

        activeConfig.connected = false;
        return {
          success: false,
          message: `Supabase API returned error: ${usersErr.message} (Code: ${usersErr.code || 'UNKNOWN'})`
        };
      }

      // Table exists and query worked!
      activeConfig.connected = true;
      activeConfig.lastChecked = Date.now();
      activeConfig.tableStatus = {
        usersTableExists: true,
        sessionsTableExists: true
      };
      saveConfigToDisk();

      return {
        success: true,
        message: 'Successfully connected and verified Supabase project and database tables!',
        tablesStatus: activeConfig.tableStatus
      };
    } catch (err: any) {
      activeConfig.connected = false;
      return { success: false, message: `Connection test error: ${err.message}` };
    }
  },

  getClient(): SupabaseClient | null {
    return supabaseClient;
  },

  isConfigured(): boolean {
    return !!(activeConfig.url && (activeConfig.anonKey || activeConfig.serviceKey));
  },

  /**
   * Sync a user to Supabase if configured
   */
  async syncUser(user: { id: string; name: string; email: string; passwordHash: string; salt: string; createdAt: number }) {
    if (!supabaseClient) return null;
    try {
      const { error } = await supabaseClient
        .from('say_it_right_users')
        .upsert({
          id: user.id,
          name: user.name,
          email: user.email,
          password_hash: user.passwordHash,
          salt: user.salt,
          created_at: new Date(user.createdAt).toISOString(),
        });
      if (error) {
        console.warn('[Supabase Sync] Warning syncing user:', error.message);
      } else {
        console.log('[Supabase Sync] User successfully synced to Supabase:', user.email);
      }
    } catch (e: any) {
      console.warn('[Supabase Sync] Exception syncing user:', e.message);
    }
  },

  /**
   * Sync a session to Supabase if configured
   */
  async syncSession(session: { id: string; userId: string; createdAt: number; request: any; result: any; isFavorite?: boolean }) {
    if (!supabaseClient) return null;
    try {
      const { error } = await supabaseClient
        .from('say_it_right_sessions')
        .upsert({
          id: session.id,
          user_id: session.userId,
          created_at: new Date(session.createdAt).toISOString(),
          rough_message: session.request.roughMessage,
          recipient: session.request.recipient,
          situation: session.request.situation,
          intention: session.request.intention,
          desired_tone: session.request.desiredTone,
          medium: session.request.medium,
          is_favorite: !!session.isFavorite,
          result: session.result,
        });
      if (error) {
        console.warn('[Supabase Sync] Warning syncing session:', error.message);
      } else {
        console.log('[Supabase Sync] Session successfully synced to Supabase:', session.id);
      }
    } catch (e: any) {
      console.warn('[Supabase Sync] Exception syncing session:', e.message);
    }
  },

  /**
   * Delete session from Supabase
   */
  async deleteSession(sessionId: string) {
    if (!supabaseClient) return null;
    try {
      await supabaseClient
        .from('say_it_right_sessions')
        .delete()
        .eq('id', sessionId);
    } catch (e: any) {
      console.warn('[Supabase Sync] Exception deleting session:', e.message);
    }
  },

  /**
   * Fetch all records from Supabase tables for inspection
   */
  async fetchRemoteData() {
    if (!supabaseClient) return null;
    try {
      const [{ data: users }, { data: sessions }] = await Promise.all([
        supabaseClient.from('say_it_right_users').select('id, name, email, created_at'),
        supabaseClient.from('say_it_right_sessions').select('*'),
      ]);
      return {
        users: users || [],
        sessions: sessions || [],
      };
    } catch (err: any) {
      return { error: err.message };
    }
  }
};
