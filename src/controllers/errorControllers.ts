import { ErrorRequestHandler, Response } from 'express';
import AppError from '../utils/AppError';

const sendErrorDev = (err: AppError, res: Response) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    // stack contains an information for where (line number and file) the error occurs
    stack: err.stack,
  });
};

const sendErrorProd = (err: AppError, res: Response) => {
  // operational error : trusted error : send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
    // Programming error or other unknown error: do't leak the error details
  } else {
    // 1) log error
    console.error('Error', err);

    // 2) send generic message
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong!',
    });
  }
};
const globalErrorController: ErrorRequestHandler = (
  err: AppError,
  req,
  res,
  next,
) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    sendErrorProd(err, res);
  }
};

export default globalErrorController;
