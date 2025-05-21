const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const app = express();
app.set("trust proxy", true);
app.use(
  cors({
    origin: "http://localhost:5173", // 프론트 주소
    credentials: true, // 쿠키 허용
  })
);

// 미들웨어
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// 📦 라우트 파일 import
const todoRoutes = require("./routes/todoRoutes");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const mySessionRoutes = require("./routes/mySessionRoutes");
const myProfileRoutes = require("./routes/myProfileRoutes");
const logRoutes = require("./routes/logRoutes");

// 📌 실제 API 라우팅 등록
app.use("/api/todos", todoRoutes); // /api/todos/*
app.use("/api/auth", authRoutes); // /api/auth/login, /auth/logout 등
app.use("/api/admin", adminRoutes); // /api/admin/*
app.use("/api/my-sessions", mySessionRoutes); // /api/my-sessions/*
app.use("/api/profile", myProfileRoutes); // /api/profile/details 등
app.use("/api/log", logRoutes); // /api/log/menu-access 등

// ❗ 공통 에러 핸들링
app.use((err, req, res, next) => {
  console.error("❗ 서버 예외:", err.message);
  res.status(500).json({ error: err.message || "서버 내부 오류" });
});

module.exports = app;
