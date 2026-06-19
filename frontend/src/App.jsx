import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/user/Dashboard';
import Submit from './pages/user/Submit';
import SubmissionList from './pages/user/SubmissionList';
import SubmissionDetail from './pages/user/SubmissionDetail';
import AppealForm from './pages/user/AppealForm';
import AppealQueue from './pages/admin/AppealQueue';
import AppealReview from './pages/admin/AppealReview';
import PolicyConfig from './pages/admin/PolicyConfig';
import Analytics from './pages/admin/Analytics';

function UserLayout({ children }) {
  return <ProtectedRoute><Layout>{children}</Layout></ProtectedRoute>;
}

function AdminLayout({ children }) {
  return <ProtectedRoute requireAdmin><Layout>{children}</Layout></ProtectedRoute>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/dashboard"           element={<UserLayout><Dashboard /></UserLayout>} />
          <Route path="/submit"              element={<UserLayout><Submit /></UserLayout>} />
          <Route path="/submissions"         element={<UserLayout><SubmissionList /></UserLayout>} />
          <Route path="/submissions/:id"     element={<UserLayout><SubmissionDetail /></UserLayout>} />
          <Route path="/appeal/:imageId"     element={<UserLayout><AppealForm /></UserLayout>} />

          <Route path="/admin/appeals"       element={<AdminLayout><AppealQueue /></AdminLayout>} />
          <Route path="/admin/appeals/:id"   element={<AdminLayout><AppealReview /></AdminLayout>} />
          <Route path="/admin/policies"      element={<AdminLayout><PolicyConfig /></AdminLayout>} />
          <Route path="/admin/analytics"     element={<AdminLayout><Analytics /></AdminLayout>} />

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
