import "dotenv/config";
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { requireAuth } from "./auth.js";
import meRouter from "./routes/me.js";
import rewardRouter from "./routes/reward.js";
import toggleRouter from "./routes/toggle.js";
import withdrawRouter from "./routes/withdraw.js";
import adminRouter from "./routes/admin.js";

const app = express();

app.set("trust proxy", 1);

app.use(cors({
  origin: process.env.ALLOWED_ORIGIN,
  methods: ["GET", "POST"],
}));

app.use(express.json());

app.use(rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
}));

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/api/me", requireAuth, meRouter);
app.use("/api/reward", requireAuth, rewardRouter);
app.use("/api/toggle-earning", requireAuth, toggleRouter);
// withdraw router handles both POST /api/withdraw and GET /api/withdrawals
app.use("/api", requireAuth, withdrawRouter);
app.use("/admin", adminRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
