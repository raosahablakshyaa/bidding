import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useBiddingRoom } from '../hooks/useBiddingRoom';
import HostDashboard from '../components/HostDashboard';
import BidderDashboard from '../components/BidderDashboard';
import WinnerScreen from '../components/WinnerScreen';
import { Loader2 } from 'lucide-react';

export default function Room() {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const queryParams = new URLSearchParams(location.search);
  const username = queryParams.get('username');
  const isHost = queryParams.get('isHost') === 'true';
  const budget = parseInt(queryParams.get('budget')) || 1000;

  const { 
    room, 
    error, 
    timerStatus, 
    isConnected, 
    recentBids, 
    actions 
  } = useBiddingRoom(roomId, username, isHost, budget);

  useEffect(() => {
    if (!username) {
      navigate(`/join/${roomId}`);
    }
  }, [username, roomId, navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass-card p-8 text-center border-accent">
          <h2 className="text-2xl font-bold text-accent mb-4">Error</h2>
          <p className="text-gray-300 mb-6">{error}</p>
          <button onClick={() => navigate('/')} className="btn-primary">Return Home</button>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <Loader2 size={48} className="animate-spin text-primary" />
        <p className="text-gray-400">Connecting to Arena...</p>
      </div>
    );
  }

  const currentUser = room.users[Object.keys(room.users).find(id => room.users[id].username === username)];
  const isUserHost = currentUser?.isHost || isHost;

  if (room.state.status === 'ended') {
    return (
      <WinnerScreen 
        room={room} 
        isHost={isUserHost} 
        actions={actions}
        currentUser={currentUser}
      />
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8 flex flex-col">
      {/* Top Bar */}
      <header className="flex justify-between items-center mb-6 glass-card p-4 rounded-2xl">
        <div className="flex items-center gap-4">
          <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
          <div>
            <h1 className="text-xl font-bold text-white">{room.settings.title}</h1>
            <p className="text-xs text-gray-400 font-mono">Room: {roomId}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-gray-400">You are</p>
            <p className="font-bold">{username}</p>
          </div>
          {currentUser && (
            <img src={currentUser.avatarUrl} alt="avatar" className="w-10 h-10 rounded-full bg-gray-800" />
          )}
        </div>
      </header>

      {isUserHost ? (
        <HostDashboard 
          room={room} 
          timerStatus={timerStatus} 
          actions={actions} 
          recentBids={recentBids} 
          roomId={roomId}
        />
      ) : (
        <BidderDashboard 
          room={room} 
          timerStatus={timerStatus} 
          actions={actions} 
          currentUser={currentUser}
          recentBids={recentBids}
        />
      )}
    </div>
  );
}
