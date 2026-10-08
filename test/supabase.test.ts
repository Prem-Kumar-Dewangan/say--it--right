import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { supabaseService } from '../server/supabase.ts';

describe('Supabase Integration Suite', () => {
  it('should return Supabase configuration object', () => {
    const config = supabaseService.getConfig();
    assert.ok(config);
    assert.ok(typeof config.connected === 'boolean');
    assert.ok(typeof config.url === 'string');
    assert.ok(typeof config.maskedAnonKey === 'string');
    assert.ok(typeof config.setupSql === 'string');
  });

  it('setup SQL schema must define tables and RLS policies', () => {
    const config = supabaseService.getConfig();
    assert.ok(config.setupSql.includes('CREATE TABLE IF NOT EXISTS public.say_it_right_users'));
    assert.ok(config.setupSql.includes('CREATE TABLE IF NOT EXISTS public.say_it_right_sessions'));
    assert.ok(config.setupSql.includes('ENABLE ROW LEVEL SECURITY'));
  });

  it('should safely extract project ref from url', () => {
    const config = supabaseService.getConfig();
    if (config.url) {
      assert.ok(config.projectRef);
      assert.equal(typeof config.projectRef, 'string');
    }
  });
});
