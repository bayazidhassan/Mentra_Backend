import { Router } from 'express';
import { userController } from './user_controller';

const router = Router();

router.post('/register', userController.register);

export const userRoutes = router;
