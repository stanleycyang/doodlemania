import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  Modal,
  Animated,
  Easing,
  GestureResponderEvent,
  ScrollView,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { MultiplayerApp } from './src/App.multiplayer';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CANVAS_SIZE = Math.min(SCREEN_WIDTH - 32, 380);

type AppMode = 'select' | 'multiplayer' | 'local';

const WORD_CATEGORIES = {
  easy: ['cat', 'dog', 'sun', 'tree', 'house', 'car', 'ball', 'star', 'fish', 'bird', 'hat', 'book', 'phone', 'cup', 'bed'],
  animals: ['elephant', 'giraffe', 'penguin', 'dolphin', 'butterfly', 'kangaroo', 'octopus', 'peacock', 'turtle', 'zebra', 'lion', 'monkey'],
  food: ['pizza', 'ice cream', 'hamburger', 'spaghetti', 'cupcake', 'taco', 'sushi', 'popcorn', 'sandwich', 'donut', 'cookie', 'banana'],
  actions: ['dancing', 'sleeping', 'running', 'jumping', 'swimming', 'flying', 'cooking', 'singing', 'laughing', 'crying', 'reading', 'painting'],
  objects: ['umbrella', 'guitar', 'camera', 'bicycle', 'airplane', 'rocket', 'balloon', 'present', 'candle', 'crown', 'glasses', 'watch'],
  places: ['beach', 'mountain', 'castle', 'jungle', 'space', 'desert', 'city', 'farm', 'hospital', 'school', 'restaurant', 'park'],
  hard: ['electricity', 'jealousy', 'democracy', 'imagination', 'confusion', 'celebration', 'adventure', 'nightmare', 'freedom', 'mystery'],
};

const DIFFICULTY_WORDS = {
  easy: [...WORD_CATEGORIES.easy, ...WORD_CATEGORIES.animals, ...WORD_CATEGORIES.food],
  medium: [...WORD_CATEGORIES.actions, ...WORD_CATEGORIES.objects, ...WORD_CATEGORIES.places],
  hard: [...WORD_CATEGORIES.hard, ...WORD_CATEGORIES.actions],
};

const COLORS = ['#000000', '#FFFFFF', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFE66D', '#DDA0DD', '#FF69B4', '#FFA500'];
const BRUSH_SIZES = [3, 6, 10, 16];
const TIME_OPTIONS = [30, 60, 90, 120];

type GameState = 'menu' | 'settings' | 'drawing' | 'reveal';
type Difficulty = 'easy' | 'medium' | 'hard' | 'mixed';

interface PathData {
  d: string;
  color: string;
  strokeWidth: number;
}

interface GameSettings {
  timeLimit: number;
  difficulty: Difficulty;
  teamCount: 2 | 3 | 4;
}

// Root App
export default function App() {
  const [appMode, setAppMode] = useState<AppMode>('select');
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const transitionTo = (mode: AppMode) => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setAppMode(mode);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  };

  if (appMode === 'select') {
    return (
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <ModeSelectScreen 
          onSelectMultiplayer={() => transitionTo('multiplayer')} 
          onSelectLocal={() => transitionTo('local')} 
        />
      </Animated.View>
    );
  }

  if (appMode === 'multiplayer') {
    return (
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <MultiplayerApp onPlayLocal={() => transitionTo('local')} />
      </Animated.View>
    );
  }

  return (
    <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
      <LocalGameApp onBack={() => transitionTo('select')} />
    </Animated.View>
  );
}

