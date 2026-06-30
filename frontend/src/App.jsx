import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./auth/AuthContext";
import PrivateRoute from "./auth/PrivateRoute";

import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import FarmerDashboard from "./pages/farmer/FarmerDashboard";
import CooperativeDashboard from "./pages/cooperative/CooperativeDashboard";
import TransporterDashboard from "./pages/transporter/TransporterDashboard";
import ConsumerScanPage from "./pages/consumer/ConsumerScanPage";
import BlogListPage from "./pages/blog/BlogListPage";
import BlogDetailPage from "./pages/blog/BlogDetailPage";
import CreateBlogPage from "./pages/blog/CreateBlogPage";
import BatchHistoryPage from "./pages/BatchHistoryPage";
import ProfilePage from "./pages/profile/ProfilePage";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: "14px",
              borderRadius: "12px",
            },
          }}
        />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/consumer/scan" element={<ConsumerScanPage />} />
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <ProfilePage />
              </PrivateRoute>
            }
          />
          {/* Blogs — public read, authenticated write */}
          <Route path="/blogs" element={<BlogListPage />} />
          <Route path="/blogs/:id" element={<BlogDetailPage />} />
          <Route
            path="/blogs/new"
            element={
              <PrivateRoute>
                <CreateBlogPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/blogs/:id/edit"
            element={
              <PrivateRoute>
                <CreateBlogPage />
              </PrivateRoute>
            }
          />

          <Route
            path="/batches/history"
            element={
              <PrivateRoute>
                <BatchHistoryPage />
              </PrivateRoute>
            }
          />

          <Route
            path="/farmer/dashboard"
            element={
              <PrivateRoute role="FARMER">
                <FarmerDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/cooperative/dashboard"
            element={
              <PrivateRoute role="COOPERATIVE">
                <CooperativeDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/transporter/dashboard"
            element={
              <PrivateRoute role="TRANSPORTER">
                <TransporterDashboard />
              </PrivateRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
