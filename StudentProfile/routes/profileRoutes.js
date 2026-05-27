import express from 'express';
import { getStudentProfileById } from '../controllers/profileController.js';

const router = express.Router();

router.get('/profiles/:id', getStudentProfileById);

export default router;