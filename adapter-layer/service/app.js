import express from "express";
import 'dotenv/config.js';

import authRoutes from "../routes/authRoutes.js";

// Create express app
const app = express();

app.use(express.json());

app.use((req, res, next) => {
  console.log(req.path, req.method);
  next();
});

app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Adapter-layer service listening on port ${PORT}`));
