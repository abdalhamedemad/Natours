import express from 'express';
import reviewControllers from '../controllers/reviewControllers';
import authController from '../controllers/authController';

const router = express.Router();
router
  .route('/')
  .get(authController.protect, reviewControllers.getAllReviews)
  .post(
    authController.protect,
    authController.restrictTo('user'),
    reviewControllers.createReview,
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
