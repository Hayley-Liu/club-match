import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from './store/useStore';
import Layout from './components/Layout';
import ToastContainer from './components/ToastContainer';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';

// Student pages
import Assessment from './pages/student/Assessment';
import Results from './pages/student/Results';
import ClubDetail from './pages/student/ClubDetail';
import Apply from './pages/student/Apply';
import MyApplications from './pages/student/MyApplications';
import Favorites from './pages/student/Favorites';
import StudentNotifications from './pages/student/Notifications';

// Club pages
import ClubRegister from './pages/club/Register';
import ClubDashboard from './pages/club/Dashboard';
import ClubApplications from './pages/club/Applications';
import ClubNotifications from './pages/club/Notifications';

// Admin pages
import AdminDashboard from './pages/admin/Dashboard';
import ClubReview from './pages/admin/ClubReview';
import Announcements from './pages/admin/Announcements';
import ClubManage from './pages/admin/ClubManage';

function ProtectedRoute({ children, role }: { children: React.ReactNode; role?: string }) {
  const user = useStore(s => s.currentUser);
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  const user = useStore(s => s.currentUser);

  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={
            user
              ? <Navigate to={user.role === 'club' ? '/club/dashboard' : user.role === 'admin' ? '/admin/dashboard' : '/'} replace />
              : <Login />
          } />

          {/* Student routes */}
          <Route path="/student/assessment" element={
            <ProtectedRoute role="student"><Assessment /></ProtectedRoute>
          } />
          <Route path="/student/results" element={
            <ProtectedRoute role="student"><Results /></ProtectedRoute>
          } />
          <Route path="/student/club/:id" element={
            <ProtectedRoute role="student"><ClubDetail /></ProtectedRoute>
          } />
          <Route path="/student/apply/:id" element={
            <ProtectedRoute role="student"><Apply /></ProtectedRoute>
          } />
          <Route path="/student/my-applications" element={
            <ProtectedRoute role="student"><MyApplications /></ProtectedRoute>
          } />
          <Route path="/student/favorites" element={
            <ProtectedRoute role="student"><Favorites /></ProtectedRoute>
          } />
          <Route path="/student/notifications" element={
            <ProtectedRoute role="student"><StudentNotifications /></ProtectedRoute>
          } />

          {/* Club routes */}
          <Route path="/club/register" element={
            <ProtectedRoute role="club"><ClubRegister /></ProtectedRoute>
          } />
          <Route path="/club/dashboard" element={
            <ProtectedRoute role="club"><ClubDashboard /></ProtectedRoute>
          } />
          <Route path="/club/applications" element={
            <ProtectedRoute role="club"><ClubApplications /></ProtectedRoute>
          } />
          <Route path="/club/notifications" element={
            <ProtectedRoute role="club"><ClubNotifications /></ProtectedRoute>
          } />

          {/* Admin routes */}
          <Route path="/admin/dashboard" element={
            <ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>
          } />
          <Route path="/admin/club-review" element={
            <ProtectedRoute role="admin"><ClubReview /></ProtectedRoute>
          } />
          <Route path="/admin/announcements" element={
            <ProtectedRoute role="admin"><Announcements /></ProtectedRoute>
          } />
          <Route path="/admin/club-manage" element={
            <ProtectedRoute role="admin"><ClubManage /></ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
      <ToastContainer />
    </BrowserRouter>
  );
}
