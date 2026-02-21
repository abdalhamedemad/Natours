import { Request, Response, NextFunction } from 'express';
import Tour, { ITour } from '../models/tourModel';
import APIFeature from '../utils/APIFeatures';

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
const getAllTours = async (req: Request, res: Response) => {
  try {
    // get all
    // const tours = await Tour.find();

    // 1) Build Query

    const features = new APIFeature<ITour>(
      Tour.find(),
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
    const tours = await features.query;

    // 3) Send the Response
    res.status(200).json({
      status: 'success',
      results: tours.length,
      data: {
        tours,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: 'Something went wrong',
    });
  }
};

// get specific one
const getTour = async (req: Request, res: Response) => {
  try {
    // Tour.findOne({_id:req.params.id})
    const tour = await Tour.findById(req.params.id);
    res.status(200).json({
      status: 'success',
      data: {
        tour,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: 'Not Found 404',
    });
  }
};

const createTour = async (req: Request, res: Response) => {
  try {
    // creating new tour using model Tour
    // const newTour = new Tour({})
    // newTour.save().then........
    // using better way
    // will return newly created document
    // if the body conatins other fields that not in the schema will be ignored this field
    const newTour = await Tour.create(req.body);
    res.status(201).json({
      status: 'success',
      data: {
        tour: newTour,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: 'Invalid data sent!',
    });
  }
};

const updateTour = async (req: Request, res: Response) => {
  try {
    //  here we add the option new : true in order to return the updated
    // version of the tour
    // run validator is true in order to  run the validator against the schema
    const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    res.status(200).json({
      status: 'success',
      data: {
        tour,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: 'Invalid data sent!',
    });
  }
};

const deleteTour = async (req: Request, res: Response) => {
  try {
    await Tour.findByIdAndDelete(req.params.id);
    res.status(204).json({
      status: 'success',
      data: null,
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err,
    });
  }
};

const getTourStats = async (req: Request, res: Response) => {
  try {
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
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err,
    });
  }
};
const getMonthlyPlan = async (req: Request, res: Response) => {
  const year = Number(req.params.year);
  try {
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
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err,
    });
  }
};

export default {
  getAllTours,
  getTour,
  createTour,
  updateTour,
  deleteTour,
  aliasTopTours,
  getTourStats,
  getMonthlyPlan,
  // checkID,
  // checkBody,
};
