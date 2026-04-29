import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import RoomCalendar from './pages/RoomCalendar';
import VehicleCalendar from './pages/VehicleCalendar';
import MyReservations from './pages/MyReservations';
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import RoomManagement from './pages/admin/RoomManagement';
import VehicleManagement from './pages/admin/VehicleManagement';
import CsvImportExport from './pages/admin/CsvImportExport';
import AuditHistory from './pages/admin/AuditHistory';
import Settings from './pages/admin/Settings';
import Impressum from './pages/Impressum';
import Datenschutz from './pages/Datenschutz';

function ProtectedRoute({ children, reqRole }: { children: React.ReactNode, reqRole?: string[] }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex justify-center mt-20">Laden...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (reqRole && !reqRole.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/impressum" element={<Impressum />} />
          <Route path="/datenschutz" element={<Datenschutz />} />
          
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/rooms" element={<RoomCalendar />} />
            <Route path="/vehicles" element={<VehicleCalendar />} />
            <Route path="/my-reservations" element={<MyReservations />} />

            <Route path="/admin" element={<ProtectedRoute reqRole={['Admin']}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute reqRole={['Admin']}><UserManagement /></ProtectedRoute>} />
            <Route path="/admin/rooms" element={<ProtectedRoute reqRole={['Admin']}><RoomManagement /></ProtectedRoute>} />
            <Route path="/admin/vehicles" element={<ProtectedRoute reqRole={['Admin']}><VehicleManagement /></ProtectedRoute>} />
            <Route path="/admin/csv" element={<ProtectedRoute reqRole={['Admin']}><CsvImportExport /></ProtectedRoute>} />
            <Route path="/admin/audit" element={<ProtectedRoute reqRole={['Admin']}><AuditHistory /></ProtectedRoute>} />
            <Route path="/admin/settings" element={<ProtectedRoute reqRole={['Admin']}><Settings /></ProtectedRoute>} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}
