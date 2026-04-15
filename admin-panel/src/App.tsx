import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Verification from './pages/Verification';
import DriversList from './pages/DriversList';
import NotificationsPage from './pages/NotificationsPage';
import FinanceReports from './pages/FinanceReports';
import AdminLayout from './components/AdminLayout';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('admin_token');
  if (!token) return <Navigate to="/login" />;
  return <AdminLayout>{children}</AdminLayout>;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/verification" 
          element={
            <ProtectedRoute>
              <Verification />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/drivers" 
          element={
            <ProtectedRoute>
              <DriversList />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/notifications" 
          element={
            <ProtectedRoute>
              <NotificationsPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/finance" 
          element={
            <ProtectedRoute>
              <FinanceReports />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Router>
  );
}




export default App;
