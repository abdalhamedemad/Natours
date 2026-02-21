/* This function used for catching error in the Async Function for handling the requests
    instead of using try and catch blocks to the Async function
    JUST SEND TO IT THE ASYNC FUNCTION
*/
import { NextFunction, Request, Response } from 'express';

type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<any>;

export default (func: AsyncRequestHandler) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // here catch will call the next with the error
    func(req, res, next).catch(next);
  };
};
