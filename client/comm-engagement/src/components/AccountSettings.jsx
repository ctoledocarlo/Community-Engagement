import React, { useState } from 'react';
import { useMutation, gql } from '@apollo/client';
import { motion } from 'framer-motion';

const UPDATE_USER = gql`
  mutation UpdateUser($name: String, $email: String, $currentPassword: String, $newPassword: String) {
    updateUser(name: $name, email: $email, currentPassword: $currentPassword, newPassword: $newPassword) {
      id
      name
      email
    }
  }
`;

const AccountSettings = ({ me }) => {
  const [form, setForm] = useState({
    name: me?.name || '',
    email: me?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [updateUser, { loading }] = useMutation(UPDATE_USER, {
    onCompleted: () => {
      alert('Profile updated successfully!');
      // Clear sensitive fields
      setForm(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
    },
    onError: (error) => {
      alert(error.message);
    }
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate passwords match if changing password
    if (form.newPassword && form.newPassword !== form.confirmPassword) {
      alert('New passwords do not match!');
      return;
    }

    // Only include fields that have values
    const variables = {};
    if (form.name !== me?.name) variables.name = form.name;
    if (form.email !== me?.email) variables.email = form.email;
    if (form.newPassword) {
      variables.currentPassword = form.currentPassword;
      variables.newPassword = form.newPassword;
    }

    await updateUser({ variables });
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-800 rounded-xl p-6 shadow-xl border border-gray-700"
      >
        <h1 className="text-2xl font-bold text-white mb-6">Account Settings</h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Profile Section */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">Profile Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Name</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Password Section */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">Change Password</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Current Password</label>
                <input
                  type="password"
                  name="currentPassword"
                  value={form.currentPassword}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">New Password</label>
                <input
                  type="password"
                  name="newPassword"
                  value={form.newPassword}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setForm({
                name: me?.name || '',
                email: me?.email || '',
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
              })}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition flex items-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : 'Save Changes'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default AccountSettings; 