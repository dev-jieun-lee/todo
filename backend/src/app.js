const express = require("express");
const cors = require("cors");
const app = express();
app.set("trust proxy", true);
const cookieParser = require("cookie-parser");
app.use(cookieParser());
const todoRoutes = require("./routes/todoRoutes");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
app.use(cors());
app.use(express.json());

app.use("/api/todos", todoRoutes);
app.use("/api", authRoutes);
app.use("/api/admin", adminRoutes);
app.use((err, req, res, next) => {
  console.error("❗ 서버 예외:", err.message);
  res.status(500).json({ error: err.message || "서버 내부 오류" });
});

const mySessionRoutes = require("./routes/mySessionRoutes");
app.use("/api/my-sessions", mySessionRoutes);

const myProfileRoutes = require("./routes/myProfileRoutes");
app.use("/api", myProfileRoutes);
module.exports = app;
