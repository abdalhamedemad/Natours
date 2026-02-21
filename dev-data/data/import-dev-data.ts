import fs from 'fs';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Tour from '../../src/models/tourModel';
dotenv.config({ path: './config.env' });

mongoose
  .connect(String(process.env.DATABASE_LOCAL), {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => {
    // console.log(con.connection);
    console.log('DB connection successful');
  });
//  Delete Data
async function deleteData() {
  try {
    await Tour.deleteMany();
    console.log('Data successfully Deleted');
  } catch (err) {
    console.log(err);
  }
}

//  Loading Data
const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/tours-simple.json`, `utf-8`),
);
async function importData() {
  try {
    console.log('loading Data');
    await Tour.create(tours);
    console.log('Data successfully loaded');
  } catch (err) {
    console.log(err);
  }
}

(async function invoked() {
  await deleteData();
  await importData();
  process.exit();
})();
