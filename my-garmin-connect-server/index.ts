import cors from 'cors';
import express from 'express';
import { GarminConnect } from 'garmin-connect';
import activitiesRouter from './routes/activities';
import authRouter, { setClient, tokenSyncMiddleware } from './routes/auth';
import healthRouter from './routes/health';
import profileRouter from './routes/profile';
import statsRouter from './routes/stats';
import trainingLoadRouter from './routes/training-load';
import { loadPersistedTokens, clearPersistedTokens } from './token-persistence';

const app = express();
const PORT = 3001;

app.use(cors({ exposedHeaders: ['X-Garmin-Tokens'] }));
app.use(express.json());
app.use(tokenSyncMiddleware);

app.use('/auth', authRouter);
app.use('/activities', activitiesRouter);
app.use('/health', healthRouter);
app.use('/profile', profileRouter);
app.use('/stats', statsRouter);
app.use('/training-load', trainingLoadRouter);

app.get('/ping', (_req, res) => {
  res.json({ status: 'ok' });
});

async function restoreSession() {
  const tokens = loadPersistedTokens();
  if (!tokens) return;

  try {
    const client = new GarminConnect();
    client.loadToken(tokens.oauth1, tokens.oauth2);
    await client.getUserSettings();
    setClient(client);
    console.log('Session restored from file');
  } catch (error) {
    console.log('Failed to restore session from file, clearing tokens:', error instanceof Error ? error.message : error);
    clearPersistedTokens();
  }
}

restoreSession().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
});
