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

interface Box {
  topWall: boolean;
  bottomWall: boolean;
  leftWall: boolean;
  rightWall: boolean;
  x1: number;
  y1: number;
  height: number;
  width: number;
  color: string;
  isCompleted: boolean;
  completedBy: string;
}

// ================== Initial Board ==============
const initBoard = (
  rows: number,
  cols: number,
  startX: number,
  startY: number,
  width: number,
  height: number
): Box[] => {
  const board: Box[] = [];
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      board.push({
        topWall: false,
        bottomWall: false,
        leftWall: false,
        rightWall: false,
        x1: startX + i * width,
        y1: startY + j * height,
        height: height,
        width: width,
        color: "gray",
        isCompleted: false,
        completedBy: "",
      });
    }
  }
  return board;
};

const gameState = {
  players,
  currentPlayer: "",
  board: initBoard(7, 7, 20, 20, 60, 60),
};

console.log(gameState);

// ======================= EVENTS =============================

io.on("connection", (socket) => {
  console.log(`New connection: ${socket.id}`);

  if (Object.keys(players).length === 2) {
    console.log("The room is full.");
    socket.emit("room-full", "The room is full. Wait for the game to finish..");
    socket.disconnect(true);
    return;
  }

  // Add the new player to the players object
  players[socket.id] = { score: 0 };

  // Set Current Player to the first player who connected
  if (Object.keys(players).length === 1) {
    gameState.currentPlayer = socket.id;
  }

  // Emit player joined event and initial game state to the newly connected client
  io.emit("player-joined", players);

  io.emit("initial-game-state", gameState);

  console.log(players);

  // Handle score and game state updates
  const updateGameState = (id: string) => {
    if (id !== gameState.currentPlayer) return;

    players[id].score += 1;

    // Switch current player
    const playerKeys = Object.keys(players);
    gameState.currentPlayer = playerKeys[1 - playerKeys.indexOf(id)]; // Switch players

    console.log(`Player score:${id} : ${players[id].score}`);
    io.emit("score-updated", players);
    io.emit("game-state-updated", gameState);
    console.log("Game status: ", gameState);
  };

  // Listen to the "changeScore" event
  socket.on("changeScore", updateGameState);

  // Handle player disconnection
  socket.on("disconnect", () => {
    delete players[socket.id];
    console.log(
      `User disconnected: ${socket.id}. Current players: ${
        Object.keys(players).length
      }`
    );

    io.emit("user-disconnected", socket.id);

    // If a player disconnects, update currentPlayer to the remaining player
    if (Object.keys(players).length === 1) {
      gameState.currentPlayer = Object.keys(players)[0];
      io.emit("game-state-updated", gameState);
    }
  });
});

// ======================= MIDDLEWARE =============================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
