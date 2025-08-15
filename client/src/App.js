import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ConfigProvider } from 'antd';
import koKR from 'antd/locale/ko_KR';
import 'antd/dist/reset.css';
import './App.css';

import Login from './components/Login';
import Dashboard from './components/Dashboard';
import ApprovalList from './components/ApprovalList';
import ApprovalDetail from './components/ApprovalDetail';
import CreateApproval from './components/CreateApproval';
import Layout from './components/Layout';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// 보호된 라우트 컴포넌트
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div>로딩 중...</div>;
  }
  
  return user ? children : <Navigate to="/login" replace />;
};

// 메인 앱 라우터
const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Router>
      <Routes>
        <Route 
          path="/login" 
          element={user ? <Navigate to="/" replace /> : <Login />} 
        />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <SocketProvider>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/approvals" element={<ApprovalList />} />
                    <Route path="/approvals/:id" element={<ApprovalDetail />} />
                    <Route path="/create" element={<CreateApproval />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Layout>
              </SocketProvider>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider 
        locale={koKR}
        theme={{
          token: {
            colorPrimary: '#1890ff',
            borderRadius: 6,
          },
        }}
      >
        <AuthProvider>
          <div className="App">
            <AppRoutes />
          </div>
        </AuthProvider>
      </ConfigProvider>
    </QueryClientProvider>
  );
}

export default App;