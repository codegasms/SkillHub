import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import axiosInstance from "../../api/axiosInstance";
import ReactStars from "react-stars";
import ReviewModal from "./ProfileComponents/ReviewModal";
import { selectUsername } from "../../redux/Features/user/authSlice";
import { createChat } from "../../redux/Features/chat/chatSlice";

const ProfilePage = () => {
  const { username } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [activeSection, setActiveSection] = useState("skills");
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const serverUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";

  const currentUsername = useSelector(selectUsername);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await axiosInstance.get(`/user/${username}`);
        setUser(response.data);
        const reviewsResponse = await axiosInstance.get(
          `/review/user/${response.data._id}`
        );
        setReviews(reviewsResponse.data.reviews);
      } catch (error) {
        console.error("Error fetching user profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [username]);

  const handleReviewSubmit = async () => {
    try {
      await axiosInstance.post("/review", {
        reviewedUser: user._id,
        rating,
        comment,
      });
      const reviewsResponse = await axiosInstance.get(
        `/review/user/${user._id}`
      );
      setReviews(reviewsResponse.data.reviews);
      setIsModalOpen(false);
      setRating(0);
      setComment("");
    } catch (error) {
      console.error("Error submitting review:", error);
    }
  };

  const handleStartChat = async () => {
    if (user && user._id) {
      try {
        const result = await dispatch(createChat(user._id));
        if (!result.error) {
          const chatId = result.payload.chatId;
          navigate(`/chat/${chatId}`);
        }
      } catch (error) {
        console.error("Error starting chat:", error);
      }
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-400"></div>
      </div>
    );
  if (!user)
    return (
      <div className="flex justify-center items-center h-screen bg-gray-900">
        <div className="text-xl text-gray-300">User not found</div>
      </div>
    );

  const joinedDate = new Date(user.createdAt);
  const joinedTime = getJoinedDuration(joinedDate);

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Hero Section */}
      <div className="relative h-64 bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-900">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent"></div>
        <div className="absolute -bottom-16 left-1/2 -translate-x-1/2">
          <div className="relative">
            <img
              className="w-32 h-32 rounded-full border-4 border-gray-900 shadow-xl object-cover"
              src={
                user.info?.profilePic
                  ? `${serverUrl}/public${user.info.profilePic}`
                  : "/default-avatar.png"
              }
              alt={`${user.name || "User"}'s profile`}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24">
        {/* Profile Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-white">
            {user.name || "Anonymous User"}
          </h1>
          <p className="text-lg text-gray-400">@{user.username}</p>
          <p className="mt-3 text-gray-400 max-w-2xl mx-auto">
            {user.bio || "No bio available"}
          </p>
          <div className="flex space-x-2">
            {currentUsername !== username && (
              <button
                onClick={handleStartChat}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition duration-300 flex items-center"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
                    clipRule="evenodd"
                  />
                </svg>
                Chat
              </button>
            )}
            {currentUsername !== username && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md transition duration-300"
              >
                Leave Review
              </button>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700/50 hover:bg-gray-800 transition-all duration-200">
            <p className="text-sm text-gray-400">Joined</p>
            <p className="mt-2 text-2xl font-semibold text-white">
              {joinedTime}
            </p>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700/50 hover:bg-gray-800 transition-all duration-200">
            <p className="text-sm text-gray-400">Skills</p>
            <p className="mt-2 text-2xl font-semibold text-white">
              {user.info.skills.length}
            </p>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700/50 hover:bg-gray-800 transition-all duration-200">
            <p className="text-sm text-gray-400">Experience</p>
            <p className="mt-2 text-2xl font-semibold text-white">
              {user.info.experience.length}
            </p>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700/50 hover:bg-gray-800 transition-all duration-200">
            <p className="text-sm text-gray-400">Reviews</p>
            <p className="mt-2 text-2xl font-semibold text-white">
              {reviews.length}
            </p>
          </div>
        </div>

        {/* Navigation */}
        <div className="border-b border-gray-800 mb-8">
          <nav className="flex space-x-8">
            {["skills", "experience", "reviews"].map((section) => (
              <button
                key={section}
                onClick={() => setActiveSection(section)}
                className={`pb-4 px-1 font-medium text-sm transition-all duration-200 ${
                  activeSection === section
                    ? "border-b-2 border-blue-500 text-blue-400"
                    : "text-gray-400 hover:text-gray-200"
                }`}
              >
                {section.charAt(0).toUpperCase() + section.slice(1)}
              </button>
            ))}
          </nav>
        </div>

        {/* Content Sections */}
        <div className="mb-16">
          {activeSection === "skills" && (
            <div className="flex flex-wrap gap-2">
              {user.info.skills.map((skill, index) => (
                <span
                  key={index}
                  className="px-4 py-2 bg-blue-900/30 text-blue-300 rounded-lg text-sm font-medium border border-blue-800/50 hover:bg-blue-900/50 transition-all duration-200"
                >
                  {skill}
                </span>
              ))}
            </div>
          )}

          {activeSection === "experience" && (
            <div className="space-y-4">
              {user.info.experience.map((exp, index) => (
                <div
                  key={index}
                  className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700/50 hover:bg-gray-800 transition-all duration-200"
                >
                  <p className="text-gray-300">{exp}</p>
                </div>
              ))}
            </div>
          )}

          {activeSection === "reviews" && (
            <div className="space-y-6">
              {reviews.map((review, index) => (
                <div
                  key={index}
                  className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700/50 hover:bg-gray-800 transition-all duration-200"
                >
                  <div className="flex items-start">
                    {review.reviewer?.info?.profilePic ? (
                      <img
                        className="h-10 w-10 rounded-full border border-gray-700"
                        src={`${serverUrl}/public${review.reviewer.info.profilePic}`}
                        alt={review.reviewer.name}
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full border border-gray-700 bg-gray-600 flex items-center justify-center">
                        <span className="text-gray-300">
                          {review.reviewer?.name?.charAt(0) || "?"}
                        </span>
                      </div>
                    )}
                    <div className="ml-4">
                      <Link
                        to={`/user/${review.reviewer?.username}`}
                        className="text-white font-medium hover:text-blue-400 transition-colors duration-200"
                      >
                        {review.reviewer?.name || "Anonymous"}
                      </Link>
                      <div className="mt-1">
                        <ReactStars
                          count={5}
                          value={review.rating}
                          size={20}
                          color2={"#60A5FA"}
                          edit={false}
                        />
                      </div>
                      <p className="mt-2 text-gray-400">{review.comment}</p>
                    </div>
                  </div>
                </div>
              ))}
              {reviews.length === 0 && (
                <p className="text-center text-gray-400">No reviews yet</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Review Modal */}
      <ReviewModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleReviewSubmit}
        rating={rating}
        setRating={setRating}
        comment={comment}
        setComment={setComment}
      />
    </div>
  );
};

// Helper function to calculate how long the user has been a member
const getJoinedDuration = (joinedDate) => {
  const now = new Date();
  const diffTime = Math.abs(now - joinedDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 14) return "1 week ago";
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;

  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffMonths / 12);

  if (diffYears > 0) {
    return diffYears === 1 ? "1 year ago" : `${diffYears} years ago`;
  }
  return diffMonths === 1 ? "1 month ago" : `${diffMonths} months ago`;
};

export default ProfilePage;
