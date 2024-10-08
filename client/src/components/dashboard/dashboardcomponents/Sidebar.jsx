import React from 'react';
import { FaAngleLeft, FaAngleRight } from "react-icons/fa6";
import { TiHomeOutline } from "react-icons/ti";
import { Link, useLocation } from 'react-router-dom';
import { MdOutlineWorkOutline } from "react-icons/md";
import { BiDollarCircle } from "react-icons/bi";
import { GrMoney } from "react-icons/gr";
import { FaLaptopCode } from "react-icons/fa";
import { RiAccountCircleLine } from "react-icons/ri";
import { useDispatch, useSelector } from 'react-redux';
import { toggleSidebar, selectIsSidebarMinimized } from '../../../redux/reducers/dashboard/sidebarSlice';

function Sidebar() {
    const dispatch = useDispatch();
    const isSidebarMinimized = useSelector(selectIsSidebarMinimized); // Get the minimized state from Redux

    // Get the current active path to highlight the active section
    const location = useLocation();
    const activeSection = location.pathname;

    return (
        <div className="relative h-screen w-[250px]">

            <div className={`bg-grey fixed top-16 h-full z-10 left-0 text-light flex flex-col items-center ${isSidebarMinimized ? 'w-16' : 'w-56'} transition-width duration-300`}>
                <div className="flex justify-between my-5 w-full pl-5 pr-5">
                    <div className={`text-md flex items-start font-bold ${isSidebarMinimized ? 'hidden' : 'block'}`}>
                        <TiHomeOutline className='mr-2 mt-1.5 text-lg' />
                        <span className='text-base font-normal p-0 m-1'>Dashboard</span>
                    </div>
                    <button className="text-light px-2 py-1 rounded" onClick={() => dispatch(toggleSidebar())}> {/* Dispatch the toggle action */}
                        {isSidebarMinimized ? <FaAngleLeft className='font-light' /> : <FaAngleRight className='font-light' />}
                    </button>
                </div>
                {!isSidebarMinimized && (
                    <div className={`w-full flex flex-col justify-between h-3/4`}>
                        <div className='w-3/4 ml-10 flex flex-col justify-start'>

                            <Link to="/jobs" className={`flex my-3 ${activeSection === '/' ? 'bg-dark border-l-4 border-cyan-blue' : ''} px-4 py-2 hover:bg-dark text-cyan-blue`}>
                                <MdOutlineWorkOutline className='text-xl mr-3' />
                                Jobs
                            </Link>

                            <Link to="/bidings" className={`flex my-3 ${activeSection === '/bidings' ? 'bg-dark border-l-4 border-cyan-blue' : ''} px-4 py-2 hover:bg-dark text-cyan-blue`}>
                                <BiDollarCircle className='mr-3 text-xl' />
                                Biddings
                            </Link>

                            <Link to="/earnings" className={`flex my-3 ${activeSection === '/earnings' ? 'bg-dark border-l-4 border-cyan-blue' : ''} px-4 py-2 hover:bg-dark text-cyan-blue`}>
                                <GrMoney className='mr-3 text-xl' />
                                Earnings
                            </Link>

                            <Link to="/projects" className={`flex my-3 ${activeSection === '/projects' ? 'bg-dark border-l-4 border-cyan-blue' : ''} px-4 py-2 hover:bg-dark text-cyan-blue`}>
                                <FaLaptopCode className='mr-3 text-xl' />
                                Projects
                            </Link>

                        </div>

                        <div className='w-full ml-8 flex flex-col justify-start my-3'>
                            <Link to="/account" className={`flex my-3 ${activeSection === '/account' ? 'bg-dark border-l-4 border-cyan-blue' : ''} px-4 py-2 hover:bg-dark text-cyan-blue`}>
                                <RiAccountCircleLine className='mr-3 text-xl' />
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
