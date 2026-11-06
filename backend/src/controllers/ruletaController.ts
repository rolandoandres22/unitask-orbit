import { Request, Response } from 'express';
import * as ruletaService from '../services/ruletaService.js';

export const getConsejoAleatorio = async (req: Request, res: Response) => {
  try {
    const consejo = await ruletaService.getRandomConsejo();

    if (!consejo) {
      return res.status(404).json({ error: 'No se encontraron consejos en el sistema' });
    }

    return res.status(200).json({ consejo });
  } catch (err: any) {
    console.error('Error en ruletaController:', err.message);
    return res.status(500).json({ error: err.message });
  }
};