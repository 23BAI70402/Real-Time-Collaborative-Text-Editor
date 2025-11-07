import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import { setupWSConnection } from "./wsServer.js";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.log("❌ MongoDB Error:", err));

app.get("/", (req, res) => res.send("Backend running successfully!"));

const server = createServer(app);
const wss = new WebSocketServer({ server });

wss.on("connection", setupWSConnection);

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`🚀 Server started on port ${PORT}`));
