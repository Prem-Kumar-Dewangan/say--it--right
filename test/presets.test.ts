import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SCENARIO_PRESETS } from '../src/data/presets.ts';
import { validateMeaningfulMessage } from '../src/utils/validation.ts';

describe('Scenario Presets Suite', () => {
  it('should contain predefined presets', () => {
    assert.ok(Array.isArray(SCENARIO_PRESETS));
    assert.ok(SCENARIO_PRESETS.length >= 5, 'Should have at least 5 preset scenarios');
  });

  it('should have unique IDs for all presets', () => {
    const ids = SCENARIO_PRESETS.map((p) => p.id);
    const uniqueIds = new Set(ids);
    assert.equal(ids.length, uniqueIds.size, 'Every preset ID must be unique');
  });

  it('should contain all required fields in each preset', () => {
    for (const preset of SCENARIO_PRESETS) {
      assert.ok(preset.id && typeof preset.id === 'string', 'id is required');
      assert.ok(preset.title && typeof preset.title === 'string', 'title is required');
      assert.ok(preset.subtitle && typeof preset.subtitle === 'string', 'subtitle is required');
      assert.ok(preset.situation && typeof preset.situation === 'string', 'situation is required');
      assert.ok(preset.recipient && typeof preset.recipient === 'string', 'recipient is required');
      assert.ok(preset.desiredTone && typeof preset.desiredTone === 'string', 'desiredTone is required');
      assert.ok(preset.medium && typeof preset.medium === 'string', 'medium is required');
      assert.ok(preset.intention && typeof preset.intention === 'string', 'intention is required');
      assert.ok(preset.roughMessage && typeof preset.roughMessage === 'string', 'roughMessage is required');
    }
  });

  it('every preset roughMessage should pass meaningful validation', () => {
    for (const preset of SCENARIO_PRESETS) {
      const validation = validateMeaningfulMessage(preset.roughMessage);
      assert.equal(
        validation.isValid,
        true,
        `Preset "${preset.id}" rough message failed validation: ${validation.error}`
      );
    }
  });
});
