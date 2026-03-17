import { Router, Request, Response, NextFunction } from 'express';
import { GarminConnect } from 'garmin-connect';
import { persistTokens, clearPersistedTokens } from '../token-persistence';

const router = Router();

let client: GarminConnect | null = null;
let lastAccessToken: string | null = null;

export function getClient() {
  return client;
}

export function setClient(c: GarminConnect) {
  client = c;
  lastAccessToken = c.exportToken().oauth2?.access_token ?? null;
}

export function tokenSyncMiddleware(req: Request, res: Response, next: NextFunction) {
  if (!client) return next();

  const originalJson = res.json.bind(res);
  res.json = (body: any) => {
    if (client) {
      const currentToken = client.exportToken().oauth2?.access_token;
      if (currentToken && currentToken !== lastAccessToken) {
        lastAccessToken = currentToken;
        const freshTokens = client.exportToken();
        persistTokens(freshTokens);
        res.setHeader('X-Garmin-Tokens', JSON.stringify(freshTokens));
      }
    }
    return originalJson(body);
  };

  next();
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
    lastAccessToken = tokens.oauth2?.access_token ?? null;
    persistTokens(tokens);
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
    const freshTokens = restored.exportToken();
    lastAccessToken = freshTokens.oauth2?.access_token ?? null;
    persistTokens(freshTokens);
    res.json({ success: true, tokens: freshTokens });
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
  clearPersistedTokens();
  res.json({ success: true });
});

export default router;
