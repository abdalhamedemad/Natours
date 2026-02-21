import dotenv from 'dotenv';
dotenv.config({ path: './config.env' });
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
app.listen(port, () => {
  console.log(`App running on port ${port}`);
});
