import * as React from "react";
import { io, Socket } from "socket.io-client";
import DotAndBoxes from "./Components/DotAndBoxes";

const socket: Socket = io("http://localhost:5001");

interface Player {
  id: string;
}

const Game: React.FunctionComponent = () => {
  const [currentUser, setCurrentUser] = React.useState<string | null>(null);
  const [playerTwo, setPlayerTwo] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState("");

  React.useEffect(() => {
    // Connect to the socket
    socket.on("connect", () => {
      console.log("Connected to server");
      setCurrentUser(socket.id ?? null);
    });

    // Listen for player join events
    socket.on("player-joined", (room: Player[]) => {
      console.log(room);

      // Find the second player who is not the current user
      const secondPlayer = room.find((player) => player.id !== currentUser);

      // Only update playerTwo if a second player exists and it's not the current user
      if (secondPlayer) {
        setPlayerTwo(secondPlayer.id);
      } else {
        setPlayerTwo(null); // Reset if there's no valid second player
      }
    });

    // Handle room full message
    socket.on("room-full", (msg) => {
      setMessage(msg);
      console.log(msg); // Log the message or show it in the UI
    });

    // Handle user disconnection
    socket.on("user-disconnected", (id: string) => {
      console.log("User disconnected:", id);
      // Optionally handle player disconnection logic here
    });

    // Cleanup to avoid memory leaks
    return () => {
      socket.off("connect");
      socket.off("player-joined");
      socket.off("room-full");
      socket.off("user-disconnected");
    };
  }, [currentUser]); // Added currentUser to the dependencies

  return (
    <>
      <div>Game</div>
      <div>User ID: {currentUser}</div>
      <div>Player Two ID: {playerTwo}</div>
      <div>{message}</div> {/* Display the message if room is full */}
      <DotAndBoxes />
    </>
  );
};

export default Game;
