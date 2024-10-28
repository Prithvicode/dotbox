import React, { useEffect, useRef } from "react";

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
  players: Record<string, { score: number }>;
}

interface BoardProps {
  gameState: GameState;
  socket: any;
}

const Board: React.FC<BoardProps> = ({ gameState, socket }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  console.log("game state inside board:", gameState);
  console.log("game socket inside board:", socket);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear the canvas before each render
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw each box in the gameState
    gameState.board.forEach((box) => {
      const { x1, y1, width, height, isCompleted, completedBy } = box;

      // Draw Boxes
      ctx.strokeStyle = "lightgray";
      ctx.strokeRect(x1, y1, width, height); // Draw the border

      drawDot(ctx, x1, y1); // Top-left corner
      drawDot(ctx, x1 + width, y1); // Top-right corner
      drawDot(ctx, x1, y1 + height); // Bottom-left corner
      drawDot(ctx, x1 + width, y1 + height); // Bottom-right corner of each boxes.
    });
  }, [gameState]);

  // Function to draw dots
  function drawDot(ctx: CanvasRenderingContext2D, x: number, y: number) {
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2); // Adjust dot size if needed
    ctx.fillStyle = "black";
    ctx.fill();
    ctx.closePath();
  }

  return (
    <canvas
      ref={canvasRef}
      width={500}
      height={500}
      className="border-2 border-black"
    ></canvas>
  );
};

export default Board;
