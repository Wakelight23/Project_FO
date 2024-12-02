import express from 'express';
import CreateRosterRouter from './routes/createRoster.router.js';

const app = express();
const port = 3000;

app.use(express.json());

app.use('/api', [CreateRosterRouter]);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
