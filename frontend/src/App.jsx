import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Landing from './pages/Landing';
import JoinRoom from './pages/JoinRoom';
import Room from './pages/Room';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-background text-white font-sans overflow-x-hidden">
        <Toaster 
          position="top-center"
          toastOptions={{
            style: {
              background: '#18181B',
              color: '#fff',
              border: '1px solid #27272A'
            }
          }}
        />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/join/:roomId" element={<JoinRoom />} />
          <Route path="/room/:roomId" element={<Room />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
