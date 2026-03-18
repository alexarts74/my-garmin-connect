import { Router } from 'express';
import { getClient } from './auth';

const router = Router();

router.get('/', async (req, res) => {
  const client = getClient();
  if (!client) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  const start = parseInt(req.query.start as string) || 0;
  const limit = parseInt(req.query.limit as string) || 20;

  try {
    const activities = await client.getActivities(start, limit);
    if (activities.length > 0) {
      const sample = activities[0] as any;
      console.log('[activities] sample keys:', Object.keys(sample).join(', '));
      console.log('[activities] sample calories:', sample.calories, 'summaryDTO.calories:', sample.summaryDTO?.calories);
    }
    // Filter running activities (typeKey === 'running')
    const runs = activities
      .filter((a: any) => a.activityType?.typeKey === 'running')
      .map((a: any) => ({
        activityId: a.activityId,
        activityName: a.activityName ?? '',
        startTimeLocal: a.startTimeLocal ?? '',
        distance: a.distance ?? 0,
        duration: a.duration ?? 0,
        averageSpeed: a.averageSpeed ?? 0,
        maxSpeed: a.maxSpeed ?? 0,
        averageHR: a.averageHR ?? 0,
        maxHR: a.maxHR ?? 0,
        calories: a.calories ?? 0,
        elevationGain: a.elevationGain ?? 0,
        elevationLoss: a.elevationLoss ?? 0,
        activityType: a.activityType ?? { typeKey: 'running', typeId: 1 },
      }));
    res.json(runs);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch activities';
    res.status(500).json({ error: message });
  }
});

router.get('/:id', async (req, res) => {
  const client = getClient();
  if (!client) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  try {
    const raw: any = await client.getActivity({ activityId: Number(req.params.id) });
    const summary = raw.summaryDTO ?? {};

    // Map IActivityDetails → our GarminActivityDetail format
    const mapped = {
      activityId: raw.activityId,
      activityName: raw.activityName ?? '',
      startTimeLocal: summary.startTimeLocal ?? raw.startTimeLocal ?? '',
      distance: summary.distance ?? 0,
      duration: summary.duration != null
        ? (summary.duration > 100000 ? summary.duration / 1000 : summary.duration)
        : 0,
      averageSpeed: summary.averageSpeed ?? 0,
      maxSpeed: summary.maxSpeed ?? 0,
      averageHR: summary.averageHR ?? 0,
      maxHR: summary.maxHR ?? 0,
      calories: summary.calories ?? 0,
      elevationGain: summary.elevationGain ?? 0,
      elevationLoss: summary.elevationLoss ?? 0,
      activityType: raw.activityType ?? { typeKey: 'running', typeId: 1 },
      description: raw.description ?? null,
      averageRunningCadenceInStepsPerMinute: summary.averageRunCadence ?? 0,
      maxRunningCadenceInStepsPerMinute: summary.maxRunCadence ?? 0,
      steps: summary.steps ?? 0,
      vO2MaxValue: summary.vO2MaxValue ?? 0,
      strideLength: summary.strideLength ?? null,
      // Map splits: prefer LAP_SPLIT, fallback to KM_SPLIT
      lapDTOs: mapSplits(raw.splitSummaries),
    };

    res.json(mapped);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch activity';
    res.status(500).json({ error: message });
  }
});

function mapSplits(splitSummaries: any[] | undefined): any[] {
  if (!splitSummaries || !Array.isArray(splitSummaries)) return [];

  // Prefer LAP_SPLIT, fallback to RUN_LAP_SPLIT, then INTERVAL_SPLIT, then KM_SPLIT
  const preferred = ['LAP_SPLIT', 'RUN_LAP_SPLIT', 'INTERVAL_SPLIT', 'KM_SPLIT'];
  for (const splitType of preferred) {
    const splits = splitSummaries.filter((s: any) => s.splitType === splitType);
    if (splits.length > 0) {
      return splits.map((s: any, i: number) => ({
        lapNumber: s.noOfSplits ?? i + 1,
        startTimeLocal: s.startTimeLocal ?? '',
        distance: s.distance ?? 0,
        duration: s.duration != null
          ? (s.duration > 100000 ? s.duration / 1000 : s.duration)
          : 0,
        averageSpeed: s.averageSpeed ?? 0,
        averageHR: s.averageHR ?? 0,
        maxHR: s.maxHR ?? 0,
        calories: s.calories ?? 0,
      }));
    }
  }

  return [];
}

export default router;
