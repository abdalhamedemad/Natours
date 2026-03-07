import express from 'express';
import reviewControllers from '../controllers/reviewControllers';
import authController from '../controllers/authController';

//  mergeParams: true  to make access for the params that comes from other
// router like for /tours/:tourId/reviews
const router = express.Router({ mergeParams: true });
router
  .route('/')
  .get(authController.protect, reviewControllers.getAllReviews)
  .post(
    authController.protect,
    authController.restrictTo('user'),
    reviewControllers.setTourUserIds,
    reviewControllers.createReview,
  );

router
  .route('/:id')
  .patch(reviewControllers.updateReview)
  .delete(reviewControllers.deleteReview);
// router
// .route('/:id')
// .get(tourController.getTour)
// .patch(tourController.updateTour)
// .delete(
// authController.protect,
// authController.restrictTo('admin', 'lead-guide'),
// tourController.deleteTour,
// );

export default router;
