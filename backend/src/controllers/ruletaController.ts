import { Request, Response } from 'express';
// Importación del servicio con la lógica de consejos
import * as ruletaService from '../services/ruletaService.js';

//Obtiene un consejo aleatorio desde la base de datos
export const getConsejoAleatorio = async (req: Request, res: Response) => {
  try {
    // Invocación al servicio que selecciona un consejo al azar
    const consejo = await ruletaService.getRandomConsejo();

    if (!consejo) {// Valida si la tabla de consejos está vacía o no devolvió datos
      return res.status(404).json({ error: 'No se encontraron consejos en el sistema' });
    }
    // Retorna el consejo con código HTTP 200 todo esta OK
    return res.status(200).json({ consejo });
  } catch (err: any) {
    console.error('Error en ruletaController:', err.message);
    return res.status(500).json({ error: err.message });
  }
};