require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Import socket handler
const initSockets = require('./socket');
initSockets(io);

// Basic health checks
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Bidding Arena Backend is running' });
});

app.get('/', (req, res) => {
  res.send('Bidding Arena Backend is active! Please open the Frontend app to use the UI.');
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
