import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import './firebase.js';
import authRouter from './routes/auth.routes.js';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (_, res) => res.json({ ok: true }));

app.use('/auth', authRouter);

const port = process.env.PORT || 4000;

app.listen(port, '0.0.0.0', () => {
  console.log(`✅ API escuchando en http://0.0.0.0:${port}`);
});
