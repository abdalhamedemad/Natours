import express from 'express';
import userControllers from '../controllers/userControllers';
import authController from '../controllers/authController';

const router = express.Router();
router.route('/signup').post(authController.signup);
router.route('/login').post(authController.login);
router.route('/forgetPassword').post(authController.forgetPassword);
router.route('/resetPassword/:token').patch(authController.resetPassword);

// all the routes after of this middleware will check for the authentication
router.use(authController.protect);

router.route('/updateMyPassword').patch(authController.updatePassword);
router.get('/me', userControllers.getMe, userControllers.getUser);
// upload.single('photo') this will add the image to the request object, so we can access this file info from req.file
router
  .route('/updateMe')
  .patch(
    userControllers.uploadUserPhoto,
    userControllers.resizeUserPhoto,
    userControllers.updateMe,
  );
router.route('/deleteMe').delete(userControllers.deleteMe);

// all the routes after of this middleware will be restricted to the admin
router.use(authController.restrictTo('admin'));
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
