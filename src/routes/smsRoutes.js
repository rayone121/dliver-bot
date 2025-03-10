// routes/smsRoutes.js
import express from "express";
import { handleSMS } from "../controllers/smsController.js";

const router = express.Router();

router.post("/", handleSMS);

export default router;