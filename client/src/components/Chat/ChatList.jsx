import { useState } from "react";
import {
  Box,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  Divider,
  Badge,
  IconButton,
  InputBase,
  Paper,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import { formatDistanceToNow } from "date-fns";
import PropTypes from "prop-types";
import DefaultAvatar from "./DefaultAvatar";

const ChatList = ({ chats, activeChatId, onChatSelect, onSearchToggle }) => {
  const [searchFocused, setSearchFocused] = useState(false);
  const serverUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Search and New Chat Header */}
      <Paper
        elevation={0}
        sx={{
          p: 1,
          display: "flex",
          alignItems: "center",
          borderBottom: "1px solid",
          borderColor: "rgb(55, 65, 81)", // gray-700
          backgroundColor: "rgb(31, 41, 55)", // gray-800
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            backgroundColor: searchFocused
              ? "rgb(55, 65, 81)"
              : "rgb(75, 85, 99)", // gray-700 : gray-600
            borderRadius: 1,
            p: 0.5,
            flexGrow: 1,
          }}
        >
          <SearchIcon sx={{ mx: 1, color: "rgb(209, 213, 219)" }} />{" "}
          {/* gray-300 */}
          <InputBase
            placeholder="Search users..."
            onClick={onSearchToggle}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            sx={{
              ml: 1,
              flex: 1,
              color: "white",
              "& ::placeholder": {
                color: "rgb(156, 163, 175)", // gray-400
                opacity: 1,
              },
            }}
          />
        </Box>
        <IconButton color="primary" onClick={onSearchToggle} sx={{ ml: 1 }}>
          <AddIcon sx={{ color: "rgb(59, 130, 246)" }} /> {/* blue-500 */}
        </IconButton>
      </Paper>

      {/* Chat List */}
      <List sx={{ flexGrow: 1, overflow: "auto", p: 0 }}>
        {chats.length === 0 ? (
          <Box sx={{ p: 2, textAlign: "center" }}>
            <Typography variant="body2" color="rgb(156, 163, 175)">
              {" "}
              {/* gray-400 */}
              No conversations yet. Start a new chat!
            </Typography>
          </Box>
        ) : (
          chats.map((chat) => (
            <Box key={chat._id}>
              <ListItem
                button
                selected={chat._id === activeChatId}
                onClick={() => onChatSelect(chat._id)}
                sx={{
                  px: 2,
                  py: 1.5,
                  backgroundColor:
                    chat._id === activeChatId
                      ? "rgb(55, 65, 81)"
                      : "transparent", // gray-700
                  "&:hover": {
                    backgroundColor: "rgb(55, 65, 81)", // gray-700
                  },
                }}
              >
                <ListItemAvatar>
                  <Badge
                    color="error"
                    badgeContent={chat.unreadCount}
                    invisible={chat.unreadCount === 0}
                    overlap="circular"
                  >
                    {chat.otherUser?.info?.profilePic ? (
                      <Avatar
                        src={`${serverUrl}/public${chat.otherUser.info.profilePic}`}
                        alt={chat.otherUser?.name}
                      />
                    ) : (
                      <Avatar>
                        <DefaultAvatar size={40} color="#4B5563" />{" "}
                        {/* gray-600 */}
                      </Avatar>
                    )}
                  </Badge>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography
                      variant="subtitle2"
                      noWrap
                      sx={{
                        fontWeight: chat.unreadCount > 0 ? "bold" : "normal",
                        color: "white",
                      }}
                    >
                      {chat.otherUser?.name || chat.otherUser?.username}
                    </Typography>
                  }
                  secondary={
                    <Typography
                      variant="body2"
                      noWrap
                      sx={{
                        fontWeight: chat.unreadCount > 0 ? "bold" : "normal",
                        color:
                          chat.unreadCount > 0
                            ? "rgb(209, 213, 219)" // gray-300
                            : "rgb(156, 163, 175)", // gray-400
                      }}
                    >
                      {chat.lastMessage?.content || "No messages yet"}
                    </Typography>
                  }
                />
                <Typography
                  variant="caption"
                  sx={{
                    ml: 1,
                    minWidth: 40,
                    textAlign: "right",
                    color: "rgb(156, 163, 175)", // gray-400
                  }}
                >
                  {chat.lastMessage?.createdAt
                    ? formatDistanceToNow(
                        new Date(chat.lastMessage.createdAt),
                        { addSuffix: false }
                      )
                    : ""}
                </Typography>
              </ListItem>
              <Divider
                component="li"
                sx={{
                  borderColor: "rgb(55, 65, 81)", // gray-700
                }}
              />
            </Box>
          ))
        )}
      </List>
    </Box>
  );
};

ChatList.propTypes = {
  chats: PropTypes.array.isRequired,
  activeChatId: PropTypes.string,
  onChatSelect: PropTypes.func.isRequired,
  onSearchToggle: PropTypes.func.isRequired,
};

export default ChatList;
