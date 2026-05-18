// In-memory store
const rooms = {};

function createRoom(roomId, hostSocketId, username, startingBalance = 1000, password = '') {
  rooms[roomId] = {
    roomId,
    hostId: hostSocketId,
    originalHostUsername: username,
    settings: {
      title: 'Live Bidding',
      startingBalance,
      password,
      timerDuration: 60,
      bidIncrement: 10,
      maxBalance: startingBalance
    },
    state: {
      status: 'waiting',
      currentItem: null,
      highestBid: 0,
      highestBidder: null,
      timerStartedAt: null,
      timerPausedAt: null,
      timeLeft: 60,
      bidHistory: [],
      soldItems: []
    },
    users: {}
  };

  addUserToRoom(roomId, hostSocketId, username, true);
  return rooms[roomId];
}

function getRoom(roomId) {
  return rooms[roomId];
}

function deleteRoom(roomId) {
  delete rooms[roomId];
}

function addUserToRoom(roomId, socketId, username, isHost = false) {
  if (!rooms[roomId]) return false;

  const startingBalance = rooms[roomId].settings.startingBalance;

  // If user already exists (reconnect), update socketId mapping
  const existingEntry = Object.values(rooms[roomId].users).find(u => u.username === username);
  if (existingEntry && existingEntry.socketId !== socketId) {
    // Move entry to new socketId, preserve all data including isHost
    const oldSocketId = existingEntry.socketId;
    const oldData = rooms[roomId].users[oldSocketId];
    delete rooms[roomId].users[oldSocketId];
    rooms[roomId].users[socketId] = { ...oldData, socketId, disconnected: false };
    // If this was the host, update room's hostId too
    if (oldData.isHost) {
      rooms[roomId].hostId = socketId;
    }
    return rooms[roomId];
  }

  if (!rooms[roomId].users[socketId]) {
    rooms[roomId].users[socketId] = {
      socketId,
      username,
      balance: startingBalance,
      isHost,
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`,
      inventory: []
    };
  }

  return rooms[roomId];
}

function removeUserFromRoom(roomId, socketId) {
  if (!rooms[roomId]) return false;
  delete rooms[roomId].users[socketId];
  return rooms[roomId];
}

function updateRoomSettings(roomId, settings) {
  if (!rooms[roomId]) return false;
  rooms[roomId].settings = { ...rooms[roomId].settings, ...settings };
  return rooms[roomId];
}

function placeBid(roomId, socketId, amount) {
  const room = rooms[roomId];
  if (!room) return { error: 'Room not found' };
  if (room.state.status !== 'active') return { error: 'Bidding is not active' };

  const user = room.users[socketId];
  if (!user) return { error: 'User not found' };

  if (amount <= room.state.highestBid) return { error: 'Bid must be higher than current highest bid' };
  if (amount > user.balance) return { error: 'Insufficient balance' };

  room.state.highestBid = amount;
  room.state.highestBidder = user.username;

  room.state.bidHistory.unshift({ bidder: user.username, amount, timestamp: Date.now() });
  if (room.state.bidHistory.length > 50) room.state.bidHistory.pop();

  return { success: true, room };
}

function markAsSold(roomId) {
  const room = rooms[roomId];
  if (!room) return { error: 'Room not found' };

  let winnerDetails = null;

  if (room.state.highestBidder && room.state.highestBid > 0) {
    const winnerSocketId = Object.keys(room.users).find(
      id => room.users[id].username === room.state.highestBidder
    );

    if (winnerSocketId) {
      room.users[winnerSocketId].balance -= room.state.highestBid;

      winnerDetails = {
        itemName: room.state.currentItem || 'Mystery Item',
        winner: room.state.highestBidder,
        amount: room.state.highestBid,
        timestamp: Date.now()
      };

      // Add to winner's inventory
      room.users[winnerSocketId].inventory.push({
        itemName: winnerDetails.itemName,
        amount: winnerDetails.amount,
        timestamp: winnerDetails.timestamp
      });

      room.state.soldItems.unshift(winnerDetails);
    }
  }

  // Reset for next item but keep room open (status = 'roundEnded')
  const lastItem = room.state.currentItem;
  room.state.currentItem = null;
  room.state.highestBid = 0;
  room.state.highestBidder = null;
  room.state.bidHistory = [];
  room.state.status = 'roundEnded';
  room.state.timeLeft = 0;

  return { success: true, room, winnerDetails, lastItem };
}

module.exports = {
  rooms,
  createRoom,
  getRoom,
  deleteRoom,
  addUserToRoom,
  removeUserFromRoom,
  updateRoomSettings,
  placeBid,
  markAsSold
};
