import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  TextInput,
  ScrollView,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing,
  Keyboard,
  TouchableWithoutFeedback,
  Modal,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { Player, Room, DrawingEvent, ChatMessage, DrawingPath } from '../types/multiplayer';

// Word Reveal Modal for Multiplayer
interface WordRevealModalProps {
  visible: boolean;
  word: string;
  countdown: number;
  teamEmoji: string;
  teamName: string;
  teamBgColor: string;
}

const WordRevealModal: React.FC<WordRevealModalProps> = ({
  visible,
  word,
  countdown,
  teamEmoji,
  teamName,
  teamBgColor,
}) => {
  const cardScale = useRef(new Animated.Value(0.8)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const countdownScale = useRef(new Animated.Value(1)).current;
  const wordBounce = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0.3)).current;
  const wordBounceAnimRef = useRef<Animated.CompositeAnimation | null>(null);
  const glowAnimRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (visible) {
      cardScale.setValue(0.8);
      cardOpacity.setValue(0);
      
      Animated.parallel([
        Animated.spring(cardScale, { toValue: 1, friction: 5, tension: 100, useNativeDriver: true }),
        Animated.timing(cardOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
      
      wordBounceAnimRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(wordBounce, { toValue: -8, duration: 400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(wordBounce, { toValue: 0, duration: 400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      );
      wordBounceAnimRef.current.start();

      glowAnimRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 0.6, duration: 800, useNativeDriver: true }),
          Animated.timing(glowAnim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
        ])
      );
      glowAnimRef.current.start();
    } else {
      // Stop animations when modal closes
      wordBounceAnimRef.current?.stop();
      glowAnimRef.current?.stop();
      wordBounce.setValue(0);
      glowAnim.setValue(0.3);
    }
    
    return () => {
      // Cleanup on unmount
      wordBounceAnimRef.current?.stop();
      glowAnimRef.current?.stop();
    };
  }, [visible]);

  useEffect(() => {
    if (countdown > 0) {
      countdownScale.setValue(1.5);
      Animated.spring(countdownScale, { toValue: 1, friction: 4, tension: 150, useNativeDriver: true }).start();
    }
  }, [countdown]);

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={modalStyles.overlay}>
        <Animated.View style={[modalStyles.bgGlow, { opacity: glowAnim }]} />
        
        <Animated.View style={[
          modalStyles.card,
          { transform: [{ scale: cardScale }], opacity: cardOpacity }
        ]}>
          <View style={[modalStyles.topAccent, { backgroundColor: teamBgColor }]} />
          
          <View style={[modalStyles.teamBadge, { backgroundColor: teamBgColor }]}>
            <Text style={modalStyles.teamBadgeText}>{teamEmoji} Team {teamName}</Text>
          </View>
          
          <View style={modalStyles.wordSection}>
            <Text style={modalStyles.labelText}>Your word to draw is</Text>
            <Animated.View style={[modalStyles.wordContainer, { transform: [{ translateY: wordBounce }] }]}>
              <Text style={modalStyles.wordText}>{word?.toUpperCase() || '???'}</Text>
            </Animated.View>
          </View>
          
          <View style={modalStyles.divider} />
          
          <View style={modalStyles.countdownSection}>
            <Text style={modalStyles.hintText}>🤫 Don't say it out loud!</Text>
            
            <View style={modalStyles.countdownWrapper}>
              <Animated.View style={[
                modalStyles.countdownCircle,
                { transform: [{ scale: countdownScale }] }
              ]}>
                <Text style={modalStyles.countdownNumber}>{countdown}</Text>
              </Animated.View>
            </View>
            
            <Text style={modalStyles.readyText}>
              {countdown > 1 ? 'Get ready to draw...' : 'Starting now!'}
            </Text>
          </View>
          
          <View style={modalStyles.progressDots}>
            {[3, 2, 1].map((n) => (
              <View
                key={n}
                style={[
                  modalStyles.dot,
                  countdown <= n && countdown > 0 && modalStyles.dotActive,
                  countdown === n && modalStyles.dotCurrent,
                ]}
              />
            ))}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bgGlow: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: '#6B4EE6',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 28,
    width: '88%',
    maxWidth: 360,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.5,
    shadowRadius: 40,
    elevation: 24,
  },
  topAccent: {
    height: 6,
    width: '100%',
  },
  teamBadge: {
    alignSelf: 'center',
    marginTop: 24,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  teamBadgeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  wordSection: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  labelText: {
    fontSize: 16,
    color: '#888',
    marginBottom: 8,
  },
  wordContainer: {
    backgroundColor: '#FFF5F5',
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: '#FFE0E0',
  },
  wordText: {
    fontSize: 38,
    fontWeight: 'bold',
    color: '#FF6B6B',
    textAlign: 'center',
    letterSpacing: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginHorizontal: 24,
  },
  countdownSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  hintText: {
    fontSize: 15,
    color: '#666',
    marginBottom: 20,
  },
  countdownWrapper: {
    marginBottom: 16,
  },
  countdownCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#6B4EE6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6B4EE6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },
  countdownNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
  },
  readyText: {
    fontSize: 16,
    color: '#999',
    fontStyle: 'italic',
  },
  progressDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    paddingBottom: 24,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ddd',
  },
  dotActive: {
    backgroundColor: '#4ECDC4',
  },
  dotCurrent: {
    backgroundColor: '#6B4EE6',
    transform: [{ scale: 1.3 }],
  },
});

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CANVAS_SIZE = SCREEN_WIDTH - 32;

