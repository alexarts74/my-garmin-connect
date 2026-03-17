import { Router } from 'express';
import { getClient } from './auth';

const router = Router();

router.get('/', async (_req, res) => {
  const client = getClient();
  if (!client) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  try {
    const [userProfile, userSettings] = await Promise.all([
      client.getUserProfile().catch((e: any) => { console.error('[profile] getUserProfile error:', e.message); return null; }),
      client.getUserSettings().catch((e: any) => { console.error('[profile] getUserSettings error:', e.message); return null; }),
    ]);

    const profile = userProfile as any;
    const settings = userSettings as any;
    const userData = settings?.userData;

    res.json({
      displayName: profile?.displayName ?? null,
      fullName: profile?.fullName ?? profile?.displayName ?? null,
      profileImageUrl: profile?.profileImageUrl ?? profile?.profileImageUrlLarge ?? null,
      location: profile?.location ?? null,
      bio: profile?.bio ?? null,
      userLevel: profile?.userLevel ?? userData?.userLevel ?? null,
      userPoint: profile?.userPoint ?? userData?.userPoint ?? null,
      userPro: profile?.userPro ?? false,
      weight: userData?.weight != null ? Math.round(userData.weight / 1000 * 10) / 10 : null,
      height: userData?.height ?? null,
      birthDate: userData?.birthDate ?? null,
      gender: userData?.gender ?? null,
      vo2MaxRunning: userData?.vo2MaxRunning ?? null,
      lactateThresholdSpeed: userData?.lactateThresholdSpeed ?? null,
      runningTrainingSpeed: userData?.runningTrainingSpeed ?? null,
      measurementSystem: userData?.measurementSystem ?? null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch profile';
    res.status(500).json({ error: message });
  }
});

export default router;
