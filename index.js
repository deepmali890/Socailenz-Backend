const express = require("express");
const cors = require("cors");
const http = require("http"); // ✅ Required for socket.io
const { Server } = require("socket.io"); // ✅ Socket.IO server
require("dotenv").config();
require('./src/config/db')
const cookieParser = require('cookie-parser');
const userRoutes = require('./src/routes/user.routes');
const postRoutes = require('./src/routes/post.routes');
const messageRoutes = require('./src/routes/message.routes');

const app = express();

const corsOptions = {
  origin: "http://localhost:5173",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
};

app.use(cors(corsOptions));
const server = http.createServer(app); // ✅ Wrap express in http server

// ✅ Create Socket.IO server
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // your frontend
    methods: ["GET", "POST"],
    credentials: true,
  }
});

// Store io globally (export or attach to app if needed in controllers)
app.set('io', io);

// 🔌 Socket.IO connection
io.on("connection", (socket) => {
  console.log("🟢 New client connected:", socket.id);

  socket.on("joinRoom", (userId) => {
    socket.join(userId); // Each user has their own room
    console.log(`👤 User ${userId} joined their personal room`);
  });

  socket.on("disconnect", () => {
    console.log("🔴 Client disconnected:", socket.id);
  });
});

// Middleware
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/v1/user', userRoutes);
app.use('/api/v1/post', postRoutes);
app.use('/api/v1/message', messageRoutes);

// Health check
app.get("/", (req, res) => {
  res.status(200).json({ message: "i am coming in backend" });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err.message : "Internal server error",
  });
});

// Start server
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 3001;
  server.listen(PORT, () => {
    console.log(`🚀 Server is live at: http://localhost:${PORT}
    🌍 Environment: ${process.env.NODE_ENV || "development"}`);
  });
}
