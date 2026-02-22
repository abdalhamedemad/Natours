import { ErrorRequestHandler, Response } from 'express';
import AppError from '../utils/AppError';
import mongoose from 'mongoose';

const handleCastErrorDB = (err: mongoose.Error.CastError) => {
  // err.path is field name , value : is the value that written
  const message = `Invalid ${err.path} : ${err.value}. `;
  return new AppError(message, 400);
};
const handleDuplicateFieldsDB = (err: any) => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  const message = `Duplicate field value: ${value}. Please use Another value!`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err: mongoose.Error.ValidationError) => {
  const errors = Object.values(err.errors).map((el: any) => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};
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
    // handles error that is related to the mongo db to mark them as operational
    let error = { ...err };

    // duplicate fields for unique fields
    if (err.code === 11000) error = handleDuplicateFieldsDB(err);

    // cast error : error that occurs bec mongoose try to cast some values but cause an error
    // ex add wrong id mongoose will try to cast into objectId if fails will throw this error
    if (err.name === 'CastError' && err instanceof mongoose.Error.CastError) {
      error = handleCastErrorDB(err);
    }
    // validation errors
    if (
      err.name === 'ValidationError' &&
      err instanceof mongoose.Error.ValidationError
    ) {
      error = handleValidationErrorDB(err);
    }
    sendErrorProd(error, res);
  }
};

export default globalErrorController;
