import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectUserProfile } from '../../redux/Features/user/ProfileSlice';
import axiosInstance from '../../api/axiosInstance';
import Sidebar from "../dashboard/dashboardcomponents/Sidebar";
import { selectIsSidebarMinimized } from "../../redux/reducers/dashboard/sidebarSlice";

const Funds = () => {
  const userProfile = useSelector(selectUserProfile);
  const [fundAmount, setFundAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [myBids, setMyBids] = useState([]);
  const [jobBids, setJobBids] = useState([]);
  const isSidebarMinimized = useSelector(selectIsSidebarMinimized);

  const isFreelancer = userProfile?.role === 'freelancer';
  const isEnterprise = userProfile?.role === 'enterprise';
  const isHybrid = userProfile?.role === 'hybrid';

  // Fetch wallet balance and bids data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch wallet balance
        const walletResponse = await axiosInstance.get('/wallet');
        setWalletBalance(walletResponse.data.balance);

        // Fetch bids for freelancer and hybrid users
        if (isFreelancer || isHybrid) {
          const myBidsResponse = await axiosInstance.get('/bids-jd/freelancer-bids');
          setMyBids(myBidsResponse.data.bids.filter(bid => bid.status === 'accepted'));
        }

        // Fetch job bids for enterprise and hybrid users
        if (isEnterprise || isHybrid) {
          const jobBidsResponse = await axiosInstance.get('/bids-jd/employer-bids');
          setJobBids(jobBidsResponse.data.bids.filter(bid => bid.status === 'accepted'));
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [isFreelancer, isEnterprise, isHybrid]);

  // Handle fund submission
  const handleSubmitFund = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axiosInstance.post('/addfund', { amount: fundAmount });
      setFundAmount('');
      // Refresh wallet balance after adding funds
      const walletResponse = await axiosInstance.get('/wallet');
      setWalletBalance(walletResponse.data.balance);
    } catch (error) {
      console.error('Error adding fund:', error);
    }
    setLoading(false);
  };

  return (
    <div className={`flex flex-grow p-5 top-16 ${
      isSidebarMinimized ? "ml-5" : "ml-10"
    } transition-all duration-300`}>
      <Sidebar />
      <div className="w-10/12 mr-6">
        {/* Section 1: Wallet Balance */}
        <div className="mb-8">
          <div className="bg-gray-800 rounded-lg p-8 shadow-lg">
            <h2 className="text-3xl font-bold text-center mb-4 text-white">Wallet Balance</h2>
            <p className="text-4xl font-bold text-center text-green-400">
              ${walletBalance || 0}
            </p>
          </div>
        </div>

        {/* Section 2: Add Funds */}
        <div className="mb-8">
          <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
            <h3 className="text-2xl font-semibold mb-4 text-white">Add Funds</h3>
            <form onSubmit={handleSubmitFund} className="space-y-4">
              <div>
                <input
                  type="number"
                  value={fundAmount}
                  onChange={(e) => setFundAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full p-3 rounded bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded transition duration-200 disabled:opacity-50"
              >
                {loading ? 'Adding...' : 'Add Fund'}
              </button>
            </form>
          </div>
        </div>

        {/* Section 3: Earnings (Freelancer & Hybrid) */}
        {(isFreelancer || isHybrid) && (
          <div className="mb-8">
            <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
              <h3 className="text-2xl font-semibold mb-4 text-white">Earnings</h3>
              <div className="space-y-4">
                {myBids.map((bid) => (
                  <div key={bid._id} className="bg-gray-700 p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-semibold text-white">{bid.job.title}</h4>
                        <p className="text-gray-400">Bid Amount: ${bid.amount}</p>
                        <p className="text-sm text-gray-500">
                          Accepted on: {new Date(bid.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="px-3 py-1 bg-green-600 rounded-full text-sm text-white">
                          Accepted
                        </span>
                        {bid.isPaid && (
                          <p className="text-sm text-green-400 mt-1">Payment Received</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {myBids.length === 0 && (
                  <p className="text-gray-400 text-center">No earnings yet</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Section 4: Payments (Enterprise & Hybrid) */}
        {(isEnterprise || isHybrid) && (
          <div className="mb-8">
            <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
              <h3 className="text-2xl font-semibold mb-4 text-white">Payments</h3>
              <div className="space-y-4">
                {jobBids.map((bid) => (
                  <div key={bid._id} className="bg-gray-700 p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-semibold text-white">{bid.job.title}</h4>
                        <p className="text-gray-400">Payment Amount: ${bid.amount}</p>
                        <p className="text-sm text-gray-500">
                          Accepted on: {new Date(bid.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="px-3 py-1 bg-green-600 rounded-full text-sm text-white">
                          Accepted
                        </span>
                        {bid.isPaid ? (
                          <p className="text-sm text-green-400 mt-1">Paid</p>
                        ) : (
                          <p className="text-sm text-yellow-400 mt-1">Pending Payment</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {jobBids.length === 0 && (
                  <p className="text-gray-400 text-center">No payments yet</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Funds;