import express from "express";
import {
  loginUser,
  registerUser,
  adminLogin,
} from "../controllers/userController.js";

const userRoter = express.Router();

userRoter.post("/register", registerUser);
userRoter.post("/login", loginUser);
userRoter.post("/admin", adminLogin);

export default userRoter;
