import { io } from "socket.io-client";
import { store } from "../redux/store";
import { addMessage, markChatAsRead } from "../redux/Features/chat/chatSlice";

let socket;

export const initializeSocket = (token) => {
  // If socket already exists and is connected, just return it
  if (socket && socket.connected) {
    return socket;
  }

  // If socket exists but is disconnected, clean it up
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
  }

  // Create a new socket connection with authentication and improved settings
  const serverUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";
  socket = io(serverUrl, {
    auth: {
      token,
    },
    // Improve connection stability
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    timeout: 10000,
    // Reduce UI flickers by avoiding unnecessary disconnects
    forceNew: false,
    transports: ["websocket"],
    // Avoid polling which can cause performance issues
    upgrade: false,
  });

  // Set up event listeners
  socket.on("connect", () => {
    console.log("Socket connected");
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected");
  });

  socket.on("connect_error", (error) => {
    console.error("Socket connection error:", error.message);
  });

  // Listen for new messages
  socket.on("receive_message", (data) => {
    console.log("Received message via socket:", data);
    // Only add the message if it's not from the current user
    // This prevents duplicate messages
    if (data.message && data.chatId) {
      // Check if the message has the correct structure
      if (typeof data.message.sender === "string") {
        console.warn(
          "Message sender is a string ID instead of an object:",
          data.message.sender
        );
      }

      store.dispatch(
        addMessage({
          chatId: data.chatId,
          message: data.message,
        })
      );
    }
  });

  // Listen for read receipts
  socket.on("messages_read", (data) => {
    if (data.chatId) {
      store.dispatch(markChatAsRead(data.chatId));
    }
  });

  return socket;
};

export const joinChat = (chatId) => {
  if (socket && socket.connected) {
    console.log("Joining chat room:", chatId);
    socket.emit("join_chat", chatId);
  } else {
    console.warn("Socket not connected, cannot join chat:", chatId);
  }
};

export const leaveChat = (chatId) => {
  if (socket && socket.connected) {
    console.log("Leaving chat room:", chatId);
    socket.emit("leave_chat", chatId);
  }
};

export const sendSocketMessage = (chatId, content) => {
  if (socket && socket.connected) {
    console.log("Sending message via socket:", { chatId, content });
    socket.emit("send_message", { chatId, content });
  } else {
    console.warn("Socket not connected, cannot send message");
  }
};

export const markAsRead = (chatId) => {
  if (socket && socket.connected) {
    console.log("Marking messages as read:", chatId);
    socket.emit("mark_read", { chatId });
  }
};

export const disconnectSocket = () => {
  if (socket) {
    console.log("Disconnecting socket");
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;
