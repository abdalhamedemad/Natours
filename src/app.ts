import express, { Request, Response } from 'express';
import morgan from 'morgan';
import path from 'path';
import tourRouter from './routes/tourRoutes';
import userRouter from './routes/userRoutes';

interface CustomRequest extends Request {
  requestTime?: string;
}
const app = express();

// 1) MIDDLEWARE
if (process.env.NODE_ENV === 'development') {
  // logger middleware
  console.log('Logger');
  app.use(morgan('dev'));
}

// this a middleware for adding the body to the request (body parser)
// without it when we try to use req.bod will give undefined
app.use(express.json());
// this in order to make express parse advanced queries with gte ,lt ..
app.set('query parser', 'extended');

// serving static files
app.use(express.static(path.join(__dirname, '../public')));

// this a middle ware that will execute for every/any request bec we do not
// specify a route and before any of the routes
app.use((req, res, next) => {
  console.log('hello from middleware');
  // if we do not call the next method req will stuck here
  next();
});
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
// 4) START SERVER
export default app;
