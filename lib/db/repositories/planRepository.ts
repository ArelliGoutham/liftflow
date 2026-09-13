import connectToDatabase from '@/lib/db/connection';
import Plan from '@/lib/db/models/Plan';
import type { IPlan } from '@/types';

/**
 * Retrieves all workout plans for a user, ordered by active status then recency.
 * @param userId - The user's MongoDB ObjectId as a string
 * @returns Array of plan documents belonging to the user
 */
export async function getUserPlans(userId: string): Promise<IPlan[]> {
  await connectToDatabase();
  return Plan.find({ userId }).sort({ isActive: -1, updatedAt: -1 }).lean() as unknown as Promise<IPlan[]>;
}

/**
 * Retrieves a single plan by ID, scoped to the specified user.
 * @param id - The plan's MongoDB ObjectId as a string
 * @param userId - The user's MongoDB ObjectId as a string (ensures ownership)
 * @returns The matching plan document, or null if not found or not owned by the user
 */
export async function getPlanById(id: string, userId: string): Promise<IPlan | null> {
  await connectToDatabase();
  return Plan.findOne({ _id: id, userId }).lean() as unknown as Promise<IPlan | null>;
}

/**
 * Creates a new workout plan in the database.
 * @param data - Partial plan fields including userId and plan name
 * @returns The newly created plan document
 */
export async function createPlan(data: Partial<IPlan>): Promise<IPlan> {
  await connectToDatabase();
  const plan = new Plan(data);
  await plan.save();
  return plan.toObject() as IPlan;
}

/**
 * Updates a plan owned by the specified user.
 * @param id - The plan's MongoDB ObjectId as a string
 * @param userId - The user's MongoDB ObjectId as a string (ensures ownership)
 * @param data - Partial plan fields to update
 * @returns The updated plan document, or null if not found or not owned by the user
 */
export async function updatePlan(id: string, userId: string, data: Partial<IPlan>): Promise<IPlan | null> {
  await connectToDatabase();
  return Plan.findOneAndUpdate({ _id: id, userId }, data, { new: true }).lean() as unknown as Promise<IPlan | null>;
}

/**
 * Deletes a plan owned by the specified user.
 * @param id - The plan's MongoDB ObjectId as a string
 * @param userId - The user's MongoDB ObjectId as a string (ensures ownership)
 * @returns The deleted plan document, or null if not found or not owned by the user
 */
export async function deletePlan(id: string, userId: string): Promise<IPlan | null> {
  await connectToDatabase();
  return Plan.findOneAndDelete({ _id: id, userId }).lean() as unknown as Promise<IPlan | null>;
}

/**
 * Sets a plan as the user's active plan, deactivating all other plans for that user.
 * @param id - The plan's MongoDB ObjectId as a string
 * @param userId - The user's MongoDB ObjectId as a string
 * @returns Promise that resolves when the active plan has been set
 */
export async function setActivePlan(id: string, userId: string): Promise<void> {
  await connectToDatabase();
  await Plan.updateMany({ userId }, { isActive: false });
  await Plan.updateOne({ _id: id, userId }, { isActive: true });
}
