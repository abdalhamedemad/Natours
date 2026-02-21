export default class AppError extends Error {
  statusCode: number;

  status: 'fail' | 'error';

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.status = String(statusCode).startsWith('4') ? 'fail' : 'error';
    // // 👇 VERY IMPORTANT (fix prototype chain in TS)
    // Object.setPrototypeOf(this, new.target.prototype);
    // This line cleans the stack trace so the error looks like it came from where you threw it — not from inside your error class/helper.
    Error.captureStackTrace(this, this.constructor);
  }
}
