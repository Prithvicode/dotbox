import * as React from "react";
import { io, Socket } from "socket.io-client";
import Board from "./Components/Board";

const socket: Socket = io("http://localhost:5001");

interface Player {
  score: number;
}

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

interface GameState {
  board: Box[];
  currentPlayer: string;
  players: Record<string, Player>;
}

const Game: React.FunctionComponent = () => {
  const [message, setMessage] = React.useState<string>("");
  const [playerId, setPlayerId] = React.useState<string | null>(null);
  const [players, setPlayers] = React.useState<Record<string, Player>>({});
  const [currentPlayer, setCurrentPlayer] = React.useState<string | null>(null);
  const [gameState, setGameState] = React.useState<GameState | null>(null);

  React.useEffect(() => {
    // Connect to the socket
    socket.on("connect", () => {
      console.log("Connected to server");
      console.log("Socket ID:", socket.id);
      setPlayerId(socket.id as string);
    });

    // Listen for player join events
    socket.on("player-joined", (players: Record<string, Player>) => {
      console.log(players);
      setPlayers(players);
    });

    // Initial Game state
    socket.on("initial-game-state", (gameState) => {
      setGameState(gameState);
    });
    // Listen for game state updates
    socket.on("game-state-updated", (newGameState: GameState) => {
      setGameState(newGameState);
      setCurrentPlayer(newGameState.currentPlayer);
    });

    // Listen for score updates
    socket.on("score-updated", (updatedPlayers: Record<string, Player>) => {
      console.log("Score updated:", updatedPlayers);
      setPlayers(updatedPlayers);
    });

    // Handle room full message
    socket.on("room-full", (msg) => {
      setMessage(msg);
      console.log(msg);
    });

    // Handle user disconnection
    socket.on("user-disconnected", (id: string) => {
      console.log("User disconnected:", id);
      setPlayers((prevPlayers) => {
        const { [id]: _, ...remainingPlayers } = prevPlayers; // Remove disconnected player
        return remainingPlayers;
      });
    });

    // Cleanup to avoid memory leaks
    return () => {
      socket.off("connect");
      socket.off("player-joined");
      socket.off("score-updated");
      socket.off("game-state-updated");
      socket.off("room-full");
      socket.off("user-disconnected");
    };
  }, []);

  // ======================= USER EVENTS =============================
  const handleOnClick = () => {
    console.log("Button clicked by:", { playerId });
    socket.emit("changeScore", playerId);
  };
  return (
    <>
      <div>Dot Box Game</div>
      {message ? (
        <div>{message}</div>
      ) : (
        <div>
          {Object.entries(players).map(([id, player]) => (
            <div key={id}>
              <div>{`Player ${id}:`}</div>
              <div>{`Score: ${player.score}`}</div>
            </div>
          ))}
          <div>
            <button
              onClick={handleOnClick}
              disabled={currentPlayer !== playerId} // Disable if current player is not the connected player
            >
              Click me
            </button>
          </div>
          {/* Board component should be rendered here, after the button */}
          <div>
            {gameState && <Board gameState={gameState} socket={socket} />}
          </div>
        </div>
      )}
    </>
  );
};

export default Game;
