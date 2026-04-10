import { Router } from 'express';
import { userController } from './user_controller';

const router = Router();

router.post('/login', userController.userRegistration);

export const userRoutes = router;
