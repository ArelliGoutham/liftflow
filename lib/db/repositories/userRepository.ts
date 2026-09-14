import connectToDatabase from '@/lib/db/connection';
import User from '@/lib/db/models/User';
import type { IUser, IUserProfile } from '@/types';

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

/**
 * Retrieves a user's profile (fitness stats, goals, equipment, etc.) as JSON-safe data.
 * @param userId - The authenticated user's MongoDB ObjectId as a string
 * @returns Promise resolving to the user profile object with stringified _id, or null if not found
 */
export async function getUserProfile(userId: string): Promise<IUserProfile | null> {
  await connectToDatabase();
  const user = await User.findById(userId).lean() as unknown as IUser | null;
  if (!user) return null;
  return {
    gender: user.gender,
    dateOfBirth: user.dateOfBirth,
    heightCm: user.heightCm,
    weightKg: user.weightKg,
    fitnessGoal: user.fitnessGoal,
    experienceLevel: user.experienceLevel,
    workoutsPerWeek: user.workoutsPerWeek,
    equipmentAccess: user.equipmentAccess,
    injuries: user.injuries,
    profileCompleted: user.profileCompleted ?? false,
    preferredUnits: user.preferredUnits ?? 'metric',
  };
}

/**
 * Updates a user's profile fields and marks the profile as completed.
 * @param userId - The authenticated user's MongoDB ObjectId as a string
 * @param data - Partial profile data to update
 * @returns Promise resolving to the updated user profile object, or null if user not found
 */
export async function updateUserProfile(
  userId: string,
  data: Partial<IUserProfile>
): Promise<IUserProfile | null> {
  await connectToDatabase();
  const updated = await User.findByIdAndUpdate(
    userId,
    { $set: { ...data, profileCompleted: true } },
    { new: true, lean: true }
  ) as unknown as IUser | null;
  if (!updated) return null;
  return {
    gender: updated.gender,
    dateOfBirth: updated.dateOfBirth,
    heightCm: updated.heightCm,
    weightKg: updated.weightKg,
    fitnessGoal: updated.fitnessGoal,
    experienceLevel: updated.experienceLevel,
    workoutsPerWeek: updated.workoutsPerWeek,
    equipmentAccess: updated.equipmentAccess,
    injuries: updated.injuries,
    profileCompleted: updated.profileCompleted ?? false,
    preferredUnits: updated.preferredUnits ?? 'metric',
  };
}
