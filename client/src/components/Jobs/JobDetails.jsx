import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import axiosInstance from "../../api/axiosInstance";
import {
  selectRole,
  selectUsername,
} from "../../redux/Features/user/authSlice";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUserCircle,
  faBriefcase,
  faTag,
  faList,
  faUser,
  faMoneyBill,
} from "@fortawesome/free-solid-svg-icons";
import { motion } from "framer-motion";

const JobDetails = () => {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [bids, setBids] = useState([]);
  const [bidAmount, setBidAmount] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const role = useSelector(selectRole);
  const username = useSelector(selectUsername);

  const serverUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";

  const fetchBids = async () => {
    try {
      const bidsResponse = await axiosInstance.get(`/bids/${id}`);
      setBids(bidsResponse.data);
    } catch (err) {
      setError("Error fetching bids");
    }
  };

  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        const response = await axiosInstance.get(`/jobs/${id}`);
        setJob(response.data);
        await fetchBids();
      } catch (err) {
        setError("Job not found!");
      }
    };

    fetchJobDetails();
  }, [id]);

  const handleBidSubmit = async () => {
    if (!bidAmount) {
      setError("Please enter a bid amount");
      return;
    }
    setIsSubmitting(true);
    setError("");
    try {
      await axiosInstance.post(`/bids/place`, {
        amount: bidAmount,
        jobId: id,
      });
      setBidAmount("");
      setSuccessMessage("Bid placed successfully!");
      await fetchBids(); // Fetch updated bids
      setTimeout(() => setSuccessMessage(""), 3000); // Clear success message after 3 seconds
    } catch (err) {
      setError("Error submitting bid");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAcceptBid = async (bidId) => {
    try {
      await axiosInstance.put(`/bids/accept/${bidId}`);
      await fetchBids(); // Fetch updated bids
      const response = await axiosInstance.get(`/jobs/${id}`);
      setJob(response.data);
    } catch (err) {
      setError("Error accepting bid");
    }
  };

  const handleDeleteBid = async (bidId) => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setError("Please login to delete your bid");
        return;
      }

      await axiosInstance.delete(`/bids/${bidId}`);

      // Refresh bids after deletion
      await fetchBids();
      setSuccessMessage("Bid deleted successfully");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Error deleting bid");
      setTimeout(() => setError(""), 3000);
    }
  };

  if (error)
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="min-h-screen flex items-center justify-center"
      >
        <div className="bg-red-500/10 text-red-500 p-6 rounded-lg text-center max-w-md">
          <h2 className="text-2xl font-bold mb-2">Error</h2>
          <p>{error}</p>
        </div>
      </motion.div>
    );

  if (!job)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse flex space-x-4">
          <div className="h-12 w-12 bg-gray-700 rounded-full"></div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-700 rounded w-64"></div>
            <div className="h-4 bg-gray-700 rounded w-52"></div>
          </div>
        </div>
      </div>
    );

  // Get the accepted bid if it exists
  const acceptedBid = bids.find((bid) => bid.status === "accepted");

  return (
    <div className="min-h-screen text-white p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        {/* Job Header Section */}
        <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-2xl shadow-xl mb-6">
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-4xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent"
          >
            {job.title}
          </motion.h1>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <p className="text-lg text-gray-300 leading-relaxed">
                {job.description}
              </p>

              <div className="flex items-center space-x-2 text-gray-300">
                <FontAwesomeIcon
                  icon={faMoneyBill}
                  className="text-green-400"
                />
                <span className="font-semibold">Budget:</span>
                <span className="bg-green-500/10 text-green-400 px-3 py-1 rounded-full">
                  ₹{job.budget.min.toLocaleString()} - ₹
                  {job.budget.max.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-2">
                <FontAwesomeIcon icon={faUser} className="text-blue-400" />
                <span className="font-semibold">Posted by:</span>
              </div>
              <div className="flex items-center p-4 bg-gray-700/50 rounded-xl">
                {job.employer.info.profilePic ? (
                  <img
                    src={`${serverUrl}/public${job.employer.info.profilePic}`}
                    alt={`${job.employer.name}'s profile`}
                    className="w-12 h-12 rounded-full mr-3 border-2 border-blue-400"
                  />
                ) : (
                  <FontAwesomeIcon
                    icon={faUserCircle}
                    className="w-12 h-12 text-gray-400 mr-3"
                  />
                )}
                <div>
                  <Link
                    to={`/user/${job.employer.username}`}
                    className="text-blue-400 hover:text-blue-300 transition-colors font-medium"
                  >
                    {job.employer.name}
                  </Link>
                  <p className="text-sm text-gray-400">Employer</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Skills and Categories Section */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-2xl"
          >
            <div className="flex items-center space-x-2 mb-4">
              <FontAwesomeIcon icon={faBriefcase} className="text-purple-400" />
              <h2 className="text-xl font-semibold">Required Skills</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {job.skillsRequired.map((skill, index) => (
                <span
                  key={index}
                  className="bg-purple-500/10 text-purple-300 px-4 py-2 rounded-full text-sm font-medium"
                >
                  {skill}
                </span>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-2xl"
          >
            <div className="flex items-center space-x-2 mb-4">
              <FontAwesomeIcon icon={faTag} className="text-cyan-400" />
              <h2 className="text-xl font-semibold">Categories</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {job.categories.map((category, index) => (
                <span
                  key={index}
                  className="bg-cyan-500/10 text-cyan-300 px-4 py-2 rounded-full text-sm font-medium"
                >
                  {category}
                </span>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Accepted Bid Section */}
        {acceptedBid && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-500/10 p-6 rounded-2xl mb-6"
          >
            <h2 className="text-2xl font-bold mb-4 text-green-400">
              Accepted Bid
            </h2>
            <div className="flex items-center justify-between bg-gray-800/50 p-4 rounded-xl">
              <div className="flex items-center space-x-4">
                {acceptedBid.freelancer.info.profilePic ? (
                  <img
                    src={`${serverUrl}/public${acceptedBid.freelancer.info.profilePic}`}
                    alt={`${acceptedBid.freelancer.name}'s profile`}
                    className="w-12 h-12 rounded-full border-2 border-green-400"
                  />
                ) : (
                  <FontAwesomeIcon
                    icon={faUserCircle}
                    className="w-12 h-12 text-gray-400"
                  />
                )}
                <div>
                  <Link
                    to={`/user/${acceptedBid.freelancer.username}`}
                    className="text-blue-400 hover:text-blue-300 transition-colors font-medium"
                  >
                    {acceptedBid.freelancer.name}
                  </Link>
                  <p className="text-sm text-gray-400">Freelancer</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm text-gray-400">Bid Amount</p>
                  <p className="text-xl font-bold text-green-400">
                    ₹{acceptedBid.amount.toLocaleString()}
                  </p>
                </div>
                <span className="bg-green-500/20 text-green-400 px-4 py-2 rounded-full text-sm font-medium">
                  Accepted
                </span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Place Bid Section */}
        {(role === "hybrid" || role === "freelancer") &&
          job.employer.username !== username &&
          !job.bidAccepted && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-2xl mb-6"
            >
              <h2 className="text-2xl font-bold mb-4">Place Your Bid</h2>
              {successMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-3 bg-green-500/10 text-green-400 rounded-lg text-center"
                >
                  {successMessage}
                </motion.div>
              )}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-3 bg-red-500/10 text-red-400 rounded-lg text-center"
                >
                  {error}
                </motion.div>
              )}
              <div className="flex items-center gap-4">
                <div className="relative flex-grow">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    ₹
                  </span>
                  <input
                    type="number"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    placeholder="Enter your bid amount"
                    className="w-full bg-gray-700/50 border border-gray-600 rounded-xl px-8 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>
                <button
                  onClick={handleBidSubmit}
                  disabled={isSubmitting}
                  className={`px-6 py-3 rounded-xl font-medium transition-all ${
                    isSubmitting
                      ? "bg-gray-600 cursor-not-allowed"
                      : "bg-blue-500 hover:bg-blue-600"
                  }`}
                >
                  {isSubmitting ? "Submitting..." : "Submit Bid"}
                </button>
              </div>
            </motion.div>
          )}

        {/* Other Bids Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-2xl"
        >
          <div className="flex items-center space-x-2 mb-6">
            <FontAwesomeIcon icon={faList} className="text-blue-400" />
            <h2 className="text-2xl font-bold">Other Bids</h2>
          </div>

          {bids.length > 0 ? (
            <div className="space-y-4">
              {bids
                .filter((bid) => bid.status !== "accepted")
                .map((bid) => (
                  <motion.div
                    key={bid._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gray-700/50 p-4 rounded-xl flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-4">
                      {bid.freelancer.info.profilePic ? (
                        <img
                          src={`${serverUrl}/public${bid.freelancer.info.profilePic}`}
                          alt={`${bid.freelancer.name}'s profile`}
                          className="w-10 h-10 rounded-full border border-gray-600"
                        />
                      ) : (
                        <FontAwesomeIcon
                          icon={faUserCircle}
                          className="w-10 h-10 text-gray-400"
                        />
                      )}
                      <div>
                        <Link
                          to={`/user/${bid.freelancer.username}`}
                          className="text-blue-400 hover:text-blue-300 transition-colors font-medium"
                        >
                          {bid.freelancer.name}
                        </Link>
                        <p className="text-sm text-gray-400">Freelancer</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm text-gray-400">Bid Amount</p>
                        <p className="text-lg font-semibold text-yellow-400">
                          ₹{bid.amount.toLocaleString()}
                        </p>
                      </div>

                      <span
                        className={`px-4 py-2 rounded-full text-sm font-medium ${
                          bid.status === "pending"
                            ? "bg-yellow-500/20 text-yellow-400"
                            : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {bid.status.charAt(0).toUpperCase() +
                          bid.status.slice(1)}
                      </span>

                      {bid.freelancer.username === username &&
                        bid.status === "pending" && (
                          <button
                            onClick={() => handleDeleteBid(bid._id)}
                            className="bg-red-500/10 text-red-400 px-4 py-2 rounded-xl font-medium hover:bg-red-500/20 transition-all"
                          >
                            Delete Bid
                          </button>
                        )}

                      {job.employer.username === username &&
                        bid.status === "pending" &&
                        !job.bidAccepted && (
                          <button
                            onClick={() => handleAcceptBid(bid._id)}
                            className="bg-green-500/10 text-green-400 px-4 py-2 rounded-xl font-medium hover:bg-green-500/20 transition-all"
                          >
                            Accept Bid
                          </button>
                        )}
                    </div>
                  </motion.div>
                ))}
            </div>
          ) : (
            <div className="text-center text-gray-400 py-8">
              No bids have been placed for this job yet.
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default JobDetails;
