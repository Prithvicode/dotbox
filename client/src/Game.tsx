import * as React from "react";
import { io, Socket } from "socket.io-client";
import Board from "./Components/Board";
import playerImage from "./assets/person.png";

const socket: Socket = io("http://localhost:5001");

interface Player {
  score: number;
  color: string;
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
  board: Box[][];
  currentPlayer: string;
  players: Record<string, Player>;
  isGameOver: Boolean;
  winner: string;
}

const Game: React.FunctionComponent = () => {
  const [message, setMessage] = React.useState<string>("");
  const [playerId, setPlayerId] = React.useState<string | null>(null);
  const [players, setPlayers] = React.useState<Record<string, Player>>({});
  const [currentPlayer, setCurrentPlayer] = React.useState<string | null>(null);
  const [gameState, setGameState] = React.useState<GameState | null>(null);
  const [gameOver, setGameOver] = React.useState<boolean>(false);

  React.useEffect(() => {
    socket.on("connect", () => {
      console.log("Connected to server");
      console.log("Socket ID:", socket.id);
      setPlayerId(socket.id as string);
    });

    socket.on("initial-game-state", (gameState) => {
      setGameState(gameState);
      setPlayers(gameState.players);
    });

    socket.on("game-state-updated", (newGameState: GameState) => {
      setGameState(newGameState);
      setPlayers(newGameState.players);
      setCurrentPlayer(newGameState.currentPlayer);
    });

    // Check Game Status for Winner; draw, winner: playerId
    socket.on("game-over", (gameState) => {
      setGameOver(gameState.isGameOver);
    });

    socket.on("room-full", (msg) => {
      setMessage(msg);
      console.log(msg);
    });

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
  const handlePlayAgain = () => {
    console.log("Button clicked by:", { playerId });
    socket.emit("play-again", gameState);
    setGameOver(false);
  };
  return (
    <>
      <div className="border-2 border-black m-5 flex flex-col items-center">
        <h1 className="text-3xl font-bold">Dot Box Game</h1>
        {message ? (
          <div>{message}</div>
        ) : (
          <div className="border-2 w-full">
            <div className="flex justify-around border-2 w-full ">
              {Object.entries(players).map(([id, player]) => (
                <div
                  key={id}
                  className="flex text-xl font-medium items-center space-x-2"
                >
                  {/* <div>{`Player ${id}:`}</div> */}
                  <div
                    className="border-2 border-black rounded-full p-1"
                    style={{ backgroundColor: player.color }}
                  >
                    <img src={playerImage} alt="" height={20} width={20} />
                  </div>
                  <div className="bg-black/70 relative -left-4 text-white px-3 -z-10 rounded-r-lg">
                    {socket.id == id
                      ? "Your Score: " + player.score
                      : "Opp Score: " + player.score}
                  </div>
                </div>
              ))}
            </div>
            {/* Player Turn  */}
            <div className="border-2 text-center flex justify-center items-center space-x-7 mb-5">
              <span className="text-3xl font-bold">Turn: </span>

              {gameState && gameState.currentPlayer ? (
                <div
                  className="border-2 border-black rounded-lg inline-block"
                  style={{
                    backgroundColor:
                      gameState.players[gameState.currentPlayer]?.color ||
                      "transparent", // Use optional chaining and fallback
                  }}
                >
                  <img src={playerImage} alt="" height={30} width={30} />
                </div>
              ) : (
                <span>No current player</span> // Fallback if no current player
              )}
            </div>
            {/* Wait for player 2 to join */}
            {Object.keys(players).length < 2 ? (
              <div> Wait for player 2 to be connected.....</div>
            ) : (
              <div className="">
                {gameState && <Board gameState={gameState} socket={socket} />}
              </div>
            )}
            <div>
              {gameOver && (
                <div>
                  {" "}
                  Game is over
                  {/* Show Winner */}
                  {gameState?.isGameOver && gameState.winner == "draw" ? (
                    <div> It is draw</div>
                  ) : (
                    // Dispaly winner
                    <div>{gameState?.winner}</div>
                  )}
                  <button onClick={handlePlayAgain}>Play again</button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Game;
