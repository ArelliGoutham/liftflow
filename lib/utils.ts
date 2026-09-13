/**
 * Checks whether a string is a 24-character hex MongoDB ObjectId.
 * @param id - The string to test
 * @returns True if the string matches the MongoDB ObjectId format, false otherwise
 */
export function isMongoId(id: string): boolean {
  return /^[0-9a-fA-F]{24}$/.test(id);
}
