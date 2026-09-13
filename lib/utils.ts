/** Checks whether a string is a 24-character hex MongoDB ObjectId. */
export function isMongoId(id: string): boolean {
  return /^[0-9a-fA-F]{24}$/.test(id);
}
