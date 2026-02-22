import express from 'express';
import userControllers from '../controllers/userControllers';
import authController from '../controllers/authController';

const router = express.Router();
router.route('/signup').post(authController.signup);
router.route('/login').post(authController.login);

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
