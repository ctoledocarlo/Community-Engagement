import React, { useState, useEffect } from "react";
import { ApolloClient, InMemoryCache, ApolloProvider, gql, useQuery } from "@apollo/client";
import { motion, AnimatePresence } from "framer-motion";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import confetti from "canvas-confetti";
import './index.css';

import CommunityPostList from "./components/CommunityPostList";
import HelpRequestList from "./components/HelpRequestList";
import ChatBox from "./components/Chatbox";
import AccountSettings from "./components/AccountSettings";
import BusinessProfile from "./components/BusinessProfile";
import EmergencyAlerts from "./components/EmergencyAlerts";
import EventsManagement from "./components/EventsManagement";

// Apollo Client Setup
const client = new ApolloClient({
  uri: "http://localhost:4002/graphql",
  cache: new InMemoryCache(),
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
  },
});

const GET_USER = gql`
  query me {
    me {
      id
      username
      role
    }
  }
`;

// Combined user stats calculation
const calculateUserStats = () => {
  // Retrieve all gamification data
  const helpPoints = parseInt(localStorage.getItem('help_points') || '0');
  const chatXp = parseInt(localStorage.getItem('chat_xp') || '0');
  const communityXp = parseInt(localStorage.getItem('community_xp') || '0');
  
  // Community achievements
  const communityAchievements = JSON.parse(localStorage.getItem('achievements') || '[]');
  
  // Help achievements
  const helpAchievements = JSON.parse(localStorage.getItem('help_achievements') || '[]');
  
  // Combined stats
  const totalPoints = helpPoints + chatXp + communityXp;
  const totalAchievements = (communityAchievements.length + helpAchievements.length);
  
  // Calculate overall level (1-10 scale)
  const level = Math.max(1, Math.min(10, Math.floor(totalPoints / 100) + 1));
  
  // Get title based on level
  const titles = [
    "Newcomer", "Participant", "Helper", "Contributor", 
    "Trusted Member", "Community Leader", "Engagement Pro", 
    "Local Legend", "Community Champion", "Hub Master"
  ];
  
  return {
    totalPoints,
    level,
    title: titles[level - 1] || "Hub Master",
    achievements: totalAchievements,
    nextLevelPoints: level * 100,
    progress: (totalPoints % 100) / 100 * 100
  };
};

