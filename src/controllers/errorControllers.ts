import { ErrorRequestHandler } from 'express';
import AppError from '../utils/AppError';

const globalErrorController: ErrorRequestHandler = (
  err: AppError,
  req,
  res,
  next,
) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
  });
};

export default globalErrorController;
