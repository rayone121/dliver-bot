// routes/webhookRoutes.js
import express from "express";
import { handleWebhook } from "../controllers/webhookController.js";

const router = express.Router();

router.post("/", handleWebhook);
router.get("/", (req, res) => {
  const {
    "hub.mode": mode,
    "hub.verify_token": token,
    "hub.challenge": challenge,
  } = req.query;

  if (mode === "subscribe" && token === process.env.WEBHOOK_VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

export default router;
