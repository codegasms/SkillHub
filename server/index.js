const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const path = require("path"); // Add this to manage file paths
const fs = require("fs");
const mongoose = require("mongoose");
const bid = require("./models/bid");
const http = require("http");
const socketIo = require("socket.io");
const dotenv = require("dotenv");
dotenv.config();

// Import Swagger
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");

// Import middleware
const { authenticateJWT } = require("./middlewares/authMiddleware");
const { errorHandler, notFound } = require("./middlewares/errorMiddleware");
const { createCorsMiddleware } = require("./middlewares/corsMiddleware");
const {
  requestLogger,
  errorLogger,
} = require("./middlewares/loggingMiddleware");
const {
  apiLimiter,
  loginLimiter,
  securityHeaders,
} = require("./middlewares/securityMiddleware");
const { sanitizeBody } = require("./middlewares/requestValidationMiddleware");
const adminAuth = require("./middleware/adminAuth");
const { debugAuth } = require("./middleware/debugMiddleware");
const {
  isSuperuser,
  isAdmin,
  hasPermission,
} = require("./middleware/roleCheck");

// Import routes
const adminRoutes = require("./routes/adminRoutes");
const userRoutes = require("./routes/userRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const jobRoutes = require("./routes/jobRoutes");
const bidRoutes = require("./routes/bidRoutes");
const projectRoutes = require("./routes/projectRoutes");
const walletRoutes = require("./routes/walletRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const chatRoutes = require("./routes/chatRoutes");

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || "development";
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: CLIENT_URL,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Connect to MongoDB
connectDB();

// ===== MIDDLEWARE SETUP =====

// 1. Application-level middleware
// Logging middleware
app.use(requestLogger(NODE_ENV === "development")); // File logging for successful requests
app.use(errorLogger(NODE_ENV === "development")); // File logging for error requests

// Security middleware
app.use(securityHeaders); // Custom security headers
app.use(apiLimiter); // Rate limiting for all routes

// CORS middleware
app.use(createCorsMiddleware(NODE_ENV)); // CORS configuration based on environment

// Body parsing middleware
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Disable sanitizeBody for admin routes to prevent interference with permissions
app.use("/admin", express.json(), express.urlencoded({ extended: true }));
// Apply sanitizeBody to all other routes
app.use(/^(?!\/admin).*$/, sanitizeBody);

// Static file serving
app.use(
  "/public",
  express.static(path.join(__dirname, "public"), {
    setHeaders: (res) => {
      res.set("Access-Control-Allow-Origin", "*");
      res.set("Access-Control-Allow-Methods", "GET");
      res.set("Cross-Origin-Resource-Policy", "cross-origin");
    },
  })
);

// Swagger UI route
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// 2. Router-level middleware
// Apply specific middleware to routes
app.use("/user/login", loginLimiter); // Stricter rate limiting for login route

// 3. Route setup
app.get("/", (req, res) => {
  res.send("Hello, My lord!");
});

app.use("/admin", adminRoutes);
app.use("/user", userRoutes);
app.use("/jobs", jobRoutes);
app.use("/bids", bidRoutes);
app.use("/review", reviewRoutes);
app.use("/notifications", notificationRoutes);
app.use("/project", projectRoutes);
app.use("/wallet", walletRoutes);
app.use("/transaction", transactionRoutes);
app.use("/chat", chatRoutes);

// Example of a protected route with authentication middleware
app.get("/recent-bids", authenticateJWT, async (req, res, next) => {
  try {
    const freelancerId = req.user.id;
    const freelancerObjectId = new mongoose.Types.ObjectId(freelancerId);

    const recentBids = await bid.find({ freelancer: freelancerObjectId });

    res.status(200).json({ recentBids });
  } catch (error) {
    next(error); // Pass error to error handling middleware
  }
});

// 4. Error handling middleware
app.use(notFound); // Handle 404 errors
app.use(errorHandler); // Handle all other errors

// Socket.io setup
const connectedUsers = {};

// Make io and connectedUsers available to the Express app
app.set("io", io);
app.set("connectedUsers", connectedUsers);

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error("Authentication error"));
  }

  try {
    const decoded = require("jsonwebtoken").verify(
      token,
      "skill_hub_secret_key"
    );
    socket.userId = decoded.id;
    next();
  } catch (error) {
    return next(new Error("Authentication error"));
  }
});

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.userId}`);

  // Store the user's socket ID
  connectedUsers[socket.userId] = socket.id;

  // Join a chat room
  socket.on("join_chat", (chatId) => {
    socket.join(chatId);
    console.log(`User ${socket.userId} joined chat: ${chatId}`);
  });

  // Leave a chat room
  socket.on("leave_chat", (chatId) => {
    socket.leave(chatId);
    console.log(`User ${socket.userId} left chat: ${chatId}`);
  });

  // Send a message
  socket.on("send_message", async (data) => {
    try {
      const { chatId, content } = data;

      // Save the message to the database
      const Chat = require("./models/chat");
      const User = require("./models/user");
      const chat = await Chat.findById(chatId);

      if (chat && chat.participants.includes(socket.userId)) {
        const newMessage = {
          sender: socket.userId,
          content,
          read: false,
        };

        chat.messages.push(newMessage);
        chat.lastMessage = new Date();
        await chat.save();

        // Get the sender user object for the response
        const sender = await User.findById(socket.userId).select(
          "username name"
        );

        // Get the other participant's ID
        const otherParticipantId = chat.participants.find(
          (p) => p.toString() !== socket.userId
        );

        // Create the message object with populated sender
        const messageWithSender = {
          ...newMessage,
          sender: {
            _id: sender._id,
            username: sender.username,
            name: sender.name,
          },
          createdAt: new Date(),
          _id: chat.messages[chat.messages.length - 1]._id,
        };

        // Only emit to the other participant, not back to the sender
        // This prevents duplicate messages for the sender
        if (connectedUsers[otherParticipantId]) {
          io.to(connectedUsers[otherParticipantId]).emit("receive_message", {
            chatId,
            message: messageWithSender,
          });
        }

        // Send notification to the other user if they're online
        if (connectedUsers[otherParticipantId]) {
          io.to(connectedUsers[otherParticipantId]).emit(
            "new_message_notification",
            {
              chatId,
              senderId: socket.userId,
            }
          );
        }
      }
    } catch (error) {
      console.error("Error sending message via socket:", error);
    }
  });

  // Mark messages as read
  socket.on("mark_read", async (data) => {
    try {
      const { chatId } = data;

      const Chat = require("./models/chat");
      const chat = await Chat.findById(chatId);

      if (chat && chat.participants.includes(socket.userId)) {
        // Get the other participant's ID
        const otherParticipantId = chat.participants.find(
          (p) => p.toString() !== socket.userId
        );

        // Mark all unread messages from the other participant as read
        let updated = false;
        chat.messages.forEach((message) => {
          if (
            !message.read &&
            message.sender.toString() === otherParticipantId.toString()
          ) {
            message.read = true;
            updated = true;
          }
        });

        if (updated) {
          await chat.save();

          // Notify the sender that their messages were read
          if (connectedUsers[otherParticipantId]) {
            io.to(connectedUsers[otherParticipantId]).emit("messages_read", {
              chatId,
            });
          }
        }
      }
    } catch (error) {
      console.error("Error marking messages as read via socket:", error);
    }
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.userId}`);
    delete connectedUsers[socket.userId];
  });
});

// Start the server
server.listen(PORT, () => {
  console.log(`Server is running on PORT=${PORT}`);
});
