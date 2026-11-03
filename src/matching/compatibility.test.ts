import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { budgetCompatibility, locationCompatibility } from './compatibility';

describe('budgetCompatibility', () => {
  it('gives equal budgets a perfect score', () => {
    assert.equal(budgetCompatibility({ budget: 1000 }, { budget: 1000 }), 1);
  });

  it('gives partially different budgets a proportional score', () => {
    assert.equal(budgetCompatibility({ budget: 1000 }, { budget: 900 }), 0.9);
  });

  it('returns zero when a budget is missing', () => {
    assert.equal(
      budgetCompatibility({ budget: 1000 }, { budget: undefined as never }),
      0,
    );
  });

  it('approaches zero for very different positive budgets', () => {
    assert.ok(
      Math.abs(
        budgetCompatibility({ budget: 1 }, { budget: 1000000 }) - 0.000001,
      ) < Number.EPSILON,
    );
  });

  it('rejects invalid budgets', () => {
    assert.throws(
      () =>
        budgetCompatibility(
          { budget: -100 as never },
          { budget: 1000 },
        ),
      /finite number greater than zero/,
    );
    assert.throws(
      () =>
        budgetCompatibility(
          { budget: Number.NaN as never },
          { budget: 1000 },
        ),
      /finite number greater than zero/,
    );
  });
});

describe('locationCompatibility', () => {
  it('matches locations without considering case or surrounding spaces', () => {
    assert.equal(
      locationCompatibility(
        { preferredArea: ' Central ' },
        { preferredArea: 'central' },
      ),
      1,
    );
  });

  it('returns zero for different locations', () => {
    assert.equal(
      locationCompatibility(
        { preferredArea: 'Central' },
        { preferredArea: 'North' },
      ),
      0,
    );
  });

  it('returns zero when a location is missing or blank', () => {
    assert.equal(
      locationCompatibility(
        { preferredArea: '' },
        { preferredArea: 'Central' },
      ),
      0,
    );
    assert.equal(
      locationCompatibility(
        { preferredArea: undefined as never },
        { preferredArea: 'Central' },
      ),
      0,
    );
  });

  it('rejects a non-string location', () => {
    assert.throws(
      () =>
        locationCompatibility(
          { preferredArea: 42 as never },
          { preferredArea: 'Central' },
        ),
      /preferredArea must be a string/,
    );
  });
});
