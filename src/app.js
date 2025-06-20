// src/app.js
import express from "express";
import webhookRoutes from "./routes/webhookRoutes.js";
import smsRoutes from "./routes/smsRoutes.js";

const app = express();
app.use(express.json());

app.use("/webhook", webhookRoutes);
app.use("/sms", smsRoutes);

app.get("/", (req, res) => {
  res.send(`<pre>Nothing to see here.</pre>`);
});

export default app;
