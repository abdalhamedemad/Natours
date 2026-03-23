import { Request, Response, NextFunction } from 'express';
import Stripe from 'stripe';
import Tour, { ITour } from '../models/tourModel';
import APIFeature from '../utils/APIFeatures';
import catchAsync from '../utils/catchAsync';
import AppError from '../utils/AppError';
import factory from './handlerFactory';
import { IUser } from '../models/userModel';

interface AuthRequest extends Request {
  user?: IUser;
}
const stripe = new Stripe(String(process.env.STRIPE_SECRET_KEY));
const getCheckoutSession = catchAsync(async (req: AuthRequest, res, next) => {
  // 1) Get the currently booked tour
  const tour = await Tour.findById(req.params.tourId);

  // 2) Create checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',

    success_url: `${req.protocol}://${req.get('host')}/`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour?.slug}`,

    customer_email: req.user?.email as string,
    client_reference_id: String(req.params.tourId),
    // product information
    line_items: [
      {
        price_data: {
          currency: 'usd',
          unit_amount: tour!.price * 100,
          product_data: {
            name: `${tour!.name} Tour`,
            description: tour!.summary,
            // images: ['url'] optional
          },
        },
        quantity: 1,
      },
    ],
  });

  // 3) Create session as response
  res.status(200).json({
    status: 'success',
    session,
  });
});

export default {
  getCheckoutSession,
};