interface Point {
  x: number;
  y: number;
}

interface LocalPath {
  id: string;
  points: Point[];
  color: string;
  brushSize: number;
}

interface MultiplayerGameScreenProps {
  room: Room;
  players: Player[];
  currentPlayer: Player | null;
  messages: ChatMessage[];
  drawings: DrawingPath[]; // From store - remote drawings
  word: string | null;
  timeRemaining: number;
  onSendDrawing: (event: Omit<DrawingEvent, 'player_id'>) => void;
  onSendChat: (text: string) => void;
  onTagTeam: (playerId: string) => void;
  onCorrectGuess: () => void;
  onSkipWord: () => void;
  onLeave: () => void;
}

const COLORS = ['#000000', '#FF0000', '#0000FF', '#00AA00', '#FFFFFF'];
const DEFAULT_BRUSH_SIZE = 8;

export const MultiplayerGameScreen: React.FC<MultiplayerGameScreenProps> = ({
  room,
  players,
  currentPlayer,
  messages,
  drawings,
  word,
  timeRemaining,
  onSendDrawing,
  onSendChat,
  onTagTeam,
  onCorrectGuess,
  onSkipWord,
  onLeave,
}) => {
  // Local drawing state (for the current path being drawn)
  const [localPaths, setLocalPaths] = useState<LocalPath[]>([]);
  const [currentPath, setCurrentPath] = useState<LocalPath | null>(null);
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [chatInput, setChatInput] = useState('');
  const brushSize = DEFAULT_BRUSH_SIZE;
  const scrollRef = useRef<ScrollView>(null);
  
  // Word reveal state
  const [showWordReveal, setShowWordReveal] = useState(false);
  const [wordCountdown, setWordCountdown] = useState(3);
  const wordRevealTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastRoundRef = useRef<number>(0);
  const lastWordRef = useRef<string | null>(null);
  
  // Round transition state
  const [showRoundTransition, setShowRoundTransition] = useState(false);
  const [transitionMessage, setTransitionMessage] = useState('');
  const roundTransitionAnim = useRef(new Animated.Value(0)).current;

  // Animations
  const timerPulse = useRef(new Animated.Value(1)).current;
  const correctGuessAnim = useRef(new Animated.Value(0)).current;
  const scoreAnim = useRef(new Animated.Value(1)).current;
  const [showCorrect, setShowCorrect] = useState(false);

  const isDrawing = currentPlayer?.is_drawing;
  const drawingTeam = room.drawing_team;
  const myTeam = currentPlayer?.team;
  // In Pictionary: teammates of the drawer guess, not the opposing team
  // You're a guesser if you're on the drawing team but NOT the drawer
  const isGuessingTeam = myTeam === drawingTeam && !isDrawing;
  // You're watching if you're on the OTHER team (not drawing team)
  const isWatchingTeam = myTeam !== drawingTeam;

  const team1Players = players.filter(p => p.team === 1);
  const team2Players = players.filter(p => p.team === 2);
  const currentDrawer = players.find(p => p.is_drawing);
  const teammates = players.filter(
    p => p.team === currentPlayer?.team && p.id !== currentPlayer?.id
  );

  // Cleanup word reveal timer on unmount and reset refs
  useEffect(() => {
    // Reset refs when component mounts (new game)
    lastRoundRef.current = 0;
    lastWordRef.current = null;
    
    return () => {
      if (wordRevealTimerRef.current) {
        clearTimeout(wordRevealTimerRef.current);
      }
    };
  }, []);

  // Clear local paths when round changes or drawings are cleared
  useEffect(() => {
    // When round changes, clear local drawing state
    setLocalPaths([]);
    setCurrentPath(null);
    
    // Show round transition (except for first round)
    if (room.current_round > 1 && !isDrawing) {
      const teamName = room.drawing_team === 1 ? 'Blue' : 'Red';
      const teamEmoji = room.drawing_team === 1 ? '🔵' : '🔴';
      setTransitionMessage(`${teamEmoji} Team ${teamName}'s Turn!`);
      setShowRoundTransition(true);
      
      Animated.sequence([
        Animated.timing(roundTransitionAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.delay(1500),
        Animated.timing(roundTransitionAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start(() => setShowRoundTransition(false));
    }
  }, [room.current_round]);

  // Also clear when remote drawings are cleared (sync with store)
  useEffect(() => {
    if (drawings.length === 0) {
      setLocalPaths([]);
      setCurrentPath(null);
    }
  }, [drawings.length]);

  // Show word reveal modal when round starts and player is the drawer
  useEffect(() => {
    const currentRound = room.current_round;
    const currentWord = word;
    
    // Only show modal when:
    // 1. Player is the drawer
    // 2. There's a word to draw
    // 3. Either the round changed OR we got a new word (for the same round)
    const isNewRound = currentRound > lastRoundRef.current;
    const isNewWord = currentWord && currentWord !== lastWordRef.current;
    
    if (isDrawing && currentWord && (isNewRound || isNewWord)) {
      lastRoundRef.current = currentRound;
      lastWordRef.current = currentWord;
      
      // Clear any existing timer
      if (wordRevealTimerRef.current) {
        clearTimeout(wordRevealTimerRef.current);
      }
      
      // Show the modal
      setShowWordReveal(true);
      setWordCountdown(3);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Sequential countdown using timeouts
      wordRevealTimerRef.current = setTimeout(() => {
        setWordCountdown(2);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        
        wordRevealTimerRef.current = setTimeout(() => {
          setWordCountdown(1);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          
          wordRevealTimerRef.current = setTimeout(() => {
            setShowWordReveal(false);
            setWordCountdown(0);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          }, 1000);
        }, 1000);
      }, 1000);
    }
    
    // Reset refs when player stops drawing or word clears
    if (!isDrawing || !currentWord) {
      lastWordRef.current = null;
    }
  }, [isDrawing, word, room.current_round]);

  // Timer pulse animation when low
  useEffect(() => {
    if (timeRemaining <= 10 && timeRemaining > 0) {
      Animated.sequence([
        Animated.timing(timerPulse, {
          toValue: 1.3,
          duration: 200,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(timerPulse, {
          toValue: 1,
          duration: 200,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [timeRemaining]);

  // Celebrate correct guess
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.is_correct_guess) {
      setShowCorrect(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      Animated.sequence([
        Animated.timing(correctGuessAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.delay(1500),
        Animated.timing(correctGuessAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => setShowCorrect(false));
      
      // Bounce score
      Animated.sequence([
        Animated.timing(scoreAnim, { toValue: 1.4, duration: 150, useNativeDriver: true }),
        Animated.timing(scoreAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
      ]).start();
    }
  }, [messages]);

  // Handle touch start
  const handleTouchStart = useCallback((event: any) => {
    if (!isDrawing) return;

    const touch = event.nativeEvent;
    const x = touch.locationX;
    const y = touch.locationY;

    const newPath: LocalPath = {
      id: `local_${Date.now()}`,
      points: [{ x, y }],
      color: selectedColor,
      brushSize,
    };

    setCurrentPath(newPath);
    onSendDrawing({
      type: 'start',
      x,
      y,
      color: selectedColor,
      brushSize,
      timestamp: Date.now(),
    });
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [isDrawing, selectedColor, brushSize, onSendDrawing]);

  // Handle touch move
  const handleTouchMove = useCallback((event: any) => {
    if (!isDrawing || !currentPath) return;

    const touch = event.nativeEvent;
    const x = touch.locationX;
    const y = touch.locationY;

    setCurrentPath(prev => {
      if (!prev) return null;
      return {
        ...prev,
        points: [...prev.points, { x, y }],
      };
    });

    onSendDrawing({
      type: 'move',
      x,
      y,
      color: selectedColor,
      brushSize,
      timestamp: Date.now(),
    });
  }, [isDrawing, currentPath, selectedColor, brushSize, onSendDrawing]);

  // Handle touch end
  const handleTouchEnd = useCallback(() => {
    if (!isDrawing || !currentPath) return;

    setLocalPaths(prev => [...prev, currentPath]);
    setCurrentPath(null);

    onSendDrawing({
      type: 'end',
      color: selectedColor,
      brushSize,
      timestamp: Date.now(),
    });
  }, [isDrawing, currentPath, selectedColor, brushSize, onSendDrawing]);

  // Clear canvas
  const handleClear = useCallback(() => {
    setLocalPaths([]);
    setCurrentPath(null);
    onSendDrawing({
      type: 'clear',
      color: selectedColor,
      brushSize,
      timestamp: Date.now(),
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [onSendDrawing, selectedColor, brushSize]);

  // Undo last stroke
  const handleUndo = useCallback(() => {
    setLocalPaths(prev => prev.slice(0, -1));
    onSendDrawing({
      type: 'undo',
      color: selectedColor,
      brushSize,
      timestamp: Date.now(),
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [onSendDrawing, selectedColor, brushSize]);

  // Send chat message
  const handleSendChat = useCallback(() => {
    if (!chatInput.trim()) return;
    onSendChat(chatInput.trim());
    setChatInput('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [chatInput, onSendChat]);

  // Auto-scroll chat
  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  // Convert points to SVG path
  const pointsToPath = (points: Point[]): string => {
    if (points.length === 0) return '';
    const [first, ...rest] = points;
    let d = `M ${first.x} ${first.y}`;
    for (const point of rest) {
      d += ` L ${point.x} ${point.y}`;
    }
    return d;
  };

  // Format time
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Create word hint (blanks with some letters shown)
  const getWordHint = (w: string | null): string => {
    if (!w) return '???';
    // Show first letter and blanks
    return w.split('').map((c, i) => i === 0 ? c.toUpperCase() : ' _').join('');
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  // Get team colors for the drawer
  const getTeamInfo = () => {
    const drawerTeam = currentDrawer?.team;
    if (drawerTeam === 1) {
      return { emoji: '🔵', name: 'Blue', bgColor: '#4ECDC4' };
    }
    return { emoji: '🔴', name: 'Red', bgColor: '#FF6B6B' };
  };

  const teamInfo = getTeamInfo();

  return (
    <SafeAreaView style={styles.container}>
      {/* Word Reveal Modal for Drawer */}
      <WordRevealModal
        visible={showWordReveal}
        word={word || ''}
        countdown={wordCountdown}
        teamEmoji={teamInfo.emoji}
        teamName={teamInfo.name}
        teamBgColor={teamInfo.bgColor}
      />

      <TouchableWithoutFeedback onPress={dismissKeyboard} accessible={false}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
        {/* Correct Guess Overlay */}
        {showCorrect && (
          <Animated.View style={[
            styles.correctOverlay,
            { opacity: correctGuessAnim }
          ]}>
            <Animated.Text style={[
              styles.correctText,
              { transform: [{ scale: correctGuessAnim }] }
            ]}>
              🎉 CORRECT! 🎉
            </Animated.Text>
          </Animated.View>
        )}

        {/* Round Transition Overlay */}
        {showRoundTransition && (
          <Animated.View style={[
            styles.roundTransitionOverlay,
            { opacity: roundTransitionAnim }
          ]}>
            <Animated.View style={[
              styles.roundTransitionCard,
              { transform: [{ scale: roundTransitionAnim }] }
            ]}>
              <Text style={styles.roundTransitionRound}>Round {room.current_round}</Text>
              <Text style={styles.roundTransitionTeam}>{transitionMessage}</Text>
            </Animated.View>
          </Animated.View>
        )}

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.leaveGameButton} onPress={onLeave}>
            <Text style={styles.leaveGameText}>✕</Text>
          </TouchableOpacity>
          <View style={styles.roundIndicator}>
            <Text style={styles.roundText}>Round {room.current_round}/{room.total_rounds}</Text>
          </View>
          <Animated.View style={[
            styles.timer,
            timeRemaining <= 10 && styles.timerDanger,
            { transform: [{ scale: timerPulse }] }
          ]}>
            <Text style={[
              styles.timerText,
              timeRemaining <= 10 && styles.timerWarning,
            ]}>
              ⏱️ {formatTime(timeRemaining)}
            </Text>
          </Animated.View>
        </View>
        
        {/* Score Bar */}
        <Animated.View style={[styles.scoreBar, { transform: [{ scale: scoreAnim }] }]}>
          <View style={[styles.teamScoreBox, styles.team1ScoreBox]}>
            <Text style={styles.teamScoreEmoji}>🔵</Text>
            <Text style={styles.teamScoreValue}>{team1Players.reduce((sum, p) => sum + p.score, 0)}</Text>
          </View>
          <Text style={styles.vsText}>VS</Text>
          <View style={[styles.teamScoreBox, styles.team2ScoreBox]}>
            <Text style={styles.teamScoreValue}>{team2Players.reduce((sum, p) => sum + p.score, 0)}</Text>
            <Text style={styles.teamScoreEmoji}>🔴</Text>
          </View>
        </Animated.View>

        {/* Word/Status Bar - word only shown to drawer (word is null for everyone else) */}
        <View style={styles.statusBar}>
          {isDrawing ? (
            <View style={styles.wordContainer}>
              <Text style={styles.wordLabel}>Draw:</Text>
              <Text style={styles.word}>{word ? word.toUpperCase() : '???'}</Text>
            </View>
          ) : isGuessingTeam ? (
            <View style={styles.statusBarContent}>
              <Text style={styles.drawerInfo}>✏️ {currentDrawer?.name || 'Teammate'} is drawing</Text>
              <Text style={styles.guessPrompt}>Type your guesses below!</Text>
            </View>
          ) : (
            <View style={styles.statusBarContent}>
              <Text style={styles.watchingInfo}>
                {drawingTeam === 1 ? '🔵' : '🔴'} Team {drawingTeam === 1 ? 'Blue' : 'Red'}'s turn
              </Text>
              <Text style={styles.drawerInfo}>{currentDrawer?.name || 'Someone'} is drawing</Text>
            </View>
          )}
        </View>

        {/* Canvas - shows both local and remote drawings */}
        <View style={styles.canvasContainer}>
          <View
            style={styles.canvas}
            onStartShouldSetResponder={() => !!isDrawing}
            onMoveShouldSetResponder={() => !!isDrawing}
            onResponderGrant={handleTouchStart}
            onResponderMove={handleTouchMove}
            onResponderRelease={handleTouchEnd}
          >
            <Svg width={CANVAS_SIZE} height={CANVAS_SIZE}>
              {/* Remote drawings from other players */}
              {drawings.map(path => (
                <Path
                  key={path.id}
                  d={pointsToPath(path.points)}
                  stroke={path.color}
                  strokeWidth={path.brushSize}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ))}
              {/* Local completed paths */}
              {localPaths.map(path => (
                <Path
                  key={path.id}
                  d={pointsToPath(path.points)}
                  stroke={path.color}
                  strokeWidth={path.brushSize}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ))}
              {/* Current path being drawn */}
              {currentPath && (
                <Path
                  d={pointsToPath(currentPath.points)}
                  stroke={currentPath.color}
                  strokeWidth={currentPath.brushSize}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
            </Svg>
          </View>
        </View>

        {/* Drawing Tools (only for drawer) */}
        {isDrawing && (
          <View style={styles.tools}>
            {/* Row 1: Colors + Undo/Clear */}
            <View style={styles.toolsRow}>
              {COLORS.map(color => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorButton,
                    { backgroundColor: color },
                    color === '#FFFFFF' && styles.whiteColor,
                    selectedColor === color && styles.selectedColor,
                  ]}
                  onPress={() => {
                    setSelectedColor(color);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                />
              ))}
              <TouchableOpacity style={styles.actionButton} onPress={handleUndo}>
                <Text style={styles.actionText}>↩️</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionButton, styles.clearButton]} onPress={handleClear}>
                <Text style={styles.actionText}>🗑️</Text>
              </TouchableOpacity>
            </View>

            {/* Row 2: Got It + Skip (centered) */}
            <View style={styles.actionRow}>
              <TouchableOpacity 
                style={styles.correctButton} 
                onPress={() => {
                  onCorrectGuess();
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                }}
              >
                <Text style={styles.correctButtonText}>✅ Got It!</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.skipButton} 
                onPress={() => {
                  onSkipWord();
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }}
              >
                <Text style={styles.skipButtonText}>⏭️ Skip</Text>
              </TouchableOpacity>
            </View>

            {/* Row 3: Guesses */}
            {messages.filter(m => m.player_id !== 'system').length > 0 && (
              <ScrollView 
                ref={scrollRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.guessesRow}
                contentContainerStyle={styles.guessesContent}
              >
                <Text style={styles.guessesLabel}>Guesses: </Text>
                {messages.filter(m => m.player_id !== 'system').map(msg => (
                  <View 
                    key={msg.id} 
                    style={[
                      styles.guessChip,
                      msg.is_correct_guess && styles.guessChipCorrect,
                    ]}
                  >
                    <Text style={styles.guessChipText}>
                      {msg.is_correct_guess ? '🎉' : msg.text}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        )}

        {/* Chat (for guessing team) */}
        {isGuessingTeam && (
          <View style={styles.chatContainer}>
            <View style={styles.chatHeader}>
              <Text style={styles.chatHeaderText}>💬 Type your guesses!</Text>
            </View>
            <ScrollView
              ref={scrollRef}
              style={styles.chatMessages}
              contentContainerStyle={styles.chatContent}
            >
              {messages.map(msg => (
                <View
                  key={msg.id}
                  style={[
                    styles.message,
                    msg.is_correct_guess && styles.correctMessage,
                    msg.player_id === currentPlayer?.id && styles.myMessage,
                  ]}
                >
                  <Text style={[
                    styles.messageAuthor,
                    msg.is_correct_guess && styles.correctMessageAuthor,
                  ]}>
                    {msg.player_name}:
                  </Text>
                  <Text style={[
                    styles.messageText,
                    msg.is_correct_guess && styles.correctMessageText,
                  ]}>
                    {msg.text}
                  </Text>
                </View>
              ))}
            </ScrollView>
            <View style={styles.chatInputContainer}>
              <TextInput
                style={styles.input}
                value={chatInput}
                onChangeText={setChatInput}
                placeholder="Type your guess..."
                placeholderTextColor="rgba(255,255,255,0.5)"
                returnKeyType="send"
                onSubmitEditing={handleSendChat}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity 
                style={[styles.sendButton, !chatInput.trim() && styles.sendButtonDisabled]} 
                onPress={handleSendChat}
                disabled={!chatInput.trim()}
              >
                <Text style={styles.sendText}>Send</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Watching the other team play */}
        {isWatchingTeam && (
          <View style={styles.watchingContainer}>
            <View style={styles.watchingHeader}>
              <Text style={styles.watchingText}>👀 Watching</Text>
              <Text style={styles.watchingSubtext}>
                {drawingTeam === 1 ? '🔵 Team Blue' : '🔴 Team Red'}'s turn
              </Text>
            </View>
            
            {/* Read-only chat to see guesses - filter out system messages */}
            <View style={styles.watchingChatContainer}>
              <Text style={styles.watchingChatLabel}>💬 Their guesses:</Text>
              <ScrollView
                ref={scrollRef}
                style={styles.watchingChat}
                contentContainerStyle={styles.watchingChatContent}
              >
                {messages.filter(m => m.player_id !== 'system').length === 0 ? (
                  <Text style={styles.noGuessesText}>No guesses yet...</Text>
                ) : (
                  messages.filter(m => m.player_id !== 'system').map(msg => (
                    <View
                      key={msg.id}
                      style={[
                        styles.watchingMessage,
                        msg.is_correct_guess && styles.watchingCorrectMessage,
                      ]}
                    >
                      <Text style={styles.watchingMessageAuthor}>{msg.player_name}:</Text>
                      <Text style={[
                        styles.watchingMessageText,
                        msg.is_correct_guess && styles.watchingCorrectText,
                      ]}>
                        {msg.is_correct_guess ? '🎉 Correct!' : msg.text}
                      </Text>
                    </View>
                  ))
                )}
              </ScrollView>
            </View>
            
            <Text style={styles.watchingHint}>
              Your turn is coming up next!
            </Text>
          </View>
        )}
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#6B4EE6',
  },
  keyboardView: {
    flex: 1,
  },
  correctOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(78, 205, 196, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  correctText: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  leaveGameButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  leaveGameText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
  roundIndicator: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  roundText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFE66D',
  },
  scoreBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 12,
  },
  teamScoreBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  team1ScoreBox: {
    backgroundColor: 'rgba(78, 205, 196, 0.3)',
  },
  team2ScoreBox: {
    backgroundColor: 'rgba(255, 107, 107, 0.3)',
  },
  teamScoreEmoji: {
    fontSize: 20,
  },
  teamScoreValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  vsText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'rgba(255,255,255,0.5)',
  },
  timer: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  timerDanger: {
    backgroundColor: 'rgba(255,107,107,0.5)',
  },
  timerText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  timerWarning: {
    color: '#FF6B6B',
  },
  statusBar: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    padding: 12,
    alignItems: 'center',
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  wordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  wordLabel: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
  },
  word: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFE66D',
    letterSpacing: 2,
  },
  wordHint: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFE66D',
    letterSpacing: 4,
  },
  statusText: {
    fontSize: 16,
    color: '#fff',
  },
  statusBarContent: {
    alignItems: 'center',
  },
  drawerInfo: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  guessPrompt: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },
  watchingInfo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFE66D',
    marginBottom: 4,
  },
  canvasContainer: {
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  canvas: {
    width: CANVAS_SIZE,
    height: CANVAS_SIZE,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  tools: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
  },
  toolsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  colorButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  whiteColor: {
    borderColor: 'rgba(255,255,255,0.5)',
  },
  selectedColor: {
    borderColor: '#FFE66D',
    borderWidth: 3,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButton: {
    backgroundColor: 'rgba(255,107,107,0.4)',
  },
  actionText: {
    fontSize: 18,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  correctButton: {
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  correctButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  skipButton: {
    backgroundColor: 'rgba(255,107,107,0.7)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  skipButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  guessesRow: {
    maxHeight: 36,
  },
  guessesContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
  },
  guessesLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
  },
  guessChip: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  guessChipCorrect: {
    backgroundColor: '#4ECDC4',
  },
  guessChipText: {
    color: '#fff',
    fontSize: 14,
  },
  chatContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  chatHeader: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  chatHeaderText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFE66D',
  },
  chatMessages: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  chatContent: {
    padding: 14,
  },
  message: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
    padding: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  myMessage: {
    backgroundColor: 'rgba(78, 205, 196, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(78, 205, 196, 0.5)',
  },
  correctMessage: {
    backgroundColor: '#4ECDC4',
    padding: 12,
    borderWidth: 0,
  },
  messageAuthor: {
    fontWeight: 'bold',
    color: '#FFE66D',
    fontSize: 15,
  },
  correctMessageAuthor: {
    color: '#fff',
  },
  messageText: {
    color: '#fff',
    flex: 1,
    fontSize: 16,
  },
  correctMessageText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  chatInputContainer: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: 'rgba(0,0,0,0.2)',
    padding: 10,
    borderRadius: 20,
  },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 14,
    fontSize: 17,
    color: '#333',
    borderWidth: 0,
  },
  sendButton: {
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 20,
    justifyContent: 'center',
    shadowColor: '#4ECDC4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  sendButtonDisabled: {
    opacity: 0.4,
    shadowOpacity: 0,
  },
  sendText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 17,
  },
  watchingContainer: {
    flex: 1,
    padding: 16,
  },
  watchingHeader: {
    alignItems: 'center',
    marginBottom: 12,
  },
  watchingText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  watchingSubtext: {
    fontSize: 16,
    color: '#FFE66D',
    marginTop: 4,
    fontWeight: '600',
  },
  watchingChatContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 16,
    padding: 12,
    marginVertical: 12,
  },
  watchingChatLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 8,
    fontWeight: '600',
  },
  watchingChat: {
    flex: 1,
  },
  watchingChatContent: {
    paddingBottom: 8,
  },
  noGuessesText: {
    color: 'rgba(255,255,255,0.5)',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 20,
  },
  watchingMessage: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
  },
  watchingCorrectMessage: {
    backgroundColor: 'rgba(78, 205, 196, 0.5)',
  },
  watchingMessageAuthor: {
    fontWeight: 'bold',
    color: 'rgba(255,255,255,0.8)',
  },
  watchingMessageText: {
    color: 'rgba(255,255,255,0.8)',
    flex: 1,
  },
  watchingCorrectText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  watchingHint: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  roundTransitionOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99,
  },
  roundTransitionCard: {
    backgroundColor: '#6B4EE6',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 16,
  },
  roundTransitionRound: {
    fontSize: 20,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
  },
  roundTransitionTeam: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFE66D',
  },
});

export default MultiplayerGameScreen;
