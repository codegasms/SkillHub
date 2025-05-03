import { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  Box,
  Typography,
  Avatar,
  TextField,
  IconButton,
  Paper,
  Divider,
  CircularProgress,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import {
  sendMessage,
  markMessagesAsRead,
} from "../../redux/Features/chat/chatSlice";
import { markAsRead } from "../../api/socketService";
import { formatDistanceToNow } from "date-fns";
import PropTypes from "prop-types";
import DefaultAvatar from "./DefaultAvatar";

const ChatWindow = ({ chat }) => {
  const dispatch = useDispatch();
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const [localMessages, setLocalMessages] = useState([]);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const { username } = useSelector((state) => state.auth);
  const serverUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";

  useEffect(() => {
    if (chat?.messages) {
      setLocalMessages(chat.messages);
    }
  }, [chat?.messages]);

  useEffect(() => {
    if (messagesEndRef.current && messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  }, [localMessages]);

  useEffect(() => {
    if (chat?._id) {
      dispatch(markMessagesAsRead(chat._id));
      markAsRead(chat._id);
    }
  }, [chat?._id, dispatch]);

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (messageText.trim()) {
        handleSendMessage(e);
      }
    }
  };

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();

    if (!messageText.trim() || !chat?._id || sending) return;

    try {
      setSending(true);

      const messageToSend = messageText.trim();
      setMessageText("");

      if (inputRef.current) {
        inputRef.current.focus();
      }

      const optimisticMessage = {
        _id: `temp-${Date.now()}`,
        content: messageToSend,
        sender: {
          _id: username,
          username: username,
        },
        read: false,
        createdAt: new Date().toISOString(),
        isOptimistic: true,
      };

      setLocalMessages((prevMessages) => [...prevMessages, optimisticMessage]);

      await dispatch(
        sendMessage({
          chatId: chat._id,
          content: messageToSend,
        })
      );
    } catch (error) {
      console.error("Error sending message:", error);
      setLocalMessages((prevMessages) =>
        prevMessages.filter((msg) => !msg.isOptimistic)
      );
    } finally {
      setSending(false);
    }
  };

  if (!chat) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
          bgcolor: "rgb(17, 24, 39)", // gray-900
        }}
      >
        <CircularProgress sx={{ color: "rgb(59, 130, 246)" }} />
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Paper
        elevation={1}
        sx={{
          p: 2,
          display: "flex",
          alignItems: "center",
          borderBottom: "1px solid",
          borderColor: "rgb(55, 65, 81)", // gray-700
          zIndex: 1,
          bgcolor: "rgb(31, 41, 55)", // gray-800
        }}
      >
        {chat.otherUser?.info?.profilePic ? (
          <Avatar
            src={`${serverUrl}/public${chat.otherUser.info.profilePic}`}
            alt={chat.otherUser?.name}
            sx={{ width: 40, height: 40, mr: 2 }}
          />
        ) : (
          <Avatar sx={{ width: 40, height: 40, mr: 2 }}>
            <DefaultAvatar size={40} color="#4B5563" />
          </Avatar>
        )}
        <Box>
          <Typography variant="subtitle1" color="white">
            {chat.otherUser?.name || "User"}
          </Typography>
          <Typography variant="body2" color="rgb(156, 163, 175)">
            @{chat.otherUser?.username}
          </Typography>
        </Box>
      </Paper>

      <Box
        ref={messagesContainerRef}
        sx={{
          flexGrow: 1,
          overflow: "auto",
          p: 2,
          display: "flex",
          flexDirection: "column",
          gap: 1,
          bgcolor: "rgb(17, 24, 39)", // gray-900
        }}
      >
        {localMessages.length === 0 ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
            }}
          >
            <Typography variant="body2" color="rgb(156, 163, 175)">
              No messages yet. Start the conversation!
            </Typography>
          </Box>
        ) : (
          localMessages.map((message) => {
            const senderUsername =
              typeof message.sender === "object" && message.sender !== null
                ? message.sender.username
                : "";

            const isCurrentUser = senderUsername === username;

            if (typeof message.sender !== "object" || message.sender === null) {
              console.warn("Message with non-object sender:", message);
            }

            return (
              <Box
                key={message._id}
                sx={{
                  alignSelf: isCurrentUser ? "flex-end" : "flex-start",
                  maxWidth: "70%",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <Paper
                  elevation={1}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: isCurrentUser
                      ? "rgb(59, 130, 246)" // blue-500
                      : "rgb(31, 41, 55)", // gray-800
                    color: "white",
                  }}
                >
                  <Typography variant="body1">{message.content}</Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      display: "block",
                      mt: 0.5,
                      textAlign: "right",
                      color: isCurrentUser
                        ? "rgba(255, 255, 255, 0.8)"
                        : "rgb(156, 163, 175)", // gray-400
                      opacity: 0.8,
                    }}
                  >
                    {formatDistanceToNow(new Date(message.createdAt), {
                      addSuffix: true,
                    })}
                    {isCurrentUser && (
                      <span style={{ marginLeft: 8 }}>
                        {message.read ? "✓✓" : "✓"}
                      </span>
                    )}
                  </Typography>
                </Paper>
              </Box>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </Box>

      <Divider sx={{ borderColor: "rgb(55, 65, 81)" }} />
      <Box
        component="form"
        onSubmit={handleSendMessage}
        sx={{
          p: 2,
          display: "flex",
          alignItems: "center",
          bgcolor: "rgb(31, 41, 55)", // gray-800
        }}
      >
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Type a message..."
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          onKeyDown={handleKeyPress}
          multiline
          maxRows={4}
          disabled={sending}
          inputRef={inputRef}
          autoComplete="off"
          inputProps={{
            autoComplete: "off",
            form: {
              autoComplete: "off",
            },
          }}
          sx={{
            mr: 1,
            "& .MuiOutlinedInput-root": {
              color: "white",
              "& fieldset": {
                borderColor: "rgb(75, 85, 99)", // gray-600
              },
              "&:hover fieldset": {
                borderColor: "rgb(107, 114, 128)", // gray-500
              },
              "&.Mui-focused fieldset": {
                borderColor: "rgb(59, 130, 246)", // blue-500
              },
            },
            "& .MuiInputBase-input::placeholder": {
              color: "rgb(156, 163, 175)", // gray-400
              opacity: 1,
            },
          }}
        />
        <IconButton
          color="primary"
          type="submit"
          disabled={!messageText.trim() || sending}
        >
          {sending ? (
            <CircularProgress size={24} sx={{ color: "rgb(59, 130, 246)" }} />
          ) : (
            <SendIcon sx={{ color: "rgb(59, 130, 246)" }} />
          )}
        </IconButton>
      </Box>
    </Box>
  );
};

ChatWindow.propTypes = {
  chat: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    otherUser: PropTypes.shape({
      _id: PropTypes.string.isRequired,
      name: PropTypes.string,
      username: PropTypes.string.isRequired,
      info: PropTypes.shape({
        profilePic: PropTypes.string,
      }),
    }),
    messages: PropTypes.arrayOf(
      PropTypes.shape({
        _id: PropTypes.string.isRequired,
        sender: PropTypes.oneOfType([
          PropTypes.string,
          PropTypes.shape({
            _id: PropTypes.string.isRequired,
            username: PropTypes.string.isRequired,
          }),
        ]),
        content: PropTypes.string.isRequired,
        read: PropTypes.bool.isRequired,
        createdAt: PropTypes.string.isRequired,
      })
    ).isRequired,
  }),
};

export default ChatWindow;
