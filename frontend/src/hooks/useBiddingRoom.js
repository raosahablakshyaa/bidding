import { useState, useEffect } from 'react';
import { socket } from '../socket';
import toast from 'react-hot-toast';

export function useBiddingRoom(roomId, username, isHost = false, startingBalance = 1000, password = '') {
  const [room, setRoom] = useState(null);
  const [error, setError] = useState(null);
  const [timerStatus, setTimerStatus] = useState({ timeLeft: 0, status: 'waiting' });
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [recentBids, setRecentBids] = useState([]);
  const [lastWinner, setLastWinner] = useState(null);

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
            const r = response.room;
            setRoom(r);
            // Restore timer status
            setTimerStatus({ timeLeft: r.state.timeLeft, status: r.state.status });
            // Restore lastWinner if round just ended
            if (r.state.status === 'roundEnded' && r.state.soldItems?.length > 0) {
              setLastWinner(r.state.soldItems[0]);
            }
            // Restore recent bids from bidHistory
            if (r.state.bidHistory?.length > 0) {
              setRecentBids(r.state.bidHistory.slice(0, 10).map((b, i) => ({ ...b, id: i })));
            }
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
      setRecentBids(prev => [{ ...data, id: Date.now() }, ...prev].slice(0, 10));
      try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
        audio.volume = 0.5;
        audio.play();
      } catch (e) {}
    }

    function onTimerUpdate(data) {
      setTimerStatus(data);
    }

    function onBiddingEnded({ winnerDetails }) {
      setTimerStatus({ timeLeft: 0, status: 'roundEnded' });
      if (winnerDetails) {
        setLastWinner(winnerDetails);
        toast.success(`${winnerDetails.winner} won ${winnerDetails.itemName} for $${winnerDetails.amount}!`);
      } else {
        setLastWinner(null);
        toast('Round ended with no winner.');
      }
    }

    function onHostLeft() {
      toast('Host has disconnected. Waiting for host to rejoin...', { icon: '⚠️' });
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('roomUpdated', onRoomUpdated);
    socket.on('bidPlaced', onBidPlaced);
    socket.on('timerUpdate', onTimerUpdate);
    socket.on('biddingEnded', onBiddingEnded);
    socket.on('hostLeft', onHostLeft);

    if (!socket.connected) {
      timeoutId = setTimeout(() => {
        if (!socket.connected) {
          setError('Failed to connect to the arena. Please check if VITE_BACKEND_URL is set.');
        }
      }, 5000);
    }

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
      socket.off('hostLeft', onHostLeft);
    };
  }, [roomId, username, isHost]);

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

  const startRound = (item) => socket.emit('startRound', { roomId, item });
  const updateSettings = (settings) => socket.emit('updateSettings', { roomId, settings });
  const pauseBidding = () => socket.emit('pauseBidding', { roomId });
  const resumeBidding = () => socket.emit('resumeBidding', { roomId });
  const endBidding = () => socket.emit('endBidding', { roomId });
  const markAsSold = () => socket.emit('markAsSold', { roomId });
  const dismissWinner = () => setLastWinner(null);
  const addToQueue = (itemName) => socket.emit('addToQueue', { roomId, itemName });
  const removeFromQueue = (index) => socket.emit('removeFromQueue', { roomId, index });
  const startFromQueue = () => socket.emit('startFromQueue', { roomId });

  // Keep timer in sync — all connected clients sync, not just host
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
    lastWinner,
    actions: {
      placeBid,
      startRound,
      updateSettings,
      pauseBidding,
      resumeBidding,
      endBidding,
      markAsSold,
      dismissWinner,
      addToQueue,
      removeFromQueue,
      startFromQueue
    }
  };
}
