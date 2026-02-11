/**
 * Tests for Fraction Math Utilities
 *
 * These tests cover all input formats specified in the branch brief:
 * - "36" → 36 inches
 * - "36 1/2" → 36.5 inches
 * - "3' 6" → 42 inches
 * - "3' 6 1/2" → 42.5 inches
 * - "3.5'" → 42 inches
 */

import { describe, it, expect } from 'vitest';
import {
  parseFraction,
  formatFraction,
  formatInchesOnly,
  addFractions,
  subtractFractions,
  multiplyFraction,
  divideFraction,
  inchesToFeet,
  feetToInches,
  roundToFraction,
  isValidMeasurement,
  describeMeasurement,
} from './fraction-math';

describe('parseFraction', () => {
  describe('pure inches (no fractions)', () => {
    it('parses whole inches: "36" → 36', () => {
      expect(parseFraction('36')).toBe(36);
    });

    it('parses decimal inches: "36.5" → 36.5', () => {
      expect(parseFraction('36.5')).toBe(36.5);
    });

    it('parses inches with symbol: "36"" → 36', () => {
      expect(parseFraction('36"')).toBe(36);
    });

    it('parses zero: "0" → 0', () => {
      expect(parseFraction('0')).toBe(0);
    });
  });

  describe('inches with fractions', () => {
    it('parses inches with fraction: "36 1/2" → 36.5', () => {
      expect(parseFraction('36 1/2')).toBe(36.5);
    });

    it('parses inches with fraction and symbol: "36 1/2"" → 36.5', () => {
      expect(parseFraction('36 1/2"')).toBe(36.5);
    });

    it('parses quarter inch: "36 1/4" → 36.25', () => {
      expect(parseFraction('36 1/4')).toBe(36.25);
    });

    it('parses three-quarter inch: "36 3/4" → 36.75', () => {
      expect(parseFraction('36 3/4')).toBe(36.75);
    });

    it('parses eighth inch: "12 1/8" → 12.125', () => {
      expect(parseFraction('12 1/8')).toBe(12.125);
    });

    it('parses sixteenth inch: "6 1/16" → 6.0625', () => {
      expect(parseFraction('6 1/16')).toBe(6.0625);
    });

    it('parses standalone fraction: "1/2" → 0.5', () => {
      expect(parseFraction('1/2')).toBe(0.5);
    });

    it('parses standalone fraction with symbol: "3/4"" → 0.75', () => {
      expect(parseFraction('3/4"')).toBe(0.75);
    });
  });

  describe('feet notation', () => {
    it('parses feet only: "3\'" → 36', () => {
      expect(parseFraction("3'")).toBe(36);
    });

    it('parses decimal feet: "3.5\'" → 42', () => {
      expect(parseFraction("3.5'")).toBe(42);
    });

    it('parses feet and inches: "3\' 6" → 42', () => {
      expect(parseFraction("3' 6")).toBe(42);
    });

    it('parses feet and inches with symbol: "3\' 6"" → 42', () => {
      expect(parseFraction('3\' 6"')).toBe(42);
    });

    it('parses feet-inches-fraction: "3\' 6 1/2" → 42.5', () => {
      expect(parseFraction("3' 6 1/2")).toBe(42.5);
    });

    it('parses feet-inches-fraction with symbol: "3\' 6 1/2"" → 42.5', () => {
      expect(parseFraction('3\' 6 1/2"')).toBe(42.5);
    });

    it('parses hyphenated notation: "3\'-6" → 42', () => {
      expect(parseFraction("3'-6")).toBe(42);
    });

    it('parses hyphenated with fraction: "3\'-6 1/2" → 42.5', () => {
      expect(parseFraction("3'-6 1/2")).toBe(42.5);
    });

    it('parses feet with just fraction: "3\' 1/2" → 36.5', () => {
      expect(parseFraction("3' 1/2")).toBe(36.5);
    });
  });

  describe('edge cases and whitespace', () => {
    it('handles leading/trailing whitespace', () => {
      expect(parseFraction('  36  ')).toBe(36);
    });

    it('handles multiple spaces between components', () => {
      expect(parseFraction("3'   6   1/2")).toBe(42.5);
    });

    it('returns NaN for empty string', () => {
      expect(parseFraction('')).toBeNaN();
    });

    it('returns NaN for null-like values', () => {
      expect(parseFraction(null as unknown as string)).toBeNaN();
      expect(parseFraction(undefined as unknown as string)).toBeNaN();
    });

    it('returns NaN for invalid input', () => {
      expect(parseFraction('abc')).toBeNaN();
      expect(parseFraction('12 feet')).toBeNaN();
    });

    it('returns NaN for malformed fractions', () => {
      expect(parseFraction('1/0')).toBeNaN();
      expect(parseFraction('1/')).toBeNaN();
    });
  });

  describe('construction standard measurements', () => {
    // Common construction measurements
    it('parses standard wall height: "97 1/8" → 97.125', () => {
      expect(parseFraction('97 1/8')).toBe(97.125);
    });

    it('parses standard wall height in feet: "8\' 1 1/8" → 97.125', () => {
      expect(parseFraction("8' 1 1/8")).toBe(97.125);
    });

    it('parses standard 2x4 width: "3 1/2" → 3.5', () => {
      expect(parseFraction('3 1/2')).toBe(3.5);
    });

    it('parses standard 2x6 width: "5 1/2" → 5.5', () => {
      expect(parseFraction('5 1/2')).toBe(5.5);
    });

    it('parses 16" OC spacing: "16" → 16', () => {
      expect(parseFraction('16')).toBe(16);
    });

    it('parses window rough opening: "36 1/2" → 36.5', () => {
      expect(parseFraction('36 1/2')).toBe(36.5);
    });
  });
});

