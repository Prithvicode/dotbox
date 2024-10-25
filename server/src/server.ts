import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { Server } from "socket.io";
import { createServer } from "http";

dotenv.config();
const port = process.env.PORT || 5001;

const app = express();
const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log(`New connection: ${socket.id}`);

  io.emit("user-connected", socket.id);

  // Disconnect
  socket.on("disconnect", () => {
    io.emit("user-disconnected", socket.id);
    console.log(`User disconnected: ${socket.id}`);
  });
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cors
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.get("/", (req, res) => {
  res.send({ message: "Hello from server" });
});

server.listen(port, () => {
  console.log(`Server created successfully on port ${port}`);
});
