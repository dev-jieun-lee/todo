const express = require("express");
const cors = require("cors");
const app = express();
app.set("trust proxy", true);
const cookieParser = require("cookie-parser");
app.use(cookieParser());
const todoRoutes = require("./routes/todoRoutes");
const authRoutes = require("./routes/authRoutes");

app.use(cors());
app.use(express.json());

app.use("/api/todos", todoRoutes);
app.use("/api", authRoutes);

module.exports = app;
