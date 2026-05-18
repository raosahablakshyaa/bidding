import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function JoinRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');

  const handleJoin = (e) => {
    e.preventDefault();
    if (username.trim()) {
      navigate(`/room/${roomId}?username=${encodeURIComponent(username)}`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card p-8 w-full max-w-md"
      >
        <h2 className="text-3xl font-bold text-center mb-2">Join Room</h2>
        <p className="text-center text-gray-400 mb-8 font-mono">{roomId}</p>
        
        <form onSubmit={handleJoin} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Your Username</label>
            <input 
              type="text" 
              placeholder="Enter your name..." 
              className="input-field"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
            />
          </div>
          
          <button type="submit" className="w-full btn-secondary py-3 text-lg mt-4">
            Enter Arena
          </button>
        </form>
      </motion.div>
    </div>
  );
}
