const { deleteAllTokensByUserId } = require("../models/refreshTokenModel");

exports.forceLogout = (req, res) => {
  const { user_id } = req.body;

  deleteAllTokensByUserId(user_id, (err) => {
    if (err) {
      return res.status(500).json({ error: "강제 로그아웃 실패" });
    }
    return res.json({ message: "모든 세션에서 로그아웃 완료" });
  });
};
