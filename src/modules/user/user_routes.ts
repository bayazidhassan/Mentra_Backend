import { Router } from 'express';
import { userController } from './user_controller';

const router = Router();

router.post('/register', userController.register);
router.post('/login', userController.login);

export const userRoutes = router;
