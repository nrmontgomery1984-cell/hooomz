/**
 * Unit conversion utilities — mm ↔ imperial, area calculations.
 * All RoomScan data is stored in mm internally.
 */

const MM_PER_INCH = 25.4;
const INCHES_PER_FOOT = 12;
const MM_PER_FOOT = MM_PER_INCH * INCHES_PER_FOOT;
const SQ_MM_PER_SQ_FT = MM_PER_FOOT * MM_PER_FOOT;

/** mm → decimal inches */
export function mmToInches(mm: number): number {
  return mm / MM_PER_INCH;
}

/** decimal inches → mm */
export function inchesToMm(inches: number): number {
  return inches * MM_PER_INCH;
}

/** mm → decimal feet */
export function mmToFeet(mm: number): number {
  return mm / MM_PER_FOOT;
}

/** decimal feet → mm */
export function feetToMm(feet: number): number {
  return feet * MM_PER_FOOT;
}

/** mm² → square feet */
export function sqMmToSqFt(sqMm: number): number {
  return sqMm / SQ_MM_PER_SQ_FT;
}

/** square feet → mm² */
export function sqFtToSqMm(sqFt: number): number {
  return sqFt * SQ_MM_PER_SQ_FT;
}

/** meters → mm */
export function metersToMm(m: number): number {
  return m * 1000;
}

/** mm → meters */
export function mmToMeters(mm: number): number {
  return mm / 1000;
}

/**
 * Convert mm to a fractional-inch string representation.
 * Resolution: 1/16". Values >= 12" rendered as feet-and-inches.
 *
 * Examples:
 *   4.76  → '3/16"'
 *   25.4  → '1"'
 *   38.1  → '1-1/2"'
 *   304.8 → '1\'-0"'
 *   317.5 → '1\'-1/2"'
 */
export function mmToFractionalInches(mm: number): string {
  if (mm === 0) return '0"';
  if (mm < 0) mm = Math.abs(mm);

  const totalInches = mm / MM_PER_INCH;
  const sixteenths = Math.round(totalInches * 16);
  const totalSixteenths = sixteenths;

  const feet = Math.floor(totalSixteenths / (16 * INCHES_PER_FOOT));
  const remainingSixteenths = totalSixteenths % (16 * INCHES_PER_FOOT);
  const wholeInches = Math.floor(remainingSixteenths / 16);
  const fracSixteenths = remainingSixteenths % 16;

  const fracStr = formatSixteenths(fracSixteenths);

  if (feet > 0) {
    const inchPart = wholeInches > 0
      ? fracSixteenths > 0 ? `${wholeInches}-${fracStr}` : `${wholeInches}"`
      : fracSixteenths > 0 ? fracStr : '0"';
    return `${feet}'-${inchPart}`;
  }

  if (wholeInches > 0) {
    return fracSixteenths > 0 ? `${wholeInches}-${fracStr}` : `${wholeInches}"`;
  }

  return fracStr;
}

function formatSixteenths(sixteenths: number): string {
  if (sixteenths === 0) return '0"';
  const gcd = greatestCommonDivisor(sixteenths, 16);
  return `${sixteenths / gcd}/${16 / gcd}"`;
}

function greatestCommonDivisor(a: number, b: number): number {
  return b === 0 ? a : greatestCommonDivisor(b, a % b);
}

/**
 * Parse a fractional-inch string or decimal number into mm.
 * Accepts: 1.5, "1-1/2", "1 1/2", "3/4", "1'-6"", "18""
 */
export function parseFractionalInchesToMm(value: number | string): number {
  if (typeof value === 'number') return inchesToMm(value);

  const str = value.trim().replace(/"+$/, '');

  // Feet-and-inches: 1'-6 or 1'6
  const feetInchesMatch = str.match(/^(\d+)'[-\s]?(.*)$/);
  if (feetInchesMatch) {
    const feet = parseInt(feetInchesMatch[1], 10);
    const inchesStr = feetInchesMatch[2].trim();
    const inches = inchesStr ? parseInchesOnly(inchesStr) : 0;
    return feetToMm(feet) + inchesToMm(inches);
  }

  return inchesToMm(parseInchesOnly(str));
}

function parseInchesOnly(str: string): number {
  // Whole + fraction: "1-1/2" or "1 1/2"
  const mixedMatch = str.match(/^(\d+)[-\s](\d+)\/(\d+)$/);
  if (mixedMatch) {
    return parseInt(mixedMatch[1], 10) + parseInt(mixedMatch[2], 10) / parseInt(mixedMatch[3], 10);
  }
  // Pure fraction: "3/4"
  const fracMatch = str.match(/^(\d+)\/(\d+)$/);
  if (fracMatch) {
    return parseInt(fracMatch[1], 10) / parseInt(fracMatch[2], 10);
  }
  // Decimal or whole
  return parseFloat(str) || 0;
}

/**
 * Convert a RoomScan source unit value to mm.
 */
export function convertToMm(value: number, sourceUnit: 'mm' | 'ft' | 'm'): number {
  switch (sourceUnit) {
    case 'mm': return value;
    case 'ft': return feetToMm(value);
    case 'm': return metersToMm(value);
  }
}
