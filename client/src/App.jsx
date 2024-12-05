import {
  Route,
  BrowserRouter as Router,
  Routes,
  useLocation,
  Navigate,
} from "react-router-dom";
import About from "./components/About";
import Bids from "./components/BidingsPage/Bids";
import Projects from "./components/ProjectPages/Projects";
import Dashboard from "./components/dashboard/Dashboard";
import JobDetails from "./components/Jobs/JobDetails";
import PostJob from "./components/Jobs/PostJob";
import Features from "./components/Features/FeaturesPage";
import Jobs from "./components/JobsPage/Jobs";
import LandingPage from "./components/LandingPage/LandingPage";
import Marketplace from "./components/MarketPlace/MarketPlace";
import Navbar from "./components/Navbar";
import ProfilePage from "./components/ProfilePage/ProfilePage";
import ProfileSettings from "./components/ProfilePage/ProfileSettings";
import LoginPage from "./components/RegistrationPages/Login";
import SignupPage from "./components/RegistrationPages/Signup";
import AdminLogin from "./components/admin/AdminLogin";
import AdminLayout from "./components/admin/AdminLayout";
import AdminDashboard from "./components/admin/AdminDashboard";
import AdminUsers from "./components/admin/AdminUsers";
import AdminJobs from "./components/admin/AdminJobs";
import TransactionPage from "./components/TransactionPage/TransactionPage";
import { useSelector } from "react-redux";
import Footer from "./components/Footer";
import NotificationsPage from "./components/Notifications/NotificationsPage";

// Protected Route component for admin routes
const AdminProtectedRoute = ({ children }) => {
  const { token } = useSelector((state) => state.admin);
  const location = useLocation();

  if (!token) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return children;
};

function App() {
  const location = useLocation();
  const hideNavbarRoutes = [
    "/login",
    "/signup",
    "/admin",
    "/admin/login",
    "/admin/dashboard",
    "/admin/users",
    "/admin/jobs",
    "/admin/reports",
  ];

  const isDashboardRoute = location.pathname.startsWith("/dashboard");

  return (
    <div className="flex flex-col min-h-screen justify-between">
      {!hideNavbarRoutes.includes(location.pathname) && <Navbar />}
      
      <main className={`w-full${isDashboardRoute ? 'flex' : ''} h-full`}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/profile" element={<ProfileSettings />} />
          <Route path="/user/:username" element={<ProfilePage />} />
          <Route path="/jobs/:id" element={<JobDetails />} />
          <Route path="/jobs/new" element={<PostJob />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/jobs" element={<Jobs />} />
          <Route path="/dashboard/bids" element={<Bids />} />
          <Route path="dashboard/projects" element={<Projects />} />
          <Route path="/about" element={<About />} />
          <Route path="dashboard/transactions/*" element={<TransactionPage />} />

          {/* Admin Routes */}
          <Route path="/admin" element={<Navigate to="/admin/login" replace />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin"
            element={
              <AdminProtectedRoute>
                <AdminLayout />
              </AdminProtectedRoute>
            }
          >
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="jobs" element={<AdminJobs />} />
          </Route>

          <Route path="/features" element={<Features />} />
        </Routes>
      </main>

      {!hideNavbarRoutes.includes(location.pathname) && (
        <footer className={isDashboardRoute ? 'ml-56' : ''}>
          <Footer />
        </footer>
      )}
    </div>
  );
}

export function APPwithRouter() {
  return (
    <Router>
      <App />
    </Router>
  );
}
