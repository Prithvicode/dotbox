import React, { useEffect, useRef, useState } from "react";

// Refact: redundant codes, choose proper data structure, modules or class (methods)

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
  players: Record<string, { score: number; color: string }>;
}

interface BoardProps {
  gameState: GameState;
  socket: any;
}

type Dot = { x: number; y: number }; // Corner
type Line = { dot1: Dot; dot2: Dot }; // Side

interface BoxCorners {
  [key: string]: Dot[];
}

interface BoxSides {
  [key: string]: Line[];
}

const Board: React.FC<BoardProps> = ({ gameState, socket }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  let boxCorners: BoxCorners = {}; // To check the mouse events
  let startDot: Dot;
  let endDot: Dot;

  let boxSides: BoxSides = {}; // To check Box Wall

  let currentPlayerColor =
    gameState.players[gameState.currentPlayer]?.color || "transparent"; // can make currentPlayer = player insted of playerId

  useEffect(() => {
    gameState.board.forEach((row, rowIndex) => {
      row.forEach((box, colIndex) => {
        const { x1, y1, width, height } = box;

        const key = `box-${rowIndex}-${colIndex}`;
        boxCorners[key] = [
          { x: x1, y: y1 }, // Top-left corner
          { x: x1 + width, y: y1 }, // Top-right corner
          { x: x1, y: y1 + height }, // Bottom-left corner
          { x: x1 + width, y: y1 + height }, // Bottom-right corner
        ];

        boxSides[key] = [
          { dot1: { x: x1, y: y1 }, dot2: { x: x1, y: y1 + height } }, // Left Side
          {
            dot1: { x: x1 + width, y: y1 },
            dot2: { x: x1 + width, y: y1 + height },
          }, // Right Side
          {
            dot1: { x: x1, y: y1 + height },
            dot2: { x: x1 + width, y: y1 + height },
          }, // Bottom Side
          { dot1: { x: x1, y: y1 }, dot2: { x: x1 + width, y: y1 } }, // Top Side
        ];
      });
    });

    // console.log(boxCorners);
    // console.log(boxSides);
  }, [gameState]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear the canvas before each render
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw each box in the gameState
    gameState.board.forEach((row) => {
      row.forEach((box) => {
        const {
          x1,
          y1,
          width,
          height,
          leftWall,
          rightWall,
          topWall,
          bottomWall,
          color,
        } = box;

        // Draw Boxes
        ctx.strokeStyle = "transparent";
        ctx.strokeRect(x1, y1, width, height); // Draw the border
        ctx.fillStyle = color;
        ctx.fillRect(x1, y1, width, height);
        // Draw available lines based on wall states
        if (leftWall) {
          drawLine(ctx, { x: x1, y: y1 }, { x: x1, y: y1 + height });
        }
        if (rightWall) {
          drawLine(
            ctx,
            { x: x1 + width, y: y1 },
            { x: x1 + width, y: y1 + height }
          );
        }
        if (topWall) {
          drawLine(ctx, { x: x1, y: y1 }, { x: x1 + width, y: y1 });
        }
        if (bottomWall) {
          drawLine(
            ctx,
            { x: x1, y: y1 + height },
            { x: x1 + width, y: y1 + height }
          );
        }

        // Draw Dots
        drawDot(ctx, x1, y1, currentPlayerColor); // Top-left corner
        drawDot(ctx, x1 + width, y1, currentPlayerColor); // Top-right corner
        drawDot(ctx, x1, y1 + height, currentPlayerColor); // Bottom-left corner
        drawDot(ctx, x1 + width, y1 + height, currentPlayerColor); // Bottom-right corner of each box.
      });
    });
  }, [gameState]);

  function drawDot(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    color: string
  ) {
    ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 5;
    ctx.shadowOffsetY = 5;

    ctx.beginPath();
    ctx.arc(x, y, 10, 0, Math.PI * 2);
    ctx.strokeStyle = color ? color : "white";
    ctx.stroke();
    ctx.fillStyle = "lightgray";
    ctx.fill();
    ctx.closePath();
  }

  function drawLine(
    ctx: CanvasRenderingContext2D,
    start: { x: number; y: number },
    end: { x: number; y: number }
  ) {
    ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 5;
    ctx.shadowOffsetY = 5;

    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.strokeStyle = "gray";
    ctx.lineWidth = 8;
    ctx.stroke();
    ctx.closePath();
  }

  // =============== EVENTS =================
  // Disable the event if currentPlayer != socket.id
  // Toggle the current Player

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (socket.id != gameState.currentPlayer) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();

    // Mouse coordinates relative to the canvas;(0,0) = rect.top-left
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // console.log("Mouse Down at:", { x: mouseX, y: mouseY });
    for (const key in boxCorners) {
      boxCorners[key].forEach((dot) => {
        if (
          mouseX - dot.x < 10 &&
          mouseX - dot.x > -10 &&
          mouseY - dot.y < 10 &&
          mouseY - dot.y > -10
        ) {
          startDot = { x: dot.x, y: dot.y };
          //   console.log("Start dot: ", startDot);
        }
      });
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (socket.id != gameState.currentPlayer) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    for (const key in boxCorners) {
      boxCorners[key].forEach((dot) => {
        if (
          mouseX - dot.x < 10 &&
          mouseX - dot.x > -10 &&
          mouseY - dot.y < 10 &&
          mouseY - dot.y > -10
        ) {
          endDot = { x: dot.x, y: dot.y };
          //   console.log("End Dot: ", endDot);
        }
      });
    }

    // Update the game state if a valid line is drawn
    if (startDot && endDot) {
      for (const key in boxSides) {
        boxSides[key].forEach((side, index) => {
          if (
            (startDot.x === side.dot1.x &&
              startDot.y === side.dot1.y &&
              endDot.x === side.dot2.x &&
              endDot.y === side.dot2.y) ||
            (startDot.x === side.dot2.x &&
              startDot.y === side.dot2.y &&
              endDot.x === side.dot1.x &&
              endDot.y === side.dot1.y)
          ) {
            // Determine the box indices from the key ("box-1-2")
            const [, rowIndex, colIndex] = key.split("-");
            const i = parseInt(rowIndex);
            const j = parseInt(colIndex);

            updateWallState(i, j, index);
          }
        });
      }
    }
  };

  const updateWallState = (i: number, j: number, sideIndex: number) => {
    const updatedBoard = [...gameState.board];
    const box = updatedBoard[i][j];
    let isWallUpdated = false;

    switch (sideIndex) {
      case 0: // Left wall
        if (!box.leftWall) {
          box.leftWall = true;
          isWallUpdated = true;

          // Update right wall of the previous box if it exists
          if (j > 0) {
            const previousBox = updatedBoard[i][j - 1];
            previousBox.rightWall = true;
          }
        }
        break;

      case 1: // Right wall
        if (!box.rightWall) {
          box.rightWall = true;
          isWallUpdated = true;

          // Update left wall of the next box if it exists
          if (j < updatedBoard[i].length - 1) {
            const nextBox = updatedBoard[i][j + 1];
            nextBox.leftWall = true;
          }
        }
        break;

      case 2: // Bottom wall
        if (!box.bottomWall) {
          box.bottomWall = true;
          isWallUpdated = true;

          // Update top wall of the box below if it exists
          if (i < updatedBoard.length - 1) {
            const nextBox = updatedBoard[i + 1][j];
            nextBox.topWall = true;
          }
        }
        break;

      case 3: // Top wall
        if (!box.topWall) {
          box.topWall = true;
          isWallUpdated = true;

          // Update bottom wall of the box above if it exists
          if (i > 0) {
            const previousBox = updatedBoard[i - 1][j];
            previousBox.bottomWall = true;
          }
        }
        break;

      default:
        console.log("Invalid side index");
        return;
    }

    if (isWallUpdated) {
      // Update game state and emit the updated board
      gameState.board = updatedBoard;
      socket.emit("board-state-updated", gameState);
      console.log("Wall updated at:", i, j, "side:", sideIndex);

      checkBoxCompletion(i, j);
    } else {
      console.log(
        "Invalid move. Wall already exists at:",
        i,
        j,
        "side:",
        sideIndex
      );
    }
  };
  interface CompletedBoxData {
    row: number;
    col: number;
    box: Box;
    completedBy: string;
    color: string;
  }

  const checkBoxCompletion = (i: number, j: number) => {
    const completedBoxes: CompletedBoxData[] = [];

    const checkAndAddBox = (row: number, col: number) => {
      const box = gameState.board[row]?.[col];
      if (
        box &&
        box.topWall &&
        box.bottomWall &&
        box.leftWall &&
        box.rightWall &&
        !box.isCompleted
      ) {
        completedBoxes.push({
          row,
          col,
          box,
          completedBy: gameState.currentPlayer,
          color: gameState.players[gameState.currentPlayer].color,
        });

        box.isCompleted = true;
      }
    };

    // Check current and neighboring boxes
    checkAndAddBox(i, j);
    if (i > 0) checkAndAddBox(i - 1, j); // Top neighbor
    if (i < gameState.board.length - 1) checkAndAddBox(i + 1, j); // Bottom neighbor
    if (j > 0) checkAndAddBox(i, j - 1); // Left neighbor
    if (j < gameState.board[i].length - 1) checkAndAddBox(i, j + 1); // Right neighbor

    if (completedBoxes.length > 0) {
      // completedBoxes.forEach((boxData) => {
      socket.emit("box-completed", completedBoxes);
      // console.log(
      //   `Box completed by ${gameState.currentPlayer} at (${boxData.row}, ${boxData.col})`
      // );
      // });
    }
  };

  return (
    <canvas
      ref={canvasRef}
      width={390}
      height={320}
      className="border-4 border-black bg-black/80 rounded-lg mx-auto "
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    ></canvas>
  );
};

export default Board;
