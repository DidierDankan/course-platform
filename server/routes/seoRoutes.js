// server/routes/seoRoutes.js
// Mounted at the root (not /api): crawlers look for /robots.txt and /sitemap.xml at the top of the site.
import express from "express";
import SeoController from "../controllers/SeoController.js";

const router = express.Router();

router.get("/robots.txt", SeoController.robots.bind(SeoController));
router.get("/sitemap.xml", SeoController.sitemap.bind(SeoController));

export default router;
