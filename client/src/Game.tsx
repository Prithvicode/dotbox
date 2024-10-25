import * as React from "react";
import { io, Socket } from "socket.io-client";

const socket: Socket = io("http://localhost:5001");

const Game: React.FunctionComponent = () => {
  const [currentUser, setCurrentUser] = React.useState<string | null>(null);

  React.useEffect(() => {
    socket.on("connect", () => {
      console.log("Connected to server");
      setCurrentUser(socket.id ?? null);
    });

    socket.on("user-connected", (id: string) => {
      console.log("User connected:", id);
    });

    socket.on("user-disconnected", (id: string) => {
      console.log("User disconnected:", id);
    });
    // Cleanup to avoid memory leaks
    return () => {
      socket.off("connect");
    };
  }, []);

  React.useEffect(() => {
    if (currentUser) {
      console.log("Current User ID:", currentUser);
    }
  }, [currentUser]);

  return (
    <>
      <div>Game</div>
      <div>User ID: {currentUser}</div>
    </>
  );
};

export default Game;
