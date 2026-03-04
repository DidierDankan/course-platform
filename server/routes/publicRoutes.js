import express from "express";
import PublicController from "../controllers/PublicController.js";
import { authenticateOptional } from "../middleware/authOptional.js";

const router = express.Router();

router.get("/sellers/:sellerId", authenticateOptional, PublicController.getSellerPublic);

export default router;