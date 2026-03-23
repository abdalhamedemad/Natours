import express, { Request, Response } from 'express';
import morgan from 'morgan';
import path from 'path';
import tourRouter from './routes/tourRoutes';
import userRouter from './routes/userRoutes';
import reviewRouter from './routes/reviewRoutes';
import bookingRouter from './routes/bookingRoutes';
import AppError from './utils/AppError';
import globalErrorController from './controllers/errorControllers';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
// import XSS from 'xss-clean';
import hpp from 'hpp';
import cors from 'cors';

interface CustomRequest extends Request {
  requestTime?: string;
}

const app = express();
app.use(
  cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  }),
);
// 1) Global MIDDLEWARE
// Set security http headers
app.use(helmet());

// Development Logger
if (process.env.NODE_ENV === 'development') {
  // logger middleware
  console.log('Logger');
  app.use(morgan('dev'));
}

// Limit requests from same API
// for ratel limiting here we specify for the same ip 100 request max in one hours
// for the sam ip prevent DOS and brute force attack
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'To many requests from this Ip , Please try again in an hour',
});

app.use('/api', limiter);

// Body parser
// this a middleware for adding the body to the request (body parser)
// without it when we try to use req.bod will give undefined
// 10kb is the limit of the body for a security prevent DOS
app.use(express.json({ limit: '10kb' }));

// Data Sanitization against no sql injection
// app.use(mongoSanitize());

// Data Sanitization against XSS for remove some malicious js inside html
// app.use(XSS());

// Prevent Parameter Pollution
// example double use of sort in the query params will keep the last one
// but in some situation we want that so if we want to keep them add in this array
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  }),
);

// this in order to make express parse advanced queries with gte ,lt ..
app.set('query parser', 'extended');

// serving static files
app.use(express.static(path.join(__dirname, '../public')));

// this a middle ware that will execute for every/any request bec we do not
// specify a route and before any of the routes
// app.use((req, res, next) => {
//   console.log('hello from middleware');
//   // if we do not call the next method req will stuck here
//   next();
// });
//  this middleware add a new property to the request object
app.use((req: CustomRequest, res: Response, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// 2) HANDLERS

// 3) ROUTES

// mounting the router to a specific url
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

// here will be reached if the request did not handled by any of the above handlers
// all means all the types of the request get,post,patch....
// this works fine in express before version 5 but in this version error handling
// writes as a middle ware
// app.all('/*', (req, res, next) => {
//   res.status(404).json({
//     status: 'fail',
//     message: `Can't find ${req.originalUrl} on this server!`,
//   });
// });
app.use((req, res, next) => {
  // res.status(404).json({
  //   status: 'fail',
  //   message: `Can't find ${req.originalUrl} on this server!`,
  // });
  // next();
  const err = new AppError(
    `Can't find ${req.originalUrl} on this server!`,
    404,
  );
  //  in Express if we passed an arguments to next function automatically will know that is an err
  // so will go and executed the error middleware
  next(err);
});

// Global error handling here will handles the operational errors so only here will send the erors and in the other palce we just throws it
// this middleware is an error middleware has 4 params , when a errors occurs express will call this middleware
app.use(globalErrorController);
// 4) START SERVER
export default app;
