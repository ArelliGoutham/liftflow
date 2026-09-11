import connectToDatabase from '@/lib/db/connection';
import Plan from '@/lib/db/models/Plan';
import type { IPlan } from '@/types';

export async function getUserPlans(userId: string): Promise<IPlan[]> {
  await connectToDatabase();
  return Plan.find({ userId }).sort({ isActive: -1, updatedAt: -1 }).lean() as unknown as Promise<IPlan[]>;
}

export async function getPlanById(id: string, userId: string): Promise<IPlan | null> {
  await connectToDatabase();
  return Plan.findOne({ _id: id, userId }).lean() as unknown as Promise<IPlan | null>;
}

export async function createPlan(data: Partial<IPlan>): Promise<IPlan> {
  await connectToDatabase();
  const plan = new Plan(data);
  await plan.save();
  return plan.toObject() as IPlan;
}

export async function updatePlan(id: string, userId: string, data: Partial<IPlan>): Promise<IPlan | null> {
  await connectToDatabase();
  return Plan.findOneAndUpdate({ _id: id, userId }, data, { new: true }).lean() as unknown as Promise<IPlan | null>;
}

export async function deletePlan(id: string, userId: string): Promise<IPlan | null> {
  await connectToDatabase();
  return Plan.findOneAndDelete({ _id: id, userId }).lean() as unknown as Promise<IPlan | null>;
}

export async function setActivePlan(id: string, userId: string): Promise<void> {
  await connectToDatabase();
  await Plan.updateMany({ userId }, { isActive: false });
  await Plan.updateOne({ _id: id, userId }, { isActive: true });
}
