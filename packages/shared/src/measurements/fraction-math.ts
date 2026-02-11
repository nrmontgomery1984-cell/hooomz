/**
 * Fraction Math Utilities for Construction Measurements
 *
 * Handles imperial fraction parsing and formatting for construction use cases.
 * All internal values are stored as decimal inches.
 *
 * Supported input formats:
 * - "36" → 36 inches
 * - "36 1/2" → 36.5 inches
 * - "3' 6" → 42 inches (3 feet 6 inches)
 * - "3' 6 1/2" → 42.5 inches
 * - "3.5'" → 42 inches (3.5 feet)
 * - "3'-6" → 42 inches (alternative notation)
 * - "3'-6 1/2" → 42.5 inches
 */

// Common fractions used in construction (to nearest 1/16")
const COMMON_FRACTIONS: [number, string][] = [
  [0, ''],
  [1 / 16, '1/16'],
  [1 / 8, '1/8'],
  [3 / 16, '3/16'],
  [1 / 4, '1/4'],
  [5 / 16, '5/16'],
  [3 / 8, '3/8'],
  [7 / 16, '7/16'],
  [1 / 2, '1/2'],
  [9 / 16, '9/16'],
  [5 / 8, '5/8'],
  [11 / 16, '11/16'],
  [3 / 4, '3/4'],
  [13 / 16, '13/16'],
  [7 / 8, '7/8'],
  [15 / 16, '15/16'],
];

/**
 * Parse a fraction string (e.g., "1/2", "3/4") to decimal
 */
function parseFractionPart(fraction: string): number {
  const trimmed = fraction.trim();
  if (!trimmed) return 0;

  const parts = trimmed.split('/');
  if (parts.length !== 2) return 0;

  const numerator = parseFloat(parts[0]);
  const denominator = parseFloat(parts[1]);

  if (isNaN(numerator) || isNaN(denominator) || denominator === 0) {
    return 0;
  }

  return numerator / denominator;
}

/**
 * Parse a construction measurement string to decimal inches
 *
 * @param input - Measurement string in various formats
 * @returns Decimal inches, or NaN if parsing fails
 *
 * @example
 * parseFraction("36") // → 36
 * parseFraction("36 1/2") // → 36.5
 * parseFraction("3' 6") // → 42
 * parseFraction("3' 6 1/2") // → 42.5
 * parseFraction("3.5'") // → 42
 * parseFraction("3'-6") // → 42
 */
