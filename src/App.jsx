import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage.jsx';
import UserManagement from './pages/UserManagement.jsx';
import DashboardLayout from './components/DashboardLayout.jsx';
import { Toaster } from 'react-hot-toast';
import './App.css';

function PrivateRoute({ children }) {
  const token = localStorage.getItem('admin_token');
  return token ? children : <Navigate to="/login" replace />;
}

function App() {
  return (
    <>
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          <Route path="/users/verified-guards" element={
            <PrivateRoute>
              <DashboardLayout>
                <UserManagement mode="verified" />
              </DashboardLayout>
            </PrivateRoute>
          } />
          
          <Route path="/users/under-review" element={
            <PrivateRoute>
              <DashboardLayout>
                <UserManagement mode="review" />
              </DashboardLayout>
            </PrivateRoute>
          } />

          <Route path="/users/under-training" element={
            <PrivateRoute>
              <DashboardLayout>
                <UserManagement mode="training" />
              </DashboardLayout>
            </PrivateRoute>
          } />
          
          <Route path="/users/clients" element={
            <PrivateRoute>
              <DashboardLayout>
                <UserManagement mode="clients" />
              </DashboardLayout>
            </PrivateRoute>
          } />

          <Route path="*" element={<Navigate to="/users/verified-guards" replace />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
