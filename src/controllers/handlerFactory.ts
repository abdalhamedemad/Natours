import { NextFunction, Request, Response } from 'express';
import { Model, Document, Query } from 'mongoose';
import catchAsync from '../utils/catchAsync';
import AppError from '../utils/AppError';
import APIFeature from '../utils/APIFeatures';

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

const getOne = <T extends Document>(
  model: Model<T>,
  popOptions?: Record<string, string>,
) => {
  return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    let query = model.findById(req.params.id);
    if (popOptions) query = query.populate(popOptions);
    // Tour.findOne({_id:req.params.id})
    const doc = await query;
    // here if the id is valid but not exist will return null so we want to handle it as 404
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

const getAll = <T extends Document>(model: Model<T>) => {
  return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };
    // get all
    // const tours = await Tour.find();
    // 1) Build Query
    const features = new APIFeature<T>(
      model.find(filter) as Query<T[], T>,
      req.query as Record<string, string | undefined>,
    )
      .filter()
      .sort()
      .limit()
      .pagination();
    // const query = await Tour.find()
    //   .where('duration')
    //   .equals(5)
    //   .where('difficulty')
    //   .equals('easy');

    // 2) execute the Quey
    const doc = await features.query;
    // 3) Send the Response
    res.status(200).json({
      status: 'success',
      results: doc.length,
      data: {
        data: doc,
      },
    });
  });
};
export default { deleteOne, updateOne, createOne, getOne, getAll };
