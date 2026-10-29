import { Router } from 'express';
import { getMovies } from '../controllers/movieController';

const movieRoutes = Router();

movieRoutes.get('/filmes', getMovies);

export default movieRoutes;
