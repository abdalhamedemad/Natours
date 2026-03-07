import { NextFunction, Request, Response } from 'express';
import User, { IUser } from '../models/userModel';
import catchAsync from '../utils/catchAsync';
import AppError from '../utils/AppError';
import factory from './handlerFactory';

interface AuthRequest extends Request {
  user?: IUser;
}
const filterObj = (obj: Record<string, any>, ...allowedFields: string[]) => {
  const newObj: Record<string, any> = {};

  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) {
      newObj[el] = obj[el];
    }
  });

  return newObj;
};
const getAllUsers = factory.getAll(User);

const createUser = (req: Request, res: Response) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not defined please use /signup',
  });
};
// Me because this for the logged in user
const updateMe = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    // 1) Create error if user post
    if (req.body.password || req.body.passwordConfirm) {
      return next(
        new AppError(
          'This route is not for password updates. Please use /updateMyPassword.',
          400,
        ),
      );
    }

    // 2) Update user document
    // to make the user not allow to change the other things
    const filteredBody = filterObj(req.body, 'name', 'email');
    // here we use findbyidandupdate not save to not run the validator of the user confirm password
    // bec we make it in a seperate controller
    const updatedUser = await User.findByIdAndUpdate(
      req.user?.id,
      filteredBody,
      {
        new: true,
        runValidators: true,
      },
    );
    res.status(200).json({
      status: 'success',
      data: {
        user: updatedUser,
      },
    });
  },
);

// Me because this for the logged in user
const deleteMe = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    await User.findByIdAndUpdate(req.user?.id, { active: false });
    res.status(204).json({
      status: 'success',
      data: null,
    });
  },
);

const getUser = factory.getOne(User);
// this for administrator, do not update password with this
const updateUser = factory.updateOne(User);
const deleteUser = factory.deleteOne(User);
export default {
  getAllUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  updateMe,
  deleteMe,
};
