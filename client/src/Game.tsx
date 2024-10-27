import * as React from "react";
import { io, Socket } from "socket.io-client";

const socket: Socket = io("http://localhost:5001");

interface Player {
  score: number;
}

const Game: React.FunctionComponent = () => {
  const [message, setMessage] = React.useState<string>("");
  const [playerId, setPlayerId] = React.useState<string | null>(null); // Track player ID
  const [player1, setPlayer1] = React.useState<Player | null>(null);
  const [player2, setPlayer2] = React.useState<Player | null>(null);
  const [currentPlayer, setCurrentPlayer] = React.useState<string | null>(null); // Track current player

  React.useEffect(() => {
    // Connect to the socket
    socket.on("connect", () => {
      console.log("Connected to server");
      console.log("Socket ID:", socket.id);
      setPlayerId(socket.id as string); // Set the player ID once connected
    });

    // Listen for player join events
    socket.on("player-joined", (players: Record<string, Player>) => {
      console.log(players);
      const playerKeys = Object.keys(players);
      if (playerKeys.length > 0) {
        setPlayer1({ score: players[playerKeys[0]].score });
      }
      if (playerKeys.length === 2) {
        setPlayer2({ score: players[playerKeys[1]].score });
      }
    });

    // Listen for score updates
    socket.on("score-updated", (players: Record<string, Player>) => {
      console.log("Score updated:", players);
      const playerKeys = Object.keys(players);
      if (playerKeys.length > 0) {
        setPlayer1({ score: players[playerKeys[0]].score });
      }
      if (playerKeys.length === 2) {
        setPlayer2({ score: players[playerKeys[1]].score });
      }
    });

    // Listen for game state updates to track the current player
    socket.on("game-state-updated", (gameState: { currentPlayer: string }) => {
      console.log("Game state updated:", gameState);
      setCurrentPlayer(gameState.currentPlayer);
    });

    // Handle room full message
    socket.on("room-full", (msg) => {
      setMessage(msg);
      console.log(msg);
    });

    // Handle user disconnection
    socket.on("user-disconnected", (id: string) => {
      console.log("User disconnected:", id);
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
    console.log("Button clicked by: ", { playerId });
    socket.emit("changeScore", playerId);
  };

  return (
    <>
      <div>Dot Box Game</div>
      {message ? (
        <div>{message}</div>
      ) : (
        <div>
          <div>Player One:</div>
          <div>Score: {player1 ? player1.score : "Not connected"}</div>

          <div>
            <div>Player Two:</div>
            <div>Score: {player2 ? player2.score : "Not connected"}</div>
          </div>
          <div>
            <button
              onClick={handleOnClick}
              disabled={currentPlayer !== playerId} // Disable if current player is not the connected player
            >
              Click me
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Game;
