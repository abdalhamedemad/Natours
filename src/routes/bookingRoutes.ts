import express from 'express';
import bookingController from '../controllers/bookingController';
import authController from '../controllers/authController';

const router = express.Router();
router.get(
  '/checkout-session/:tourId',
  authController.protect,
  bookingController.getCheckoutSession,
);

export default router;
