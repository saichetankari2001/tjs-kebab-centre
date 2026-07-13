require('dotenv').config();
const express = require('express');
const cors    = require('cors');

const healthRouter    = require('./routes/health');
const subscribeRouter = require('./routes/subscribe');
const notifyRouter    = require('./routes/notify');

const app  = express();
const PORT = process.env.PORT ?? 4000;

const corsOptions = { origin: process.env.FRONTEND_URL ?? 'http://localhost:3000', optionsSuccessStatus: 200 };
app.options('*', cors(corsOptions));
app.use(cors(corsOptions));
app.use(express.json());

app.use('/health',        healthRouter);
app.use('/api/subscribe', subscribeRouter);
app.use('/api/notify',    notifyRouter);

app.listen(PORT, () => console.log(`TJ's backend running on port ${PORT}`));
