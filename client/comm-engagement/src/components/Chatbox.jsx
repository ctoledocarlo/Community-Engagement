import React, { useState, useEffect } from "react";
import { useLazyQuery, gql } from "@apollo/client";

const COMMUNITY_AI_QUERY = gql`
  query CommunityAIQuery($question: String!, $sessionId: String!) {
    communityAIQuery(question: $question, sessionId: $sessionId) {
      answer
      followUp
      question
      sessionId
    }
  }
`;

const ChatBox = ({ me }) => {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hi! How can I help you today?",
      followUp: "What are people talking about?\nWhat do people need help with?",
    },
  ]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState(me?.id || "guest-session");
  const [isMinimized, setIsMinimized] = useState(false);
  
  // Gamification UI state
  const [points, setPoints] = useState(0);
  const [streak, setStreak] = useState(1);
  const [level, setLevel] = useState(1);
  const [showReward, setShowReward] = useState(false);

  // Simulate point increase when sending/receiving messages
  useEffect(() => {
    if (messages.length > 1) {
      // Add points for each message beyond the initial one
      setPoints(messages.length * 5);
      
      // Update level based on points
      setLevel(Math.max(1, Math.floor(messages.length / 3)));
      
      // Show reward animation for certain milestones
      if (messages.length % 3 === 0) {
        setShowReward(true);
        setTimeout(() => setShowReward(false), 2000);
      }
    }
  }, [messages.length]);

  const [fetchAIResponse, { loading }] = useLazyQuery(COMMUNITY_AI_QUERY, {
    fetchPolicy: "no-cache",
    onCompleted: (data) => {
      const res = data.communityAIQuery;
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: res.answer,
          followUp: res.followUp,
        },
      ]);
      setSessionId(res.sessionId);
    },
    onError: (err) => {
      console.error("AI Query failed:", err.message);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, something went wrong while talking to the AI.",
        },
      ]);
    },
  });

  const sendMessage = (text) => {
    const messageText = text || input;
    if (!messageText.trim()) return;

    setMessages((prev) => [...prev, { role: "user", content: messageText }]);
    setInput("");

    fetchAIResponse({
      variables: {
        question: messageText,
        sessionId,
      },
    });
  };

  const handleFollowUpClick = (question) => {
    sendMessage(question);
  };

  // Calculate progress to next level
  const levelProgress = ((points % 15) / 15) * 100;
  
  // Determine badges based on level
  const badges = [];
  if (level >= 1) badges.push("🌱"); // Beginner
  if (level >= 2) badges.push("🌟"); // Intermediate
  if (level >= 3) badges.push("🏆"); // Advanced
  if (level >= 4) badges.push("👑"); // Expert
  if (level >= 5) badges.push("🔮"); // Master

  return (
    <div className="fixed bottom-4 right-4 w-80 bg-gray-800 rounded-2xl shadow-xl flex flex-col overflow-hidden border border-gray-700 z-50">
      {/* Header with gamification elements */}
      <div className="bg-gray-700 text-white px-4 py-2">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Agentic AI Chat</h3>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="bg-blue-600 text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
                {level}
              </span>
              <span className="text-yellow-400 text-xs font-semibold">{points} pts</span>
              <div className="bg-orange-600 text-white text-xs rounded-full px-2 py-0.5 flex items-center">
                🔥 {streak}
              </div>
            </div>
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="text-gray-300 hover:text-white focus:outline-none w-6 h-6 flex items-center justify-center bg-gray-600 rounded-full hover:bg-gray-500"
            >
              {isMinimized ? "+" : "−"}
            </button>
          </div>
        </div>
        
        {/* Level Progress Bar */}
        {!isMinimized && (
          <>
            <div className="w-full bg-gray-600 h-1.5 rounded-full mt-1 overflow-hidden">
              <div 
                className="bg-blue-500 h-1.5 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${levelProgress}%` }}
              />
            </div>
            
            {/* Badges */}
            {badges.length > 0 && (
              <div className="flex gap-1 mt-1">
                {badges.map((badge, idx) => (
                  <span key={idx} className="text-sm" title={`Level ${idx + 1} badge`}>
                    {badge}
                  </span>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Minimize/Maximize Animation */}
      <div 
        className={`transition-all duration-300 ease-in-out ${
          isMinimized ? 'h-0' : 'h-[80vh]'
        } flex flex-col`}
      >
        {/* Reward Animation */}
        {showReward && (
          <div className="absolute top-14 left-0 right-0 mx-auto w-max bg-yellow-500 text-black font-bold py-1 px-3 rounded-full shadow-lg animate-bounce z-10">
            +5 points! 🎉
          </div>
        )}

        {/* Chat Messages */}
        <div className="flex-1 p-3 overflow-y-auto space-y-4 bg-gray-900">
          {messages.map((msg, idx) => (
            <div key={idx} className="space-y-1">
              <div
                className={`p-2 rounded-md text-sm max-w-[90%] break-words ${
                  msg.role === "assistant"
                    ? "bg-blue-950 text-left text-white"
                    : "bg-blue-900 text-right text-white self-end"
                }`}
              >
                {msg.content}
                {msg.role === "user" && (
                  <span className="text-xs text-blue-300 block mt-1">+5 pts</span>
                )}
              </div>

              {msg.role === "assistant" && msg.followUp && (
                <div className="flex flex-col gap-1 ml-2">
                  {msg.followUp.split("\n").filter(q => q.trim() !== "").map((question, i) => (
                    <button
                      key={i}
                      className="text-xs text-blue-400 hover:underline text-left group"
                      onClick={() => handleFollowUpClick(question.trim())}
                    >
                      <span className="group-hover:scale-110 transition-transform inline-block">➤</span> {question}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="text-sm text-gray-400 animate-pulse">
              Agent is thinking... <span className="text-xs text-yellow-400">+5 pts coming</span>
            </div>
          )}
        </div>

        <div className="p-2 border-t border-gray-700 flex bg-gray-800">
          <input
            type="text"
            className="flex-1 px-3 py-2 rounded-md text-sm bg-gray-700 text-white placeholder-gray-400 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />
          <button
            onClick={() => sendMessage()}
            className="ml-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 hover:scale-105 active:scale-95 transition-transform text-sm"
            disabled={loading}
          >
            {loading ? "..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatBox;