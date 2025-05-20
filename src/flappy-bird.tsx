import { useState, useEffect } from 'react';

interface Pipe {
  id: number;
  x: number;
  gapTop: number;
  gapBottom: number;
  passed: boolean;
}

export default function FlappyBird() {
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [birdPosition, setBirdPosition] = useState(250);
  const [birdVelocity, setBirdVelocity] = useState(0);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [pipes, setPipes] = useState<Pipe[]>([]);
  
  const GRAVITY = 0.4;
  const JUMP_FORCE = -7;
  const PIPE_WIDTH = 60;
  const PIPE_GAP = 180;
  const GAME_WIDTH = 400;
  const GAME_HEIGHT = 500;
  const BIRD_SIZE = 30;
  const BIRD_LEFT = 100;
  const PIPE_SPEED = 2;
  
  const startGame = () => {
    setGameStarted(true);
    setGameOver(false);
    setBirdPosition(250);
    setBirdVelocity(0);
    setScore(0);
    setPipes([]);
  };
  
  const endGame = () => {
    setGameOver(true);
    setGameStarted(false);
    
    if (score > highScore) {
      setHighScore(score);
    }
  };
  
  const jump = () => {
    if (!gameStarted && !gameOver) {
      startGame();
    }
    
    if (gameStarted) {
      // Add a small upward impulse and dampen existing velocity for more responsive controls
      const currentVelocity = birdVelocity;
      // If already moving up quickly, add less force
      const adjustedForce = currentVelocity < 0 ? JUMP_FORCE * 0.8 : JUMP_FORCE;
      setBirdVelocity(adjustedForce);
    }
  };
  
      // Generate pipes
  useEffect(() => {
    let pipeInterval: number | undefined;
    
    if (gameStarted && !gameOver) {
      // Generate first pipe after a short delay to give player time to react
      const initialTimeout = setTimeout(() => {
        const gapPosition = Math.floor(Math.random() * (GAME_HEIGHT - PIPE_GAP - 200)) + 100;
        
        setPipes([{
          id: Date.now(),
          x: GAME_WIDTH,
          gapTop: gapPosition,
          gapBottom: gapPosition + PIPE_GAP,
          passed: false
        }]);
        
        // Then start regular interval
        pipeInterval = setInterval(() => {
          const gapPosition = Math.floor(Math.random() * (GAME_HEIGHT - PIPE_GAP - 200)) + 100;
          
          setPipes(prev => [...prev, {
            id: Date.now(),
            x: GAME_WIDTH,
            gapTop: gapPosition,
            gapBottom: gapPosition + PIPE_GAP,
            passed: false
          }]);
        }, 2000);
      }, 1000);
      
      return () => {
        clearTimeout(initialTimeout);
        clearInterval(pipeInterval);
      };
    }
    
    return () => {
      clearInterval(pipeInterval);
    };
  }, [gameStarted, gameOver, GAME_HEIGHT, GAME_WIDTH, PIPE_GAP]);
  
  // Game loop
  useEffect(() => {
    let frameId: number;
    
    const gameLoop = () => {
      if (gameStarted && !gameOver) {
        // Update bird position based on velocity
        setBirdPosition(prev => {
          const newPosition = prev + birdVelocity;
          
          if (newPosition <= 0 || newPosition >= GAME_HEIGHT - BIRD_SIZE) {
            endGame();
            return prev;
          }
          
          return newPosition;
        });
        
        // Apply gravity to velocity with a terminal velocity
        setBirdVelocity(prev => {
          const newVelocity = prev + GRAVITY;
          // Add terminal velocity to prevent falling too fast
          return Math.min(newVelocity, 10);
        });
        
        // Update pipes
        setPipes(prev => {
          const updatedPipes = prev
            .map(pipe => {
              // Check for collision
              const birdRight = BIRD_LEFT + BIRD_SIZE;
              const birdTop = birdPosition;
              const birdBottom = birdPosition + BIRD_SIZE;
              
              const pipeLeft = pipe.x;
              const pipeRight = pipe.x + PIPE_WIDTH;
              
              // Check if bird is within pipe horizontally
              if (birdRight > pipeLeft && BIRD_LEFT < pipeRight) {
                // Check if bird is colliding with top or bottom pipe
                if (birdTop < pipe.gapTop || birdBottom > pipe.gapBottom) {
                  endGame();
                }
              }
              
              // Update score if bird passes pipe
              if (!pipe.passed && BIRD_LEFT > pipe.x + PIPE_WIDTH) {
                setScore(s => s + 1);
                return { ...pipe, passed: true };
              }
              
              return { ...pipe, x: pipe.x - PIPE_SPEED };
            })
            .filter(pipe => pipe.x + PIPE_WIDTH > -10); // Remove pipes that are off screen
            
          return updatedPipes;
        });
        
        frameId = requestAnimationFrame(gameLoop);
      }
    };
    
    if (gameStarted && !gameOver) {
      frameId = requestAnimationFrame(gameLoop);
    }
    
    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [gameStarted, gameOver, birdPosition, birdVelocity, BIRD_LEFT, BIRD_SIZE, GAME_HEIGHT, PIPE_WIDTH, PIPE_SPEED]);
  
  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        jump();
        e.preventDefault(); // Prevent spacebar from scrolling the page
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [gameStarted]);
  
  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="text-center mb-4">
        <h1 className="text-2xl font-bold mb-2">Flappy Bird</h1>
        <div className="mb-2">Score: {score} | High Score: {highScore}</div>
      </div>
      
      <div 
        className="relative bg-blue-100 border-2 border-black overflow-hidden cursor-pointer"
        style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}
        onClick={jump}
      >
        {/* Bird */}
        <div 
          className="absolute bg-yellow-400 rounded-lg"
          style={{ 
            width: BIRD_SIZE, 
            height: BIRD_SIZE, 
            left: BIRD_LEFT, 
            top: birdPosition,
            transform: `rotate(${Math.min(Math.max(birdVelocity * 2, -30), 30)}deg)`,
            transition: 'transform 0.2s ease'
          }}
        >
          {/* Bird eye */}
          <div className="absolute bg-white rounded-full w-2 h-2 top-1 right-2">
            <div className="absolute bg-black rounded-full w-1 h-1 top-0 right-0"></div>
          </div>
          {/* Bird beak */}
          <div className="absolute bg-orange-500 w-4 h-2" style={{ right: -4, top: 5 }}></div>
        </div>
        
        {/* Pipes */}
        {pipes.map((pipe) => (
          <div key={pipe.id}>
            {/* Top pipe */}
            <div 
              className="absolute bg-green-500"
              style={{ 
                width: PIPE_WIDTH, 
                height: pipe.gapTop, 
                left: pipe.x, 
                top: 0 
              }}
            >
              <div className="absolute bg-green-600 w-full h-4 bottom-0"></div>
            </div>
            
            {/* Bottom pipe */}
            <div 
              className="absolute bg-green-500"
              style={{ 
                width: PIPE_WIDTH, 
                top: pipe.gapBottom, 
                left: pipe.x, 
                bottom: 0 
              }}
            >
              <div className="absolute bg-green-600 w-full h-4 top-0"></div>
            </div>
          </div>
        ))}
        
        {/* Ground */}
        <div 
          className="absolute bg-yellow-700 bottom-0 w-full h-4"
        ></div>
        
        {/* Game over or start screen */}
        {!gameStarted && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-4 rounded text-center">
              <h2 className="text-xl font-bold mb-2">
                {gameOver ? 'Game Over' : 'Flappy Bird'}
              </h2>
              <p>{gameOver ? `Score: ${score}` : 'Click or press Space to start'}</p>
              {gameOver && (
                <button
                  className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
                  onClick={startGame}
                >
                  Play Again
                </button>
              )}
            </div>
          </div>
        )}
      </div>
      
      <div className="mt-4 text-gray-600 text-sm">
        Press Space or click/tap to jump
      </div>
    </div>
  );
}