// server/controllers/SellerStatsController.js
import SellerStatsService from "../db/SellerStatsService.js";
import { logError } from "../lib/logError.js";

class SellerStatsController {
  // GET /api/dashboard/seller/stats. No parameters: the seller is always the signed-in user, so there is no id in the
  // request that could be swapped for another seller's.
  async getMyStats(req, res) {
    try {
      const stats = await SellerStatsService.statsFor(req.user.id);
      return res.json(stats);
    } catch (err) {
      logError("Seller stats", err);
      return res.status(500).json({ message: "Couldn't load your numbers" });
    }
  }
}

export default new SellerStatsController();
