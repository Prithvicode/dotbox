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

const players: Record<string, Player> = {};

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
): Box[][] => {
  const board: Box[][] = [];
  for (let i = 0; i < rows; i++) {
    const row: Box[] = [];
    for (let j = 0; j < cols; j++) {
      const box: Box = {
        topWall: false,
        bottomWall: false,
        leftWall: false,
        rightWall: false,
        x1: startX + j * width,
        y1: startY + i * height,
        height: height,
        width: width,
        color: "gray",
        isCompleted: false,
        completedBy: "",
      };
      row.push(box);
    }
    board.push(row);
  }
  return board;
};

const gameState = {
  players,
  currentPlayer: "",
  board: initBoard(3, 3, 20, 20, 60, 60),
  isGameOver: false,
  winner: "",
};
gameState.board.forEach((row) => {
  row.forEach((box) => {
    console.log(box);
  });
});

// ======================= EVENTS =============================

io.on("connection", (socket) => {
  console.log(`New connection: ${socket.id}`);

  if (Object.keys(players).length === 2) {
    console.log("The room is full.");
    socket.emit("room-full", "The room is full. Wait for the game to finish..");
    socket.disconnect(true);
    return;
  }

  // Add the new player
  players[socket.id] = { score: 0 };

  // Set Current Player to the first player who connected
  if (Object.keys(players).length === 1) {
    gameState.currentPlayer = socket.id;
  }

  // io.emit("player-joined", gameState.players);

  io.emit("initial-game-state", gameState);

  interface completedBox {
    row: number;
    col: number;
    box: Box;
    completedBy: string;
  }
  socket.on("box-completed", (completedBoxes) => {
    completedBoxes.forEach((boxData: completedBox) => {
      const { row, col, completedBy } = boxData;
      if (gameState.players[completedBy]) {
        gameState.players[completedBy].score += 10;
      }

      gameState.board[row][col].isCompleted = true;
      gameState.board[row][col].completedBy = completedBy;

      console.log("Completed box:", gameState.board[row][col]);
      console.log(
        `Completed by: ${completedBy}, score: ${gameState.players[completedBy].score}`
      );
    });

    // Toggle current player
    const playerKeys = Object.keys(players);
    gameState.currentPlayer =
      playerKeys[1 - playerKeys.indexOf(gameState.currentPlayer)];

    checkGameStatus();

    // Emit updated game state
    io.emit("game-state-updated", gameState);
    console.log("Players:", gameState.players);
    console.log(
      "Current player after box completion:",
      gameState.currentPlayer
    );
  });

  socket.on("board-state-updated", (updatedGameState) => {
    // console.log("Received updated board state:", updatedBoard);
    gameState.board = updatedGameState.board;

    // Toggle currentPlayer
    const playerKeys = Object.keys(players);
    gameState.currentPlayer =
      playerKeys[1 - playerKeys.indexOf(updatedGameState.currentPlayer)]; // Switch players

    io.emit("game-state-updated", gameState);
    console.log(gameState.players);
    console.log("CurrentPlayer from boardUpate:", gameState.currentPlayer);
  });

  const checkGameStatus = () => {
    let allBoxesCompleted = true;
    for (let row of gameState.board) {
      for (let box of row) {
        if (!box.isCompleted) {
          allBoxesCompleted = false;
          break;
        }
      }
    }
    if (allBoxesCompleted) {
      gameState.isGameOver = true;
      determineWinner();
      io.emit("game-over", gameState);
      console.log("Game Over. Winner:", gameState.winner);
    }
  };

  const determineWinner = () => {
    const playerKeys = Object.keys(players);
    const [player1, player2] = playerKeys;

    if (gameState.players[player1].score > gameState.players[player2].score) {
      gameState.winner = player1;
    } else if (
      gameState.players[player1].score < gameState.players[player2].score
    ) {
      gameState.winner = player2;
    } else {
      gameState.winner = "draw";
    }
  };

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
