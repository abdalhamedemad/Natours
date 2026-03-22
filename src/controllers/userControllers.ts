import { NextFunction, Request, Response } from 'express';
import User, { IUser } from '../models/userModel';
import catchAsync from '../utils/catchAsync';
import AppError from '../utils/AppError';
import factory from './handlerFactory';
import multer, { FileFilterCallback } from 'multer';
import sharp from 'sharp';

interface AuthRequest extends Request {
  user?: IUser;
}
interface AuthRequest2 extends Request {
  user?: IUser;
  file?: Express.Multer.File;
}

// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     // null -> means no error
//     // 2nd arg: the path
//     cb(null, 'public/img/users');
//   },
//   filename: (req, file, cb) => {
//     const fileExtension = file.mimetype.split('/')[1];
//     // add date.now so if the user add 2 images
//     cb(null, `user-${req.user.id}-${Date.now()}.${fileExtension}`);
//   },
// });

// if we making an image processing before directly after uploading it so it's better to store it in the memory first
// this will store the file image in req.file.buffer
const multerStorage = multer.memoryStorage();

// for filtering only allows photos
const multerFilter = (
  req: AuthRequest,
  file: Express.Multer.File,
  cb: FileFilterCallback,
) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(
      new AppError('Not an image! Please upload only images.', 400) as any,
      false,
    );
  }
};

const upload = multer({ storage: multerStorage, fileFilter: multerFilter });

const uploadUserPhoto = upload.single('photo');
const resizeUserPhoto = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  if (!req.file) return next();
  req.file.filename = `user-${req?.user?.id}-${Date.now()}.jpeg`;
  // resize makes crop 500*500
  sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);
  next();
};

const filterObj = (obj: Record<string, any>, ...allowedFields: string[]) => {
  const newObj: Record<string, any> = {};

  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) {
      newObj[el] = obj[el];
    }
  });

  return newObj;
};

const createUser = (req: Request, res: Response) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not defined please use /signup',
  });
};
// Me because this for the logged in user
const getMe = (req: AuthRequest, res: Response, next: NextFunction) => {
  req.params.id = req.user?.id;
  next();
};
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
    if (req.file) filteredBody.file = req.file.filename;
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
const getAllUsers = factory.getAll(User);
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
  getMe,
  uploadUserPhoto,
  resizeUserPhoto,
};
