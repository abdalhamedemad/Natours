import mongoose, { Aggregate, Query, Document } from 'mongoose';
import slugify from 'slugify';
// import validator from 'validator';
export interface TourQuery<T> extends Query<T, ITour> {
  start?: number;
}
export interface ITour extends Document {
  name: string;
  slug: string;
  duration: number;
  maxGroupSize: number;
  difficulty: string;

  ratingAverage: number;
  ratingQuantity: number;

  price: number;
  priceDiscount?: number;

  summary: string;
  description?: string;

  imageCover: string;
  images: string[];

  createdAt: Date;
  startDates: Date[];

  durationWeeks?: number;
}
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
      // max and min length only in string
      maxLength: [40, 'A tour name must have less or equal 40 characters'],
      minLength: [10, 'A tour name must have more or equal 10 characters'],
      // custom validator use external library to check the name only contains alphabets only
      // validate: [validator.isAlpha, 'Tour name must only contain characters'],
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      // values that are allowed , enum only for strings
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either: easy,medium and difficult ',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Ratings must be above 1.0'],
      max: [5, 'Ratings must be below  5.0'],
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    priceDiscount: {
      type: Number,
      // custom validator => true valid , => false not valid
      validate: {
        // normal function not arrow bec we wil use this
        // this will only work for creation and will not works in the update
        validator: function (this: ITour, val: number): boolean {
          return val < this.price;
        },
        message: 'Discount price ({VALUE}) should be below regular price',
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a summary'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image'],
    },
    // image here is array of strings
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      // means we donot want to return this field back when making a query
      select: false,
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
    // embeddings
    startLocation: {
      // GeoJSON for Geospatial data
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      // array of number latitude and longitude
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        // array of number latitude and longitude
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    // child to parent Referencing to User collection
    // here like in SQL pointing to primary key id in user's table
    guides: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  {
    // here we specify to add the virtual fields when we need data as json or object
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Virtual Properties (derived Fields)
// .get() because we want to calculate only when a request occurs
// we use a normal function here not an arrow function because we want this
// here this will refer to the tourSchema
tourSchema.virtual('durationWeeks').get(function (this: ITour) {
  return this.duration / 7;
});

// here in the tour model we make a parent refrecncing tour-> review
// if we want to gets all the review for a certain tour without storing
// an array of ids in the parent routes (child refrencing) we can store
// this virtual add a virtual field
// Virtual populate
// virtual field name : reviews will use this to make populate
tourSchema.virtual('reviews', {
  // table
  ref: 'Review',
  // like foreign key
  foreignField: 'tour',
  // primary field
  localField: '_id',
});

// 1- Document Middleware  (hooks): runs before .save() and .create() and not works for insertMany or update or findby
// we can add many pre and post middlewares
// Called document because in this middle ware we have access to the current document by using this
tourSchema.pre('save', function (this: ITour, next) {
  // here we add a slug in the current document before saved into the dB
  // not here we have to define slug into the Schema
  this.slug = slugify(this.name, { lower: true });
  next();
});

// this will runs after the documents saved to the db
// tourSchema.post('save', function (doc, next) {
//   console.log(doc);
//   next();
// });

// 2- Query Middleware for find methods like find  and not findByID method bec inside it use findOne
// tourSchema.pre('find', function () {});
//  here will work for all find method because we use a regex to work for all methods that start with word find
// like findOne , findAndDelete  findAndUpdate all ...
tourSchema.pre(/^find/, function (this: TourQuery<any>, next) {
  // here before finding or searching we filter out not secrets tours
  // we do not want any find method access them thorow queries
  this.find({ secretTour: { $ne: true } });

  this.start = Date.now();
  next();
});

tourSchema.pre(/^find/, function (this: TourQuery<any>, next) {
  // this populate will fill out the reference guides with the data of the users
  // like make a join to get the data of the user to the document
  // and in select - to remove __v and.. from the returning
  // populate behind the scene create another query
  this.populate({
    path: 'guides',
    select: '-__V -passwordChangedAt',
  });
  next();
});

tourSchema.post(/^find/, function (this: TourQuery<any>, doc, next) {
  const duration = Date.now() - (this.start ?? Date.now());
  console.log(`Query took ${Date.now() - duration} millsecond`);
  next();
});

// 3- Aggregation tour this runs before and after the aggregations
// here this will point into the aggregation object
// here we will hide the secret tours from the aggregation
tourSchema.pre('aggregate', function (this: Aggregate<ITour[]>, next) {
  // here the pipeline will contains all the stages of the current aggregation
  // so simply will add at the first match that exclude sectet tours
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
  next();
});

// here we use the schema to build a model Tour so we can now use Tour to make a crud operation very easy
// here the convention that model name must start with a Capital letter
const Tour = mongoose.model('Tour', tourSchema);

export default Tour;
