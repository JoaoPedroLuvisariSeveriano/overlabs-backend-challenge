import type { NextFunction, Request, Response } from 'express';
import * as movieService from '../services/movieService';

export async function getMovies(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsedMovies = await movieService.getMovies();
    res.status(200).json(parsedMovies);
  } catch (error) {
    next(error);
  }
}
