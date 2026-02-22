import { NextFunction, Response, Request } from 'express';
import User from '../models/userModel';
import AppError from '../utils/AppError';
import catchAsync from '../utils/catchAsync';
import { promisify } from 'util';
import jwt, { JwtPayload } from 'jsonwebtoken';

const signToken = (id: string) => {
  return jwt.sign({ id }, process.env.JWT_SECRET as string, {
    expiresIn: '90d',
  });
};
const signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });
  // id here is the payload "data" needed by the JWT, and JWT header will create automatically
  const token = signToken(newUser._id.toString());
  res.status(201).json({
    status: 'success',
    token,
    data: {
      user: newUser,
    },
  });
});

const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  // 1) check if email and password exist
  if (!email || !password) {
    const error = new AppError('Please provide email and password!', 400);
    return next(error);
  }
  // 2) Check if the user exists && password is correct
  // here findOne will not get the password because we close the select for password field in the model
  // to select it use select('+password');
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.checkCorrectPassword(password, user.password))) {
    // 401 unauthorized
    return next(new AppError('Incorrect email or password', 401));
  }

  // 3) if every things ok, send token to client
  const token = signToken(user._id.toString());
  res.status(201).json({
    status: 'success',
    token,
  });
});

const protect = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    // 1) get the token
    let token: string = '';
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1] || '';
    }
    if (!token) {
      return next(
        new AppError(
          'Your are not logged in! Please log in to get access',
          401,
        ),
      );
    }
    // 2) verify the token
    // this function will return the payload data which is the _id
    const decoded = (await promisify<string, string>(jwt.verify)(
      token,
      process.env.JWT_SECRET as string,
    )) as unknown as JwtPayload;
    // 3) check if user still exists i.e if some one stole the token and user has been deleted
    const freshUser = await User.findById(decoded.id);
    if (!freshUser)
      return next(
        new AppError(
          'the user belong to this token does no longer exist ',
          401,
        ),
      );
    // 4) check if user changed password after the token was issued
    // iat , issued at the time of the token created
    if (freshUser.changedPasswordAfter(decoded.iat))
      return next(
        new AppError('User recently changed password! Please login again', 401),
      );

    // req.user = freshUser;
    next();
  },
);
export default { signup, login, protect };
