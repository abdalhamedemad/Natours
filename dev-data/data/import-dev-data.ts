import fs from 'fs';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Tour from '../../src/models/tourModel';
import User from '../../src/models/userModel';
import Review from '../../src/models/reviewModel';

dotenv.config({ path: './config.env' });
//  Loading Data
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, `utf-8`));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, `utf-8`));
const reviews = JSON.parse(
  fs.readFileSync(`${__dirname}/reviews.json`, `utf-8`),
);
async function deleteData() {
  try {
    await Tour.deleteMany();
    await User.deleteMany();
    await Review.deleteMany();
    console.log('Data successfully Deleted');
  } catch (err) {
    console.log(err);
  }
}

async function importData() {
  try {
    console.log('loading Data');
    await Tour.create(tours);
    await User.create(users, { validateBeforeSave: false });
    await Review.create(reviews);
    console.log('Data successfully loaded');
  } catch (err) {
    console.log(err);
  }
}
mongoose
  .connect(String(process.env.DATABASE_LOCAL), {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(async () => {
    // console.log(con.connection);
    console.log('DB connection successful');
    await deleteData();
    await importData();
  });
//  Delete Data

// (async function invoked() {
//   // await deleteData();
//   // await importData();
//   process.exit();
// })();
