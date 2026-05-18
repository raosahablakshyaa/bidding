import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Trophy, RefreshCcw, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function WinnerScreen({ room, isHost, actions, currentUser }) {
  const navigate = useNavigate();
  const winnerName = room.state.highestBidder;
  const isWinner = winnerName === currentUser?.username;

  useEffect(() => {
    if (winnerName) {
      const duration = 3000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#6D28D9', '#06B6D4', '#F43F5E']
        });
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#6D28D9', '#06B6D4', '#F43F5E']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    }
  }, [winnerName]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-background z-0"></div>
      {winnerName && (
        <>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[150px] pointer-events-none z-0"></div>
        </>
      )}

      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", bounce: 0.5 }}
        className="glass-card p-12 text-center w-full max-w-2xl z-10 relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary via-secondary to-accent"></div>
        
        <Trophy size={80} className="mx-auto text-yellow-400 mb-8" />
        
        <h2 className="text-2xl text-gray-400 uppercase tracking-widest mb-4">Round Ended</h2>
        
        {winnerName ? (
          <>
            <h1 className="text-5xl md:text-6xl font-black mb-6">
              {isWinner ? "You Won!" : `${winnerName} Won!`}
            </h1>
            <p className="text-xl text-gray-300 mb-2">Item: <span className="font-bold text-white">{room.state.currentItem}</span></p>
            <p className="text-xl text-gray-300 mb-10">Winning Bid: <span className="font-mono font-bold text-secondary text-3xl block mt-2">${room.state.highestBid.toLocaleString()}</span></p>
          </>
        ) : (
          <h1 className="text-4xl font-bold mb-10 text-gray-400">Round ended with no bids.</h1>
        )}

        <div className="flex flex-col md:flex-row justify-center gap-4">
          {isHost && (
            <button 
              onClick={() => actions.startRound(room.state.currentItem)}
              className="btn-primary py-4 px-8 text-lg flex items-center justify-center gap-2"
            >
              <RefreshCcw size={20} /> Next Round
            </button>
          )}
          <button 
            onClick={() => navigate('/')}
            className="btn-secondary py-4 px-8 text-lg flex items-center justify-center gap-2"
          >
            <Home size={20} /> Leave Room
          </button>
        </div>
      </motion.div>
    </div>
  );
}
