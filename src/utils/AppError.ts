export default class AppError extends Error {
  statusCode: number;

  status: 'fail' | 'error';

  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.status = String(statusCode).startsWith('4') ? 'fail' : 'error';
    // this flag for know if is operational error (error that we know that may occurs ex: access
    // not found page) for this type of error we want to send back information "message" about the error
    // but if programming error that comes from library or from bugs we do not want to show it's message back
    // to the users in the production
    this.isOperational = true;
    // This line cleans the stack trace so the error looks like it came from where you threw it — not from inside your error class/helper.
    Error.captureStackTrace(this, this.constructor);
  }
}
