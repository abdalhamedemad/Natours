import mongoose, { Query, Document, Model } from 'mongoose';
import Tour from './tourModel';

// Review
export interface ReviewQuery<T> extends Query<T, IReview> {
  start?: number;
  r?: IReview | null;
}
export interface IReview extends Document {
  review: string;
  rating: number;
  createdAt: Date;
  tour: mongoose.Schema.Types.ObjectId;
}
interface ReviewModel extends Model<IReview> {
  calcAverageRatings(tourId: mongoose.Schema.Types.ObjectId): Promise<void>;
}
const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review cannot be empty'],
      trim: true,
      maxLength: [200, 'A review must have less or equal 200 characters'],
      minLength: [10, 'A review must have more or equal 10 characters'],
    },
    rating: {
      type: Number,
      min: [1, 'Ratings must be above 1.0'],
      max: [5, 'Ratings must be below  5.0'],
    },
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user'],
    },
    tour: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);
// here we can prevent duplicates same user have multiple reviews on same tour
// we make a unique between tour, user in reviews
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.pre(/^find/, function (this: ReviewQuery<any>, next) {
  // will add this two extra query
  // this.populate({
  //   path: 'user',
  //   select: 'name photo',
  // }).populate({
  //   path: 'tour',
  //   select: 'name',
  // });
  this.populate({
    path: 'user',
    select: 'name photo',
  });
  next();
});

// Static methods to calculate the average rating for each tour and update this field when deleting or updating the review
//  we make it a static to make this point to the current model so we can use the aggregate
reviewSchema.statics.calcAverageRatings = async function (
  // here this point to current document
  this: Model<any>,
  tourId,
) {
  const stats = await this.aggregate([
    {
      // select
      $match: { tour: tourId },
    },
    {
      // group by
      $group: {
        _id: '$tour',
        // add one for each match
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);
  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingQuantity: stats[0].nRating,
      ratingAverage: stats[0].avgRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingQuantity: 0,
      ratingAverage: 4.5,
    });
  }
};

reviewSchema.post('save', function (this: IReview) {
  // here this point to the current document
  // but we want to access the current model in Order to call the calcAverage Ratings
  // sol is to use this.constructor this point to the current Model
  (this.constructor as ReviewModel).calcAverageRatings(this.tour);
});

// findByIdAndUpdate
// findByIdAndDelete
// this will not have access to document middleware (like save) but have access to query middleware
// here we coud not in the pre call calcAverageRatings because we want to calc after saving in the post
// we did not will have the access of the tourId and could not use this trick
reviewSchema.pre(/^findOneAnd/, async function (this: ReviewQuery<any>, next) {
  // in order to access the current document from the query we just have to await it to finsih execute
  // and this will return the current document
  // here we want to pass data from the pre to post so use this trick
  this.r = await this.findOne();
  next();
});

reviewSchema.post(/^findOneAnd/, async function (this: ReviewQuery<any>) {
  if (!this.r) return;
  await (this.r.constructor as ReviewModel).calcAverageRatings(this.r.tour);
});
const Review = mongoose.model('Review', reviewSchema);

export default Review;
