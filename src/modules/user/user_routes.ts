import { Router } from 'express';
import { userController } from './user_controller';

const router = Router();

router.post('/register', userController.userRegistration);
router.post('/login', userController.userLogin);

export const userRoutes = router;
