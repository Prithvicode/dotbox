import React, { useEffect, useRef } from "react";

const DotAndBoxes: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dotRadius = 8;
    const lineThickness = 4;
    const gridSize = 4; // 4x4 grid
    const dots: { x: number; y: number; row: number; col: number }[] = [];
    const lines: Set<string> = new Set();
    const boxes: boolean[][] = Array(gridSize - 1)
      .fill(null)
      .map(() => Array(gridSize - 1).fill(false));
    let startDot: { row: number; col: number } | null = null;

    // Set canvas size
    canvas.width = 800;
    canvas.height = 600;
    ctx.fillStyle = "#ffffff"; // Set background color
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Function to draw dots
    const drawDot = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
      ctx.beginPath();
      ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
      ctx.fillStyle = "black";
      ctx.fill();
      ctx.closePath();
    };

    // Function to draw lines
    const drawLine = (
      ctx: CanvasRenderingContext2D,
      start: { row: number; col: number },
      end: { row: number; col: number }
    ) => {
      ctx.beginPath();
      ctx.lineWidth = lineThickness;
      ctx.strokeStyle = "blue";
      ctx.moveTo(start.col * 100 + 50, start.row * 100 + 50);
      ctx.lineTo(end.col * 100 + 50, end.row * 100 + 50);
      ctx.stroke();
      ctx.closePath();
    };

    const getDotClicked = (x: number, y: number) => {
      for (const dot of dots) {
        const distance = Math.sqrt((x - dot.x) ** 2 + (y - dot.y) ** 2);
        if (distance <= dotRadius) {
          return { row: dot.row, col: dot.col };
        }
      }
      return null;
    };

    // Check if the line is horizontal or vertical (not diagonal)
    const isValidLine = (
      start: { row: number; col: number },
      end: { row: number; col: number }
    ) => {
      return (
        (start.row === end.row && Math.abs(start.col - end.col) === 1) || // Horizontal line
        (start.col === end.col && Math.abs(start.row - end.row) === 1) // Vertical line
      );
    };

    // Update and check box completion
    const updateBoxes = () => {
      for (let row = 0; row < gridSize - 1; row++) {
        for (let col = 0; col < gridSize - 1; col++) {
          // Each box is surrounded by four lines
          const topLine = lines.has(`${row}-${col}-${row}-${col + 1}`);
          const bottomLine = lines.has(
            `${row + 1}-${col}-${row + 1}-${col + 1}`
          );
          const leftLine = lines.has(`${row}-${col}-${row + 1}-${col}`);
          const rightLine = lines.has(
            `${row}-${col + 1}-${row + 1}-${col + 1}`
          );

          if (topLine && bottomLine && leftLine && rightLine) {
            boxes[row][col] = true; // Mark the box as completed
            // Draw filled box to indicate completion
            ctx.fillStyle = "rgba(0, 128, 0, 0.3)";
            ctx.fillRect(col * 100 + 55, row * 100 + 55, 90, 90);
          }
        }
      }
    };

    // Create Dots
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const x = col * 100 + 50;
        const y = row * 100 + 50;
        dots.push({ x, y, row, col });
        drawDot(ctx, x, y);
      }
    }

    // Mouse Event Handlers
    const handleMouseDown = (e: MouseEvent) => {
      const { offsetX, offsetY } = e;
      const clickedDot = getDotClicked(offsetX, offsetY);
      if (clickedDot) {
        startDot = clickedDot;
        console.log(`Start Dot: Row ${startDot.row}, Col ${startDot.col}`);
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      const { offsetX, offsetY } = e;
      const clickedDot = getDotClicked(offsetX, offsetY);
      if (
        startDot &&
        clickedDot &&
        clickedDot !== startDot &&
        isValidLine(startDot, clickedDot)
      ) {
        const lineId = `${startDot.row}-${startDot.col}-${clickedDot.row}-${clickedDot.col}`;
        const reverseLineId = `${clickedDot.row}-${clickedDot.col}-${startDot.row}-${startDot.col}`;
        if (!lines.has(lineId) && !lines.has(reverseLineId)) {
          lines.add(lineId);
          drawLine(ctx, startDot, clickedDot);
          updateBoxes();
        }
        startDot = null; // Reset start dot
      }
    };

    // Event Listeners
    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mouseup", handleMouseUp);

    // Cleanup event listeners
    return () => {
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  return <canvas ref={canvasRef} style={{ border: "1px solid black" }} />;
};

export default DotAndBoxes;