describe('formatFraction', () => {
  describe('basic formatting', () => {
    it('formats whole feet and inches: 42 → "3\' 6""', () => {
      expect(formatFraction(42)).toBe('3\' 6"');
    });

    it('formats feet-inches-fraction: 42.5 → "3\' 6 1/2""', () => {
      expect(formatFraction(42.5)).toBe('3\' 6 1/2"');
    });

    it('formats inches only when less than 12: 6.5 → "6 1/2""', () => {
      expect(formatFraction(6.5)).toBe('6 1/2"');
    });

    it('formats pure fraction: 0.5 → "1/2""', () => {
      expect(formatFraction(0.5)).toBe('1/2"');
    });

    it('formats zero: 0 → "0""', () => {
      expect(formatFraction(0)).toBe('0"');
    });

    it('formats exact feet: 36 → "3\' 0""', () => {
      expect(formatFraction(36)).toBe("3' 0\"");
    });

    it('formats 1 foot exactly: 12 → "1\' 0""', () => {
      expect(formatFraction(12)).toBe("1' 0\"");
    });
  });

  describe('common fractions', () => {
    it('formats 1/4: 6.25 → "6 1/4""', () => {
      expect(formatFraction(6.25)).toBe('6 1/4"');
    });

    it('formats 3/4: 6.75 → "6 3/4""', () => {
      expect(formatFraction(6.75)).toBe('6 3/4"');
    });

    it('formats 1/8: 6.125 → "6 1/8""', () => {
      expect(formatFraction(6.125)).toBe('6 1/8"');
    });

    it('formats 3/8: 6.375 → "6 3/8""', () => {
      expect(formatFraction(6.375)).toBe('6 3/8"');
    });

    it('formats 1/16: 6.0625 → "6 1/16""', () => {
      expect(formatFraction(6.0625)).toBe('6 1/16"');
    });
  });

  describe('rounding to nearest fraction', () => {
    // Values that should round to common fractions
    it('rounds 6.13 to 6 1/8: → "6 1/8""', () => {
      expect(formatFraction(6.13)).toBe('6 1/8"');
    });

    it('rounds 6.24 to 6 1/4: → "6 1/4""', () => {
      expect(formatFraction(6.24)).toBe('6 1/4"');
    });

    it('rounds 6.51 to 6 1/2: → "6 1/2""', () => {
      expect(formatFraction(6.51)).toBe('6 1/2"');
    });
  });

  describe('options', () => {
    it('always shows feet when option is set', () => {
      expect(formatFraction(6.5, { alwaysShowFeet: true })).toBe('0\' 6 1/2"');
    });
  });

  describe('edge cases', () => {
    it('handles NaN', () => {
      expect(formatFraction(NaN)).toBe('');
    });

    it('handles Infinity', () => {
      expect(formatFraction(Infinity)).toBe('');
    });

    it('handles negative values', () => {
      expect(formatFraction(-6.5)).toBe('-6 1/2"');
    });

    it('handles large values', () => {
      expect(formatFraction(120)).toBe("10' 0\"");
    });
  });
});

describe('formatInchesOnly', () => {
  it('formats without converting to feet: 42.5 → "42 1/2""', () => {
    expect(formatInchesOnly(42.5)).toBe('42 1/2"');
  });

  it('formats whole inches: 36 → "36""', () => {
    expect(formatInchesOnly(36)).toBe('36"');
  });

  it('formats fraction only: 0.5 → "1/2""', () => {
    expect(formatInchesOnly(0.5)).toBe('1/2"');
  });

  it('handles zero: 0 → "0""', () => {
    expect(formatInchesOnly(0)).toBe('0"');
  });
});

