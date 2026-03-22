import { Request, Response, NextFunction } from 'express';
import Tour, { ITour } from '../models/tourModel';
import APIFeature from '../utils/APIFeatures';
import catchAsync from '../utils/catchAsync';
import AppError from '../utils/AppError';
import factory from './handlerFactory';

/*
// this function for a params middleware so we have addition val
const checkID: RequestParamHandler = (req, res, next, val) => {
  console.log(`Tour id is ${val}`);
  if (Number(req.params.id) > tours.length) {
    // do not forget here the return if we do not add it the res will send back
    // and continue execution and will send another res
    return res.status(404).json({
      status: 'fail',
      message: 'Invalid ID',
    });
  }
  next();
};
*/

// const checkBody = (req: Request, res: Response, next: NextFunction) => {
//   if (!req.body.name || !req.body.price) {
//     return res.status(400).json({
//       status: 'fail',
//       message: 'Missing price or name',
//     });
//   }
//   next();
// };

const aliasTopTours = (req: Request, res: Response, next: NextFunction) => {
  req.url =
    '/?limit=5&sort=-ratingsAverage,price&fields=name,price,ratingsAverage,summary,difficulty';
  next();
};

//  get all tours
const getAllTours = factory.getAll(Tour);

// get specific one
const getTour = factory.getOne(Tour, { path: 'reviews' });

const getTourBySlug = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const query = Tour.findOne({ slug: req.params.slug }).populate({
      path: 'reviews',
      fields: 'review rating user',
    });
    const doc = await query;
    // here if the id is valid but not exist will return null so we want to handle it as 404
    if (!doc) {
      // return in order not to complete execute the func
      return next(new AppError('No document found with that Slug', 404));
    }
    res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  },
);
const createTour = factory.createOne(Tour);
const updateTour = factory.updateOne(Tour);
const deleteTour = factory.deleteOne(Tour);

// const deleteTour = catchAsync(
//   async (req: Request, res: Response, next: NextFunction) => {
//     const tour = await Tour.findByIdAndDelete(req.params.id);
//     if (!tour) {
//       // return in order not to complete execute the func
//       return next(new AppError('No tour found with that ID', 404));
//     }
//     res.status(204).json({
//       status: 'success',
//       data: null,
//     });
//   },
// );

const getTourStats = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    // here is the Aggregation pipeline it takes array of statges
    const stats = await Tour.aggregate([
      // first stage we can use match in order to filter documents like where in SQl query
      {
        $match: { ratingsAverage: { $gte: 4.5 } },
      },
      // Second stage about groping by like having in SQL if we do not want to make on a group just
      // without grouping add _id:null
      {
        $group: {
          _id: '$difficulty',
          // 1 for each of docs
          numTours: { $sum: 1 },
          numRatings: { $sum: '$ratingsQuantity' },
          // here we want to make averaging in field ratingsAverage
          avgRating: { $avg: '$ratingsAverage' },
          avgPrice: { $avg: '$price' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' },
        },
      },
      // third Sort Stage here can sort according to th field that in the group the newly we calculate it
      {
        $sort: {
          // 1 for Asc
          avgPrice: 1,
        },
      },
      // we can repeate and add more statges as we want for ex we can use again match stage
      {
        // id not equal easy
        // $match: {
        //   _id: { $ne: 'easy' },
        // },
      },
    ]);
    res.status(200).json({
      status: 'success',
      data: stats,
    });
  },
);
const getMonthlyPlan = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const year = Number(req.params.year);

    const plan = await Tour.aggregate([
      {
        /* this stage used to unwinding , startdates is an array 
        this will unwinds this array to be each document will be cross by each date 
        so for each element in the array will produce a document */
        $unwind: '$startDates',
      },
      {
        $match: {
          // here will filter to take only the months inside the given year
          startDates: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`),
          },
        },
      },
      {
        $group: {
          // this will group by month this a mongo db operator
          _id: { $month: '$startDates' },
          // count one for each of the documents
          numToursStarts: { $sum: 1 },
          // we want all the tours for each month so this will be an array
          // to make array use push name of each tour
          tours: { $push: '$name' },
        },
      },
      {
        // here we want to change the name of the id to month
        // here we can add more fields
        $addFields: { month: '$_id' },
      },
      {
        // project like select to select the fileds that we want to shows
        // 1-> show 0-> don't show
        $project: {
          _id: 0,
        },
      },
      {
        // -1 DSC 1->ASC
        $sort: { numToursStart: -1 },
      },
      // {
      //   // limit num of the shown documents
      //   $limit: 6,
      // },
    ]);
    res.status(200).json({
      status: 'success',
      data: plan,
    });
  },
);

// '/tours-within/:distance/center/:latlng/unit/:unit',
// /tours-within/233/center/34.111,-118.113491/unit/mi
const getToursWithin = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { distance, latlng, unit } = req.params;
    const [lat, lng] = (latlng as string).split(',');
    // radius here is the distance divided by the radius of the sphere
    const radius =
      unit === 'mi' ? Number(distance) / 3963.2 : Number(distance) / 6378.1;
    if (!lat || !lng) {
      next(
        new AppError(
          'Please provide latitutr and longitude in the format lat,lng',
          400,
        ),
      );
    }
    // in order to use geospatial operation we have to index the gespatial field the we use
    const tours = await Tour.find({
      startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
    });
    res.status(200).json({
      status: 'success',
      results: tours.length,
      data: {
        data: tours,
      },
    });
  },
);

const getDistances = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { latlng, unit } = req.params;
    const [lat, lng] = (latlng as string).split(',');

    const multiplier = unit === 'mi' ? 0.000621371 : 0.001;
    if (!lat || !lng) {
      next(
        new AppError(
          'Please provide latitutr and longitude in the format lat,lng',
          400,
        ),
      );
    }
    const distances = await Tour.aggregate([
      {
        // always needs to be the first stage in the geo aggregation pipeline
        // because there only one geo index startLocation $geoNear will automatically use it
        $ageoNear: {
          near: {
            type: 'Point',
            coordinates: [Number(lng), Number(lat)],
          },
          distanceField: 'distance',
          // to convert from meter to km
          distanceMultiplier: multiplier,
        },
      },
      {
        $project: {
          distance: 1,
          name: 1,
        },
      },
    ]);
    res.status(200).json({
      status: 'success',
      results: distances.length,
      data: {
        data: distances,
      },
    });
  },
);

export default {
  getAllTours,
  getTour,
  createTour,
  updateTour,
  deleteTour,
  aliasTopTours,
  getTourStats,
  getMonthlyPlan,
  getToursWithin,
  getDistances,
  getTourBySlug,
  // checkID,
  // checkBody,
};
