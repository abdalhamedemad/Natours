import express from 'express';
import userControllers from '../controllers/userControllers';
import authController from '../controllers/authController';

const router = express.Router();
router.route('/signup').post(authController.signup);
router.route('/login').post(authController.login);
router.route('/forgetPassword').post(authController.forgetPassword);
router.route('/resetPassword/:token').patch(authController.resetPassword);
router
  .route('/updateMyPassword')
  .patch(authController.protect, authController.updatePassword);
router
  .route('/updateMe')
  .delete(authController.protect, userControllers.updateMe);

router
  .route('/deleteMe')
  .patch(authController.protect, userControllers.deleteMe);
router
  .route('/')
  .get(userControllers.getAllUsers)
  .post(userControllers.createUser);
router
  .route('/:id')
  .get(userControllers.getUser)
  .patch(userControllers.updateUser)
  .delete(userControllers.deleteUser);
export default router;
