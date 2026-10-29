import cors from 'cors';
import express, { type NextFunction, type Request, type Response } from 'express';
import movieRoutes from './routes/movieRoutes';
import { ExternalApiError } from './services/movieService';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', message: 'API Overlabs rodando. Acesse /filmes' });
});

app.use(movieRoutes);

app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Rota não encontrada.' });
});

// Middleware global de erro (precisa dos 4 parâmetros para o Express reconhecê-lo).
app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(error);

  if (error instanceof ExternalApiError) {
    res.status(502).json({ error: error.message });
    return;
  }

  res.status(500).json({ error: 'Erro interno do servidor.' });
});

export default app;
