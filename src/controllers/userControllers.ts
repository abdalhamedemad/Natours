import { NextFunction, Request, Response } from 'express';
import User, { IUser } from '../models/userModel';
import catchAsync from '../utils/catchAsync';
import AppError from '../utils/AppError';

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
const getAllUsers = catchAsync(async (req: Request, res: Response, next) => {
  const users = await User.find();
  res.status(200).json({
    status: 'success',
    results: users.length,
    data: {
      users,
    },
  });
  next();
});

const createUser = (req: Request, res: Response) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not implemented yet',
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

const getUser = (req: Request, res: Response) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not implemented yet',
  });
};
const updateUser = (req: Request, res: Response) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not implemented yet',
  });
};
const deleteUser = (req: Request, res: Response) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not implemented yet',
  });
};

export default {
  getAllUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  updateMe,
  deleteMe,
};
