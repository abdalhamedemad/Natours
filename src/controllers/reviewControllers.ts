import { Request, Response, NextFunction } from 'express';
import Review from '../models/reviewModel';
import catchAsync from '../utils/catchAsync';
import { IUser } from '../models/userModel';
import factory from './handlerFactor';

// import AppError from '../utils/AppError';
interface AuthRequest extends Request {
  user?: IUser;
}
const getAllReviews = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };

    const reviews = await Review.find(filter);
    res.status(200).json({
      status: 'success',
      result: reviews.length,
      data: {
        reviews,
      },
    });
  },
);
const setTourUserIds = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  req.body.tour ??= req.params.tourId;
  req.body.user ??= req.user?.id;
  next();
};
const createReview = factory.createOne(Review);
const updateReview = factory.updateOne(Review);
const deleteReview = factory.deleteOne(Review);
export default {
  getAllReviews,
  createReview,
  deleteReview,
  updateReview,
  setTourUserIds,
};
