import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validateMeaningfulMessage } from '../src/utils/validation.ts';

describe('Message Validation Suite', () => {
  describe('Invalid & Gibberish Inputs', () => {
    it('should reject null or undefined', () => {
      assert.deepEqual(validateMeaningfulMessage(null), {
        isValid: false,
        error: 'Enter valid msg'
      });
      assert.deepEqual(validateMeaningfulMessage(undefined), {
        isValid: false,
        error: 'Enter valid msg'
      });
    });

    it('should reject empty or whitespace-only strings', () => {
      assert.deepEqual(validateMeaningfulMessage(''), {
        isValid: false,
        error: 'Enter valid msg'
      });
      assert.deepEqual(validateMeaningfulMessage('   '), {
        isValid: false,
        error: 'Enter valid msg'
      });
    });

    it('should reject single characters', () => {
      assert.deepEqual(validateMeaningfulMessage('a'), {
        isValid: false,
        error: 'Enter valid msg'
      });
      assert.deepEqual(validateMeaningfulMessage('?'), {
        isValid: false,
        error: 'Enter valid msg'
      });
    });

    it('should reject repeated characters', () => {
      assert.equal(validateMeaningfulMessage('aaaaaaa').isValid, false);
      assert.equal(validateMeaningfulMessage('zzzzzz').isValid, false);
      assert.equal(validateMeaningfulMessage('xxxxx').isValid, false);
    });

    it('should reject keyboard smashing like "jdnfefenf"', () => {
      assert.equal(validateMeaningfulMessage('jdnfefenf').isValid, false);
      assert.equal(validateMeaningfulMessage('asdfghjkl').isValid, false);
      assert.equal(validateMeaningfulMessage('qwertyuiop').isValid, false);
      assert.equal(validateMeaningfulMessage('zxcvbnm').isValid, false);
    });

    it('should reject random strings of symbols or numbers without words', () => {
      assert.equal(validateMeaningfulMessage('123456789').isValid, false);
      assert.equal(validateMeaningfulMessage('!@#$%^&*()').isValid, false);
      assert.equal(validateMeaningfulMessage('123 456').isValid, false);
    });
  });

  describe('Valid Messages', () => {
    it('should accept typical workplace drafts', () => {
      const result = validateMeaningfulMessage('I will be 15 minutes late to the standup.');
      assert.equal(result.isValid, true);
    });

    it('should accept short common workplace phrases', () => {
      assert.equal(validateMeaningfulMessage('Can we reschedule?').isValid, true);
      assert.equal(validateMeaningfulMessage('Need an update on the project').isValid, true);
      assert.equal(validateMeaningfulMessage('Thanks for the quick turnaround').isValid, true);
    });

    it('should accept single recognized action words', () => {
      assert.equal(validateMeaningfulMessage('reschedule').isValid, true);
      assert.equal(validateMeaningfulMessage('reminder').isValid, true);
      assert.equal(validateMeaningfulMessage('urgent').isValid, true);
    });

    it('should accept Romanized Hindi / Hinglish phrases', () => {
      assert.equal(validateMeaningfulMessage('kal chutti chahiye bhai').isValid, true);
      assert.equal(validateMeaningfulMessage('aaj meeting kitne baje hai?').isValid, true);
      assert.equal(validateMeaningfulMessage('theek hai baad me baat karte hain').isValid, true);
    });

    it('should accept non-Latin Indic script inputs', () => {
      assert.equal(validateMeaningfulMessage('नमस्ते क्या हाल है').isValid, true);
    });
  });
});
