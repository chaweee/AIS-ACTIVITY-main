import * as AuthController from "../controllers/authController.js";
import express from "express";

const UserRoutes = express.Router();

UserRoutes.post('/new', AuthController.register);
UserRoutes.post('/login', AuthController.signIn);

export default UserRoutes;