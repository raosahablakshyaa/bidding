import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, Users, Shield, ArrowRight } from 'lucide-react';

export default function Landing() {
  const [roomId, setRoomId] = useState('');
  const [username, setUsername] = useState('');
  const [hostPassword, setHostPassword] = useState('');
  const [joinPassword, setJoinPassword] = useState('');
  const [budget, setBudget] = useState(1000);
  const navigate = useNavigate();

  const generateRoomId = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleCreateRoom = (e) => {
    e.preventDefault();
    if (!username.trim()) {
      alert("Please enter a username");
      return;
    }
    const newRoomId = generateRoomId();
    // Redirect to room page as host
    navigate(`/room/${newRoomId}?username=${encodeURIComponent(username)}&isHost=true&budget=${budget}&password=${encodeURIComponent(hostPassword)}`);
  };

  const handleJoinRoom = (e) => {
    e.preventDefault();
    if (!roomId.trim() || !username.trim()) {
      alert("Please enter both Room ID and Username");
      return;
    }
    navigate(`/room/${roomId}?username=${encodeURIComponent(username)}&password=${encodeURIComponent(joinPassword)}`);
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-4 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-[100px] pointer-events-none"></div>

      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="z-10 text-center mb-12"
      >
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-4">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary animate-pulse-fast">
            Live Bidding
          </span> Arena
        </h1>
        <p className="text-gray-400 text-lg max-w-xl mx-auto">
          The ultimate real-time bidding experience. Host private rooms, add items dynamically, and outbid your friends in a futuristic neon dashboard.
        </p>
      </motion.div>

      <div className="z-10 flex flex-col md:flex-row gap-8 w-full max-w-4xl">
        {/* Create Room Card */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="flex-1 glass-card p-8 flex flex-col"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-primary/20 rounded-xl text-primary">
              <Shield size={24} />
            </div>
            <h2 className="text-2xl font-bold">Host a Room</h2>
          </div>
          
          <form onSubmit={handleCreateRoom} className="flex-1 flex flex-col gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Host Username</label>
              <input 
                type="text" 
                placeholder="Enter your name..." 
                className="input-field"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Max Budget (Starting Balance)</label>
              <input 
                type="number" 
                min="100"
                className="input-field font-mono"
                value={budget}
                onChange={(e) => setBudget(parseInt(e.target.value) || 0)}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Room Password (Optional)</label>
              <input 
                type="text" 
                placeholder="Leave blank for open room" 
                className="input-field"
                value={hostPassword}
                onChange={(e) => setHostPassword(e.target.value)}
              />
            </div>
            <div className="mt-auto pt-6">
              <button type="submit" className="w-full btn-primary flex items-center justify-center gap-2 py-3 text-lg">
                Create Room <ArrowRight size={20} />
              </button>
            </div>
          </form>
        </motion.div>

        {/* Join Room Card */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="flex-1 glass-card p-8 flex flex-col"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-secondary/20 rounded-xl text-secondary">
              <Users size={24} />
            </div>
            <h2 className="text-2xl font-bold">Join a Room</h2>
          </div>
          
          <form onSubmit={handleJoinRoom} className="flex-1 flex flex-col gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Room Code</label>
              <input 
                type="text" 
                placeholder="e.g. A1B2C3" 
                className="input-field font-mono uppercase"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value.toUpperCase())}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Bidder Username</label>
              <input 
                type="text" 
                placeholder="Enter your name..." 
                className="input-field"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Room Password (If any)</label>
              <input 
                type="text" 
                placeholder="Required if set by host" 
                className="input-field"
                value={joinPassword}
                onChange={(e) => setJoinPassword(e.target.value)}
              />
            </div>
            <div className="mt-auto pt-6">
              <button type="submit" className="w-full btn-secondary flex items-center justify-center gap-2 py-3 text-lg">
                Join Arena <Zap size={20} />
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
