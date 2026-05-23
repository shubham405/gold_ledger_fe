import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ScrollManager } from './components/ScrollManager';
import { AuthLayout } from './components/AuthLayout';
import { Layout } from './components/Layout';
import { GuestRoute } from './components/GuestRoute';
import { ProtectedRoute } from './components/ProtectedRoute';
import { RootRedirect } from './components/RootRedirect';
import { AuthProvider } from './context/AuthContext';
import { BorrowerDetail } from './pages/BorrowerDetail';
import { Borrowers } from './pages/Borrowers';
import { Dashboard } from './pages/Dashboard';
import { LoanDetail } from './pages/LoanDetail';
import { Loans } from './pages/Loans';
import { ForgotPassword } from './pages/ForgotPassword';
import { Login } from './pages/Login';
import { RegisterAccount } from './pages/RegisterAccount';
import { RegisterShop } from './pages/RegisterShop';
import { ResetPassword } from './pages/ResetPassword';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollManager />
        <Routes>
          <Route
            element={
              <GuestRoute>
                <AuthLayout />
              </GuestRoute>
            }
          >
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<RegisterShop />} />
            <Route path="/register/account" element={<RegisterAccount />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
          </Route>

          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="/borrowers" element={<Borrowers />} />
            <Route path="/borrowers/:id" element={<BorrowerDetail />} />
            <Route path="/loans" element={<Loans />} />
            <Route path="/loans/:id" element={<LoanDetail />} />
          </Route>

          <Route path="*" element={<RootRedirect />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
