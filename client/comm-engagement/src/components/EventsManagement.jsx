import React, { useState } from 'react';
import { useMutation, useQuery, gql } from '@apollo/client';
import { motion, AnimatePresence } from 'framer-motion';

const GET_EVENTS = gql`
  query GetEvents {
    events {
      id
      title
      description
      date
      location
      organizer
      category
      maxParticipants
      currentParticipants
      volunteers {
        id
        username
        role
      }
      suggestedVolunteers {
        id
        username
        matchScore
        previousEvents
      }
    }
  }
`;

const CREATE_EVENT = gql`
  mutation CreateEvent(
    $title: String!
    $description: String!
    $date: String!
    $location: String!
    $category: String!
    $maxParticipants: Int!
  ) {
    createEvent(
      title: $title
      description: $description
      date: $date
      location: $location
      category: $category
      maxParticipants: $maxParticipants
    ) {
      id
      title
    }
  }
`;

const ASSIGN_VOLUNTEER = gql`
  mutation AssignVolunteer($eventId: ID!, $volunteerId: ID!) {
    assignVolunteer(eventId: $eventId, volunteerId: $volunteerId) {
      id
      volunteers {
        id
        username
      }
    }
  }
`;

const GET_AI_RECOMMENDATIONS = gql`
  query GetAIRecommendations($eventId: ID!) {
    getAIRecommendations(eventId: $eventId) {
      bestTime
      suggestedVolunteers {
        id
        username
        matchScore
        previousEvents
      }
      expectedParticipation
      similarEvents {
        id
        title
        participation
      }
    }
  }
`;

const EventsManagement = ({ me }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    date: '',
    location: '',
    category: 'workshop',
    maxParticipants: 20
  });

  const { loading, error, data, refetch } = useQuery(GET_EVENTS);
  const [createEvent] = useMutation(CREATE_EVENT, {
    onCompleted: () => {
      setIsCreating(false);
      setForm({
        title: '',
        description: '',
        date: '',
        location: '',
        category: 'workshop',
        maxParticipants: 20
      });
      refetch();
    }
  });
  const [assignVolunteer] = useMutation(ASSIGN_VOLUNTEER);

  const { data: aiData, loading: aiLoading } = useQuery(GET_AI_RECOMMENDATIONS, {
    variables: { eventId: selectedEvent?.id },
    skip: !selectedEvent
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await createEvent({
      variables: {
        ...form,
        maxParticipants: parseInt(form.maxParticipants)
      }
    });
  };

  const handleAssignVolunteer = async (eventId, volunteerId) => {
    await assignVolunteer({
      variables: {
        eventId,
        volunteerId
      }
    });
    refetch();
  };

  if (loading) return <div className="text-center">Loading...</div>;
  if (error) return <div className="text-center text-red-500">Error loading events</div>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Event Management</h1>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsCreating(!isCreating)}
          className="px-4 py-2 bg-blue-600 rounded-lg"
        >
          {isCreating ? 'Cancel' : 'Create Event'}
        </motion.button>
      </div>

      {/* Create Event Form */}
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
                <label className="block text-sm font-medium mb-1">Event Title</label>
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Date</label>
                  <input
                    type="datetime-local"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 rounded-lg"
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
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 rounded-lg"
                  >
                    <option value="workshop">Workshop</option>
                    <option value="meetup">Meetup</option>
                    <option value="cleanup">Clean-up Drive</option>
                    <option value="fundraiser">Fundraiser</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Max Participants</label>
                  <input
                    type="number"
                    min="1"
                    value={form.maxParticipants}
                    onChange={(e) => setForm({ ...form, maxParticipants: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 rounded-lg"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition"
              >
                Create Event
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Events List */}
      <div className="grid gap-6">
        {data?.events?.map((event) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-gray-800 rounded-xl p-6"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-bold">{event.title}</h2>
                <p className="text-gray-300 mt-1">{event.description}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm ${
                event.currentParticipants >= event.maxParticipants
                  ? 'bg-red-900 text-red-300'
                  : 'bg-green-900 text-green-300'
              }`}>
                {event.currentParticipants}/{event.maxParticipants} participants
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-400">Date & Time</p>
                <p className="text-white">{new Date(event.date).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Location</p>
                <p className="text-white">{event.location}</p>
              </div>
            </div>

            {/* Volunteers Section */}
            <div className="mt-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium">Volunteers</h3>
                <button
                  onClick={() => {
                    setSelectedEvent(event);
                    setShowRecommendations(true);
                  }}
                  className="text-sm text-blue-400 hover:text-blue-300"
                >
                  View AI Recommendations
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {event.volunteers?.map((volunteer) => (
                  <div
                    key={volunteer.id}
                    className="bg-gray-700 px-3 py-1 rounded-full text-sm"
                  >
                    {volunteer.username}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* AI Recommendations Modal */}
      <AnimatePresence>
        {showRecommendations && selectedEvent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-gray-800 rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">AI Recommendations</h2>
                <button
                  onClick={() => setShowRecommendations(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              {aiLoading ? (
                <div className="text-center py-4">Loading recommendations...</div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-medium mb-2">Suggested Time</h3>
                    <p className="text-green-400">{aiData?.getAIRecommendations?.bestTime}</p>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2">Expected Participation</h3>
                    <p className="text-blue-400">
                      {aiData?.getAIRecommendations?.expectedParticipation} participants
                    </p>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2">Suggested Volunteers</h3>
                    <div className="space-y-2">
                      {aiData?.getAIRecommendations?.suggestedVolunteers?.map((volunteer) => (
                        <div
                          key={volunteer.id}
                          className="bg-gray-700 p-3 rounded-lg flex justify-between items-center"
                        >
                          <div>
                            <p className="font-medium">{volunteer.username}</p>
                            <p className="text-sm text-gray-400">
                              {volunteer.previousEvents} previous events
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-yellow-400">
                              {Math.round(volunteer.matchScore * 100)}% match
                            </span>
                            <button
                              onClick={() => handleAssignVolunteer(selectedEvent.id, volunteer.id)}
                              className="px-3 py-1 bg-blue-600 rounded-lg text-sm hover:bg-blue-700"
                            >
                              Assign
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2">Similar Events</h3>
                    <div className="space-y-2">
                      {aiData?.getAIRecommendations?.similarEvents?.map((event) => (
                        <div
                          key={event.id}
                          className="bg-gray-700 p-3 rounded-lg flex justify-between items-center"
                        >
                          <p>{event.title}</p>
                          <span className="text-sm text-gray-400">
                            {event.participation} participants
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EventsManagement; 