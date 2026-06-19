import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

const app = new Hono();

// Middleware
app.use('*', logger());
app.use('*', cors());

// In-memory storage
interface HabitStats {
  totalCompletions: number;
  completionsByHour: Record<string, number>;
}

const habitStore = new Map<string, HabitStats>();

function getOrCreateStats(habitName: string): HabitStats {
  if (!habitStore.has(habitName)) {
    const completionsByHour: Record<string, number> = {};
    for (let i = 0; i <= 23; i++) {
      completionsByHour[String(i)] = 0;
    }
    habitStore.set(habitName, { totalCompletions: 0, completionsByHour });
  }
  return habitStore.get(habitName)!;
}

// Zod schema
const trackSchema = z.object({
  habitName: z.string().min(1),
  completionHour: z.number().int().min(0).max(23),
});

// Health check
app.get('/health', (c) => {
  return c.json({ status: 'ok' });
});

// POST /track
app.post(
  '/track',
  zValidator('json', trackSchema, (result, c) => {
    if (!result.success) {
      return c.json(
        {
          success: false,
          issues: result.error.issues,
        },
        400
      );
    }
  }),
  (c) => {
    const { habitName, completionHour } = c.req.valid('json');
    const stats = getOrCreateStats(habitName);
    stats.totalCompletions += 1;
    stats.completionsByHour[String(completionHour)] =
      (stats.completionsByHour[String(completionHour)] || 0) + 1;

    return c.json({
      success: true,
      message: 'Habit tracked successfully.',
    });
  }
);

// GET /stats/:habitName
app.get('/stats/:habitName', (c) => {
  const habitName = c.req.param('habitName');
  const stats = getOrCreateStats(habitName);

  return c.json({
    habitName,
    totalCompletions: stats.totalCompletions,
    completionsByHour: stats.completionsByHour,
  });
});

const port = Number(process.env.PORT) || 3000;
console.log(`🚀 Habit Coach API running on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});
