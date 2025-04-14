// shell-app/src/App.jsx
import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useQuery, gql, useMutation } from '@apollo/client';
import { Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

const UserAuth = lazy(() => import('userAuth/App'));
const CommEngagementApp = lazy(() => import('commEngagement/App'));
const ChatBox = lazy(() => import('commEngagement/ChatBox'));

const CURRENT_USER_QUERY = gql`
  query me {
    me {
      id
      username
      role
    }
  }
`;

const LOGOUT_MUTATION = gql`
  mutation Logout {
    logout
  }
`;

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [logout] = useMutation(LOGOUT_MUTATION, {
    onCompleted: () => {
      console.log("✅ Logged out successfully");
      setIsLoggedIn(false);
    },
    onError: (error) => {
      console.error("Error logging out:", error);
    }
  });

  const { loading, error, data, refetch } = useQuery(CURRENT_USER_QUERY, {
    fetchPolicy: 'network-only',
    onCompleted: (data) => {
      setIsLoggedIn(!!data?.me);
    }
  });

  useEffect(() => {
    const handleLoginSuccess = async (event) => {
      console.log('✅ Received loginSuccess event in ShellApp: ' + event.detail.isLoggedIn);
      await refetch();
      setIsLoggedIn(true);
    };

    const handleLogoutSuccess = async (event) => {
      console.log('✅ Received logoutSuccess event in ShellApp: ' + event.detail.isLoggedIn);
      await logout();
      setIsLoggedIn(false);
    };

    window.addEventListener('loginSuccess', handleLoginSuccess);
    window.addEventListener('logoutSuccess', handleLogoutSuccess);

    return () => {
      window.removeEventListener('loginSuccess', handleLoginSuccess);
      window.removeEventListener('logoutSuccess', handleLogoutSuccess);
    };
  }, [refetch, logout]);

  if (loading) return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-white text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <p>Loading...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-red-500 text-center">
        <p className="text-xl mb-2">Error!</p>
        <p>{error.message}</p>
      </div>
    </div>
  );

  return (
    <div className="App min-h-screen bg-gray-900">
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p>Loading...</p>
          </div>
        </div>
      }>
        <Routes>
          <Route 
            path="/" 
            element={
              isLoggedIn ? 
                <CommEngagementApp me={data?.me} /> : 
                <Navigate to="/login" replace />
            } 
          />
          <Route 
            path="/login" 
            element={
              !isLoggedIn ? 
                <UserAuth /> : 
                <Navigate to="/" replace />
            } 
          />
        </Routes>
        {isLoggedIn && data?.me && (
          <Suspense fallback={
            <div className="fixed bottom-4 right-4 bg-gray-800 p-4 rounded-lg shadow-lg">
              <div className="animate-pulse">Loading chat...</div>
            </div>
          }>
            <ChatBox me={data.me} />
          </Suspense>
        )}
      </Suspense>
    </div>
  );
}

export default App;
