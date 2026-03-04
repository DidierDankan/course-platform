import PublicService from "../db/PublicService.js";

class PublicController {
  async getSellerPublic(req, res) {
    try {
      const sellerId = Number(req.params.sellerId);
      if (!sellerId) return res.status(400).json({ ok: false, message: "Invalid sellerId" });

      // Always return public profile
      const sellerPublic = await PublicService.getSellerPublic(sellerId);
      if (!sellerPublic) return res.status(404).json({ ok: false, message: "Seller not found" });

      const courses = await PublicService.getSellerCourses(sellerId);

      // Only when logged in, return extra details
      let sellerPrivate = null;
      if (req.user?.id) {
        sellerPrivate = await PublicService.getSellerPrivate(sellerId);
      }

      return res.json({
        ok: true,
        isAuthenticated: !!req.user?.id,
        seller: {
          ...sellerPublic,
          ...(sellerPrivate || {}),
        },
        courses,
      });
    } catch (err) {
      console.error("getSellerPublic error:", err);
      return res.status(500).json({ ok: false, message: "Server error" });
    }
  }
}

export default new PublicController();