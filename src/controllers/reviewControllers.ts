import { Request, Response, NextFunction } from 'express';
import Review from '../models/reviewModel';
import catchAsync from '../utils/catchAsync';
import { IUser } from '../models/userModel';
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

const createReview = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    req.body.tour ??= req.params.tourId;
    req.body.user ??= req.user?.id;
    const newReview = await Review.create(req.body);
    res.status(201).json({
      status: 'success',
      data: {
        review: newReview,
      },
    });
  },
);
export default { getAllReviews, createReview };
