import express from 'express';
import tourController from '../controllers/tourControllers';
import authController from '../controllers/authController';
import reviewRouter from './reviewRoutes';

// create a new Router (middle ware)
const router = express.Router();

// nested route for /tour/22156/reviews
// reviews is child of tour here we want reviews of this tour
// here we don't want to use reviewcontroller inside here additionally
// duplicate code bec in reviewRoutes we use reviewControllers.createReview
// sol make a redirection to review Router to make access to tourId inside reviewRouter use margeParams: true
// because :tourId comes from here
router.use('/:tourId/reviews', reviewRouter);

// middleware params
// router.param('id', tourController.checkID);
router
  .route('/top-5-cheap')
  .get(tourController.aliasTopTours, tourController.getAllTours);
router.route('/tour-stats').get(tourController.getTourStats);
router
  .route('/monthly-plan/:year')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide', 'guide'),
    tourController.getMonthlyPlan,
  );
router
  .route('/')
  .get(tourController.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.createTour,
  );
router
  .route('/:id')
  .get(tourController.getTour)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.updateTour,
  )
  // here we put both authentication and authorization
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour,
  );

export default router;
