import { useState, useEffect } from 'react';
import { socket } from '../socket';
import toast from 'react-hot-toast';

export function useBiddingRoom(roomId, username, isHost = false, startingBalance = 1000, password = '') {
  const [room, setRoom] = useState(null);
  const [error, setError] = useState(null);
  const [timerStatus, setTimerStatus] = useState({ timeLeft: 0, status: 'waiting' });
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [recentBids, setRecentBids] = useState([]);

  useEffect(() => {
    let timeoutId;
    
    function onConnect() {
      setIsConnected(true);
      if (timeoutId) clearTimeout(timeoutId);
      
      if (roomId && username) {
        socket.emit('joinRoom', { roomId, username, isHost, startingBalance, password }, (response) => {
          if (response.error) {
            setError(response.error);
            toast.error(response.error);
          } else {
            setRoom(response.room);
          }
        });
      }
    }

    function onDisconnect() {
      setIsConnected(false);
    }

    function onRoomUpdated(updatedRoom) {
      setRoom(updatedRoom);
      setTimerStatus({
        timeLeft: updatedRoom.state.timeLeft,
        status: updatedRoom.state.status
      });
    }

    function onBidPlaced(data) {
      setRoom(data.room);
      setRecentBids(prev => [{...data, id: Date.now()}, ...prev].slice(0, 10));
      
      // Play sound effect
      try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
        audio.volume = 0.5;
        audio.play();
      } catch (e) {
        // ignore audio errors
      }
    }

    function onTimerUpdate(data) {
      setTimerStatus(data);
    }

    function onBiddingEnded(endedRoom) {
      setRoom(endedRoom);
      setTimerStatus({ timeLeft: 0, status: 'ended' });
      toast.success('Bidding has ended!');
    }

    function onHostMigrated(newHostId) {
      if (socket.id === newHostId) {
        toast.success('You are now the host!');
        // Ideally we would redirect or update state to reflect host powers
      }
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('roomUpdated', onRoomUpdated);
    socket.on('bidPlaced', onBidPlaced);
    socket.on('timerUpdate', onTimerUpdate);
    socket.on('biddingEnded', onBiddingEnded);
    socket.on('hostMigrated', onHostMigrated);

    // Connection timeout check
    if (!socket.connected) {
      timeoutId = setTimeout(() => {
        if (!socket.connected) {
          setError("Failed to connect to the arena. Please check if VITE_BACKEND_URL is set in Vercel.");
        }
      }, 5000);
    }

    // Initial connection handling if already connected
    if (socket.connected && roomId && username) {
      onConnect();
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('roomUpdated', onRoomUpdated);
      socket.off('bidPlaced', onBidPlaced);
      socket.off('timerUpdate', onTimerUpdate);
      socket.off('biddingEnded', onBiddingEnded);
      socket.off('hostMigrated', onHostMigrated);
    };
  }, [roomId, username, isHost]);

  // Actions
  const placeBid = (amount) => {
    return new Promise((resolve) => {
      socket.emit('placeBid', { roomId, amount }, (response) => {
        if (response.error) {
          toast.error(response.error);
          resolve(false);
        } else {
          resolve(true);
        }
      });
    });
  };

  const startRound = (item) => {
    socket.emit('startRound', { roomId, item });
  };

  const updateSettings = (settings) => {
    socket.emit('updateSettings', { roomId, settings });
  };

  const pauseBidding = () => {
    socket.emit('pauseBidding', { roomId });
  };

  const resumeBidding = () => {
    socket.emit('resumeBidding', { roomId });
  };

  const endBidding = () => {
    socket.emit('endBidding', { roomId });
  };

  // Keep timer in sync for host
  useEffect(() => {
    let interval;
    if (isHost && room?.state?.status === 'active') {
      interval = setInterval(() => {
        socket.emit('syncTimer', { roomId });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isHost, room?.state?.status, roomId]);

  return {
    room,
    error,
    timerStatus,
    isConnected,
    recentBids,
    actions: {
      placeBid,
      startRound,
      updateSettings,
      pauseBidding,
      resumeBidding,
      endBidding
    }
  };
}
