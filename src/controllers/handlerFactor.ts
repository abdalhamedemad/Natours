import { NextFunction, Request, Response } from 'express';
import { Model, Document } from 'mongoose';
import catchAsync from '../utils/catchAsync';
import AppError from '../utils/AppError';

const deleteOne = <T extends Document>(model: Model<T>) => {
  return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const doc = await model.findByIdAndDelete(req.params.id);
    if (!doc) {
      // return in order not to complete execute the func
      return next(new AppError('No document found with that ID', 404));
    }
    res.status(204).json({
      status: 'success',
      data: null,
    });
  });
};

const updateOne = <T extends Document>(model: Model<T>) => {
  return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    //  here we add the option new : true in order to return the updated
    // version of the tour
    // run validator is true in order to  run the validator against the schema
    const doc = await model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!doc) {
      // return in order not to complete execute the func
      return next(new AppError('No document found with that ID', 404));
    }
    res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });
};

const createOne = <T extends Document>(model: Model<T>) => {
  return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    // creating new tour using model Tour
    // const newTour = new Tour({})
    // newTour.save().then........
    // using better way
    // will return newly created document
    // if the body contains other fields that not in the schema will be ignored this field
    const newDoc = await model.create(req.body);
    res.status(201).json({
      status: 'success',
      data: {
        data: newDoc,
      },
    });
  });
};

export default { deleteOne, updateOne, createOne };
