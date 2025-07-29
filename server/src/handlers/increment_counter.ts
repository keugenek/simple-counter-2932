
import { db } from '../db';
import { countersTable } from '../db/schema';
import { type IncrementCounterInput, type Counter } from '../schema';
import { eq } from 'drizzle-orm';

export const incrementCounter = async (input: IncrementCounterInput): Promise<Counter> => {
  try {
    // First, try to get the existing counter (assuming id=1 for single counter)
    const existingCounters = await db.select()
      .from(countersTable)
      .where(eq(countersTable.id, 1))
      .execute();

    if (existingCounters.length === 0) {
      // Create initial counter if it doesn't exist
      const result = await db.insert(countersTable)
        .values({
          count: input.increment,
          updated_at: new Date()
        })
        .returning()
        .execute();

      return result[0];
    } else {
      // Update existing counter
      const currentCounter = existingCounters[0];
      const newCount = currentCounter.count + input.increment;

      const result = await db.update(countersTable)
        .set({
          count: newCount,
          updated_at: new Date()
        })
        .where(eq(countersTable.id, 1))
        .returning()
        .execute();

      return result[0];
    }
  } catch (error) {
    console.error('Counter increment failed:', error);
    throw error;
  }
};