// Mode Selection Screen
function ModeSelectScreen({ onSelectMultiplayer, onSelectLocal }: { onSelectMultiplayer: () => void; onSelectLocal: () => void }) {
  const logoScale = useRef(new Animated.Value(0)).current;
  const titleSlide = useRef(new Animated.Value(-30)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const button1Slide = useRef(new Animated.Value(80)).current;
  const button2Slide = useRef(new Animated.Value(80)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const emojiWiggle = useRef(new Animated.Value(0)).current;
  const button1Scale = useRef(new Animated.Value(1)).current;
  const button2Scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(logoScale, { toValue: 1, friction: 4, tension: 100, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(titleSlide, { toValue: 0, duration: 400, easing: Easing.out(Easing.back(1.5)), useNativeDriver: true }),
        Animated.timing(titleOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(buttonOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.stagger(150, [
          Animated.spring(button1Slide, { toValue: 0, friction: 6, tension: 80, useNativeDriver: true }),
          Animated.spring(button2Slide, { toValue: 0, friction: 6, tension: 80, useNativeDriver: true }),
        ]),
      ]),
      Animated.timing(taglineOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(emojiWiggle, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(emojiWiggle, { toValue: -1, duration: 500, useNativeDriver: true }),
        Animated.timing(emojiWiggle, { toValue: 0, duration: 500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const handlePress = (scale: Animated.Value, callback: () => void) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start(callback);
  };

  const emojiRotate = emojiWiggle.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-15deg', '0deg', '15deg'],
  });

  return (
    <SafeAreaView style={modeStyles.container}>
      <View style={modeStyles.content}>
        <Animated.Text style={[modeStyles.emoji, { transform: [{ scale: logoScale }, { rotate: emojiRotate }] }]}>
          🎨
        </Animated.Text>
        <Animated.Text style={[modeStyles.title, { opacity: titleOpacity, transform: [{ translateY: titleSlide }] }]}>
          Pictionary
        </Animated.Text>
        <Animated.Text style={[modeStyles.subtitle, { opacity: titleOpacity, transform: [{ translateY: titleSlide }] }]}>
          Party
        </Animated.Text>

        <Animated.View style={[modeStyles.buttons, { opacity: buttonOpacity }]}>
          <Animated.View style={{ transform: [{ translateY: button1Slide }, { scale: button1Scale }] }}>
            <TouchableOpacity 
              style={[modeStyles.button, modeStyles.multiplayerButton]} 
              onPress={() => handlePress(button1Scale, onSelectMultiplayer)}
              activeOpacity={1}
            >
              <Text style={modeStyles.buttonIcon}>🌐</Text>
              <View style={modeStyles.buttonContent}>
                <Text style={modeStyles.buttonTitle}>Online Multiplayer</Text>
                <Text style={modeStyles.buttonDesc}>Play with friends anywhere</Text>
              </View>
              <Text style={modeStyles.buttonArrow}>→</Text>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View style={{ transform: [{ translateY: button2Slide }, { scale: button2Scale }] }}>
            <TouchableOpacity 
              style={[modeStyles.button, modeStyles.localButton]} 
              onPress={() => handlePress(button2Scale, onSelectLocal)}
              activeOpacity={1}
            >
              <Text style={modeStyles.buttonIcon}>📱</Text>
              <View style={modeStyles.buttonContent}>
                <Text style={modeStyles.buttonTitle}>Local Party</Text>
                <Text style={modeStyles.buttonDesc}>Same device, pass & play</Text>
              </View>
              <Text style={modeStyles.buttonArrow}>→</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>

        <Animated.Text style={[modeStyles.tagline, { opacity: taglineOpacity }]}>
          Draw. Guess. Win!
        </Animated.Text>
      </View>
    </SafeAreaView>
  );
}

const modeStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#6B4EE6' },
  content: { flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 100, marginBottom: 8 },
  title: { fontSize: 52, fontWeight: 'bold', color: '#fff', textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 2, height: 2 }, textShadowRadius: 8 },
  subtitle: { fontSize: 42, fontWeight: '700', color: '#FFB347', marginBottom: 48, textShadowColor: 'rgba(0,0,0,0.2)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 4 },
  buttons: { width: '100%', gap: 18, marginBottom: 48 },
  button: { flexDirection: 'row', alignItems: 'center', padding: 22, borderRadius: 20, gap: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 8 },
  multiplayerButton: { backgroundColor: '#FF6B6B' },
  localButton: { backgroundColor: '#4ECDC4' },
  buttonIcon: { fontSize: 40 },
  buttonContent: { flex: 1 },
  buttonTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  buttonDesc: { fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  buttonArrow: { fontSize: 24, fontWeight: 'bold', color: 'rgba(255,255,255,0.8)' },
  tagline: { fontSize: 20, color: 'rgba(255,255,255,0.7)', fontStyle: 'italic', fontWeight: '500' },
});

// Local Game - Redesigned with unified theme
function LocalGameApp({ onBack }: { onBack: () => void }) {
  const [gameState, setGameState] = useState<GameState>('menu');
  const [currentWord, setCurrentWord] = useState('');
  const [scores, setScores] = useState<number[]>([0, 0]);
  const [currentTeam, setCurrentTeam] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [paths, setPaths] = useState<PathData[]>([]);
  const [currentPath, setCurrentPath] = useState('');
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(6);
  const [showWord, setShowWord] = useState(false);
  const [settings, setSettings] = useState<GameSettings>({
    timeLimit: 60,
    difficulty: 'mixed',
    teamCount: 2,
  });
  const [roundNumber, setRoundNumber] = useState(1);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const wordTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Animations
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const timerPulse = useRef(new Animated.Value(1)).current;
  const menuAnim = useRef(new Animated.Value(0)).current;
  const scoreScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (gameState === 'menu') {
      Animated.spring(menuAnim, { toValue: 1, friction: 6, useNativeDriver: true }).start();
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (wordTimerRef.current) clearTimeout(wordTimerRef.current);
    };
  }, [gameState]);

  useEffect(() => {
    if (timeLeft <= 10 && timeLeft > 0 && gameState === 'drawing') {
      Animated.sequence([
        Animated.timing(timerPulse, { toValue: 1.2, duration: 200, useNativeDriver: true }),
        Animated.timing(timerPulse, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [timeLeft, gameState]);

  const getRandomWord = useCallback(() => {
    let wordPool: string[];
    if (settings.difficulty === 'mixed') {
      wordPool = [...DIFFICULTY_WORDS.easy, ...DIFFICULTY_WORDS.medium, ...DIFFICULTY_WORDS.hard];
    } else {
      wordPool = DIFFICULTY_WORDS[settings.difficulty];
    }
    return wordPool[Math.floor(Math.random() * wordPool.length)];
  }, [settings.difficulty]);

  const teamColors = ['🔵', '🔴', '🟢', '🟡'];
  const teamNames = ['Blue', 'Red', 'Green', 'Yellow'];
  const teamBgColors = ['#4ECDC4', '#FF6B6B', '#96CEB4', '#FFE66D'];

  const startRound = useCallback(() => {
    const word = getRandomWord();
    setCurrentWord(word);
    setPaths([]);
    setCurrentPath('');
    setTimeLeft(settings.timeLimit);
    setShowWord(true);
    setGameState('drawing');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    wordTimerRef.current = setTimeout(() => {
      setShowWord(false);
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            setGameState('reveal');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, 3000);
  }, [getRandomWord, settings.timeLimit]);

  const handleGuessCorrect = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    Animated.sequence([
      Animated.timing(scoreScale, { toValue: 1.4, duration: 150, useNativeDriver: true }),
      Animated.spring(scoreScale, { toValue: 1, friction: 3, useNativeDriver: true }),
    ]).start();

    setScores((prev) => {
      const newScores = [...prev];
      newScores[currentTeam] += 1;
      return newScores;
    });
    setCurrentTeam((prev) => (prev + 1) % settings.teamCount);
    setRoundNumber((prev) => prev + 1);
    setGameState('menu');
  }, [currentTeam, settings.teamCount]);

  const handleSkip = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCurrentTeam((prev) => (prev + 1) % settings.teamCount);
    setRoundNumber((prev) => prev + 1);
    setGameState('menu');
  }, [settings.teamCount]);

  const clearCanvas = useCallback(() => {
    setPaths([]);
    setCurrentPath('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const undoLast = useCallback(() => {
    setPaths((prev) => prev.slice(0, -1));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const resetGame = useCallback(() => {
    setScores(Array(settings.teamCount).fill(0));
    setCurrentTeam(0);
    setRoundNumber(1);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [settings.teamCount]);

  const handleTouchStart = (event: GestureResponderEvent) => {
    const { locationX, locationY } = event.nativeEvent;
    setCurrentPath(`M${locationX.toFixed(0)},${locationY.toFixed(0)}`);
  };

  const handleTouchMove = (event: GestureResponderEvent) => {
    const { locationX, locationY } = event.nativeEvent;
    setCurrentPath((prev) => `${prev} L${locationX.toFixed(0)},${locationY.toFixed(0)}`);
  };

  const handleTouchEnd = () => {
    if (currentPath) {
      setPaths((prev) => [...prev, { d: currentPath, color: selectedColor, strokeWidth: brushSize }]);
      setCurrentPath('');
    }
  };

  // MENU SCREEN - Redesigned
  const renderMenu = () => (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Local Party</Text>
        <TouchableOpacity style={styles.settingsIcon} onPress={() => setGameState('settings')}>
          <Text style={styles.settingsIconText}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.menuContent}>
        {/* Current Turn Card */}
        <Animated.View style={[styles.turnCard, { backgroundColor: teamBgColors[currentTeam], transform: [{ scale: menuAnim }] }]}>
          <Text style={styles.turnEmoji}>{teamColors[currentTeam]}</Text>
          <View style={styles.turnInfo}>
            <Text style={styles.turnLabel}>UP NEXT</Text>
            <Text style={styles.turnTeam}>Team {teamNames[currentTeam]}</Text>
          </View>
          <View style={styles.roundBadge}>
            <Text style={styles.roundBadgeText}>Round {roundNumber}</Text>
          </View>
        </Animated.View>

        {/* Scoreboard */}
        <View style={styles.scoreboard}>
          <Text style={styles.scoreboardTitle}>📊 Scoreboard</Text>
          <View style={styles.scoreGrid}>
            {scores.slice(0, settings.teamCount).map((score, index) => (
              <Animated.View 
                key={index}
                style={[
                  styles.scoreCard,
                  { backgroundColor: teamBgColors[index] },
                  currentTeam === index && { transform: [{ scale: scoreScale }] },
                ]}
              >
                <Text style={styles.scoreEmoji}>{teamColors[index]}</Text>
                <Text style={styles.scoreValue}>{score}</Text>
                <Text style={styles.scoreLabel}>{teamNames[index]}</Text>
              </Animated.View>
            ))}
          </View>
        </View>

        {/* Start Button */}
        <TouchableOpacity style={styles.startButton} onPress={startRound} activeOpacity={0.9}>
          <Text style={styles.startButtonEmoji}>🎯</Text>
          <Text style={styles.startButtonText}>Start Drawing!</Text>
        </TouchableOpacity>

        {/* Actions */}
        <View style={styles.menuActions}>
          <TouchableOpacity style={styles.menuAction} onPress={resetGame}>
            <Text style={styles.menuActionText}>🔄 New Game</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );

  // SETTINGS SCREEN - Redesigned
  const renderSettings = () => (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => setGameState('menu')}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView contentContainerStyle={styles.settingsContent}>
        {/* Time Setting */}
        <View style={styles.settingCard}>
          <View style={styles.settingHeader}>
            <Text style={styles.settingIcon}>⏱️</Text>
            <Text style={styles.settingTitle}>Time per Round</Text>
          </View>
          <View style={styles.optionGrid}>
            {TIME_OPTIONS.map((time) => (
              <TouchableOpacity
                key={time}
                style={[styles.optionPill, settings.timeLimit === time && styles.optionPillActive]}
                onPress={() => { setSettings((s) => ({ ...s, timeLimit: time })); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
              >
                <Text style={[styles.optionPillText, settings.timeLimit === time && styles.optionPillTextActive]}>
                  {time}s
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Difficulty Setting */}
        <View style={styles.settingCard}>
          <View style={styles.settingHeader}>
            <Text style={styles.settingIcon}>📊</Text>
            <Text style={styles.settingTitle}>Difficulty</Text>
          </View>
          <View style={styles.optionGrid}>
            {(['easy', 'medium', 'hard', 'mixed'] as Difficulty[]).map((diff) => (
              <TouchableOpacity
                key={diff}
                style={[styles.optionPill, settings.difficulty === diff && styles.optionPillActive]}
                onPress={() => { setSettings((s) => ({ ...s, difficulty: diff })); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
              >
                <Text style={[styles.optionPillText, settings.difficulty === diff && styles.optionPillTextActive]}>
                  {diff.charAt(0).toUpperCase() + diff.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Teams Setting */}
        <View style={styles.settingCard}>
          <View style={styles.settingHeader}>
            <Text style={styles.settingIcon}>👥</Text>
            <Text style={styles.settingTitle}>Number of Teams</Text>
          </View>
          <View style={styles.optionGrid}>
            {([2, 3, 4] as const).map((count) => (
              <TouchableOpacity
                key={count}
                style={[styles.optionPill, styles.optionPillWide, settings.teamCount === count && styles.optionPillActive]}
                onPress={() => {
                  setSettings((s) => ({ ...s, teamCount: count }));
                  setScores(Array(count).fill(0));
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Text style={[styles.optionPillText, settings.teamCount === count && styles.optionPillTextActive]}>
                  {count} Teams
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );

  // DRAWING SCREEN
  const renderDrawing = () => (
    <SafeAreaView style={styles.container}>
      {/* Word Modal */}
      <Modal visible={showWord} transparent animationType="fade">
        <View style={styles.wordModal}>
          <View style={styles.wordCard}>
            <Text style={styles.wordCardTeam}>{teamColors[currentTeam]} Team {teamNames[currentTeam]}</Text>
            <Text style={styles.wordCardLabel}>Your word is:</Text>
            <Text style={styles.wordCardWord}>{currentWord.toUpperCase()}</Text>
            <Text style={styles.wordCardHint}>🤫 Don't say it! Starting in 3s...</Text>
          </View>
        </View>
      </Modal>

      {/* Header with Timer */}
      <View style={styles.drawingHeader}>
        <View style={[styles.teamBadge, { backgroundColor: teamBgColors[currentTeam] }]}>
          <Text style={styles.teamBadgeText}>{teamColors[currentTeam]} {teamNames[currentTeam]}</Text>
        </View>
        <Animated.View style={[styles.timerBadge, timeLeft <= 10 && styles.timerDanger, { transform: [{ scale: timerPulse }] }]}>
          <Text style={[styles.timerText, timeLeft <= 10 && styles.timerTextDanger]}>⏱️ {timeLeft}s</Text>
        </Animated.View>
      </View>

      {/* Canvas */}
      <View style={styles.canvasWrapper}>
        <View 
          style={styles.canvas}
          onStartShouldSetResponder={() => true}
          onMoveShouldSetResponder={() => true}
          onResponderGrant={handleTouchStart}
          onResponderMove={handleTouchMove}
          onResponderRelease={handleTouchEnd}
        >
          <Svg width={CANVAS_SIZE} height={CANVAS_SIZE}>
            {paths.map((path, index) => (
              <Path key={index} d={path.d} stroke={path.color} strokeWidth={path.strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="none" />
            ))}
            {currentPath && (
              <Path d={currentPath} stroke={selectedColor} strokeWidth={brushSize} strokeLinecap="round" strokeLinejoin="round" fill="none" />
            )}
          </Svg>
        </View>
      </View>

      {/* Drawing Tools */}
      <View style={styles.toolsContainer}>
        {/* Colors */}
        <View style={styles.colorRow}>
          {COLORS.map((color) => (
            <TouchableOpacity
              key={color}
              style={[styles.colorDot, { backgroundColor: color }, color === '#FFFFFF' && styles.colorDotWhite, selectedColor === color && styles.colorDotSelected]}
              onPress={() => { setSelectedColor(color); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
            />
          ))}
        </View>

        {/* Brush Sizes */}
        <View style={styles.brushRow}>
          {BRUSH_SIZES.map((size) => (
            <TouchableOpacity
              key={size}
              style={[styles.brushDot, brushSize === size && styles.brushDotSelected]}
              onPress={() => { setBrushSize(size); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
            >
              <View style={[styles.brushPreview, { width: size, height: size, backgroundColor: selectedColor }]} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Actions */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={undoLast}>
            <Text style={styles.actionBtnText}>↩️</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.clearBtn]} onPress={clearCanvas}>
            <Text style={styles.actionBtnText}>🗑️</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.correctBtn} onPress={handleGuessCorrect}>
            <Text style={styles.correctBtnText}>✅ They Got It!</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
            <Text style={styles.skipBtnText}>⏭️</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );

  // REVEAL SCREEN
  const renderReveal = () => (
    <SafeAreaView style={styles.container}>
      <View style={styles.revealContent}>
        <Text style={styles.revealEmoji}>⏰</Text>
        <Text style={styles.revealTitle}>Time's Up!</Text>
        <Text style={styles.revealLabel}>The word was:</Text>
        <Text style={styles.revealWord}>{currentWord.toUpperCase()}</Text>
        
        <View style={styles.revealButtons}>
          <TouchableOpacity style={styles.revealYes} onPress={handleGuessCorrect}>
            <Text style={styles.revealYesText}>✅ They Got It!</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.revealNo} onPress={handleSkip}>
            <Text style={styles.revealNoText}>❌ Nope</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );

  return (
    <>
      {gameState === 'menu' && renderMenu()}
      {gameState === 'settings' && renderSettings()}
      {gameState === 'drawing' && renderDrawing()}
      {gameState === 'reveal' && renderReveal()}
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#6B4EE6' },
  
  // Header
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  backButton: { padding: 8 },
  backText: { fontSize: 16, color: '#fff', fontWeight: '600' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  settingsIcon: { padding: 8 },
  settingsIconText: { fontSize: 24 },

  // Menu
  menuContent: { padding: 20, paddingBottom: 40 },
  turnCard: { borderRadius: 24, padding: 24, flexDirection: 'row', alignItems: 'center', marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 8 },
  turnEmoji: { fontSize: 48, marginRight: 16 },
  turnInfo: { flex: 1 },
  turnLabel: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.8)', letterSpacing: 1 },
  turnTeam: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  roundBadge: { backgroundColor: 'rgba(0,0,0,0.2)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16 },
  roundBadgeText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  scoreboard: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20, padding: 20, marginBottom: 24 },
  scoreboardTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginBottom: 16, textAlign: 'center' },
  scoreGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' },
  scoreCard: { borderRadius: 16, padding: 16, alignItems: 'center', minWidth: 80, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 4 },
  scoreEmoji: { fontSize: 24, marginBottom: 4 },
  scoreValue: { fontSize: 36, fontWeight: 'bold', color: '#fff' },
  scoreLabel: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.8)' },

  startButton: { backgroundColor: '#FFE66D', borderRadius: 20, padding: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, shadowColor: '#FFE66D', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8, marginBottom: 20 },
  startButtonEmoji: { fontSize: 32 },
  startButtonText: { fontSize: 24, fontWeight: 'bold', color: '#5B3EE6' },

  menuActions: { alignItems: 'center' },
  menuAction: { padding: 12 },
  menuActionText: { fontSize: 16, color: 'rgba(255,255,255,0.7)', fontWeight: '600' },

  // Settings
  settingsContent: { padding: 20 },
  settingCard: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20, padding: 20, marginBottom: 16 },
  settingHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 10 },
  settingIcon: { fontSize: 24 },
  settingTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  optionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  optionPill: { backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 16, borderWidth: 2, borderColor: 'transparent' },
  optionPillWide: { flex: 1, alignItems: 'center' },
  optionPillActive: { backgroundColor: '#4ECDC4', borderColor: '#4ECDC4' },
  optionPillText: { fontSize: 16, fontWeight: '600', color: 'rgba(255,255,255,0.8)' },
  optionPillTextActive: { color: '#fff' },

  // Drawing
  drawingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  teamBadge: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
  teamBadgeText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  timerBadge: { backgroundColor: 'rgba(0,0,0,0.3)', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  timerDanger: { backgroundColor: 'rgba(255,107,107,0.5)' },
  timerText: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  timerTextDanger: { color: '#FF6B6B' },

  canvasWrapper: { alignItems: 'center', paddingHorizontal: 16 },
  canvas: { width: CANVAS_SIZE, height: CANVAS_SIZE, backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 8 },

  toolsContainer: { padding: 16, gap: 12 },
  colorRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, flexWrap: 'wrap' },
  colorDot: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: 'transparent' },
  colorDotWhite: { borderColor: 'rgba(255,255,255,0.5)' },
  colorDotSelected: { borderColor: '#FFE66D', borderWidth: 3, transform: [{ scale: 1.15 }] },

  brushRow: { flexDirection: 'row', justifyContent: 'center', gap: 14 },
  brushDot: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  brushDotSelected: { backgroundColor: 'rgba(255,230,109,0.4)', borderWidth: 2, borderColor: '#FFE66D' },
  brushPreview: { borderRadius: 100 },

  actionRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
  actionBtn: { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  clearBtn: { backgroundColor: 'rgba(255,107,107,0.4)' },
  actionBtnText: { fontSize: 24 },
  correctBtn: { backgroundColor: '#4ECDC4', paddingHorizontal: 20, paddingVertical: 14, borderRadius: 20 },
  correctBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  skipBtn: { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,107,107,0.6)', justifyContent: 'center', alignItems: 'center' },
  skipBtnText: { fontSize: 24 },

  // Word Modal
  wordModal: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  wordCard: { backgroundColor: '#fff', padding: 40, borderRadius: 30, alignItems: 'center', margin: 20, width: '85%' },
  wordCardTeam: { fontSize: 16, fontWeight: '600', color: '#6B4EE6', marginBottom: 8 },
  wordCardLabel: { fontSize: 18, color: '#666', marginBottom: 12 },
  wordCardWord: { fontSize: 42, fontWeight: 'bold', color: '#FF6B6B', marginBottom: 20, textAlign: 'center' },
  wordCardHint: { fontSize: 14, color: '#999', textAlign: 'center' },

  // Reveal
  revealContent: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  revealEmoji: { fontSize: 80, marginBottom: 16 },
  revealTitle: { fontSize: 40, fontWeight: 'bold', color: '#FF6B6B', marginBottom: 8 },
  revealLabel: { fontSize: 20, color: 'rgba(255,255,255,0.8)', marginBottom: 8 },
  revealWord: { fontSize: 48, fontWeight: 'bold', color: '#FFE66D', marginBottom: 40, textAlign: 'center' },
  revealButtons: { gap: 16, width: '100%' },
  revealYes: { backgroundColor: '#4ECDC4', padding: 20, borderRadius: 20, alignItems: 'center' },
  revealYesText: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  revealNo: { backgroundColor: '#FF6B6B', padding: 20, borderRadius: 20, alignItems: 'center' },
  revealNoText: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
});
