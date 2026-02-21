import { Request, Response } from 'express';

const getAllUsers = (req: Request, res: Response) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not implemented yet',
  });
};

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
