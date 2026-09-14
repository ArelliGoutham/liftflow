/**
 * Checks whether a string is a 24-character hex MongoDB ObjectId.
 * @param id - The string to test
 * @returns True if the string matches the MongoDB ObjectId format, false otherwise
 */
export function isMongoId(id: string): boolean {
  return /^[0-9a-fA-F]{24}$/.test(id);
}

/**
 * Converts centimeters to feet and inches.
 * @param cm - Height in centimeters
 * @returns Object with `feet` and `inches` (inches rounded to one decimal)
 */
export function cmToFeetInches(cm: number): { feet: number; inches: number } {
  const totalInches = cm / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round((totalInches % 12) * 10) / 10;
  return { feet, inches };
}

/**
 * Converts feet and inches to centimeters.
 * @param feet - The feet component
 * @param inches - The inches component
 * @returns Height in centimeters rounded to one decimal
 */
export function feetInchesToCm(feet: number, inches: number): number {
  const totalInches = feet * 12 + inches;
  return Math.round(totalInches * 2.54 * 10) / 10;
}

/**
 * Converts kilograms to pounds.
 * @param kg - Weight in kilograms
 * @returns Weight in pounds rounded to one decimal
 */
export function kgToLbs(kg: number): number {
  return Math.round(kg * 2.20462262185 * 10) / 10;
}

/**
 * Converts pounds to kilograms.
 * @param lbs - Weight in pounds
 * @returns Weight in kilograms rounded to one decimal
 */
export function lbsToKg(lbs: number): number {
  return Math.round((lbs / 2.20462262185) * 10) / 10;
}

/**
 * Formats a height value for display based on the preferred unit system.
 * @param cm - Height in centimeters
 * @param units - 'metric' or 'imperial'
 * @returns Formatted string like "175 cm" or "5'9""
 */
export function formatHeight(cm: number, units: string): string {
  if (units === 'imperial') {
    const { feet, inches } = cmToFeetInches(cm);
    return `${feet}'${inches}"`;
  }
  return `${Math.round(cm)} cm`;
}

/**
 * Formats a weight value for display based on the preferred unit system.
 * @param kg - Weight in kilograms
 * @param units - 'metric' or 'imperial'
 * @returns Formatted string like "75 kg" or "165 lbs"
 */
export function formatWeight(kg: number, units: string): string {
  if (units === 'imperial') {
    return `${kgToLbs(kg)} lbs`;
  }
  return `${Math.round(kg)} kg`;
}
