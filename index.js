const express = require('express');
const cors = require('cors');
// const runAgent = require('./agent'); // import your logic here

const app = express();
app.use(cors());
app.use(express.json());

// app.post('/api/agent', async (req, res) => {
//     const { query } = req.body;
//     try {
//         const result = await runAgent(query);
//         res.json({ result });
//     } catch (err) {
//         res.status(500).json({ error: err.message });
//     }
// });

const agentRoutes = require('./routes/agent');
app.use('/api/agent', agentRoutes);

app.listen(3001, () => console.log('Backend listening on port 3001'));