export function parseFraction(input: string): number {
  if (!input || typeof input !== 'string') {
    return NaN;
  }

  const trimmed = input.trim();
  if (!trimmed) return NaN;

  // Try to parse as pure number first (already in inches)
  const pureNumber = parseFloat(trimmed);
  if (!isNaN(pureNumber) && !trimmed.includes("'") && !trimmed.includes('/')) {
    return pureNumber;
  }

  let feet = 0;
  let inches = 0;
  let fraction = 0;

  // Handle feet notation: 3' or 3.5' or 3'-6 or 3' 6
  const feetMatch = trimmed.match(/^(\d+(?:\.\d+)?)\s*['′]\s*[-]?\s*/);
  if (feetMatch) {
    feet = parseFloat(feetMatch[1]);
    const remainder = trimmed.slice(feetMatch[0].length).trim();

    if (remainder) {
      // Parse remaining inches and fraction
      const inchesMatch = remainder.match(/^(\d+(?:\.\d+)?)\s*/);
      if (inchesMatch) {
        inches = parseFloat(inchesMatch[1]);
        const fractionPart = remainder.slice(inchesMatch[0].length).trim();
        // Remove trailing " if present
        const cleanFraction = fractionPart.replace(/["″]\s*$/, '').trim();
        if (cleanFraction) {
          fraction = parseFractionPart(cleanFraction);
        }
      } else {
        // Just a fraction remaining (e.g., "3' 1/2")
        const cleanFraction = remainder.replace(/["″]\s*$/, '').trim();
        fraction = parseFractionPart(cleanFraction);
      }
    }

    return feet * 12 + inches + fraction;
  }

  // Handle inches with fraction: "36 1/2" or "36 1/2""
  const inchesWithFractionMatch = trimmed.match(
    /^(\d+(?:\.\d+)?)\s+(\d+\/\d+)\s*["″]?\s*$/
  );
  if (inchesWithFractionMatch) {
    inches = parseFloat(inchesWithFractionMatch[1]);
    fraction = parseFractionPart(inchesWithFractionMatch[2]);
    return inches + fraction;
  }

  // Handle standalone fraction: "1/2" or "3/4"
  const standaloneFractionMatch = trimmed.match(/^(\d+\/\d+)\s*["″]?\s*$/);
  if (standaloneFractionMatch) {
    return parseFractionPart(standaloneFractionMatch[1]);
  }

  // Handle just inches with optional " symbol: "36" or "36""
  const justInchesMatch = trimmed.match(/^(\d+(?:\.\d+)?)\s*["″]?\s*$/);
  if (justInchesMatch) {
    return parseFloat(justInchesMatch[1]);
  }

  return NaN;
}

/**
 * Find the closest common fraction for a decimal value
 */
function findClosestFraction(decimal: number): string {
  // Get just the fractional part
  const fractionalPart = decimal - Math.floor(decimal);

  if (fractionalPart < 0.001) {
    return '';
  }

  let closest = COMMON_FRACTIONS[0];
  let minDiff = Math.abs(fractionalPart - closest[0]);

  for (const [value, display] of COMMON_FRACTIONS) {
    const diff = Math.abs(fractionalPart - value);
    if (diff < minDiff) {
      minDiff = diff;
      closest = [value, display];
    }
  }

  // Also check if we're closer to 1 (next whole number)
  if (Math.abs(1 - fractionalPart) < minDiff) {
    return '';
  }

  return closest[1];
}

/**
 * Format decimal inches to feet-inches-fraction display string
 *
 * @param inches - Decimal inches
 * @param options - Formatting options
 * @returns Formatted string (e.g., "3' 6 1/2"")
 *
 * @example
 * formatFraction(42.5) // → "3' 6 1/2""
 * formatFraction(36) // → "3' 0""
 * formatFraction(6.5) // → "6 1/2""
 * formatFraction(0.5) // → "1/2""
 */
export function formatFraction(
  inches: number,
  options: {
    alwaysShowFeet?: boolean;
    precision?: 16 | 8 | 4 | 2;
  } = {}
): string {
  const { alwaysShowFeet = false } = options;

  if (isNaN(inches) || !isFinite(inches)) {
    return '';
  }

  const isNegative = inches < 0;
  const absInches = Math.abs(inches);

  const totalFeet = Math.floor(absInches / 12);
  const remainingInches = absInches % 12;
  const wholeInches = Math.floor(remainingInches);

  // Check if fractional part rounds up to next inch
  const fractionalPart = remainingInches - wholeInches;
  const fractionStr = findClosestFraction(fractionalPart);
  const roundsUp = fractionStr === '' && fractionalPart > 0.97;

  let adjustedWholeInches = wholeInches;
  let adjustedFeet = totalFeet;

  if (roundsUp) {
    adjustedWholeInches = wholeInches + 1;
    if (adjustedWholeInches >= 12) {
      adjustedWholeInches = 0;
      adjustedFeet++;
    }
  }

  const sign = isNegative ? '-' : '';

  // Build the output string
  const parts: string[] = [];

  if (adjustedFeet > 0 || alwaysShowFeet) {
    parts.push(`${adjustedFeet}'`);
  }

  if (adjustedWholeInches > 0 || (adjustedFeet > 0 && !fractionStr) || (adjustedFeet === 0 && !fractionStr)) {
    parts.push(`${adjustedWholeInches}`);
  }

  if (fractionStr) {
    if (parts.length > 0 && !parts[parts.length - 1].endsWith("'")) {
      // Add space between whole inches and fraction
      parts[parts.length - 1] += ` ${fractionStr}`;
    } else if (adjustedWholeInches === 0 && adjustedFeet === 0) {
      // Just the fraction
      parts.push(fractionStr);
    } else {
      parts.push(fractionStr);
    }
  }

  // Add the inch symbol to the last numeric part
  let result = parts.join(' ');

  // Add " if we have an inches component
  // This includes: inches > 0, any fraction, no feet (pure inches), or feet with 0 inches shown
  const hasInchesDisplay = adjustedWholeInches > 0 || fractionStr || adjustedFeet === 0 ||
    (adjustedFeet > 0 && parts.length > 1);
  if (hasInchesDisplay) {
    result += '"';
  }

  return sign + result;
}

/**
 * Format decimal inches to inches-only display (no feet conversion)
 *
 * @param inches - Decimal inches
 * @returns Formatted string (e.g., "42 1/2"")
 */
export function formatInchesOnly(inches: number): string {
  if (isNaN(inches) || !isFinite(inches)) {
    return '';
  }

  const isNegative = inches < 0;
  const absInches = Math.abs(inches);
  const wholeInches = Math.floor(absInches);
  const fractionStr = findClosestFraction(absInches);

  const sign = isNegative ? '-' : '';

  if (fractionStr) {
    if (wholeInches > 0) {
      return `${sign}${wholeInches} ${fractionStr}"`;
    }
    return `${sign}${fractionStr}"`;
  }

  return `${sign}${wholeInches}"`;
}

/**
 * Add two measurements (in decimal inches)
 */
export function addFractions(a: number, b: number): number {
  return a + b;
}

/**
 * Subtract two measurements (in decimal inches)
 */
export function subtractFractions(a: number, b: number): number {
  return a - b;
}

/**
 * Multiply a measurement by a scalar
 */
export function multiplyFraction(inches: number, multiplier: number): number {
  return inches * multiplier;
}

/**
 * Divide a measurement by a divisor
 */
export function divideFraction(inches: number, divisor: number): number {
  if (divisor === 0) return NaN;
  return inches / divisor;
}

/**
 * Convert decimal inches to feet (as decimal)
 */
export function inchesToFeet(inches: number): number {
  return inches / 12;
}

/**
 * Convert feet (as decimal) to inches
 */
export function feetToInches(feet: number): number {
  return feet * 12;
}

/**
 * Round to the nearest fraction (e.g., nearest 1/16")
 *
 * @param inches - Decimal inches
 * @param precision - Denominator of the smallest fraction (16 = 1/16", 8 = 1/8", etc.)
 */
export function roundToFraction(inches: number, precision: number = 16): number {
  return Math.round(inches * precision) / precision;
}

/**
 * Validate if a string is a valid measurement format
 */
export function isValidMeasurement(input: string): boolean {
  const result = parseFraction(input);
  return !isNaN(result) && isFinite(result);
}

/**
 * Get a human-readable description of the measurement
 * Useful for accessibility and voice interfaces
 */
export function describeMeasurement(inches: number): string {
  if (isNaN(inches) || !isFinite(inches)) {
    return 'invalid measurement';
  }

  const feet = Math.floor(inches / 12);
  const remainingInches = inches % 12;
  const wholeInches = Math.floor(remainingInches);
  const fractionStr = findClosestFraction(remainingInches);

  const parts: string[] = [];

  if (feet > 0) {
    parts.push(`${feet} ${feet === 1 ? 'foot' : 'feet'}`);
  }

  if (wholeInches > 0) {
    parts.push(`${wholeInches} ${wholeInches === 1 ? 'inch' : 'inches'}`);
  }

  if (fractionStr) {
    parts.push(`${fractionStr} of an inch`);
  }

  if (parts.length === 0) {
    return '0 inches';
  }

  return parts.join(' and ');
}
