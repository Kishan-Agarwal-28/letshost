import  { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'motion/react';
import { useConfettiCannon } from '@/components/ui/confetti-cannon';
import { useToast } from '@/hooks/use-toast';
const BOARD_SIZE = 8;

  const EMPTY = 0
  const BLACK = 1
  const WHITE = 2

type Cell = typeof EMPTY | typeof BLACK | typeof WHITE;

type Board = Cell[][];
type Player = typeof BLACK | typeof WHITE;
type Move = { row: number; col: number };
type Difficulty = 'easy' | 'medium' | 'hard';

const DIFFICULTY: Record<string, Difficulty> = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard'
};

const DIRECTIONS: [number, number][] = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1],          [0, 1],
  [1, -1],  [1, 0], [1, 1]
];

const initializeBoard = (): Board => {
  const board: Board = Array.from({ length: BOARD_SIZE }, () =>
    Array(BOARD_SIZE).fill(EMPTY)
  );
  board[3][3] = WHITE;
  board[3][4] = BLACK;
  board[4][3] = BLACK;
  board[4][4] = WHITE;
  return board;
};

const isValidPosition = (row: number, col: number): boolean =>
  row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;

const isValidMove = (board: Board, row: number, col: number, player: Player): boolean => {
  if (board[row][col] !== EMPTY) return false;
  const opponent = player === BLACK ? WHITE : BLACK;

  for (const [dx, dy] of DIRECTIONS) {
    let r = row + dx, c = col + dy;
    let foundOpponent = false;

    while (isValidPosition(r, c) && board[r][c] === opponent) {
      foundOpponent = true;
      r += dx;
      c += dy;
    }

    if (foundOpponent && isValidPosition(r, c) && board[r][c] === player) return true;
  }

  return false;
};

const getValidMoves = (board: Board, player: Player): Move[] => {
  const moves: Move[] = [];
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (isValidMove(board, row, col, player)) {
        moves.push({ row, col });
      }
    }
  }
  return moves;
};

const makeMove = (board: Board, row: number, col: number, player: Player): Board => {
  const newBoard = board.map(row => [...row]);
  const opponent = player === BLACK ? WHITE : BLACK;

  newBoard[row][col] = player;

  for (const [dx, dy] of DIRECTIONS) {
    const toFlip: Move[] = [];
    let r = row + dx, c = col + dy;

    while (isValidPosition(r, c) && newBoard[r][c] === opponent) {
      toFlip.push({ row: r, col: c });
      r += dx;
      c += dy;
    }

    if (toFlip.length && isValidPosition(r, c) && newBoard[r][c] === player) {
      for (const { row: fr, col: fc } of toFlip) {
        newBoard[fr][fc] = player;
      }
    }
  }

  return newBoard;
};

const evaluateBoard = (board: Board, player: Player): number => {
  const opponent = player === BLACK ? WHITE : BLACK;
  const weights = [
    [100, -10, 8, 6, 6, 8, -10, 100],
    [-10, -25, -4, -4, -4, -4, -25, -10],
    [8, -4, 6, 4, 4, 6, -4, 8],
    [6, -4, 4, 0, 0, 4, -4, 6],
    [6, -4, 4, 0, 0, 4, -4, 6],
    [8, -4, 6, 4, 4, 6, -4, 8],
    [-10, -25, -4, -4, -4, -4, -25, -10],
    [100, -10, 8, 6, 6, 8, -10, 100]
  ];

  let score = 0;
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const cell = board[r][c];
      if (cell === player) score += weights[r][c];
      else if (cell === opponent) score -= weights[r][c];
    }
  }

  const mobility = getValidMoves(board, player).length - getValidMoves(board, opponent).length;
  score += mobility * 5;

  return score;
};

const minimax = (
  board: Board,
  depth: number,
  maximizing: boolean,
  player: Player,
  alpha: number = -Infinity,
  beta: number = Infinity
): { score: number; move: Move | null } => {
  const opponent = player === BLACK ? WHITE : BLACK;
  const current = maximizing ? player : opponent;
  const moves = getValidMoves(board, current);

  if (depth === 0 || moves.length === 0) {
    return { score: evaluateBoard(board, player), move: null };
  }

  let bestMove: Move | null = null;

  if (maximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      const newBoard = makeMove(board, move.row, move.col, current);
      const evalResult = minimax(newBoard, depth - 1, false, player, alpha, beta);
      if (evalResult.score > maxEval) {
        maxEval = evalResult.score;
        bestMove = move;
      }
      alpha = Math.max(alpha, evalResult.score);
      if (beta <= alpha) break;
    }
    return { score: maxEval, move: bestMove };
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      const newBoard = makeMove(board, move.row, move.col, current);
      const evalResult = minimax(newBoard, depth - 1, true, player, alpha, beta);
      if (evalResult.score < minEval) {
        minEval = evalResult.score;
        bestMove = move;
      }
      beta = Math.min(beta, evalResult.score);
      if (beta <= alpha) break;
    }
    return { score: minEval, move: bestMove };
  }
};

