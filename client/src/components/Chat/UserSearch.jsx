import { useSelector } from "react-redux";
import {
  Box,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  TextField,
  CircularProgress,
  Paper,
} from "@mui/material";
import PropTypes from "prop-types";
import DefaultAvatar from "./DefaultAvatar";

const UserSearch = ({ query, onQueryChange, onUserSelect }) => {
  const { searchResults, loading, error } = useSelector((state) => state.chat);
  const serverUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";

  return (
    <Paper
      elevation={3}
      sx={{
        position: "absolute",
        top: 60,
        left: 0,
        right: 0,
        zIndex: 10,
        maxHeight: 400,
        overflow: "auto",
        borderTop: "1px solid",
        borderColor: "rgb(55, 65, 81)", // gray-700
        bgcolor: "rgb(31, 41, 55)", // gray-800
      }}
    >
      <Box sx={{ p: 2 }}>
        <TextField
          fullWidth
          variant="outlined"
          size="small"
          placeholder="Search by username..."
          value={query}
          onChange={onQueryChange}
          autoFocus
          sx={{
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
            "& .MuiInputLabel-root": {
              color: "rgb(156, 163, 175)", // gray-400
            },
            "& .MuiInputBase-input::placeholder": {
              color: "rgb(156, 163, 175)", // gray-400
              opacity: 1,
            },
          }}
        />
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
          <CircularProgress size={24} sx={{ color: "rgb(59, 130, 246)" }} />{" "}
          {/* blue-500 */}
        </Box>
      ) : error ? (
        <Box sx={{ p: 2 }}>
          <Typography color="error">{error}</Typography>
        </Box>
      ) : searchResults.length === 0 ? (
        <Box sx={{ p: 2 }}>
          <Typography variant="body2" color="rgb(156, 163, 175)">
            {" "}
            {/* gray-400 */}
            {query.length < 2
              ? "Type at least 2 characters to search"
              : "No users found"}
          </Typography>
        </Box>
      ) : (
        <List>
          {searchResults.map((user) => (
            <ListItem
              key={user._id}
              button
              onClick={() => onUserSelect(user._id)}
              sx={{
                "&:hover": {
                  backgroundColor: "rgb(55, 65, 81)", // gray-700
                },
              }}
            >
              <ListItemAvatar>
                {user.info?.profilePic ? (
                  <Avatar
                    src={`${serverUrl}/public${user.info.profilePic}`}
                    alt={user.name}
                  />
                ) : (
                  <Avatar>
                    <DefaultAvatar size={40} color="#4B5563" /> {/* gray-600 */}
                  </Avatar>
                )}
              </ListItemAvatar>
              <ListItemText
                primary={<Typography color="white">{user.name}</Typography>}
                secondary={
                  <Typography variant="body2" color="rgb(156, 163, 175)">
                    {" "}
                    {/* gray-400 */}@{user.username}
                  </Typography>
                }
              />
            </ListItem>
          ))}
        </List>
      )}
    </Paper>
  );
};

UserSearch.propTypes = {
  query: PropTypes.string.isRequired,
  onQueryChange: PropTypes.func.isRequired,
  onUserSelect: PropTypes.func.isRequired,
};

export default UserSearch;
