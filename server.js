const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path'); // Added this to find your files

const app = express();

app.use(cors());

// Modified Helmet so it doesn't block your video streaming/scripts on Vercel
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

app.use(express.json());

// 1. Tell Express to serve your HTML, CSS, and JS files from your main folder
app.use(express.static(__dirname));

// 2. This completely stops the "Cannot GET" error by sending your front-end file
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Live on port ${PORT}`);
});
