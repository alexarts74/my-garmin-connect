import cors from 'cors';
import express from 'express';
import activitiesRouter from './routes/activities';
import authRouter from './routes/auth';
import healthRouter from './routes/health';
import profileRouter from './routes/profile';
import statsRouter from './routes/stats';
import trainingLoadRouter from './routes/training-load';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.use('/auth', authRouter);
app.use('/activities', activitiesRouter);
app.use('/health', healthRouter);
app.use('/profile', profileRouter);
app.use('/stats', statsRouter);
app.use('/training-load', trainingLoadRouter);

app.get('/ping', (_req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
