/**
 * VIN validation (ISO 3779 / NHTSA)
 */

const VIN_REGEX = /^[A-HJ-NPR-Z0-9]{17}$/i;

const TRANSLITERATION: Record<string, number> = {
  A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8,
  J: 1, K: 2, L: 3, M: 4, N: 5, P: 7, R: 9,
  S: 2, T: 3, U: 4, V: 5, W: 6, X: 7, Y: 8, Z: 9,
  "0": 0, "1": 1, "2": 2, "3": 3, "4": 4,
  "5": 5, "6": 6, "7": 7, "8": 8, "9": 9,
};

const WEIGHTS = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];

export function cleanVin(input: string): string {
  return input.replace(/[\s\-]/g, "").toUpperCase();
}

export function isValidFormat(vin: string): boolean {
  return VIN_REGEX.test(vin);
}

export function calculateCheckDigit(vin: string): string {
  let sum = 0;
  for (let i = 0; i < 17; i++) {
    const value = TRANSLITERATION[vin[i]] ?? 0;
    sum += value * WEIGHTS[i];
  }
  const remainder = sum % 11;
  return remainder === 10 ? "X" : String(remainder);
}

export function isValidCheckDigit(vin: string): boolean {
  if (vin.length !== 17) return false;
  return vin[8] === calculateCheckDigit(vin);
}

export interface ValidationResult {
  valid: boolean;
  cleaned: string;
  error?: string;
}

export function validateVin(input: string): ValidationResult {
  const cleaned = cleanVin(input);

  if (!cleaned) {
    return { valid: false, cleaned: "", error: "Please enter a VIN." };
  }
  if (cleaned.length !== 17) {
    return {
      valid: false,
      cleaned,
      error: "Please enter a valid 17-character VIN.",
    };
  }
  if (!isValidFormat(cleaned)) {
    return {
      valid: false,
      cleaned,
      error: "VIN contains invalid characters (I, O, and Q are not allowed).",
    };
  }
  if (!isValidCheckDigit(cleaned)) {
    return {
      valid: false,
      cleaned,
      error: "Invalid VIN check digit (position 9). Please verify the VIN.",
    };
  }
  return { valid: true, cleaned };
}

/** Model year from position 10 (approximate for modern VINs) */
const YEAR_CODES: Record<string, number> = {
  A: 2010, B: 2011, C: 2012, D: 2013, E: 2014, F: 2015, G: 2016, H: 2017,
  J: 2018, K: 2019, L: 2020, M: 2021, N: 2022, P: 2023, R: 2024, S: 2025,
  T: 2026, V: 2027, W: 2028, X: 2029, Y: 2030,
  "1": 2001, "2": 2002, "3": 2003, "4": 2004, "5": 2005,
  "6": 2006, "7": 2007, "8": 2008, "9": 2009,
};

export function getYearCode(vin: string): number | null {
  if (vin.length < 10) return null;
  return YEAR_CODES[vin[9]] ?? null;
}
