import { Request, Response } from 'express';
import User from '../models/userModel';
import catchAsync from '../utils/catchAsync';

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

export default { getAllUsers, getUser, createUser, updateUser, deleteUser };
