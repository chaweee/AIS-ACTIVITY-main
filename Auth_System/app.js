import express from "express";
import "dotenv/config.js";
import UserRoutes from "./routes/UserRoutes.js";
import cors from "cors";

// Create express app
const app = express();

// Enable CORS to front-end
let corsOptions = {
  origin: process.env.ORIGIN,
};

app.use((req, res, next) => {
  console.log(req.path, req.method);
  next();
});

// Middleware
app.use(express.json());
app.use(cors(corsOptions));

const port = process.env.PORT || 3000;

try {
  app.listen(port, () => {
    console.log(`Listening on port ${port}...`);
  });
} catch (e) {
  console.log(e);
}

// Routes
app.use("/user", UserRoutes);
