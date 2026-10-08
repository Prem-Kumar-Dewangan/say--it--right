/**
 * Main Test Entrypoint for Say It Right
 * Runs all unit and integration test suites:
 * - Message validation & anti-gibberish checks
 * - Database CRUD, password hashing & auth tokens
 * - Scenario presets & communications models
 * - Supabase integration and schemas
 */

import './validation.test.ts';
import './presets.test.ts';
import './db.test.ts';
import './supabase.test.ts';
