const store = require('./store');

function initSockets(io) {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('joinRoom', ({ roomId, username, isHost, startingBalance, password }, callback) => {
      socket.join(roomId);

      let room = store.getRoom(roomId);
      if (!room) {
        if (isHost) {
          room = store.createRoom(roomId, socket.id, username, startingBalance, password);
        } else {
          return callback({ error: 'Room does not exist' });
        }
      } else {
        // Only original host username can have isHost=true
        const effectiveIsHost = room.originalHostUsername === username;

        if (!effectiveIsHost && room.settings.password && room.settings.password !== password) {
          return callback({ error: 'Invalid room password' });
        }

        // addUserToRoom handles reconnect: moves socketId, preserves isHost, updates hostId
        store.addUserToRoom(roomId, socket.id, username, effectiveIsHost);
      }

      io.to(roomId).emit('roomUpdated', room);
      callback({ success: true, room });
    });

    // Host: Start/Reset Round (manual item name)
    socket.on('startRound', ({ roomId, item }) => {
      const room = store.getRoom(roomId);
      const callerUser = room && room.users[socket.id];
      const isCallerHost = callerUser && callerUser.isHost;
      if (room && (room.hostId === socket.id || isCallerHost)) {
        if (isCallerHost) room.hostId = socket.id;
        room.state.status = 'active';
        room.state.currentItem = item;
        room.state.highestBid = 0;
        room.state.highestBidder = null;
        room.state.lastBidder = null;
        room.state.bidHistory = [];
        room.state.timeLeft = 0;
        room.state.timerStartedAt = null;
        room.state.timerPausedAt = null;
        io.to(roomId).emit('roomUpdated', room);
      }
    });

    // Host: Add item to queue
    socket.on('addToQueue', ({ roomId, itemName }, callback) => {
      const room = store.getRoom(roomId);
      const isCallerHost = room && room.users[socket.id]?.isHost;
      if (room && (room.hostId === socket.id || isCallerHost)) {
        if (isCallerHost) room.hostId = socket.id;
        const result = store.addToQueue(roomId, itemName.trim());
        io.to(roomId).emit('roomUpdated', result.room);
        if (callback) callback({ success: true });
      }
    });

    // Host: Remove item from queue
    socket.on('removeFromQueue', ({ roomId, index }) => {
      const room = store.getRoom(roomId);
      const isCallerHost = room && room.users[socket.id]?.isHost;
      if (room && (room.hostId === socket.id || isCallerHost)) {
        if (isCallerHost) room.hostId = socket.id;
        const result = store.removeFromQueue(roomId, index);
        io.to(roomId).emit('roomUpdated', result.room);
      }
    });

    // Host: Start next random item from queue
    socket.on('startFromQueue', ({ roomId }) => {
      const room = store.getRoom(roomId);
      const isCallerHost = room && room.users[socket.id]?.isHost;
      if (room && (room.hostId === socket.id || isCallerHost)) {
        if (isCallerHost) room.hostId = socket.id;
        const result = store.startNextFromQueue(roomId);
        if (result.error) return;
        io.to(roomId).emit('roomUpdated', result.room);
      }
    });

    // Place a bid
    socket.on('placeBid', ({ roomId, amount }, callback) => {
      const result = store.placeBid(roomId, socket.id, amount);
      if (result.error) return callback(result);

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
      const isCallerHost = room && room.users[socket.id]?.isHost;
      if (room && (room.hostId === socket.id || isCallerHost)) {
        if (isCallerHost) room.hostId = socket.id;
        store.updateRoomSettings(roomId, settings);
        io.to(roomId).emit('roomUpdated', room);
      }
    });

    socket.on('pauseBidding', ({ roomId }) => {
      const room = store.getRoom(roomId);
      const isCallerHost = room && room.users[socket.id]?.isHost;
      if (room && (room.hostId === socket.id || isCallerHost) && room.state.status === 'active') {
        if (isCallerHost) room.hostId = socket.id;
        room.state.status = 'paused';
        const elapsed = Math.floor((Date.now() - room.state.timerStartedAt) / 1000);
        room.state.timeLeft = Math.max(0, room.state.timeLeft - elapsed);
        room.state.timerPausedAt = Date.now();
        io.to(roomId).emit('roomUpdated', room);
      }
    });

    socket.on('resumeBidding', ({ roomId }) => {
      const room = store.getRoom(roomId);
      const isCallerHost = room && room.users[socket.id]?.isHost;
      if (room && (room.hostId === socket.id || isCallerHost) && room.state.status === 'paused') {
        if (isCallerHost) room.hostId = socket.id;
        room.state.status = 'active';
        room.state.timerStartedAt = Date.now();
        room.state.timerPausedAt = null;
        io.to(roomId).emit('roomUpdated', room);
      }
    });

    socket.on('endBidding', ({ roomId }) => {
      const room = store.getRoom(roomId);
      const isCallerHost = room && room.users[socket.id]?.isHost;
      if (room && (room.hostId === socket.id || isCallerHost)) {
        if (isCallerHost) room.hostId = socket.id;
        room.state.status = 'roundEnded';
        room.state.timeLeft = 0;
        io.to(roomId).emit('roomUpdated', room);
        io.to(roomId).emit('biddingEnded', { winnerDetails: null });
      }
    });

    // Mark item as sold
    socket.on('markAsSold', ({ roomId }) => {
      const room = store.getRoom(roomId);
      const isCallerHost = room && room.users[socket.id]?.isHost;
      if (room && (room.hostId === socket.id || isCallerHost)) {
        if (isCallerHost) room.hostId = socket.id;
        const result = store.markAsSold(roomId);
        if (result.success) {
          io.to(roomId).emit('roomUpdated', result.room);
          io.to(roomId).emit('biddingEnded', { winnerDetails: result.winnerDetails });
        }
      }
    });

    // Timer Sync — only runs when a bid has been placed (timerStartedAt is set)
    socket.on('syncTimer', ({ roomId }) => {
      const room = store.getRoom(roomId);
      if (room && room.state.status === 'active' && room.state.timerStartedAt) {
        const elapsed = (Date.now() - room.state.timerStartedAt) / 1000;
        const currentLeft = Math.max(0, room.state.timeLeft - elapsed);

        if (currentLeft <= 0) {
          const result = store.markAsSold(roomId);
          if (result.success) {
            io.to(roomId).emit('roomUpdated', result.room);
            io.to(roomId).emit('biddingEnded', { winnerDetails: result.winnerDetails });
          }
          return;
        }

        io.to(roomId).emit('timerUpdate', { timeLeft: Math.ceil(currentLeft), status: room.state.status });
      }
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);

      for (const roomId in store.rooms) {
        const room = store.rooms[roomId];
        if (room.users[socket.id]) {
          const wasHost = room.users[socket.id].isHost;

          if (wasHost) {
            room.users[socket.id].disconnected = true;
            io.to(roomId).emit('hostLeft');
          } else {
            // Keep bidder entry too so balance/inventory preserved on reconnect
            room.users[socket.id].disconnected = true;
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
