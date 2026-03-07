import express from 'express';
import reviewControllers from '../controllers/reviewControllers';
import authController from '../controllers/authController';

//  mergeParams: true  to make access for the params that comes from other
// router like for /tours/:tourId/reviews
const router = express.Router({ mergeParams: true });

router.use(authController.protect);
router
  .route('/')
  .get(reviewControllers.getAllReviews)
  .post(
    authController.restrictTo('user'),
    reviewControllers.setTourUserIds,
    reviewControllers.createReview,
  );

router
  .route('/:id')
  .get(reviewControllers.getReview)
  .patch(
    authController.restrictTo('user', 'admin'),
    reviewControllers.updateReview,
  )
  .delete(
    authController.restrictTo('user', 'admin'),
    reviewControllers.deleteReview,
  );
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
