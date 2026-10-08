import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../server/db.ts';

describe('Database & Auth Suite', () => {
  const testEmail = `test_${Date.now()}@example.com`;
  const testPassword = 'SecurePassword123!';
  const testName = 'Test User';
  let createdUserId = '';
  let sessionToken = '';

  it('should create a new user with hashed password', () => {
    const result = db.createUser(testName, testEmail, testPassword);
    assert.ok(result.user);
    assert.ok(result.token);
    assert.equal(result.user.name, testName);
    assert.equal(result.user.email, testEmail);
    assert.ok(result.user.id);
    assert.ok(result.token.startsWith('tok_'));

    createdUserId = result.user.id;
    sessionToken = result.token;
  });

  it('should find user by email and by id', () => {
    const userByEmail = db.findUserByEmail(testEmail);
    assert.ok(userByEmail);
    assert.equal(userByEmail?.id, createdUserId);

    const userById = db.findUserById(createdUserId);
    assert.ok(userById);
    assert.equal(userById?.email, testEmail);
  });

  it('should authenticate user with correct credentials', () => {
    const authResult = db.authenticateUser(testEmail, testPassword);
    assert.ok(authResult);
    assert.equal(authResult?.user.id, createdUserId);
    assert.ok(authResult?.token);
  });

  it('should reject authentication with incorrect password', () => {
    const authResult = db.authenticateUser(testEmail, 'WrongPassword456!');
    assert.equal(authResult, null);
  });

  it('should reject authentication with non-existent email', () => {
    const authResult = db.authenticateUser('nonexistent@example.com', 'SomePassword');
    assert.equal(authResult, null);
  });

  it('should validate an active session token', () => {
    const validatedUser = db.validateSessionToken(sessionToken);
    assert.ok(validatedUser);
    assert.equal(validatedUser?.id, createdUserId);
  });

  it('should reject invalid session tokens', () => {
    const validatedUser = db.validateSessionToken('tok_invalid_token_123');
    assert.equal(validatedUser, null);
  });

  it('should save, retrieve, and delete a user session', () => {
    const sessionData = {
      id: `sess_test_${Date.now()}`,
      userId: createdUserId,
      createdAt: Date.now(),
      request: {
        roughMessage: 'Need to push back on deadline',
        recipient: 'Manager',
        situation: 'Negotiate',
        intention: 'Ask for 2 more days',
        desiredTone: 'Professional',
        medium: 'Email'
      },
      result: {
        suggestedMessage: 'I would like to request a two-day extension on the deliverable.',
        whyItWorks: 'Direct and proactive',
        keyAdjustments: ['Clear timeline', 'No defensive tone']
      },
      isFavorite: true
    };

    // Save session
    const saved = db.saveUserSession(createdUserId, sessionData);
    assert.equal(saved.id, sessionData.id);

    // Retrieve user sessions
    const userSessions = db.getUserSessions(createdUserId);
    assert.ok(userSessions.some((s) => s.id === sessionData.id));

    // Delete session
    const deleted = db.deleteUserSession(createdUserId, sessionData.id);
    assert.equal(deleted, true);

    // Confirm deletion
    const updatedSessions = db.getUserSessions(createdUserId);
    assert.equal(updatedSessions.some((s) => s.id === sessionData.id), false);
  });

  it('should return valid database statistics', () => {
    const stats = db.getDatabaseStats();
    assert.equal(stats.connected, true);
    assert.ok(typeof stats.totalUsers === 'number');
    assert.ok(typeof stats.totalSessions === 'number');
    assert.ok(stats.totalUsers >= 1);
  });
});
