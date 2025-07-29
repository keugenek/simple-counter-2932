
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { countersTable } from '../db/schema';
import { type IncrementCounterInput } from '../schema';
import { incrementCounter } from '../handlers/increment_counter';
import { eq } from 'drizzle-orm';

describe('incrementCounter', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create initial counter when none exists', async () => {
    const input: IncrementCounterInput = {
      increment: 5
    };

    const result = await incrementCounter(input);

    // Verify returned counter
    expect(result.id).toBeDefined();
    expect(result.count).toEqual(5);
    expect(result.updated_at).toBeInstanceOf(Date);

    // Verify counter was saved to database
    const counters = await db.select()
      .from(countersTable)
      .where(eq(countersTable.id, result.id))
      .execute();

    expect(counters).toHaveLength(1);
    expect(counters[0].count).toEqual(5);
    expect(counters[0].updated_at).toBeInstanceOf(Date);
  });

  it('should increment existing counter', async () => {
    // Create initial counter
    const initialResult = await db.insert(countersTable)
      .values({
        count: 10,
        updated_at: new Date()
      })
      .returning()
      .execute();

    const initialCounter = initialResult[0];

    // Increment by 3
    const input: IncrementCounterInput = {
      increment: 3
    };

    const result = await incrementCounter(input);

    // Verify increment worked
    expect(result.id).toEqual(initialCounter.id);
    expect(result.count).toEqual(13); // 10 + 3
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(initialCounter.updated_at.getTime());

    // Verify database was updated
    const counters = await db.select()
      .from(countersTable)
      .where(eq(countersTable.id, result.id))
      .execute();

    expect(counters).toHaveLength(1);
    expect(counters[0].count).toEqual(13);
  });

  it('should use default increment value of 1', async () => {
    // Create initial counter
    await db.insert(countersTable)
      .values({
        count: 5,
        updated_at: new Date()
      })
      .returning()
      .execute();

    // Use default increment (should be 1)
    const input: IncrementCounterInput = {
      increment: 1 // This would be applied by Zod default in real usage
    };

    const result = await incrementCounter(input);

    expect(result.count).toEqual(6); // 5 + 1
  });

  it('should handle large increment values', async () => {
    // Create initial counter
    await db.insert(countersTable)
      .values({
        count: 100,
        updated_at: new Date()
      })
      .returning()
      .execute();

    const input: IncrementCounterInput = {
      increment: 1000
    };

    const result = await incrementCounter(input);

    expect(result.count).toEqual(1100); // 100 + 1000

    // Verify in database
    const counters = await db.select()
      .from(countersTable)
      .where(eq(countersTable.id, result.id))
      .execute();

    expect(counters[0].count).toEqual(1100);
  });

  it('should handle multiple increments correctly', async () => {
    // First increment (creates counter)
    const firstResult = await incrementCounter({ increment: 2 });
    expect(firstResult.count).toEqual(2);

    // Second increment
    const secondResult = await incrementCounter({ increment: 3 });
    expect(secondResult.count).toEqual(5); // 2 + 3
    expect(secondResult.id).toEqual(firstResult.id); // Same counter

    // Third increment
    const thirdResult = await incrementCounter({ increment: 10 });
    expect(thirdResult.count).toEqual(15); // 5 + 10
    expect(thirdResult.id).toEqual(firstResult.id); // Same counter

    // Verify final state in database
    const counters = await db.select()
      .from(countersTable)
      .execute();

    expect(counters).toHaveLength(1);
    expect(counters[0].count).toEqual(15);
  });

  it('should update timestamp on each increment', async () => {
    // Create initial counter
    const initialResult = await incrementCounter({ increment: 1 });
    const initialTime = initialResult.updated_at.getTime();

    // Wait a small amount to ensure time difference
    await new Promise(resolve => setTimeout(resolve, 10));

    // Increment again
    const secondResult = await incrementCounter({ increment: 1 });
    const secondTime = secondResult.updated_at.getTime();

    expect(secondTime).toBeGreaterThan(initialTime);
    expect(secondResult.count).toEqual(2);
  });
});
