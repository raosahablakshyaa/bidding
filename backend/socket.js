const store = require('./store');

function initSockets(io) {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Join a room
    socket.on('joinRoom', ({ roomId, username, isHost }, callback) => {
      socket.join(roomId);
      
      let room = store.getRoom(roomId);
      if (!room) {
        if (isHost) {
          room = store.createRoom(roomId, socket.id, username);
        } else {
          return callback({ error: 'Room does not exist' });
        }
      } else {
        store.addUserToRoom(roomId, socket.id, username, isHost);
      }
      
      io.to(roomId).emit('roomUpdated', room);
      callback({ success: true, room });
    });

    // Host: Start/Reset Round
    socket.on('startRound', ({ roomId, item }) => {
      const room = store.getRoom(roomId);
      if (room && room.hostId === socket.id) {
        room.state.status = 'active';
        room.state.currentItem = item;
        room.state.highestBid = 0;
        room.state.highestBidder = null;
        room.state.bidHistory = [];
        room.state.timeLeft = room.settings.timerDuration;
        room.state.timerStartedAt = Date.now();
        room.state.timerPausedAt = null;
        
        io.to(roomId).emit('roomUpdated', room);
      }
    });

    // Place a bid
    socket.on('placeBid', ({ roomId, amount }, callback) => {
      const result = store.placeBid(roomId, socket.id, amount);
      if (result.error) {
        return callback(result);
      }
      
      // Deduct balance logic (optional: could only deduct from winner at end, but requirements say "Animated balance deduction")
      // If we deduct immediately, we should refund the previous highest bidder.
      // For simplicity in a fast game: deduct from current, refund previous.
      const room = result.room;
      
      io.to(roomId).emit('bidPlaced', {
        bidder: room.users[socket.id].username,
        amount,
        room
      });
      callback({ success: true });
    });

    // Host controls
    socket.on('updateSettings', ({ roomId, settings }) => {
      const room = store.getRoom(roomId);
      if (room && room.hostId === socket.id) {
        store.updateRoomSettings(roomId, settings);
        io.to(roomId).emit('roomUpdated', room);
      }
    });
    
    socket.on('pauseBidding', ({ roomId }) => {
      const room = store.getRoom(roomId);
      if (room && room.hostId === socket.id && room.state.status === 'active') {
        room.state.status = 'paused';
        const elapsed = Math.floor((Date.now() - room.state.timerStartedAt) / 1000);
        room.state.timeLeft = Math.max(0, room.state.timeLeft - elapsed);
        room.state.timerPausedAt = Date.now();
        io.to(roomId).emit('roomUpdated', room);
      }
    });
    
    socket.on('resumeBidding', ({ roomId }) => {
      const room = store.getRoom(roomId);
      if (room && room.hostId === socket.id && room.state.status === 'paused') {
        room.state.status = 'active';
        room.state.timerStartedAt = Date.now();
        room.state.timerPausedAt = null;
        io.to(roomId).emit('roomUpdated', room);
      }
    });
    
    socket.on('endBidding', ({ roomId }) => {
      const room = store.getRoom(roomId);
      if (room && room.hostId === socket.id) {
        room.state.status = 'ended';
        
        // Deduct balance from winner
        if (room.state.highestBidder) {
          const winnerSocketId = Object.keys(room.users).find(
            id => room.users[id].username === room.state.highestBidder
          );
          if (winnerSocketId && room.users[winnerSocketId]) {
            room.users[winnerSocketId].balance -= room.state.highestBid;
          }
        }
        
        io.to(roomId).emit('biddingEnded', room);
        io.to(roomId).emit('roomUpdated', room);
      }
    });

    // Timer Sync
    socket.on('syncTimer', ({ roomId }) => {
      const room = store.getRoom(roomId);
      if (room && room.state.status === 'active') {
        const elapsed = Math.floor((Date.now() - room.state.timerStartedAt) / 1000);
        const currentLeft = Math.max(0, room.state.timeLeft - elapsed);
        
        if (currentLeft <= 0) {
          // Timer ended
          room.state.status = 'ended';
          if (room.state.highestBidder) {
            const winnerSocketId = Object.keys(room.users).find(
              id => room.users[id].username === room.state.highestBidder
            );
            if (winnerSocketId && room.users[winnerSocketId]) {
              room.users[winnerSocketId].balance -= room.state.highestBid;
            }
          }
          io.to(roomId).emit('biddingEnded', room);
        }
        
        io.to(roomId).emit('timerUpdate', { timeLeft: currentLeft, status: room.state.status });
      }
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
      
      // Find which room the user was in and remove them
      for (const roomId in store.rooms) {
        const room = store.rooms[roomId];
        if (room.users[socket.id]) {
          const wasHost = room.users[socket.id].isHost;
          store.removeUserFromRoom(roomId, socket.id);
          
          if (wasHost) {
            // If host disconnects, either migrate host or close room
            const remainingUsers = Object.keys(room.users);
            if (remainingUsers.length > 0) {
              const newHostId = remainingUsers[0];
              room.users[newHostId].isHost = true;
              room.hostId = newHostId;
              io.to(roomId).emit('hostMigrated', newHostId);
            } else {
              store.deleteRoom(roomId);
            }
          }
          
          if (store.rooms[roomId]) {
            io.to(roomId).emit('roomUpdated', store.rooms[roomId]);
          }
          break;
        }
      }
    });
  });
}

module.exports = initSockets;
