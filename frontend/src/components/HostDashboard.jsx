import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Square, Settings, Users, Activity, Copy, Check, Plus, Trash2, Shuffle, List } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export default function HostDashboard({ room, timerStatus, actions, recentBids, roomId }) {
  const [newItemName, setNewItemName] = useState('');
  const [queueInput, setQueueInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [mode, setMode] = useState('queue'); // 'queue' | 'manual'

  const itemQueue = room.state.itemQueue || [];
  const isIdle = room.state.status === 'waiting' || room.state.status === 'roundEnded';

  const handleAddToQueue = (e) => {
    e.preventDefault();
    if (!queueInput.trim()) return;
    actions.addToQueue(queueInput.trim());
    setQueueInput('');
  };

  const handleManualStart = (e) => {
    e.preventDefault();
    if (!newItemName.trim()) return;
    actions.startRound(newItemName.trim());
    setNewItemName('');
  };

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/join/${roomId}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const usersList = Object.values(room.users).filter(u => !u.isHost);

  return (
    <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column */}
      <div className="flex flex-col gap-6">
        <div className="glass-card p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2"><Settings size={20} className="text-primary" /> Host Controls</h2>
            <div className="flex gap-2">
              <button onClick={() => setShowQR(!showQR)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><path d="M8 12h8"></path><path d="M12 8v8"></path></svg>
              </button>
              <button onClick={copyLink} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                {copied ? <Check size={20} className="text-green-500" /> : <Copy size={20} />}
              </button>
            </div>
          </div>

          <AnimatePresence>
            {showQR && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-6 flex justify-center">
                <div className="p-4 bg-white rounded-xl">
                  <QRCodeSVG value={`${window.location.origin}/join/${roomId}`} size={150} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {isIdle ? (
            <div className="flex flex-col gap-4">
              {room.state.status === 'roundEnded' && (
                <p className="text-sm text-green-400 font-medium">Round ended. Start next item:</p>
              )}

              {/* Mode Toggle */}
              <div className="flex gap-2 p-1 bg-black/30 rounded-xl">
                <button onClick={() => setMode('queue')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-bold transition-colors ${mode === 'queue' ? 'bg-primary/40 text-white' : 'text-gray-400 hover:text-white'}`}>
                  <List size={15} /> Queue
                </button>
                <button onClick={() => setMode('manual')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-bold transition-colors ${mode === 'manual' ? 'bg-primary/40 text-white' : 'text-gray-400 hover:text-white'}`}>
                  <Play size={15} /> Manual
                </button>
              </div>

              {mode === 'queue' ? (
                <div className="flex flex-col gap-3">
                  {/* Add to queue */}
                  <form onSubmit={handleAddToQueue} className="flex gap-2">
                    <input
                      type="text"
                      value={queueInput}
                      onChange={e => setQueueInput(e.target.value)}
                      className="input-field flex-1 py-2 text-sm"
                      placeholder="Add item to queue..."
                    />
                    <button type="submit" disabled={!queueInput.trim()} className="btn-primary px-3 py-2">
                      <Plus size={18} />
                    </button>
                  </form>

                  {/* Queue list */}
                  {itemQueue.length > 0 ? (
                    <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                      <AnimatePresence>
                        {itemQueue.map((item, i) => (
                          <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                            className="flex items-center justify-between p-2.5 bg-black/30 rounded-xl border border-white/10">
                            <span className="text-sm font-medium text-white truncate flex-1">{item}</span>
                            <button onClick={() => actions.removeFromQueue(i)} className="ml-2 p-1 hover:text-red-400 text-gray-500 transition-colors">
                              <Trash2 size={14} />
                            </button>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 text-center py-2">Queue is empty. Add items above.</p>
                  )}

                  <button
                    onClick={actions.startFromQueue}
                    disabled={itemQueue.length === 0}
                    className="btn-primary py-3 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Shuffle size={18} /> Start Random Item ({itemQueue.length})
                  </button>
                </div>
              ) : (
                <form onSubmit={handleManualStart} className="flex flex-col gap-3">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Item to Bid On</label>
                    <input
                      type="text"
                      value={newItemName}
                      onChange={e => setNewItemName(e.target.value)}
                      className="input-field"
                      placeholder="e.g. VIP Ticket"
                      autoFocus
                    />
                  </div>
                  <button type="submit" disabled={!newItemName.trim()} className="btn-primary py-3 flex items-center justify-center gap-2">
                    <Play size={20} /> Start Bidding
                  </button>
                </form>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="p-4 bg-primary/20 border border-primary/30 rounded-xl">
                <p className="text-sm text-primary mb-1">Currently Bidding On</p>
                <p className="text-2xl font-bold">{room.state.currentItem}</p>
              </div>

              {/* Show remaining queue count */}
              {itemQueue.length > 0 && (
                <p className="text-xs text-gray-400 text-center">{itemQueue.length} item{itemQueue.length > 1 ? 's' : ''} remaining in queue</p>
              )}

              <div className="flex gap-2">
                {room.state.status === 'active' ? (
                  <button onClick={actions.pauseBidding} className="flex-1 btn-secondary py-3 flex items-center justify-center gap-2">
                    <Pause size={20} /> Pause
                  </button>
                ) : (
                  <button onClick={actions.resumeBidding} className="flex-1 btn-secondary py-3 flex items-center justify-center gap-2">
                    <Play size={20} /> Resume
                  </button>
                )}
                <button onClick={actions.endBidding} className="flex-1 btn-danger py-3 flex items-center justify-center gap-2">
                  <Square size={20} /> Force End
                </button>
              </div>
              <button onClick={actions.markAsSold} className="w-full btn-primary bg-green-500 hover:bg-green-600 shadow-[0_0_15px_rgba(34,197,94,0.5)] py-3 mt-2 font-bold text-lg">
                SOLD! (End & Record)
              </button>
            </div>
          )}
        </div>

        <div className="glass-card p-6 flex-1 flex flex-col">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Users size={20} className="text-secondary" /> Connected Bidders ({usersList.length})</h2>
          <div className="flex-1 overflow-y-auto pr-2 space-y-3">
            {usersList.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Waiting for bidders to join...</p>
            ) : (
              usersList.map(user => (
                <div key={user.username} className="flex items-center justify-between p-3 bg-black/30 rounded-xl border border-white/5">
                  <div className="flex items-center gap-3">
                    <img src={user.avatarUrl} alt="" className="w-8 h-8 rounded-full bg-gray-800" />
                    <div>
                      <span className="font-medium">{user.username}</span>
                      {user.inventory?.length > 0 && (
                        <span className="ml-2 text-xs text-purple-400">🎒 {user.inventory.length}</span>
                      )}
                    </div>
                  </div>
                  <span className="font-mono text-secondary">${user.balance.toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Sold Items History */}
        <div className="glass-card p-6 flex-1 flex flex-col">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-green-400">Sold Items History</h2>
          <div className="flex-1 overflow-y-auto pr-2 space-y-3">
            {!room.state.soldItems || room.state.soldItems.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No items sold yet.</p>
            ) : (
              room.state.soldItems.map((item, i) => (
                <div key={i} className="flex flex-col p-3 bg-green-900/20 rounded-xl border border-green-500/30">
                  <span className="font-bold text-white text-lg">{item.itemName}</span>
                  <div className="flex justify-between items-center mt-1 text-sm">
                    <span className="text-gray-400">Winner: <span className="text-primary font-bold">{item.winner}</span></span>
                    <span className="font-mono text-green-400 font-bold">${item.amount.toLocaleString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Middle & Right Columns */}
      <div className="lg:col-span-2 flex flex-col gap-6">
        <div className="glass-card p-8 flex flex-col items-center justify-center relative overflow-hidden min-h-[300px]">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10 opacity-50"></div>

          <div className="z-10 text-center w-full">
            {room.state.status === 'roundEnded' && (
              <div className="mb-4">
                <span className="px-4 py-1.5 rounded-full bg-green-900/40 text-green-400 border border-green-500/30 text-sm font-bold uppercase tracking-wider">
                  Round Ended — Start next item
                </span>
              </div>
            )}
            <h3 className="text-gray-400 text-lg uppercase tracking-wider mb-2">Highest Bid</h3>
            <div className="text-7xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 mb-4 font-mono">
              ${room.state.highestBid.toLocaleString()}
            </div>

            <AnimatePresence mode="wait">
              {room.state.highestBidder ? (
                <motion.div key={room.state.highestBidder}
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                  className="inline-flex items-center gap-3 px-6 py-3 bg-primary/20 border border-primary/40 rounded-full">
                  <span className="text-gray-300">by</span>
                  <span className="font-bold text-xl text-primary">{room.state.highestBidder}</span>
                </motion.div>
              ) : (
                <motion.div className="h-14 flex items-center text-gray-500">No bids yet</motion.div>
              )}
            </AnimatePresence>
          </div>

          {(room.state.status === 'active' || room.state.status === 'paused') && (
            <div className="absolute top-6 right-6 flex flex-col items-end">
              <span className="text-xs text-gray-400 uppercase tracking-widest mb-1">Time Left</span>
              <span className={`text-3xl font-mono font-bold ${timerStatus.timeLeft <= 10 ? 'text-accent animate-pulse' : 'text-secondary'}`}>
                00:{timerStatus.timeLeft.toString().padStart(2, '0')}
              </span>
            </div>
          )}
        </div>

        <div className="glass-card p-6 flex-1 flex flex-col">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Activity size={20} className="text-accent" /> Live Activity</h2>
          <div className="flex-1 overflow-y-auto pr-2 space-y-3 relative">
            {recentBids.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center text-gray-500">No activity yet</div>
            ) : (
              <AnimatePresence>
                {recentBids.map((bid) => (
                  <motion.div key={bid.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between p-4 bg-black/40 rounded-xl border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-accent animate-pulse"></div>
                      <span className="font-bold text-lg">{bid.bidder}</span>
                      <span className="text-gray-400">placed a bid of</span>
                    </div>
                    <span className="font-mono font-bold text-xl text-white">${bid.amount.toLocaleString()}</span>
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
