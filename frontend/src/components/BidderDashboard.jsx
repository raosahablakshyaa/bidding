import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, Activity, Trophy, ChevronUp } from 'lucide-react';

export default function BidderDashboard({ room, timerStatus, actions, currentUser, recentBids }) {
  const [customBid, setCustomBid] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentHighest = room.state.highestBid;
  const myBalance = currentUser?.balance || 0;
  
  const handleQuickBid = async (amount) => {
    setIsSubmitting(true);
    await actions.placeBid(currentHighest + amount);
    setIsSubmitting(false);
  };

  const handleCustomBid = async (e) => {
    e.preventDefault();
    const amount = parseInt(customBid);
    if (!isNaN(amount)) {
      setIsSubmitting(true);
      const success = await actions.placeBid(amount);
      if (success) setCustomBid('');
      setIsSubmitting(false);
    }
  };

  const sortedUsers = Object.values(room.users)
    .filter(u => !u.isHost)
    .sort((a, b) => b.balance - a.balance);

  const isActive = room.state.status === 'active';
  const myRank = sortedUsers.findIndex(u => u.username === currentUser?.username) + 1;

  return (
    <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Arena */}
      <div className="lg:col-span-2 flex flex-col gap-6">
        <div className="glass-card p-8 flex flex-col items-center justify-center relative min-h-[350px] overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/20 via-background to-background"></div>
          
          <div className="z-10 text-center w-full">
            {isActive ? (
              <div className="mb-8">
                <span className="px-4 py-1.5 rounded-full bg-secondary/20 text-secondary border border-secondary/30 text-sm font-bold uppercase tracking-wider">
                  Bidding On: {room.state.currentItem}
                </span>
              </div>
            ) : (
              <div className="mb-8">
                <span className="px-4 py-1.5 rounded-full bg-gray-800 text-gray-400 border border-gray-700 text-sm font-bold uppercase tracking-wider">
                  {room.state.status === 'waiting' ? 'Waiting for Host...' : 'Round Paused'}
                </span>
              </div>
            )}
            
            <h3 className="text-gray-400 text-lg uppercase tracking-wider mb-2">Highest Bid</h3>
            <div className="text-6xl md:text-8xl font-black text-white mb-4 font-mono tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
              ${currentHighest.toLocaleString()}
            </div>
            
            <AnimatePresence mode="wait">
              {room.state.highestBidder ? (
                <motion.div 
                  key={room.state.highestBidder}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={`inline-flex items-center gap-3 px-6 py-3 border rounded-full ${room.state.highestBidder === currentUser?.username ? 'bg-secondary/20 border-secondary text-secondary' : 'bg-primary/20 border-primary text-primary'}`}
                >
                  {room.state.highestBidder === currentUser?.username ? (
                    <span className="font-bold text-xl">You hold the highest bid!</span>
                  ) : (
                    <>
                      <span className="text-gray-300">held by</span>
                      <span className="font-bold text-xl">{room.state.highestBidder}</span>
                    </>
                  )}
                </motion.div>
              ) : (
                <motion.div className="h-14 flex items-center text-gray-500">Be the first to bid!</motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Timer Ring */}
          {isActive && (
            <div className="absolute top-6 right-6 flex flex-col items-end bg-black/40 p-3 rounded-xl border border-white/10">
              <span className="text-xs text-gray-400 uppercase tracking-widest mb-1">Time Left</span>
              <span className={`text-3xl font-mono font-bold ${timerStatus.timeLeft <= 10 ? 'text-accent animate-pulse' : 'text-white'}`}>
                00:{timerStatus.timeLeft.toString().padStart(2, '0')}
              </span>
            </div>
          )}
        </div>

        {/* Bidding Controls */}
        <div className={`glass-card p-6 flex flex-col gap-6 ${!isActive ? 'opacity-50 pointer-events-none' : ''}`}>
          <div className="flex justify-between items-end">
            <h3 className="text-xl font-bold flex items-center gap-2"><Wallet className="text-secondary" /> Place Your Bid</h3>
            <div className="text-right">
              <p className="text-sm text-gray-400 mb-1">Available Balance</p>
              <p className="text-2xl font-mono font-bold text-green-400">${myBalance.toLocaleString()}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[10, 50, 100, 500].map(amount => {
              const canAfford = myBalance >= (currentHighest + amount);
              return (
                <button
                  key={amount}
                  onClick={() => handleQuickBid(amount)}
                  disabled={!canAfford || isSubmitting}
                  className="btn-primary py-4 flex flex-col items-center justify-center gap-1 group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform"></div>
                  <span className="text-sm text-white/70">+{amount}</span>
                  <span className="font-bold text-lg">${(currentHighest + amount).toLocaleString()}</span>
                </button>
              )
            })}
          </div>
          
          <form onSubmit={handleCustomBid} className="flex gap-4">
            <div className="flex-1 relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
              <input 
                type="number"
                value={customBid}
                onChange={e => setCustomBid(e.target.value)}
                min={currentHighest + 1}
                max={myBalance}
                placeholder={`Min ${currentHighest + 1}`}
                className="input-field pl-8 font-mono text-lg"
              />
            </div>
            <button 
              type="submit" 
              disabled={isSubmitting || !customBid || parseInt(customBid) <= currentHighest || parseInt(customBid) > myBalance}
              className="btn-secondary px-8 text-lg flex items-center gap-2"
            >
              Bid Custom <ChevronUp size={20} />
            </button>
          </form>
        </div>
      </div>

      {/* Sidebar */}
      <div className="flex flex-col gap-6">
        <div className="glass-card p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center justify-between">
            <span className="flex items-center gap-2"><Trophy size={20} className="text-yellow-400" /> Leaderboard</span>
            <span className="text-sm font-normal text-gray-400 bg-gray-800 px-3 py-1 rounded-full">Rank #{myRank}</span>
          </h2>
          <div className="space-y-3">
            {sortedUsers.map((user, idx) => (
              <div 
                key={user.username} 
                className={`flex items-center justify-between p-3 rounded-xl border ${user.username === currentUser?.username ? 'bg-primary/20 border-primary/50' : 'bg-black/30 border-white/5'}`}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-6 text-center font-bold ${idx === 0 ? 'text-yellow-400' : idx === 1 ? 'text-gray-300' : idx === 2 ? 'text-amber-700' : 'text-gray-500'}`}>
                    {idx + 1}
                  </span>
                  <img src={user.avatarUrl} alt="" className="w-8 h-8 rounded-full bg-gray-800" />
                  <span className={`font-medium ${user.username === currentUser?.username ? 'text-white' : 'text-gray-300'}`}>
                    {user.username} {user.username === currentUser?.username && '(You)'}
                  </span>
                </div>
                <span className="font-mono text-sm text-gray-400">${user.balance.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card p-6 flex-1 flex flex-col">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Activity size={20} className="text-secondary" /> Activity Feed</h2>
          <div className="flex-1 overflow-y-auto pr-2 space-y-3 relative min-h-[200px]">
            {recentBids.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center text-gray-500">No activity yet</div>
            ) : (
              <AnimatePresence>
                {recentBids.map((bid) => (
                  <motion.div 
                    key={bid.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex flex-col p-3 bg-black/40 rounded-xl border border-white/5"
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className={`font-bold ${bid.bidder === currentUser?.username ? 'text-secondary' : 'text-white'}`}>
                        {bid.bidder}
                      </span>
                      <span className="font-mono text-lg font-bold text-white">${bid.amount.toLocaleString()}</span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
