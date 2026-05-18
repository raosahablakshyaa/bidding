import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Trophy, RefreshCcw, X } from 'lucide-react';

export default function WinnerScreen({ winnerDetails, isHost, currentUser, onDismiss, onNextRound }) {
  const [nextItem, setNextItem] = useState('');
  const isWinner = winnerDetails?.winner === currentUser?.username;

  useEffect(() => {
    if (winnerDetails?.winner) {
      const end = Date.now() + 3000;
      const frame = () => {
        confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#6D28D9', '#06B6D4', '#F43F5E'] });
        confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#6D28D9', '#06B6D4', '#F43F5E'] });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      frame();
    }
  }, [winnerDetails?.winner]);

  const handleNextRound = (e) => {
    e.preventDefault();
    if (nextItem.trim()) {
      onNextRound(nextItem.trim());
      setNextItem('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', bounce: 0.5 }}
        className="glass-card p-10 text-center w-full max-w-lg relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary via-secondary to-accent"></div>

        <button onClick={onDismiss} className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-lg transition-colors">
          <X size={20} />
        </button>

        <Trophy size={64} className="mx-auto text-yellow-400 mb-6" />
        <h2 className="text-xl text-gray-400 uppercase tracking-widest mb-3">Round Ended</h2>

        {winnerDetails?.winner ? (
          <>
            <h1 className="text-4xl md:text-5xl font-black mb-4">
              {isWinner ? 'You Won! 🎉' : `${winnerDetails.winner} Won!`}
            </h1>
            <p className="text-lg text-gray-300 mb-1">
              Item: <span className="font-bold text-white">{winnerDetails.itemName}</span>
            </p>
            <p className="text-lg text-gray-300 mb-8">
              Winning Bid: <span className="font-mono font-bold text-secondary text-2xl">${winnerDetails.amount.toLocaleString()}</span>
            </p>
          </>
        ) : (
          <h1 className="text-3xl font-bold mb-8 text-gray-400">Round ended with no bids.</h1>
        )}

        {isHost ? (
          <form onSubmit={handleNextRound} className="flex gap-3">
            <input
              type="text"
              value={nextItem}
              onChange={e => setNextItem(e.target.value)}
              placeholder="Next item to bid on..."
              className="input-field flex-1"
              autoFocus
            />
            <button type="submit" disabled={!nextItem.trim()} className="btn-primary px-6 flex items-center gap-2">
              <RefreshCcw size={18} /> Start
            </button>
          </form>
        ) : (
          <p className="text-gray-400">Waiting for host to start next round...</p>
        )}
      </motion.div>
    </div>
  );
}
