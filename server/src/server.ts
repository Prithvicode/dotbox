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

// ======================= STATES =============================

interface Player {
  score: number;
}

const players: Record<string, Player> = {}; // Holds the players

const gameState = {
  players, // Reference players here
  currentPlayer: "", // Store current player ID
  // Additional game states can be added here
};

// ======================= EVENTS =============================

io.on("connection", (socket) => {
  console.log(`New connection: ${socket.id}`);

  // Room Full
  if (Object.keys(players).length == 2) {
    console.log("The room is full.");
    socket.emit("room-full", "The room is full. Wait for the game to finish..");
    socket.disconnect(true);
  } else {
    // Add the new player to the players object
    players[socket.id] = { score: 0 };

    // Set Current Player to the first player who connected
    if (Object.keys(players).length === 1) {
      gameState.currentPlayer = socket.id;
    }
  }

  // Emit player joined event
  io.emit("player-joined", players);
  console.log(players);

  //===== Score =====
  socket.on("changeScore", (id) => {
    if (id === gameState.currentPlayer) {
      players[id].score += 1;

      // Switch current player
      const playerKeys = Object.keys(players);
      gameState.currentPlayer = playerKeys[1 - playerKeys.indexOf(id)]; // 0, 1

      console.log(`Player score:${id} : ${players[id].score}`);
      io.emit("score-updated", players);
      io.emit("game-state-updated", { currentPlayer: gameState.currentPlayer }); // Emit current player change
      console.log(players);
    }
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

    // If a player disconnects, update currentPlayer to the remaining player
    if (Object.keys(players).length === 1) {
      gameState.currentPlayer = Object.keys(players)[0];
      io.emit("game-state-updated", { currentPlayer: gameState.currentPlayer });
    }
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
