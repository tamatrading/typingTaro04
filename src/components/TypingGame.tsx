import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Heart, Trophy, Volume2, VolumeX } from 'lucide-react';

interface GameSettings {
  selectedStages: number[];
  speed: number;
}

interface Props {
  settings: GameSettings;
  onAdminRequest: () => void;
}

interface ScorePopup {
  id: number;
  score: number;
  x: number;
  y: number;
}

const TypingGame: React.FC<Props> = ({ settings, onAdminRequest }) => {
  const [stage, setStage] = useState(settings.selectedStages[0]);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameState, setGameState] = useState('start');
  const [speedMultiplier, setSpeedMultiplier] = useState(settings.speed);
  const [currentWord, setCurrentWord] = useState<{
    id: number;
    text: string;
    x: number;
    y: number;
    speed: number;
    startTime: number;
  } | null>(null);
  const [input, setInput] = useState('');
  const [life, setLife] = useState(10);
  const [questionCount, setQuestionCount] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [particles, setParticles] = useState<
    Array<{ id: number; x: number; y: number; color: string }>
  >([]);
  const [scoreAnimation, setScoreAnimation] = useState(false);
  const [shakeAnimation, setShakeAnimation] = useState(false);
  const [scorePopups, setScorePopups] = useState<ScorePopup[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const finalScoreRef = useRef<number>(0);
  const previousHighScoreRef = useRef<number>(0);
  const currentStageIndexRef = useRef(0);

  useEffect(() => {
    finalScoreRef.current = score;
  }, [score]);

  useEffect(() => {
    setSpeedMultiplier(settings.speed);
    setStage(settings.selectedStages[0]);
    currentStageIndexRef.current = 0;
  }, [settings]);

  const stageBackgrounds = {
    1: 'from-slate-600 to-slate-800',
    2: 'from-emerald-600 to-emerald-800',
    3: 'from-violet-600 to-violet-800',
    4: 'from-amber-600 to-amber-800',
    5: 'from-rose-600 to-rose-800',
    6: 'from-cyan-600 to-cyan-800',
    7: 'from-fuchsia-600 to-fuchsia-800',
    8: 'from-lime-600 to-lime-800',
    9: 'from-orange-600 to-orange-800',
    10: 'from-sky-600 to-sky-800',
  };

  const stageSets = {
    1: ['F', 'J'],
    2: ['あ', 'い', 'う', 'え', 'お'],
    3: ['か', 'き', 'く', 'け', 'こ'],
    4: ['さ', 'し', 'す', 'せ', 'そ'],
    5: ['た', 'ち', 'つ', 'て', 'と'],
    6: ['な', 'に', 'ぬ', 'ね', 'の'],
    7: ['は', 'ひ', 'ふ', 'へ', 'ほ'],
    8: ['ま', 'み', 'む', 'め', 'も'],
    9: ['や', 'ゆ', 'よ'],
    10: ['わ', 'を', 'ん'],
  };

  const romajiMap = {
    あ: ['A'],
    い: ['I'],
    う: ['U'],
    え: ['E'],
    お: ['O'],
    か: ['KA'],
    き: ['KI'],
    く: ['KU'],
    け: ['KE'],
    こ: ['KO'],
    さ: ['SA'],
    し: ['SI', 'SHI'],
    す: ['SU'],
    せ: ['SE'],
    そ: ['SO'],
    た: ['TA'],
    ち: ['TI', 'CHI'],
    つ: ['TU', 'TSU'],
    て: ['TE'],
    と: ['TO'],
    な: ['NA'],
    に: ['NI'],
    ぬ: ['NU'],
    ね: ['NE'],
    の: ['NO'],
    は: ['HA'],
    ひ: ['HI'],
    ふ: ['FU', 'HU'],
    へ: ['HE'],
    ほ: ['HO'],
    ま: ['MA'],
    み: ['MI'],
    む: ['MU'],
    め: ['ME'],
    も: ['MO'],
    や: ['YA'],
    ゆ: ['YU'],
    よ: ['YO'],
    わ: ['WA'],
    を: ['WO'],
    ん: ['NN'],
  };

  const playSound = useCallback(
    (freq: number, type: OscillatorType, dur: number, vol = 0.3) => {
      if (isMuted || !audioContextRef.current) return;
      try {
        const osc = audioContextRef.current.createOscillator();
        const gain = audioContextRef.current.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(vol, audioContextRef.current.currentTime);
        gain.gain.exponentialRampToValueAtTime(
          0.01,
          audioContextRef.current.currentTime + dur
        );
        osc.connect(gain);
        gain.connect(audioContextRef.current.destination);
        osc.start();
        osc.stop(audioContextRef.current.currentTime + dur);
      } catch (e) {
        console.error(e);
      }
    },
    [isMuted]
  );

  const playTypeSound = useCallback(
    () => playSound(800, 'square', 0.05, 0.1),
    [playSound]
  );
  const playCorrectSound = useCallback(() => {
    playSound(880, 'sine', 0.1, 0.2);
    playSound(1760, 'sine', 0.15, 0.1);
  }, [playSound]);
  const playMissSound = useCallback(
    () => playSound(220, 'square', 0.15, 0.2),
    [playSound]
  );
  const playStageClearSound = useCallback(() => {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((note, i) => {
      setTimeout(() => playSound(note, 'sine', 0.5, 0.2), i * 200);
    });
  }, [playSound]);
  const playGameClearSound = useCallback(() => {
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98, 2093.0];
    notes.forEach((note, i) => {
      setTimeout(() => {
        playSound(note, 'sine', 0.8, 0.15);
        if (i % 2 === 0) playSound(note / 2, 'triangle', 0.8, 0.1);
      }, i * 300);
    });
  }, [playSound]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (gameState === 'start') {
        if (e.key === 'v') {
          onAdminRequest();
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameState, onAdminRequest]);

  useEffect(() => {
    const savedHighScore = localStorage.getItem('typingGameHighScore');
    if (savedHighScore) {
      const parsedHighScore = parseInt(savedHighScore, 10);
      setHighScore(parsedHighScore);
      previousHighScoreRef.current = parsedHighScore;
    }
  }, []);

  const updateHighScore = useCallback((finalScore: number) => {
    finalScoreRef.current = finalScore;
    if (finalScore > previousHighScoreRef.current) {
      return true;
    }
    return false;
  }, []);

  const saveNewHighScore = useCallback(() => {
    if (finalScoreRef.current > previousHighScoreRef.current) {
      localStorage.setItem(
        'typingGameHighScore',
        finalScoreRef.current.toString()
      );
      previousHighScoreRef.current = finalScoreRef.current;
      setHighScore(finalScoreRef.current);
    }
  }, []);

  const initAudio = useCallback(() => {
    if (typeof window !== 'undefined' && !audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext ||
        window.webkitAudioContext)();
    }
  }, []);

  const resetGame = useCallback(() => {
    initAudio();
    saveNewHighScore();
    setScore(0);
    setStage(settings.selectedStages[0]);
    currentStageIndexRef.current = 0;
    setLife(10);
    setQuestionCount(0);
    setInput('');
    setGameState('playing');
    setCurrentWord(null);
    setScorePopups([]);
    finalScoreRef.current = 0;
  }, [initAudio, saveNewHighScore, settings.selectedStages]);

  const convertToRomaji = useCallback((word: string) => {
    if (!word) return [];
    return romajiMap[word as keyof typeof romajiMap] || [word];
  }, []);

  const calculateScore = useCallback(
    (y: number) => {
      const maxScore = 8;
      const minScore = 1;
      const maxHeight = 100;

      return Math.max(
        minScore,
        Math.ceil(maxScore * (1 - y / maxHeight) * (1 + speedMultiplier * 0.2))
      );
    },
    [speedMultiplier]
  );

  const createParticles = useCallback((x: number, y: number) => {
    const newParticles = Array.from({ length: 10 }, (_, i) => ({
      id: Date.now() + i,
      x,
      y,
      color: ['#60A5FA', '#34D399', '#FBBF24'][Math.floor(Math.random() * 3)],
    }));
    setParticles((prev) => [...prev, ...newParticles]);
    setTimeout(() => {
      setParticles((prev) =>
        prev.filter((p) => !newParticles.find((np) => np.id === p.id))
      );
    }, 1000);
  }, []);

  const createScorePopup = useCallback(
    (score: number, x: number, y: number) => {
      const newPopup = {
        id: Date.now(),
        score,
        x,
        y,
      };
      setScorePopups((prev) => [...prev, newPopup]);
      setTimeout(() => {
        setScorePopups((prev) =>
          prev.filter((popup) => popup.id !== newPopup.id)
        );
      }, 1000);
    },
    []
  );

  const saveHighScoreToStorage = useCallback((score: number) => {
    if (score >= previousHighScoreRef.current) {
      localStorage.setItem('typingGameHighScore', score.toString());
    }
  }, []);

  const gameOver = useCallback(() => {
    setGameState('gameover');
    setCurrentWord(null);
    updateHighScore(score);
    saveHighScoreToStorage(score);
    playGameClearSound();
  }, [playGameClearSound, score, updateHighScore, saveHighScoreToStorage]);

  const checkStageClear = useCallback(() => {
    if (questionCount >= 19) {
      currentStageIndexRef.current++;
      if (currentStageIndexRef.current >= settings.selectedStages.length) {
        setGameState('clear');
        updateHighScore(score);
        saveHighScoreToStorage(score);
        playGameClearSound();
      } else {
        setGameState('stageClear');
        playStageClearSound();
      }
      return true;
    }
    return false;
  }, [
    questionCount,
    settings.selectedStages.length,
    playGameClearSound,
    playStageClearSound,
    score,
    updateHighScore,
    saveHighScoreToStorage,
  ]);

  const nextStage = useCallback(() => {
    setIsTransitioning(true);
    setTimeout(() => {
      setStage(settings.selectedStages[currentStageIndexRef.current]);
      setQuestionCount(0);
      setInput('');
      setGameState('playing');
      setCurrentWord(null);
      setIsTransitioning(false);
    }, 500);
  }, [settings.selectedStages]);

  const createNewWord = useCallback(() => {
    const currentSet = stageSets[stage as keyof typeof stageSets];
    let text;

    if (questionCount > 0 && questionCount % 3 === 0) {
      text = Math.random() < 0.5 ? 'F' : 'J';
    } else {
      text = currentSet[Math.floor(Math.random() * currentSet.length)];
    }

    return {
      id: Date.now(),
      text,
      x: Math.random() * 80 + 10,
      y: -10,
      speed: (0.6 + 1 * 0.09) * speedMultiplier,
      startTime: Date.now(),
    };
  }, [stage, questionCount, speedMultiplier]);

  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (gameState !== 'playing' || !currentWord) return;

      const value = e.target.value.toUpperCase();
      setInput(value);
      playTypeSound();

      const correctRomaji = convertToRomaji(currentWord.text);
      const isPartiallyCorrect = correctRomaji.some((romaji) =>
        romaji.startsWith(value)
      );

      if (!isPartiallyCorrect && value) {
        setLife((prev) => {
          const newLife = prev - 1;
          if (newLife <= 0) {
            gameOver();
            return 0;
          }
          return newLife;
        });
        playMissSound();
        setInput('');
        setShakeAnimation(true);
        setTimeout(() => setShakeAnimation(false), 500);
        return;
      }

      if (correctRomaji.includes(value)) {
        const pointsEarned = calculateScore(currentWord.y);
        setScore((prev) => prev + pointsEarned);
        setInput('');
        setQuestionCount((prev) => prev + 1);
        playCorrectSound();

        if (currentWord) {
          createParticles(currentWord.x, currentWord.y);
          createScorePopup(pointsEarned, currentWord.x, currentWord.y);
        }

        setScoreAnimation(true);
        setTimeout(() => setScoreAnimation(false), 300);

        if (!checkStageClear()) {
          setCurrentWord(createNewWord());
        }
      }
    },
    [
      gameState,
      currentWord,
      playTypeSound,
      convertToRomaji,
      gameOver,
      playMissSound,
      calculateScore,
      playCorrectSound,
      createParticles,
      createScorePopup,
      checkStageClear,
      createNewWord,
    ]
  );

  useEffect(() => {
    if (gameState === 'playing' && !currentWord && !isTransitioning) {
      setCurrentWord(createNewWord());
    }
  }, [gameState, currentWord, createNewWord, isTransitioning]);

  useEffect(() => {
    if (gameState !== 'playing' || !currentWord) return;

    const intervalId = setInterval(() => {
      setCurrentWord((prevWord) => {
        if (!prevWord) return null;
        const updatedWord = { ...prevWord, y: prevWord.y + prevWord.speed };
        if (updatedWord.y > 100) {
          gameOver();
          return null;
        }
        return updatedWord;
      });
    }, 50);

    return () => clearInterval(intervalId);
  }, [gameState, currentWord, gameOver]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        if (gameState === 'start') {
          resetGame();
        } else if (gameState === 'stageClear') {
          nextStage();
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameState, resetGame, nextStage]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-2xl p-8 bg-gradient-to-b from-blue-100 to-blue-200 shadow-xl rounded-lg transition-transform duration-300 hover:scale-[1.02]">
        <div className="text-center mb-4">
          <div className="flex justify-between items-center mb-2">
            <h1 className="text-2xl font-bold">タイピング太郎 v04</h1>
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-2 rounded-full hover:bg-gray-200 transition-transform hover:scale-110"
            >
              {isMuted ? <VolumeX /> : <Volume2 />}
            </button>
          </div>
          <div className="flex justify-between items-center px-4">
            <div>
              <p className="text-lg">ステージ {stage}</p>
              <p className="text-sm">問題 {questionCount}/20</p>
            </div>
            <div className="flex gap-1 flex-wrap max-w-[200px]">
              {[...Array(life)].map((_, i) => (
                <Heart
                  key={i}
                  className="text-red-500 transition-transform hover:scale-125"
                  size={16}
                  fill="red"
                />
              ))}
            </div>
            <div>
              <p
                className={`text-lg transform transition-all duration-300 ${
                  scoreAnimation ? 'scale-125 text-green-600' : ''
                }`}
              >
                スコア: {score}
              </p>
              <p className="text-sm text-gray-600">ハイスコア: {highScore}</p>
            </div>
          </div>
        </div>

        <div
          className={`relative h-96 bg-gradient-to-b ${
            stageBackgrounds[stage as keyof typeof stageBackgrounds]
          } rounded-lg mb-8 overflow-hidden ${
            shakeAnimation ? 'animate-[shake_0.5s_ease-in-out]' : ''
          }`}
        >
          {gameState === 'start' && (
            <div className="absolute inset-0 bg-gradient-to-b from-blue-500 to-blue-700 flex flex-col items-center justify-center text-white">
              <h2 className="text-4xl font-bold mb-6 animate-pulse"></h2>
              <Trophy
                className="text-yellow-300 mb-6 animate-bounce"
                size={64}
              />
              <p className="text-xl mb-4">現在のハイスコア: {highScore}</p>
              <p className="text-lg mb-6">スピード: {speedMultiplier}</p>
              <button
                onClick={resetGame}
                className="bg-green-500 hover:bg-green-600 text-white text-xl py-6 px-8 rounded-lg transform transition-all duration-300 hover:scale-110 hover:rotate-1 mb-4"
              >
                スタート！
              </button>
              <p className="text-gray-200 animate-pulse mb-2">
                スペースキーでもスタートできます
              </p>
              <p className="text-gray-200 animate-pulse">
                Vキーで管理画面を開きます
              </p>
            </div>
          )}

          {gameState === 'stageClear' && (
            <div className="absolute inset-0 bg-gradient-to-b from-emerald-300 via-green-400 to-emerald-500 flex flex-col items-center justify-center text-white">
              <h2 className="text-4xl mb-4 font-bold animate-bounce">
                ステージクリア！
              </h2>
              <Trophy
                className="mb-4 text-yellow-300 animate-pulse"
                size={64}
              />
              <p className="text-xl mb-2">スコア: {score}</p>
              <button
                onClick={nextStage}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xl py-6 px-8 rounded-lg transform transition-all duration-300 hover:scale-110 hover:rotate-1"
              >
                次のステージへ
              </button>
              <p className="text-white mt-4 animate-pulse">
                スペースキーでも進めます
              </p>
            </div>
          )}

          {gameState === 'gameover' && (
            <div className="absolute inset-0 bg-gradient-to-b from-slate-600 via-slate-700 to-slate-800 flex flex-col items-center justify-center text-white">
              <h2 className="text-4xl mb-4 font-bold animate-bounce">
                ゲームオーバー
              </h2>
              <Trophy className="mb-4 text-slate-400" size={64} />
              <p className="text-xl mb-2">最終スコア: {score}</p>
              {finalScoreRef.current > previousHighScoreRef.current && (
                <p className="text-lg text-yellow-300 mb-2">
                  🎉 ハイスコア達成！ 🎉
                </p>
              )}
              <p className="text-lg text-slate-300 mb-4">
                ステージ {stage} - {questionCount}/20問クリア
              </p>
              <button
                onClick={resetGame}
                className="bg-slate-500 hover:bg-slate-600 text-white text-xl py-6 px-8 rounded-lg transform transition-all duration-300 hover:scale-110"
              >
                もう一度チャレンジ！
              </button>
            </div>
          )}

          {gameState === 'clear' && (
            <div className="absolute inset-0 bg-gradient-radial from-yellow-300 via-amber-400 to-amber-500 flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-yellow-300/30 via-amber-400/20 to-amber-500/10 animate-spin-slow"></div>

              <div className="relative z-10 flex flex-col items-center justify-center max-w-lg mx-auto px-3 text-center">
                <h2 className="text-3xl sm:text-4xl md:text-4xl mb- 4xl text-white font-bold animate-bounce">
                  🎉 全ステージクリア！ 🎉
                </h2>

                <p className="text-xl sm:text-2xl md:text-3xl text-white mb-3 animate-pulse">
                  おめでとうございます！
                </p>

                <p className="text-lg sm:text-xl md:text-2xl text-white mb-3">
                  最終スコア: {score}
                </p>

                {finalScoreRef.current > previousHighScoreRef.current && (
                  <div className="relative mb-3">
                    {saveHighScoreToStorage(score)}
                    <p className="text-base sm:text-lg md:text-xl text-red animate-pulse">
                      🏆 ハイスコア達成！ 🏆
                    </p>
                    <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-400 rounded-lg blur opacity-75 animate-pulse"></div>
                  </div>
                )}

                <button
                  onClick={resetGame}
                  className="relative group bg-gradient-to-br from-amber-400 to-amber-600 text-white text-lg sm:text-xl md:text-2xl py-4 sm:py-6 px-6 sm:px-8 rounded-xl transform transition-all duration-300 hover:scale-110 hover:rotate-1 overflow-hidden mt-2"
                >
                  <span className="absolute inset-0 w-full h-full bg-gradient-to-br from-amber-300 to-amber-500 animate-pulse opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  <span className="relative">最初から挑戦！</span>
                </button>
              </div>

              <div className="absolute inset-0 pointer-events-none">
                {[...Array(12)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute animate-float-random text-xl sm:text-2xl"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                      animationDelay: `${Math.random() * 2}s`,
                    }}
                  >
                    {['🌟', '✨', '💫', '⭐'][Math.floor(Math.random() * 4)]}
                  </div>
                ))}
              </div>
            </div>
          )}

          {gameState === 'playing' && currentWord && (
            <div
              className="absolute transition-all duration-50 bg-white/20 backdrop-blur-sm rounded px-4 py-2 animate-[float_2s_ease-in-out_infinite]"
              style={{
                left: `${currentWord.x}%`,
                top: `${currentWord.y}%`,
                transform: `translateX(-50%) rotate(${
                  Math.sin(currentWord.y / 10) * 5
                }deg)`,
              }}
            >
              <div className="text-white font-bold text-2xl">
                {currentWord.text}
              </div>
              {stage > 1 && (
                <div className="text-gray-200 text-sm mt-1">
                  {convertToRomaji(currentWord.text)[0]}
                </div>
              )}
            </div>
          )}

          {particles.map((particle) => (
            <div
              key={particle.id}
              className="absolute w-2 h-2 rounded-full animate-[particle_1s_ease-out_forwards]"
              style={{
                left: `${particle.x}%`,
                top: `${particle.y}%`,
                backgroundColor: particle.color,
              }}
            />
          ))}

          {scorePopups.map((popup) => (
            <div
              key={popup.id}
              className="absolute text-2xl font-bold text-yellow-300 animate-[scorePopup_1s_ease-out_forwards]"
              style={{
                left: `${popup.x}%`,
                top: `${popup.y}%`,
                transform: 'translateX(-50%)',
                textShadow: '0 0 10px rgba(0,0,0,0.5)',
              }}
            >
              +{popup.score}
            </div>
          ))}
        </div>

        {gameState === 'playing' && (
          <div className="text-center">
            <input
              type="text"
              value={input}
              onChange={handleInput}
              className="w-32 text-center text-2xl p-2 border-2 border-blue-400 rounded transition-all duration-300 focus:ring-4 focus:ring-blue-300 focus:border-blue-500"
              autoFocus
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default TypingGame;
