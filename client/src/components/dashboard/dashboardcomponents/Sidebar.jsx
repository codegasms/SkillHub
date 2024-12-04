import React from "react";
import { FaAngleLeft, FaAngleRight } from "react-icons/fa6";
import { TiHomeOutline } from "react-icons/ti";
import { Link, useLocation } from "react-router-dom";
import { MdOutlineWorkOutline } from "react-icons/md";
import { BiDollarCircle } from "react-icons/bi";
import { GrMoney } from "react-icons/gr";
import { FaExchangeAlt, FaLaptopCode } from "react-icons/fa";
import { RiAccountCircleLine } from "react-icons/ri";
import { useDispatch, useSelector } from "react-redux";
import {
  toggleSidebar,
  selectIsSidebarMinimized,
} from "../../../redux/reducers/dashboard/sidebarSlice";
import { selectRole } from "../../../redux/Features/user/authSlice";

function Sidebar() {
  const dispatch = useDispatch();
  const isSidebarMinimized = useSelector(selectIsSidebarMinimized);
  const userRole = useSelector(selectRole);
  const location = useLocation();
  const activeSection = location.pathname;

  const isFreelancer = userRole === "freelancer";
  const isHybrid = userRole === "hybrid";
  const showFreelancerMenu = isFreelancer || isHybrid;

  return (
    <div className="relative h-screen w-[250px]">
      <div
        className={`bg-grey fixed top-16 h-full z-10 left-0 text-light flex flex-col items-center ${
          isSidebarMinimized ? "w-16" : "w-56"
        } transition-width duration-300`}
      >
        <div className="flex justify-between my-5 w-full pl-5 pr-5">
          <div
            className={`text-md flex items-start font-bold ${
              isSidebarMinimized ? "hidden" : "block"
            }`}
          >
            <TiHomeOutline className="mr-2 mt-1.5 text-lg" />
            <Link
              to={
                userRole === 'enterprise'
                  ? '/entrepreneur-dashboard'
                  : userRole === 'hybrid'
                  ? '/hybrid-dashboard'
                  : '/freelancer-dashboard'
              }
              className="text-base font-normal p-0 m-1"
            >
              Dashboard
            </Link>
          </div>
          <button
            className="text-light px-2 py-1 rounded"
            onClick={() => dispatch(toggleSidebar())}
          >
            {isSidebarMinimized ? (
              <FaAngleLeft className="font-light" />
            ) : (
              <FaAngleRight className="font-light" />
            )}
          </button>
        </div>
        {!isSidebarMinimized && (
          <div className={`w-full flex flex-col justify-between h-3/4`}>
            <div className="w-3/4 ml-10 flex flex-col justify-start">
              {showFreelancerMenu && (
                <>
                  <Link
                    to="/dashboard/jobs"
                    className={`flex my-3 ${
                      activeSection === "/dashboard/jobs"
                        ? "bg-dark border-l-4 border-cyan-blue"
                        : ""
                    } px-4 py-2 hover:bg-dark text-cyan-blue`}
                  >
                    <MdOutlineWorkOutline className="text-xl mr-3" />
                    Jobs
                  </Link>

                  <Link
                    to="/dashboard/bids"
                    className={`flex my-3 ${
                      activeSection === "/dashboard/bids"
                        ? "bg-dark border-l-4 border-cyan-blue"
                        : ""
                    } px-4 py-2 hover:bg-dark text-cyan-blue`}
                  >
                    <BiDollarCircle className="mr-3 text-xl" />
                    Bidings
                  </Link>

                </>
              )}

              {/* Always show Projects and Transactions */}
              <Link
                to="/dashboard/projects"
                className={`flex my-3 ${
                  activeSection === "/dashboard/projects"
                    ? "bg-dark border-l-4 border-cyan-blue"
                    : ""
                } px-4 py-2 hover:bg-dark text-cyan-blue`}
              >
                <FaLaptopCode className="mr-3 text-xl" />
                Projects
              </Link>
              <Link
                    to="/dashboard/funds"
                    className={`flex my-3 ${
                      activeSection === "/dashboard/funds"
                        ? "bg-dark border-l-4 border-cyan-blue"
                        : ""
                    } px-4 py-2 hover:bg-dark text-cyan-blue`}
                  >
                    <GrMoney className="mr-3 text-xl" />
                    Funds
              </Link>

              <Link
                to="/dashboard/transactions"
                className={`flex my-3 ${
                  activeSection === "/dashboard/transactions"
                    ? "bg-dark border-l-4 border-cyan-blue"
                    : ""
                } px-4 py-2 hover:bg-dark text-cyan-blue`}
              >
                <FaExchangeAlt className="mr-3 text-xl" />
                Transactions
              </Link>
            </div>

            <div className="w-full ml-8 flex flex-col justify-start my-3">
              <Link
                to="/account"
                className={`flex my-3 ${
                  activeSection === "/account"
                    ? "bg-dark border-l-4 border-cyan-blue"
                    : ""
                } px-4 py-2 hover:bg-dark text-cyan-blue`}
              >
                <RiAccountCircleLine className="mr-3 text-xl" />
                Account
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Sidebar;
