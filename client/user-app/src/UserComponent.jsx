import React, { useState } from 'react';
import { useMutation, gql } from '@apollo/client';
import { useNavigate } from 'react-router-dom';  // <-- Add this for navigation

const LOGIN_MUTATION = gql`
  mutation Login($username: String!, $password: String!) {
    login(username: $username, password: $password)
  }
`;

const REGISTER_MUTATION = gql`
  mutation Signup($username: String!, $email: String!, $password: String!, $role: UserRole!) {
    signup(username: $username, email: $email, password: $password, role: $role)
  }
`;

function UserComponent() {
  const navigate = useNavigate();  // <-- Initialize navigate

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState('login');
  const [authError, setAuthError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('resident');

  const [login] = useMutation(LOGIN_MUTATION, {
    onCompleted: () => {
      console.log('✅ Login successful, redirecting...');

      // Dispatch custom event
      window.dispatchEvent(new CustomEvent('loginSuccess', { detail: { isLoggedIn: true } }));

      // Remove the navigation since shell-app will handle it
    },
    onError: (error) => setAuthError(error.message || 'Login failed'),
  });

  const [register] = useMutation(REGISTER_MUTATION, {
    onCompleted: () => {
      alert('Registration successful! Please log in.');
      setActiveTab('login');
    },
    onError: (error) => setAuthError(error.message || 'Registration failed'),
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setAuthError('');

    if (activeTab === 'login') {
      if (!username || !password) {
        setAuthError('Username and password are required.');
        setIsSubmitting(false);
        return;
      }
      await login({ variables: { username, password } });
    } else {
      if (!username || !password || !email) {
        setAuthError('Username, email and password are required.');
        setIsSubmitting(false);
        return;
      }
      await register({ variables: { username, email, password, role } });
    }

    setIsSubmitting(false);
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-900 text-white">
      <div className="w-full max-w-md p-8 bg-gray-800 rounded-lg shadow-lg">
        
        {/* Tab Navigation */}
        <div className="flex justify-center space-x-4 mb-6">
          <button
            onClick={() => setActiveTab('login')}
            className={`px-4 py-2 rounded-t-lg ${activeTab === 'login' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400'}`}
          >
            Login
          </button>
          <button
            onClick={() => setActiveTab('signup')}
            className={`px-4 py-2 rounded-t-lg ${activeTab === 'signup' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400'}`}
          >
            Sign Up
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="username" className="block text-lg font-medium">Username</label>
            <input
              id="username"
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full mt-2 p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mb-6">
            <label htmlFor="password" className="block text-lg font-medium">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full mt-2 p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {activeTab === 'signup' && (
            <>
              <div className="mb-4">
                <label htmlFor="email" className="block text-lg font-medium">Email</label>
                <input
                  id="email"
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full mt-2 p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="mb-4">
                <label htmlFor="role" className="block text-lg font-medium">Role</label>
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full mt-2 p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="resident">Resident</option>
                  <option value="business_owner">Business Owner</option>
                  <option value="community_organizer">Community Organizer</option>
                </select>
              </div>
            </>
          )}

          {authError && <div className="text-red-500 mb-4">{authError}</div>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-600"
          >
            {isSubmitting ? 'Authenticating...' : (activeTab === 'login' ? 'Login' : 'Sign Up')}
          </button>
        </form>
      </div>
    </div>
  );
}

export default UserComponent;
