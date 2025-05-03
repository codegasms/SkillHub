import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchUserProfile,
  selectUserProfile,
} from "../redux/Features/user/ProfileSlice";
import {
  selectAccessToken,
  selectRole,
  logoutAndNavigate,
} from "../redux/Features/user/authSlice";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserCircle } from "@fortawesome/free-solid-svg-icons";
import NotificationIcon from "./Notifications/NotificationIcon";
import ChatNotificationIcon from "./Chat/ChatNotificationIcon";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const accessToken = useSelector(selectAccessToken);
  const userProfile = useSelector(selectUserProfile);
  const userRole = useSelector(selectRole);
  const serverUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";

  useEffect(() => {
    if (accessToken) {
      dispatch(fetchUserProfile());
    }
  }, [accessToken, dispatch]);

  const handleLogout = () => {
    dispatch(logoutAndNavigate());
    setIsOpen(false);
    navigate("/");
  };

  const getDashboardLink = () => {
    return "/dashboard"; // All user types now use the same dashboard route
  };

  return (
    <>
      <nav className="fixed z-[200] w-screen bg-white bg-opacity-60 shadow dark:bg-gray-800 dark:bg-opacity-60 backdrop-blur transition-all duration-300">
        <div className="container px-6 py-4 mx-auto">
          <div className="lg:flex lg:items-center lg:justify-between">
            <div className="flex items-center justify-between">
              <Link className=" flex" to="/">
                <img
                  className="w-auto h-6 sm:h-7"
                  src="/logo.png"
                  alt="Skill Hub Logo"
                />
                <span className="text-gray-700 dark:text-gray-200 text-lg font-semibold ml-2">
                  Skill Hub
                </span>
              </Link>

              {/* Mobile menu button */}
              <div className="flex lg:hidden">
                <button
                  onClick={() => setIsOpen(!isOpen)}
                  type="button"
                  className="text-gray-500 dark:text-gray-200 hover:text-gray-600 dark:hover:text-gray-400 focus:outline-none"
                  aria-label="toggle menu"
                >
                  {!isOpen ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-6 h-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4 8h16M4 16h16"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-6 h-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div
              className={`absolute rounded inset-x-0 z-20 w-full px-6 py-4 transition-all duration-300 ease-in-out bg-white bg-opacity-60 dark:bg-gray-800 dark:bg-opacity-60 lg:mt-0 lg:p-0 lg:top-0 lg:relative lg:bg-transparent lg:w-auto lg:opacity-100 lg:translate-x-0 lg:flex lg:items-center ${
                isOpen
                  ? "translate-x-0 opacity-100"
                  : "opacity-0 -translate-x-full"
              }`}
            >
              <Link
                to="/marketplace"
                className="px-3 py-2 mx-3 mt-2 text-gray-700 transition-colors duration-300 transform rounded-md lg:mt-0 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Marketplace
              </Link>
              <Link
                to="/about"
                className="px-3 py-2 mx-3 mt-2 text-gray-700 transition-colors duration-300 transform rounded-md lg:mt-0 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                About
              </Link>

              <div className="flex items-center pr-4">
                {accessToken ? (
                  <>
                    {userRole !== "freelancer" && (
                      <Link
                        to="/jobs/new"
                        className="px-3 py-2 mx-3 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                      >
                        New Job
                      </Link>
                    )}
                    <Link
                      to={getDashboardLink()}
                      className="px-3 py-2 mx-3 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/profile"
                      className="px-3 py-2 mx-3 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                    >
                      Settings
                    </Link>
                    <div className="lg:mx-4 lg:my-0 my-2">
                      <NotificationIcon />
                    </div>
                    <div className="lg:mx-4 lg:my-0 my-2">
                      <ChatNotificationIcon />
                    </div>
                    <button
                      onClick={handleLogout}
                      className="px-3 py-2 mx-3 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                    >
                      Logout
                    </button>
                    <Link
                      to={`/user/${userProfile.username}`}
                      className="relative"
                    >
                      <button
                        type="button"
                        className="flex items-center focus:outline-none"
                        aria-label="toggle profile dropdown"
                      >
                        <div className="w-8 h-8 overflow-hidden border-2 border-gray-400 rounded-full">
                          {userProfile.info.profilePic ? (
                            <img
                              src={`${serverUrl}/public${userProfile.info.profilePic}`}
                              alt={`${userProfile.name}'s profile`}
                              className="w-10 h-10 rounded-full"
                            />
                          ) : (
                            <FontAwesomeIcon
                              icon={faUserCircle}
                              className="w-10 h-10 text-gray-500"
                            />
                          )}
                        </div>
                      </button>
                    </Link>
                  </>
                ) : (
                  <Link
                    to="/login"
                    className="px-3 py-2 mx-3 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                  >
                    Login
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>
      <div className=" h-[70px]"></div>
    </>
  );
};

export default Navbar;