const App = ({ me }) => {
  const [selectedPage, setSelectedPage] = useState("Community");
  const { data: userData } = useQuery(GET_USER);
  const [showUserCard, setShowUserCard] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [dailyStreakClaimed, setDailyStreakClaimed] = useState(() => {
    const lastClaimDate = localStorage.getItem('last_daily_claim');
    return lastClaimDate === new Date().toDateString();
  });
  const [showDailyReward, setShowDailyReward] = useState(false);
  
  const userStats = calculateUserStats();

  // Track user activity for daily rewards
  useEffect(() => {
    // Update stats periodically
    const updateStats = () => {
      userStats = calculateUserStats();
    };
    
    // Set interval to check stats
    const interval = setInterval(updateStats, 10000); // every 10 seconds
    
    // Check for daily streak on load
    if (!dailyStreakClaimed) {
      const lastLogin = localStorage.getItem('last_login_date');
      const today = new Date().toDateString();
      
      // If last login was before today, show daily reward
      if (lastLogin !== today) {
        setShowDailyReward(true);
      }
    }
    
    // Set today as last login
    localStorage.setItem('last_login_date', new Date().toDateString());
    
    // Add navigation notification
    addNotification("Welcome to Community Hub! 👋");
    
    return () => clearInterval(interval);
  }, []);
  
  // Track page changes for gamification
  useEffect(() => {
    // Add notification based on page change
    switch(selectedPage) {
      case "Community":
        addNotification("Community Posts loaded! 📝");
        break;
      case "HelpRequest":
        addNotification("Help Requests loaded! 🤝");
        break;
      case "Business":
        addNotification("Business Profile loaded! 🏢");
        break;
      case "Account":
        addNotification("Account Settings loaded! ⚙️");
        break;
      case "Emergency":
        addNotification("Emergency Alerts loaded! 🚨");
        break;
      case "Events":
        addNotification("Events Management loaded! 📅");
        break;
    }
  }, [selectedPage]);
  
  const addNotification = (message) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message }]);
    
    // Remove notification after 4 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(notif => notif.id !== id));
    }, 4000);
  };
  
  const claimDailyReward = () => {
    // Add points for daily login
    const dailyPoints = 25;
    const helpPoints = parseInt(localStorage.getItem('help_points') || '0');
    localStorage.setItem('help_points', (helpPoints + dailyPoints).toString());
    
    // Save claim status
    localStorage.setItem('last_daily_claim', new Date().toDateString());
    
    // Update UI
    setDailyStreakClaimed(true);
    setShowDailyReward(false);
    
    // Update stats
    userStats = calculateUserStats();
    
    // Add notification
    addNotification(`Daily login streak claimed! +${dailyPoints} pts 🎉`);
    
    // Celebration effect
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.3 }
    });
  };

  // Function to format role for display
  const formatRole = (role) => {
    if (!role) return "";
    return role.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <ApolloProvider client={client}>
      <Router>
        <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white">
          {/* Notification System */}
          <div className="fixed top-4 right-4 z-50 space-y-2">
            <AnimatePresence>
              {notifications.map(notification => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 50 }}
                  className="bg-gray-800 border-l-4 border-blue-500 text-white px-4 py-3 shadow-lg rounded-md"
                >
                  {notification.message}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          
          <Routes>
            <Route path="/account" element={<AccountSettings me={userData?.me} />} />
            <Route path="/business-profile" element={<BusinessProfile me={userData?.me} />} />
            <Route path="/" element={
              <>
                {/* Daily Reward Modal */}
                <AnimatePresence>
                  {showDailyReward && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
                    >
                      <motion.div
                        initial={{ scale: 0.9 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0.9 }}
                        className="bg-gray-800 rounded-xl p-8 max-w-md border-2 border-yellow-500"
                      >
                        <h2 className="text-2xl font-bold text-center mb-4">Daily Login Reward! 🎁</h2>
                        <div className="flex justify-center mb-6">
                          <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-4xl">
                            🔥
                          </div>
                        </div>
                        <p className="text-center mb-6">
                          Welcome back to Community Hub! Claim your daily reward to keep your streak going!
                        </p>
                        <div className="text-center mb-6">
                          <span className="text-2xl font-bold text-yellow-400">+25 points</span>
                        </div>
                        <button
                          onClick={claimDailyReward}
                          className="w-full py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 rounded-lg font-bold text-lg shadow-lg transform transition hover:scale-105 active:scale-95"
                        >
                          Claim Reward
                        </button>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {/* User Profile Card */}
                <AnimatePresence>
                  {showUserCard && (
                    <motion.div
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="fixed top-20 right-4 z-40 bg-gray-800 rounded-xl p-5 shadow-xl border border-blue-600 w-80"
                    >
                      <div className="flex items-center mb-4">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold mr-3">
                          {userData?.me?.username ? userData.me.username.charAt(0).toUpperCase() : "U"}
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">{userData?.me?.username || "User"}</h3>
                          <p className="text-blue-400 text-sm">{formatRole(userData?.me?.role)}</p>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-1">
                          <span>Level {userStats.level}</span>
                          <span>{userStats.totalPoints}/{userStats.nextLevelPoints} points</span>
                        </div>
                        <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                          <motion.div 
                            className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${userStats.progress}%` }}
                            transition={{ duration: 0.5 }}
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 mb-4">
                        <div className="bg-gray-700 rounded-lg p-3 text-center">
                          <p className="text-lg font-bold text-yellow-400">{userStats.totalPoints}</p>
                          <p className="text-xs text-gray-300">Total Points</p>
                        </div>
                        <div className="bg-gray-700 rounded-lg p-3 text-center">
                          <p className="text-lg font-bold text-green-400">{userStats.achievements}</p>
                          <p className="text-xs text-gray-300">Achievements</p>
                        </div>
                      </div>

                      {/* Business Profile Section */}
                      {userData?.me?.role === 'business_owner' && (
                        <div className="mb-4 p-3 bg-gradient-to-r from-blue-900 to-purple-900 rounded-lg">
                          <h4 className="text-sm font-bold text-white mb-2">Business Owner Features</h4>
                          <button 
                            onClick={() => {
                              setSelectedPage("Business");
                              setShowUserCard(false);
                            }}
                            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition flex items-center justify-center gap-2"
                          >
                            <span>🏢</span> Manage Business Profile
                          </button>
                        </div>
                      )}
                      
                      <div className="space-y-2">
                        <button 
                          onClick={() => {
                            setSelectedPage("Account");
                            setShowUserCard(false);
                          }}
                          className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition flex items-center justify-center gap-2"
                        >
                          <span>⚙️</span> Account Settings
                        </button>
                        <button 
                          onClick={() => setShowUserCard(false)}
                          className="w-full py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition"
                        >
                          Close
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Header with navigation */}
                <div className="max-w-7xl mx-auto px-4 py-4">
                  <div className="flex justify-between items-center">
                    {/* Left side - Title and Navigation */}
                    <div className="flex items-center space-x-6">
                      <motion.div 
                        whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                        transition={{ duration: 0.5 }}
                        className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500"
                      >
                        Community Hub
                      </motion.div>
                      
                      <div className="hidden md:flex space-x-3">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className={`px-4 py-2 rounded-lg text-white font-medium transition ${
                            selectedPage === "Community" 
                              ? "bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg" 
                              : "bg-gray-700 hover:bg-gray-600"
                          }`}
                          onClick={() => setSelectedPage("Community")}
                        >
                          <span className="mr-2">📝</span> Community Posts
                        </motion.button>

                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className={`px-4 py-2 rounded-lg text-white font-medium transition ${
                            selectedPage === "HelpRequest" 
                              ? "bg-gradient-to-r from-purple-600 to-purple-700 shadow-lg" 
                              : "bg-gray-700 hover:bg-gray-600"
                          }`}
                          onClick={() => setSelectedPage("HelpRequest")}
                        >
                          <span className="mr-2">🤝</span> Help Requests
                        </motion.button>

                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className={`px-4 py-2 rounded-lg text-white font-medium transition ${
                            selectedPage === "Emergency" 
                              ? "bg-gradient-to-r from-red-600 to-red-700 shadow-lg" 
                              : "bg-gray-700 hover:bg-gray-600"
                          }`}
                          onClick={() => setSelectedPage("Emergency")}
                        >
                          <span className="mr-2">🚨</span> Emergency
                        </motion.button>

                        {/* Role-specific navigation items */}
                        {userData?.me?.role === 'business_owner' && (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={`px-4 py-2 rounded-lg text-white font-medium transition ${
                              selectedPage === "Business" 
                                ? "bg-gradient-to-r from-green-600 to-green-700 shadow-lg" 
                                : "bg-gray-700 hover:bg-gray-600"
                            }`}
                            onClick={() => setSelectedPage("Business")}
                          >
                            <span className="mr-2">🏢</span> Business Profile
                          </motion.button>
                        )}

                        {userData?.me?.role === 'community_organizer' && (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={`px-4 py-2 rounded-lg text-white font-medium transition ${
                              selectedPage === "Events" 
                                ? "bg-gradient-to-r from-purple-600 to-purple-700 shadow-lg" 
                                : "bg-gray-700 hover:bg-gray-600"
                            }`}
                            onClick={() => setSelectedPage("Events")}
                          >
                            <span className="mr-2">📅</span> Events
                          </motion.button>
                        )}
                      </div>
                    </div>

                    {/* Right side - User Profile */}
                    <motion.div 
                      whileHover={{ scale: 1.05 }}
                      onClick={() => setShowUserCard(!showUserCard)}
                      className="flex items-center bg-gray-700 rounded-full px-3 py-1 cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold mr-2">
                        {userStats.level}
                      </div>
                      <div className="hidden sm:block">
                        <p className="text-xs">{formatRole(userData?.me?.role)}</p>
                        <p className="text-xs text-yellow-400 font-medium">{userStats.totalPoints} pts</p>
                      </div>
                      <div className="ml-2 text-xs">
                        <span className="text-yellow-400">
                          {showUserCard ? "▲" : "▼"}
                        </span>
                      </div>
                    </motion.div>
                  </div>

                  {/* Mobile Navigation */}
                  <div className="md:hidden flex justify-center space-x-2 mt-4">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`px-3 py-2 rounded-lg text-white font-medium transition ${
                        selectedPage === "Community" 
                          ? "bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg" 
                          : "bg-gray-700 hover:bg-gray-600"
                      }`}
                      onClick={() => setSelectedPage("Community")}
                    >
                      <span>📝</span>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`px-3 py-2 rounded-lg text-white font-medium transition ${
                        selectedPage === "HelpRequest" 
                          ? "bg-gradient-to-r from-purple-600 to-purple-700 shadow-lg" 
                          : "bg-gray-700 hover:bg-gray-600"
                      }`}
                      onClick={() => setSelectedPage("HelpRequest")}
                    >
                      <span>🤝</span>
                    </motion.button>

                    {userData?.me?.role === 'business_owner' && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-3 py-2 rounded-lg text-white font-medium transition bg-gray-700 hover:bg-gray-600"
                        onClick={() => window.location.href = '/business-profile'}
                      >
                        <span>🏢</span>
                      </motion.button>
                    )}
                  </div>
                </div>

                {/* Main content area */}
                <div className="container mx-auto px-4 py-8">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={selectedPage}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      {selectedPage === "Community" && <CommunityPostList me={userData?.me} />}
                      {selectedPage === "HelpRequest" && <HelpRequestList me={userData?.me} />}
                      {selectedPage === "Business" && <BusinessProfile me={userData?.me} />}
                      {selectedPage === "Account" && <AccountSettings me={userData?.me} />}
                      {selectedPage === "Emergency" && <EmergencyAlerts me={userData?.me} />}
                      {selectedPage === "Events" && <EventsManagement me={userData?.me} />}
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Chat Box */}
                <ChatBox me={userData?.me} />

                {/* Bottom Navigation */}
                <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-4">
                  <button
                    onClick={() => setSelectedPage("Community")}
                    className={`px-6 py-2 rounded-full ${
                      selectedPage === "Community" ? "bg-blue-600" : "bg-gray-700"
                    }`}
                  >
                    Community
                  </button>
                  <button
                    onClick={() => setSelectedPage("HelpRequest")}
                    className={`px-6 py-2 rounded-full ${
                      selectedPage === "HelpRequest" ? "bg-blue-600" : "bg-gray-700"
                    }`}
                  >
                    Help
                  </button>
                  <button
                    onClick={() => setSelectedPage("Emergency")}
                    className={`px-6 py-2 rounded-full ${
                      selectedPage === "Emergency" ? "bg-red-600" : "bg-gray-700"
                    }`}
                  >
                    Emergency
                  </button>
                  {userData?.me?.role === 'business_owner' && (
                    <button
                      onClick={() => setSelectedPage("Business")}
                      className={`px-6 py-2 rounded-full ${
                        selectedPage === "Business" ? "bg-blue-600" : "bg-gray-700"
                      }`}
                    >
                      Business
                    </button>
                  )}
                  {userData?.me?.role === 'community_organizer' && (
                    <button
                      onClick={() => setSelectedPage("Events")}
                      className={`px-6 py-2 rounded-full ${
                        selectedPage === "Events" ? "bg-purple-600" : "bg-gray-700"
                      }`}
                    >
                      Events
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedPage("Account")}
                    className={`px-6 py-2 rounded-full ${
                      selectedPage === "Account" ? "bg-blue-600" : "bg-gray-700"
                    }`}
                  >
                    Account
                  </button>
                </div>
              </>
            } />
          </Routes>
        </div>
      </Router>
    </ApolloProvider>
  );
}

export default App;