describe('math operations', () => {
  describe('addFractions', () => {
    it('adds two measurements', () => {
      expect(addFractions(36, 6.5)).toBe(42.5);
    });

    it('adds measurements with fractions', () => {
      expect(addFractions(6.25, 6.75)).toBe(13);
    });
  });

  describe('subtractFractions', () => {
    it('subtracts two measurements', () => {
      expect(subtractFractions(42.5, 6.5)).toBe(36);
    });

    it('can result in negative', () => {
      expect(subtractFractions(6, 10)).toBe(-4);
    });
  });

  describe('multiplyFraction', () => {
    it('multiplies measurement by scalar', () => {
      expect(multiplyFraction(6.5, 2)).toBe(13);
    });

    it('handles decimal multipliers', () => {
      expect(multiplyFraction(10, 0.5)).toBe(5);
    });
  });

  describe('divideFraction', () => {
    it('divides measurement by divisor', () => {
      expect(divideFraction(13, 2)).toBe(6.5);
    });

    it('returns NaN for division by zero', () => {
      expect(divideFraction(10, 0)).toBeNaN();
    });
  });
});

describe('unit conversions', () => {
  describe('inchesToFeet', () => {
    it('converts inches to feet', () => {
      expect(inchesToFeet(36)).toBe(3);
    });

    it('handles partial feet', () => {
      expect(inchesToFeet(42)).toBe(3.5);
    });
  });

  describe('feetToInches', () => {
    it('converts feet to inches', () => {
      expect(feetToInches(3)).toBe(36);
    });

    it('handles decimal feet', () => {
      expect(feetToInches(3.5)).toBe(42);
    });
  });
});

describe('roundToFraction', () => {
  it('rounds to nearest 1/16 by default', () => {
    expect(roundToFraction(6.53)).toBe(6.5);
  });

  it('rounds to nearest 1/8', () => {
    expect(roundToFraction(6.53, 8)).toBe(6.5);
  });

  it('rounds to nearest 1/4', () => {
    expect(roundToFraction(6.53, 4)).toBe(6.5);
  });

  it('rounds to nearest 1/2', () => {
    expect(roundToFraction(6.3, 2)).toBe(6.5);
  });
});

describe('isValidMeasurement', () => {
  it('returns true for valid measurements', () => {
    expect(isValidMeasurement('36')).toBe(true);
    expect(isValidMeasurement('36 1/2')).toBe(true);
    expect(isValidMeasurement("3' 6")).toBe(true);
    expect(isValidMeasurement("3' 6 1/2")).toBe(true);
    expect(isValidMeasurement("3.5'")).toBe(true);
  });

  it('returns false for invalid measurements', () => {
    expect(isValidMeasurement('')).toBe(false);
    expect(isValidMeasurement('abc')).toBe(false);
    expect(isValidMeasurement('1/0')).toBe(false);
  });
});

describe('describeMeasurement', () => {
  it('describes feet and inches', () => {
    expect(describeMeasurement(42.5)).toBe('3 feet and 6 inches and 1/2 of an inch');
  });

  it('describes inches only', () => {
    expect(describeMeasurement(6)).toBe('6 inches');
  });

  it('describes single foot', () => {
    expect(describeMeasurement(12)).toBe('1 foot');
  });

  it('describes single inch', () => {
    expect(describeMeasurement(1)).toBe('1 inch');
  });

  it('describes fraction only', () => {
    expect(describeMeasurement(0.5)).toBe('1/2 of an inch');
  });

  it('describes zero', () => {
    expect(describeMeasurement(0)).toBe('0 inches');
  });

  it('handles invalid input', () => {
    expect(describeMeasurement(NaN)).toBe('invalid measurement');
  });
});

describe('round-trip parsing and formatting', () => {
  const testCases = [
    { input: '36', expectedInches: 36 },
    { input: '36 1/2', expectedInches: 36.5 },
    { input: "3' 6", expectedInches: 42 },
    { input: "3' 6 1/2", expectedInches: 42.5 },
    { input: "3.5'", expectedInches: 42 },
    { input: "8' 1 1/8", expectedInches: 97.125 },
    { input: '97 1/8', expectedInches: 97.125 },
  ];

  testCases.forEach(({ input, expectedInches }) => {
    it(`parses "${input}" to ${expectedInches} inches`, () => {
      expect(parseFraction(input)).toBe(expectedInches);
    });
  });

  it('parse → format → parse returns same value', () => {
    const original = 42.5;
    const formatted = formatFraction(original);
    const reparsed = parseFraction(formatted);
    expect(reparsed).toBe(original);
  });
});
