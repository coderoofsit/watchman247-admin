import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage.jsx';
import UserManagement from './pages/UserManagement.jsx';
import CalendarPage from './pages/CalendarPage.jsx';
import InboxPage from './pages/InboxPage.jsx';
import HomePage from './pages/HomePage.jsx';
import LiveGuardServicePage from './pages/LiveGuardServicePage.jsx';
import PlaceholderPage from './pages/PlaceholderPage.jsx';
import DashboardLayout from './components/DashboardLayout.jsx';
import { Toaster } from 'react-hot-toast';
import './App.css';

function PrivateRoute({ children }) {
  const token = localStorage.getItem('admin_token');
  return token ? children : <Navigate to="/login" replace />;
}

function LayoutRoute({ children }) {
  return (
    <PrivateRoute>
      <DashboardLayout>{children}</DashboardLayout>
    </PrivateRoute>
  );
}

function App() {
  return (
    <>
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route
            path="/home"
            element={
              <LayoutRoute>
                <HomePage />
              </LayoutRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <LayoutRoute>
                <PlaceholderPage title="Dashboard" />
              </LayoutRoute>
            }
          />
          <Route
            path="/live-guard-service"
            element={
              <LayoutRoute>
                <LiveGuardServicePage />
              </LayoutRoute>
            }
          />
          <Route
            path="/invoices"
            element={
              <LayoutRoute>
                <PlaceholderPage title="Invoices" />
              </LayoutRoute>
            }
          />
          <Route
            path="/chat-room"
            element={
              <LayoutRoute>
                <PlaceholderPage title="Chat Room" />
              </LayoutRoute>
            }
          />
          <Route
            path="/help-center"
            element={
              <LayoutRoute>
                <PlaceholderPage title="Help Center" />
              </LayoutRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <LayoutRoute>
                <PlaceholderPage title="Reports" />
              </LayoutRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <LayoutRoute>
                <PlaceholderPage title="Settings" />
              </LayoutRoute>
            }
          />

          <Route
            path="/inbox"
            element={
              <LayoutRoute>
                <InboxPage />
              </LayoutRoute>
            }
          />

          <Route
            path="/calendar"
            element={
              <LayoutRoute>
                <CalendarPage />
              </LayoutRoute>
            }
          />

          <Route
            path="/users/verified-guards"
            element={
              <LayoutRoute>
                <UserManagement mode="verified" />
              </LayoutRoute>
            }
          />

          <Route
            path="/users/under-review"
            element={
              <LayoutRoute>
                <UserManagement mode="review" />
              </LayoutRoute>
            }
          />

          <Route
            path="/users/under-training"
            element={
              <LayoutRoute>
                <UserManagement mode="training" />
              </LayoutRoute>
            }
          />

          <Route
            path="/users/clients"
            element={
              <LayoutRoute>
                <UserManagement mode="clients" />
              </LayoutRoute>
            }
          />

          <Route
            path="/complaints"
            element={<Navigate to="/inbox?tab=complaints" replace />}
          />

          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
