import { Request, Response, NextFunction } from 'express';
import Review from '../models/reviewModel';
import catchAsync from '../utils/catchAsync';
import { IUser } from '../models/userModel';
import factory from './handlerFactory';

// import AppError from '../utils/AppError';
interface AuthRequest extends Request {
  user?: IUser;
}
const getAllReviews = factory.getAll(Review);
const setTourUserIds = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  req.body.tour ??= req.params.tourId;
  req.body.user ??= req.user?.id;
  next();
};
const getReview = factory.getOne(Review);
const createReview = factory.createOne(Review);
const updateReview = factory.updateOne(Review);
const deleteReview = factory.deleteOne(Review);
export default {
  getAllReviews,
  createReview,
  deleteReview,
  updateReview,
  setTourUserIds,
  getReview,
};
