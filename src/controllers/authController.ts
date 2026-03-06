import { NextFunction, Response, Request } from 'express';
import User, { IUser } from '../models/userModel';
import AppError from '../utils/AppError';
import catchAsync from '../utils/catchAsync';
import { promisify } from 'util';
import jwt, { JwtPayload } from 'jsonwebtoken';
import sendEmail from '../utils/nodemailer';
import crypto from 'crypto';
interface AuthRequest extends Request {
  user?: IUser;
}
const signToken = (id: string) => {
  return jwt.sign({ id }, process.env.JWT_SECRET as string, {
    expiresIn: '90d',
  });
};
const createSendToken = (user: IUser, statusCode: number, res: Response) => {
  const token = signToken(user._id.toString());
  const cookieOptions = {
    expires: new Date(
      Date.now() +
        Number(process.env.JWT_COOKIE_EXPIRES_IN) * 24 * 60 * 60 * 1000,
    ),
    // not able to modify cookies at the browser
    httpOnly: true,
    secure: false,
  };

  // to make cookies send only in https
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  // when creating a new user will send back the password in the model we se select = false
  // to make it not returning from quering but here for creating new one so that is different
  user.password = undefined;
  res.cookie('jwt', token, cookieOptions);
  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};
const signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    role: req.body.role,
  });
  // id here is the payload "data" needed by the JWT, and JWT header will create automatically
  createSendToken(newUser, 201, res);
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
  createSendToken(user, 200, res);
});

const protect = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
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
    req.user = freshUser;
    next();
  },
);
// for Authorization
const restrictTo = (...roles: Array<string>) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!roles.includes(req.user?.role || ''))
      return next(
        // 403 : forbidden for auth
        new AppError('User has no Permission to access this route', 403),
      );
    next();
  };
};

const forgetPassword = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    // 1) Get user based on Posted email
    console.log('email', req.body?.email);
    const user = await User.findOne({ email: req.body.email });
    if (!user)
      return next(new AppError('There is no user with email address', 404));
    // 2) Generate A random Token
    const resetToken = user.createPasswordResetToken();
    // after create the reset token we did not save what we made to the Db so will use save
    // to save them this parameter will make mongoose did not make the validation bec we only
    // save the token so other required field will makes an error
    await user.save({ validateBeforeSave: false });
    // 3) Send it to user's email an url that will click on it will reset the password
    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;

    const message = `Forgot your Password? Submit a PATCH request with your new password and password Confirm
    to: ${resetURL}. \n If you did not forget your password, please ignore this`;

    const options = {
      email: String(req.body.email),
      subject: `Your password Reset Token available for 10 min`,
      text: message,
    };
    try {
      await sendEmail(options);
      res.status(200).json({
        status: ' success',
        message: 'Token sent to email',
      });
    } catch (err) {
      user.passwordResetToken = undefined;
      user.passwordReset = undefined;
      await user.save({ validateBeforeSave: false });
      return next(
        new AppError(
          'There was an error sending the email. Try again later ',
          500,
        ),
      );
    }
  },
);
const resetPassword = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    // 1) Get user based on the Token
    // hash with the same way at the forget to compare it (cypto is simpler than bcrypt that we used in the password)
    const hashedToken = crypto
      .createHash('sha256')
      .update(String(req.params.token))
      .digest('hex');
    console.log(hashedToken);
    // this check for both if exist and expiration bec if expired will not return a user
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() },
    });
    // 2) If token has not expired , and there is user , set the new password
    if (!user) {
      return next(new AppError('Token is invalid or expired', 400));
    }
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // 4) log the user in , send JWT
    createSendToken(user, 200, res);
  },
);

const updatePassword = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    // 1) get the user from the collection
    // we have to explicitly select the password
    const user = await User.findById(req?.user?.id).select('+password');

    // 2) Check if the posted current password is correct
    const correct = await user.correctPassword(
      req.body.passwordCurrent,
      user.password,
    );
    if (!correct) {
      return next(new AppError('your current password not correct', 401));
    }
    // 3) if so, update the password
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save();
    //  we do not use findByIDandUpdate because this will not runs the validator
    // if check if the passwordConfirm === this.password bec in update mongoose doe not
    // keep in memory this.password
    // 4) Log user in, send JWT
    createSendToken(user, 200, res);
  },
);

export default {
  signup,
  login,
  protect,
  restrictTo,
  forgetPassword,
  resetPassword,
  updatePassword,
};
