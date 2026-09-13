import connectToDatabase from '@/lib/db/connection';
import User from '@/lib/db/models/User';
import type { IUser } from '@/types';

/**
 * Finds a user by their email address.
 * @param email - The email address to search for
 * @returns Promise resolving to the matching user document or null if not found
 */
export async function findUserByEmail(email: string): Promise<IUser | null> {
  await connectToDatabase();
  return User.findOne({ email }).lean() as unknown as Promise<IUser | null>;
}

/**
 * Creates a new user in the database.
 * @param data - User creation data including auth provider ID, name, email, and optional image
 * @returns Promise resolving to the newly created user document
 */
export async function createUser(data: {
  authProviderId: string;
  name: string;
  email: string;
  image?: string;
}): Promise<IUser> {
  await connectToDatabase();
  const user = new User(data);
  await user.save();
  return user.toObject() as IUser;
}

/**
 * Finds a user by their MongoDB ObjectId.
 * @param id - The user's MongoDB ObjectId as a string
 * @returns Promise resolving to the matching user document or null if not found
 */
export async function findUserById(id: string): Promise<IUser | null> {
  await connectToDatabase();
  return User.findById(id).lean() as unknown as Promise<IUser | null>;
}
