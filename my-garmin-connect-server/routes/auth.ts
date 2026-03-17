import { Router } from 'express';
import { GarminConnect } from 'garmin-connect';

const router = Router();

let client: GarminConnect | null = null;

export function getClient() {
  return client;
}

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  try {
    client = new GarminConnect({
      username: email,
      password: password,
    });
    await client.login();
    const tokens = client.exportToken();
    res.json({ success: true, tokens });
  } catch (error) {
    client = null;
    const message = error instanceof Error ? error.message : 'Login failed';
    res.status(401).json({ error: message });
  }
});

router.post('/restore', async (req, res) => {
  const { oauth1, oauth2 } = req.body;

  if (!oauth1 || !oauth2) {
    res.status(400).json({ error: 'oauth1 and oauth2 tokens are required' });
    return;
  }

  try {
    const restored = new GarminConnect();
    restored.loadToken(oauth1, oauth2);
    await restored.getUserSettings();
    client = restored;
    res.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Token restoration failed';
    res.status(401).json({ error: message });
  }
});

router.get('/status', (_req, res) => {
  res.json({ authenticated: client !== null });
});

router.post('/logout', (_req, res) => {
  client = null;
  res.json({ success: true });
});

export default router;
