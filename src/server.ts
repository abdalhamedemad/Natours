import dotenv from 'dotenv';

dotenv.config({ path: './config.env' });

// for errors that are not handled by express i.e for code that is outside express middlewares and functions
// for Sync code like accessing undefined variable
// this will catch all the errors occurs after it so if error happens before this listening will not caught it
process.on('uncaughtException', (err: Error) => {
  console.log(err.name, err.message);
  console.log('UNHANDLED REJECTION!!! SHUTTING DOWN...');
  // here we must exit the process because for uncaughtException node are in state called unclean
  process.exit(1);
});

import app from './app';
import mongoose from 'mongoose';

mongoose
  .connect(String(process.env.DATABASE_LOCAL), {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then((con) => {
    // console.log(con.connection);
    console.log('DB connection successful');
  });

const port = process.env.PORT || 8000;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}`);
});

// for errors that are not handled by express i.e for code that is outside express middlewares and functions
// handling unhandled Rejection globally for Async codes
// when unhandled rejection occurs the process will emits unhandled rejection events
process.on('unhandledRejection', (err: Error) => {
  console.log(err.name, err.message);
  console.log('UNHANDLED REJECTION!!! SHUTTING DOWN...');
  // here we use server.close to make the server finishes the current request then
  // after that ending the process
  server.close(() => {
    // 1 for a code exceptions
    // 0 for a code success
    process.exit(1);
  });
});
