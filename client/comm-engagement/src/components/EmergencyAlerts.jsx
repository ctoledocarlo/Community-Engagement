import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, gql } from '@apollo/client';
import { motion, AnimatePresence } from 'framer-motion';

const GET_ALERTS = gql`
  query GetAlerts {
    emergencyAlerts {
      id
      type
      title
      description
      location
      status
      reporter {
        id
        username
      }
      createdAt
      updatedAt
      nearbyUsers {
        id
        username
        distance
      }
    }
  }
`;

const CREATE_ALERT = gql`
  mutation CreateAlert($type: String!, $title: String!, $description: String!, $location: String!) {
    createEmergencyAlert(
      type: $type
      title: $title
      description: $description
      location: $location
    ) {
      id
      title
    }
  }
`;

const UPDATE_ALERT_STATUS = gql`
  mutation UpdateAlertStatus($id: ID!, $status: String!) {
    updateEmergencyAlertStatus(id: $id, status: $status) {
      id
      status
    }
  }
`;

const ALERT_SUBSCRIPTION = gql`
  subscription OnNewAlert {
    newEmergencyAlert {
      id
      type
      title
      description
      location
      status
      reporter {
        username
      }
      createdAt
    }
  }
`;

const EmergencyAlerts = ({ me }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [form, setForm] = useState({
    type: 'missing_pet',
    title: '',
    description: '',
    location: ''
  });

  const { loading, error, data, subscribeToMore } = useQuery(GET_ALERTS);
  const [createAlert] = useMutation(CREATE_ALERT, {
    onCompleted: () => {
      setIsCreating(false);
      setForm({
        type: 'missing_pet',
        title: '',
        description: '',
        location: ''
      });
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
    }
  });
  const [updateStatus] = useMutation(UPDATE_ALERT_STATUS);

  // Subscribe to new alerts
  useEffect(() => {
    const unsubscribe = subscribeToMore({
      document: ALERT_SUBSCRIPTION,
      updateQuery: (prev, { subscriptionData }) => {
        if (!subscriptionData.data) return prev;
        const newAlert = subscriptionData.data.newEmergencyAlert;

        // Show browser notification if supported
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('New Emergency Alert', {
            body: newAlert.title,
            icon: '/alert-icon.png'
          });
        }

        return {
          emergencyAlerts: [newAlert, ...prev.emergencyAlerts]
        };
      }
    });

    return () => unsubscribe();
  }, [subscribeToMore]);

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await createAlert({
      variables: form
    });
  };

  const handleStatusUpdate = async (id, status) => {
    await updateStatus({
      variables: {
        id,
        status
      }
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-red-900 text-red-300';
      case 'resolved':
        return 'bg-green-900 text-green-300';
      case 'investigating':
        return 'bg-yellow-900 text-yellow-300';
      default:
        return 'bg-gray-900 text-gray-300';
    }
  };

  if (loading) return <div className="text-center">Loading...</div>;
  if (error) return <div className="text-center text-red-500">Error loading alerts</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Success Notification */}
      <AnimatePresence>
        {showNotification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50"
          >
            Alert created successfully! Notifying nearby residents...
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Emergency Alerts</h1>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsCreating(!isCreating)}
          className="px-4 py-2 bg-red-600 rounded-lg"
        >
          {isCreating ? 'Cancel' : 'Report Emergency'}
        </motion.button>
      </div>

      {/* Create Alert Form */}
      <AnimatePresence>
        {isCreating && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-8"
          >
            <form onSubmit={handleSubmit} className="bg-gray-800 rounded-xl p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Emergency Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 rounded-lg"
                >
                  <option value="missing_pet">Missing Pet</option>
                  <option value="safety_hazard">Safety Hazard</option>
                  <option value="suspicious_activity">Suspicious Activity</option>
                  <option value="medical_emergency">Medical Emergency</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 rounded-lg h-32"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Location</label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 rounded-lg"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-red-600 rounded-lg hover:bg-red-700 transition"
              >
                Create Alert
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Alerts List */}
      <div className="space-y-4">
        {data?.emergencyAlerts?.map((alert) => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-gray-800 rounded-xl p-6"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-1 rounded text-xs ${
                    alert.type === 'missing_pet' ? 'bg-blue-900 text-blue-300' :
                    alert.type === 'safety_hazard' ? 'bg-yellow-900 text-yellow-300' :
                    alert.type === 'suspicious_activity' ? 'bg-purple-900 text-purple-300' :
                    alert.type === 'medical_emergency' ? 'bg-red-900 text-red-300' :
                    'bg-gray-900 text-gray-300'
                  }`}>
                    {alert.type.replace('_', ' ').toUpperCase()}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs ${getStatusColor(alert.status)}`}>
                    {alert.status.toUpperCase()}
                  </span>
                </div>
                <h2 className="text-xl font-bold">{alert.title}</h2>
                <p className="text-gray-300 mt-1">{alert.description}</p>
              </div>
              {alert.reporter.id === me.id && (
                <select
                  value={alert.status}
                  onChange={(e) => handleStatusUpdate(alert.id, e.target.value)}
                  className="px-2 py-1 bg-gray-700 rounded-lg text-sm"
                >
                  <option value="active">Active</option>
                  <option value="investigating">Investigating</option>
                  <option value="resolved">Resolved</option>
                </select>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-400">Location</p>
                <p className="text-white">{alert.location}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Reported by</p>
                <p className="text-white">{alert.reporter.username}</p>
              </div>
            </div>

            {alert.nearbyUsers?.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-gray-400 mb-2">Nearby Residents Notified</p>
                <div className="flex flex-wrap gap-2">
                  {alert.nearbyUsers.map((user) => (
                    <div
                      key={user.id}
                      className="bg-gray-700 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                    >
                      <span>{user.username}</span>
                      <span className="text-gray-400">({user.distance}m away)</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default EmergencyAlerts; 