const getAIMove = (board: Board, difficulty: Difficulty): Move | null => {
  const validMoves = getValidMoves(board, WHITE);
  if (!validMoves.length) return null;

  if (difficulty === 'easy') {
    return validMoves[Math.floor(Math.random() * validMoves.length)];
  }

  if (difficulty === 'medium') {
    if (Math.random() < 0.7) {
      return minimax(board, 3, true, WHITE).move ?? validMoves[0];
    } else {
      return validMoves[Math.floor(Math.random() * validMoves.length)];
    }
  }

  const result = minimax(board, 5, true, WHITE);
  const bestScore = result.score;
  const goodMoves = validMoves.filter(move => {
    const newBoard = makeMove(board, move.row, move.col, WHITE);
    return evaluateBoard(newBoard, WHITE) >= bestScore * 0.9;
  });

  return goodMoves.length > 0
    ? goodMoves[Math.floor(Math.random() * goodMoves.length)]
    : result.move ?? validMoves[0];
};

const countPieces = (board: Board): { black: number; white: number } => {
  let black = 0, white = 0;
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] === BLACK) black++;
      else if (board[r][c] === WHITE) white++;
    }
  }
  return { black, white };
};

const OthelloPiece = ({cell}:{cell:number} ) => {
  // Define the rotate animation based on cell color (BLACK/WHITE)
  const rotateVariants = {
    initial: { rotateX: 0 },
    animate: { rotateX: 180 },
    exit: { rotateX: 0 },
  };

  return (
    <motion.div
      className={`w-10 h-10 rounded-full transition-transform duration-500
        ${cell === BLACK
          ? 'bg-gradient-to-br from-gray-900 via-black to-gray-800 shadow-[inset_0_3px_8px_rgba(0,0,0,0.6),_0_4px_6px_rgba(0,0,0,0.8),_0_-2px_4px_rgba(255,255,255,0.1)]'
          : 'bg-gradient-to-br from-white via-gray-200 to-gray-300 shadow-[inset_0_3px_8px_rgba(0,0,0,0.3),_0_4px_6px_rgba(0,0,0,0.6),_0_-2px_4px_rgba(255,255,255,0.2)]'
      }`}
      initial="initial"
      animate="animate"
      exit="exit"
      variants={rotateVariants}
      transition={{ duration: 1 }}
    />
  );
};
export default function OthelloGame() {
  const [board, setBoard] = useState<Board>(initializeBoard());
  const [currentPlayer, setCurrentPlayer] = useState<Player>(BLACK);
  const [difficulty, setDifficulty] = useState<Difficulty>(DIFFICULTY.MEDIUM);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [isAIThinking, setIsAIThinking] = useState<boolean>(false);
  const [validMoves, setValidMoves] = useState<Move[]>([]);
  const [showHints, setShowHints] = useState<boolean>(false);
  const [hintMoves, setHintMoves] = useState<Move[]>([]);
  const [isGameStarted, setIsGameStarted] = useState<boolean>(false);
  const [hintCount, setHintCount] = useState<number>(3);
  const {toast}=useToast();

  const checkGameOver = useCallback((board: Board): boolean => {
    const blackMoves = getValidMoves(board, BLACK);
    const whiteMoves = getValidMoves(board, WHITE);

    if (blackMoves.length === 0 && whiteMoves.length === 0) {
      const { black, white } = countPieces(board);
      setGameOver(true);
      setIsGameStarted(false);
      toast({
        title: "Success",
        description: "Game Over",
        duration: 5000,
        variant: "default",
      })
      if (black > white) setWinner('You');
      else if (white > black) setWinner('AI');
      else setWinner('Tie');
      return true;
    }

    return false;
  }, []);

  const checkAndSkipTurn = useCallback((board: Board, player: Player): boolean => {
    const currentPlayerMoves = getValidMoves(board, player);
    const opponent = player === BLACK ? WHITE : BLACK;
    const opponentMoves = getValidMoves(board, opponent);

    if (currentPlayerMoves.length === 0) {
      if (opponentMoves.length === 0) {
        checkGameOver(board);
        return true;
      } else {
        setCurrentPlayer(opponent);
        toast({
          title: "Attention",
          description: "Turn skipped to AI",
          duration: 5000,
          variant: "attention",
        })
        return true;
      }
    }

    return false;
  }, [checkGameOver]);

  const handleCellClick = useCallback((row: number, col: number) => {
    if (gameOver || currentPlayer !== BLACK || isAIThinking) return;

    if (!isValidMove(board, row, col, BLACK)) return;

    const newBoard = makeMove(board, row, col, BLACK);
    setBoard(newBoard);
    setShowHints(false);
    if(!isGameStarted){
      setIsGameStarted(true);
    }

    if (!checkGameOver(newBoard)) {
      if (!checkAndSkipTurn(newBoard, WHITE)) {
        setCurrentPlayer(WHITE);
      }
    }
  }, [board, currentPlayer, gameOver, isAIThinking, checkGameOver, checkAndSkipTurn]);

  const makeAIMove = useCallback(async () => {
    if (currentPlayer !== WHITE || gameOver) return;

    setIsAIThinking(true);

    await new Promise(resolve => setTimeout(resolve, 500));

    const aiMove = getAIMove(board, difficulty);

    if (aiMove) {
      const newBoard = makeMove(board, aiMove.row, aiMove.col, WHITE);
      setBoard(newBoard);

      if (!checkGameOver(newBoard)) {
        if (!checkAndSkipTurn(newBoard, BLACK)) {
          setCurrentPlayer(BLACK);
        }
      }
    } else {
      checkAndSkipTurn(board, BLACK);
    }

    setIsAIThinking(false);
  }, [board, currentPlayer, difficulty, gameOver, checkGameOver, checkAndSkipTurn]);

  useEffect(() => {
    if (currentPlayer === WHITE && !gameOver) {
      makeAIMove();
    }
  }, [currentPlayer, gameOver, makeAIMove]);

  useEffect(() => {
    if (currentPlayer === BLACK) {
      const moves = getValidMoves(board, BLACK);
      setValidMoves(moves);

      if (moves.length === 0 && !gameOver) {
        checkAndSkipTurn(board, BLACK);
      }
    } else {
      setValidMoves([]);
    }
  }, [board, currentPlayer, gameOver, checkAndSkipTurn]);

  const resetGame = () => {
    const freshBoard = initializeBoard();
    setIsGameStarted(false);
    setBoard(freshBoard);
    setCurrentPlayer(BLACK);
    setGameOver(false);
    setWinner(null);
    setIsAIThinking(false);
    setValidMoves(getValidMoves(freshBoard, BLACK));
    setShowHints(false);
    setHintMoves([]);
  };

  const toggleHints = () => {
    if(hintCount<=0){
       toast({
        title:"Error",
        description:"No hints available",
        duration:5000,
        variant:"error",
        })
       return;
      }
    if (!showHints && currentPlayer === BLACK && validMoves.length > 0) {
      const shuffled = [...validMoves].sort(() => 0.5 - Math.random());
      setHintMoves(shuffled.slice(0, 3));
      setShowHints(true);
      setHintCount(hintCount-1);
    } else {
      setShowHints(false);
      setHintMoves([]);
     
    }
  };

  const { black, white } = countPieces(board);

  const isValidMoveHighlight = (row: number, col: number): boolean =>
    showHints && hintMoves.some(move => move.row === row && move.col === col);
const confettiCannon=useConfettiCannon;
useEffect(() => {
  if(winner==="You"){
    confettiCannon();
  }
},[winner])

  return (
     <div className="min-h-screen w-full p-2 sm:p-4 ">
      <div className="max-w-4xl mx-auto">
        <Card className="mb-4 sm:mb-6 bg-background outline-none border-none w-full backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2 sm:mb-4">
              Othello
            </CardTitle>
            
            {/* Score and Status - Responsive Layout */}
            <div className="flex justify-center gap-2 sm:gap-4 items-center flex-wrap text-sm sm:text-base">
              <Badge variant="outline" className="bg-black text-white border-white/30 px-2 py-1 sm:px-3 sm:py-1.5">
                You (Black): {black}
              </Badge>
              <Badge variant="outline" className="bg-white text-black border-white/30 px-2 py-1 sm:px-3 sm:py-1.5">
                AI (White): {white}
              </Badge>
              {isAIThinking && (
                <Badge className="bg-yellow-500 text-black animate-pulse px-2 py-1 sm:px-3 sm:py-1.5">
                  AI Thinking...
                </Badge>
              )}
            </div>
          </CardHeader>
          
          <CardContent>
            {/* Controls - Responsive Button Layout */}
            <div className="flex justify-center gap-2 sm:gap-4 mb-4 sm:mb-6 flex-wrap">
              {/* Difficulty Buttons */}
              <div className="flex gap-1 sm:gap-2 w-full sm:w-auto justify-center">
                {Object.values(DIFFICULTY).map((diff) => (
                  <Button
                    key={diff}
                    variant={difficulty === diff ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      if(!isGameStarted){
                      setDifficulty(diff)
                    }
                    else{
                      toast({
                        title: "Error",
                        description: "Game already started",
                        duration: 5000,
                        variant: "error",
                      })
                    }
                  }}
                    disabled={!gameOver && (currentPlayer === WHITE || isAIThinking)}
                    className={`text-xs sm:text-sm px-2 sm:px-3 ${
                      difficulty === diff 
                        ? "bg-white text-black" 
                        : "bg-white/10 text-white border-white/30 hover:bg-white/20"
                    }`}
                  >
                    {diff.charAt(0).toUpperCase() + diff.slice(1)}
                  </Button>
                ))}
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-1 sm:gap-2 w-full sm:w-auto justify-center">
                <Button 
                  onClick={toggleHints}
                  disabled={gameOver || currentPlayer !== BLACK || validMoves.length === 0 || isAIThinking}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 text-xs sm:text-sm px-2 sm:px-3"
                >
                  <span className="hidden sm:inline">{showHints ? 'Hide Hints' : 'Show Hints ('+hintCount+')'}</span>
                  <span className="sm:hidden">{showHints ? 'Hide' : 'Hints'}</span>
                </Button>
                <Button 
                  onClick={resetGame}
                  size="sm"
                  className="bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm px-2 sm:px-3"
                >
                  <span className="hidden sm:inline">New Game</span>
                  <span className="sm:hidden">Reset</span>
                </Button>
              </div>
            </div>

            {/* Game Board - Fully Responsive */}
            <div className="flex justify-center px-2 sm:px-0">
              <div className="grid grid-cols-8 gap-0.5 sm:gap-1 bg-[url(/wooden-background-wood-texture-brown-600nw-2477335391.webp)] p-1 sm:p-2 rounded-lg shadow-2xl w-full max-w-xs sm:max-w-md lg:max-w-lg">
                {board.map((row, rowIndex) =>
                  row.map((cell, colIndex) => (
                    <button
                      key={`${rowIndex}-${colIndex}`}
                      style={{
                        boxShadow: 'inset -4px 4px 8px #000000, inset 4px -4px 8px #211d1a'
                      }} 
                      className={`
                        aspect-square w-full rounded-sm flex items-center justify-center transition-all duration-200 p-0.5 sm:p-1
                        ${isValidMoveHighlight(rowIndex, colIndex) 
                          ? 'bg-transparent hover:bg-green-200/30 shadow-lg ring-1 sm:ring-2 ring-blue-400' 
                          : 'bg-transparent hover:bg-zinc-950/80'
                        }
                        ${cell === EMPTY && currentPlayer === BLACK && !gameOver ? 'cursor-pointer' : 'cursor-default'}
                      `}
                      onClick={() => handleCellClick(rowIndex, colIndex)}
                      disabled={gameOver || currentPlayer !== BLACK || isAIThinking}
                    >
                      {cell === BLACK && <OthelloPiece cell={BLACK} />}
                      {cell === WHITE && <OthelloPiece cell={WHITE} />}
                      {cell === EMPTY && isValidMoveHighlight(rowIndex, colIndex) && (
                        <div className="w-3 h-3 sm:w-4 sm:h-4 lg:w-6 lg:h-6 bg-blue-500/60 rounded-full animate-pulse shadow-lg" />
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Game Over Message - Responsive */}
            {gameOver && (
              <div className="text-center mt-4 sm:mt-6">
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 sm:p-4 border border-white/30 mx-2 sm:mx-0">
                  <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Game Over!</h2>
                  <p className="text-base sm:text-lg text-white">
                    {winner === 'Tie' ? "It's a tie!" : `${winner} wins!`}
                  </p>
                  <p className="text-white/80 mt-1 text-sm sm:text-base">
                    Final Score - You: {black}, AI: {white}
                  </p>
                </div>
              </div>
            )}

            {/* Status Messages - Responsive */}
            {!gameOver && currentPlayer === BLACK && validMoves.length === 0 && (
              <div className="text-center mt-4">
                <Badge variant="outline" className="bg-orange-500/20 text-orange-200 border-orange-400/30 text-xs sm:text-sm px-2 py-1">
                  No valid moves - Turn skipped to AI
                </Badge>
              </div>
            )}

            {!gameOver && currentPlayer === WHITE && getValidMoves(board, WHITE).length === 0 && (
              <div className="text-center mt-4">
                <Badge variant="outline" className="bg-orange-500/20 text-orange-200 border-orange-400/30 text-xs sm:text-sm px-2 py-1">
                  AI has no valid moves - Turn skipped to you
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}