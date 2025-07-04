const express = require('express');
const cors = require('cors');
// const runAgent = require('./agent'); // import your logic here
const WebSocket = require('ws');
const  agent  = require('./controllers/agent');
const http = require('http');
const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);


// WebSocket setup
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  console.log('✅ WebSocket client connected');

  ws.on('message', async (msg) => {
    try {
      const data = JSON.parse(msg);
      await agent.init(ws, data);
    } catch (err) {
      ws.send(JSON.stringify({ error: 'Invalid message format or internal error.' }));
    }
  });

  ws.on('close', () => {
    console.log('❌ WebSocket client disconnected');
  });
});
const agentRoutes = require('./routes/agent');
app.use('/api/agent', agentRoutes);

// app.listen(3001, () => console.log('Backend listening on port 3001'));
server.listen(3001, () => {
  console.log('Backend listening on port 3001');
});