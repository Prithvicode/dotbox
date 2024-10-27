import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { Server } from "socket.io";
import { createServer } from "http";
import { connection } from "mongoose";

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

// 1. Server connection
// 2. Create players state, store them as socket key as id
// 3. Each player will increase their respective scoreState

// ======================= STATES =============================
interface Player {
  score: number;
}

const players: Record<string, Player> = {}; // Holds the players

const gameState = {
  players, // Reference players here
  currentPlayer: "",
  boardState: "",
  playerState: "",
  gameStatus: "",
};

// ======================= EVENTS =============================
io.on("connection", (socket) => {
  console.log(`New connection: ${socket.id}`);

  // Room Full
  if (Object.keys(players).length == 2) {
    console.log("The room is full.");
    socket.emit("room-full", "The room is full. Wait for game to finish..");
    socket.disconnect(true);
  } else {
    // Add the new player to the players object
    players[socket.id] = {
      score: 0,
    };
  }

  io.emit("player-joined", players);
  console.log(players);

  //===== Score =====
  socket.on("changeScore", (id) => {
    players[id].score += 1;

    console.log(`Player score:${id} : ${players[id].score}`);
    io.emit("score-updated", players);
    console.log(players);
  });

  // Handle player disconnection
  socket.on("disconnect", () => {
    // Remove the player from the players object on disconnect
    delete players[socket.id];
    console.log(players);

    // Notify other players that a user has disconnected
    io.emit("user-disconnected", socket.id);
    console.log(
      `User disconnected: ${socket.id}. Current players: ${
        Object.keys(players).length
      }`
    );
  });
});

// ======================= MIDDLEWARE =============================
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
