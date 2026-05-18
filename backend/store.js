// In-memory store
const rooms = {};

// Structure of a room:
// {
//   roomId: string,
//   hostId: string,
//   settings: { title: string, startingBalance: number, timerDuration: number, bidIncrement: number, maxBalance: number },
//   state: {
//     status: 'waiting' | 'active' | 'paused' | 'ended',
//     currentItem: string | null,
//     highestBid: number,
//     highestBidder: string | null,
//     timerStartedAt: number | null,
//     timerPausedAt: number | null,
//     timeLeft: number,
//     bidHistory: Array<{ bidder: string, amount: number, timestamp: number }>
//   },
//   users: {
//     [socketId]: { username: string, balance: number, isHost: boolean, avatarUrl: string }
//   }
// }

function createRoom(roomId, hostId, username, startingBalance = 1000) {
  rooms[roomId] = {
    roomId,
    hostId,
    settings: {
      title: 'Live Bidding',
      startingBalance: startingBalance,
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
      bidHistory: []
    },
    users: {}
  };
  
  addUserToRoom(roomId, hostId, username, true);
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
  
  rooms[roomId].users[socketId] = {
    socketId,
    username,
    balance: startingBalance,
    isHost,
    avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`
  };
  
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
  
  // Accept bid
  room.state.highestBid = amount;
  room.state.highestBidder = user.username;
  
  room.state.bidHistory.unshift({
    bidder: user.username,
    amount,
    timestamp: Date.now()
  });
  
  // Keep history manageable
  if (room.state.bidHistory.length > 50) {
    room.state.bidHistory.pop();
  }
  
  return { success: true, room };
}

module.exports = {
  rooms,
  createRoom,
  getRoom,
  deleteRoom,
  addUserToRoom,
  removeUserFromRoom,
  updateRoomSettings,
  placeBid
};
