// server/controllers/DashboardController.js
import DashboardService from "../db/DashboardService.js";
import { logError } from "../lib/logError.js";

class DashboardController {
  constructor() {
    this.getMyDashboard = this.getMyDashboard.bind(this);
  }

  async getMyDashboard(req, res) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ ok: false, message: "Unauthorized" });
      }

      const dashboard = await DashboardService.getDashboardData(userId);

      return res.json({ ok: true, ...dashboard });
    } catch (err) {
      logError("Dashboard", err);
      return res.status(500).json({ ok: false, message: "Server error" });
    }
  }
}

export default new DashboardController();