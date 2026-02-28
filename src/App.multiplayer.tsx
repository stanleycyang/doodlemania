import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, StyleSheet, Alert, Animated, Easing, ActivityIndicator, Text, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import * as Haptics from 'expo-haptics';
import { HomeScreen } from './screens/HomeScreen';
import { CreateRoomScreen } from './screens/CreateRoomScreen';
import { JoinRoomScreen } from './screens/JoinRoomScreen';
import { LobbyScreen } from './screens/LobbyScreen';
import { MultiplayerGameScreen } from './screens/MultiplayerGameScreen';
import { useMultiplayer, getSavedSession, clearSession } from './hooks/useMultiplayer';
import { isSupabaseConfigured } from './lib/supabase';
import { Player } from './types/multiplayer';

// Game End Screen Component
interface GameEndScreenProps {
  players: Player[];
  currentPlayer: Player | null;
  onPlayAgain: () => void;
  onTiebreaker: () => void;
  onLeave: () => void;
}

const GameEndScreen: React.FC<GameEndScreenProps> = ({
  players,
  currentPlayer,
  onPlayAgain,
  onTiebreaker,
  onLeave,
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const confettiAnim = useRef(new Animated.Value(0)).current;

  const team1Players = players.filter(p => p.team === 1);
  const team2Players = players.filter(p => p.team === 2);
  const team1Score = team1Players.reduce((sum, p) => sum + p.score, 0);
  const team2Score = team2Players.reduce((sum, p) => sum + p.score, 0);
  
  const winningTeam = team1Score > team2Score ? 1 : team2Score > team1Score ? 2 : 0;
  const myTeamWon = currentPlayer?.team === winningTeam;
  const isTie = team1Score === team2Score;

  useEffect(() => {
    Haptics.notificationAsync(
      myTeamWon ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning
    );
    
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(confettiAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
          Animated.timing(confettiAnim, { toValue: 0, duration: 1000, useNativeDriver: true }),
        ])
      ),
    ]).start();
  }, []);

  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <SafeAreaView style={endStyles.container}>
      <ScrollView contentContainerStyle={endStyles.scrollContent}>
        {/* Trophy Section */}
        <Animated.View style={[endStyles.trophySection, { transform: [{ scale: scaleAnim }] }]}>
          <Animated.Text style={[
            endStyles.trophy,
            { opacity: confettiAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) }
          ]}>
            {isTie ? '🤝' : '🏆'}
          </Animated.Text>
          <Text style={endStyles.resultTitle}>
            {isTie ? "It's a Tie!" : myTeamWon ? 'Your Team Won!' : 'Game Over!'}
          </Text>
          {!isTie && (
            <Text style={endStyles.winnerText}>
              {winningTeam === 1 ? '🔵 Team Blue' : '🔴 Team Red'} Wins!
            </Text>
          )}
        </Animated.View>

        {/* Final Scores */}
        <View style={endStyles.scoresContainer}>
          <View style={[endStyles.teamFinalScore, winningTeam === 1 && endStyles.winningTeam]}>
            <Text style={endStyles.teamLabel}>🔵 Team Blue</Text>
            <Text style={endStyles.finalScore}>{team1Score}</Text>
            {winningTeam === 1 && <Text style={endStyles.crownEmoji}>👑</Text>}
          </View>
          <View style={[endStyles.teamFinalScore, winningTeam === 2 && endStyles.winningTeam]}>
            <Text style={endStyles.teamLabel}>🔴 Team Red</Text>
            <Text style={endStyles.finalScore}>{team2Score}</Text>
            {winningTeam === 2 && <Text style={endStyles.crownEmoji}>👑</Text>}
          </View>
        </View>

        {/* Leaderboard */}
        <View style={endStyles.leaderboard}>
          <Text style={endStyles.leaderboardTitle}>🎨 Player Scores</Text>
          {sortedPlayers.map((player, index) => (
            <View 
              key={player.id} 
              style={[
                endStyles.playerRow,
                player.id === currentPlayer?.id && endStyles.currentPlayerRow,
              ]}
            >
              <Text style={endStyles.rankText}>
                {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
              </Text>
              <View style={endStyles.playerInfo}>
                <Text style={endStyles.playerName}>
                  {player.name} {player.id === currentPlayer?.id && '(You)'}
                </Text>
                <Text style={endStyles.teamIndicator}>
                  {player.team === 1 ? '🔵' : '🔴'}
                </Text>
              </View>
              <Text style={endStyles.playerScore}>{player.score} pts</Text>
            </View>
          ))}
        </View>

        {/* Actions */}
        <View style={endStyles.actions}>
          {isTie && currentPlayer?.is_host && (
            <TouchableOpacity 
              style={endStyles.tiebreakerButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                onTiebreaker();
              }}
            >
              <Text style={endStyles.tiebreakerText}>⚡ Tiebreaker Round!</Text>
            </TouchableOpacity>
          )}
          {isTie && !currentPlayer?.is_host && (
            <View style={endStyles.waitingForHost}>
              <Text style={endStyles.waitingText}>⏳ Waiting for host to start tiebreaker...</Text>
            </View>
          )}
          {!isTie && currentPlayer?.is_host ? (
            <TouchableOpacity 
              style={endStyles.playAgainButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onPlayAgain();
              }}
            >
              <Text style={endStyles.playAgainText}>🎮 Play Again</Text>
            </TouchableOpacity>
          ) : !isTie && !currentPlayer?.is_host ? (
            <View style={endStyles.waitingForHost}>
              <Text style={endStyles.waitingText}>⏳ Waiting for host to start new game...</Text>
            </View>
          ) : null}
          <TouchableOpacity 
            style={endStyles.leaveButton}
            onPress={onLeave}
          >
            <Text style={endStyles.leaveButtonText}>Leave Game</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const endStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#6B4EE6',
  },
  scrollContent: {
    padding: 20,
    alignItems: 'center',
  },
  trophySection: {
    alignItems: 'center',
    marginVertical: 20,
  },
  trophy: {
    fontSize: 80,
    marginBottom: 16,
  },
  resultTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  winnerText: {
    fontSize: 22,
    color: '#FFE66D',
    fontWeight: '600',
    marginTop: 8,
  },
  scoresContainer: {
    flexDirection: 'row',
    gap: 16,
    marginVertical: 20,
  },
  teamFinalScore: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    position: 'relative',
  },
  winningTeam: {
    backgroundColor: 'rgba(255,230,109,0.25)',
    borderWidth: 3,
    borderColor: '#FFE66D',
  },
  teamLabel: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
    marginBottom: 8,
  },
  finalScore: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
  },
  crownEmoji: {
    position: 'absolute',
    top: -10,
    right: 10,
    fontSize: 24,
  },
  leaderboard: {
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 20,
    padding: 16,
    marginVertical: 16,
  },
  leaderboardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFE66D',
    textAlign: 'center',
    marginBottom: 16,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
  },
  currentPlayerRow: {
    backgroundColor: 'rgba(255,230,109,0.2)',
    borderWidth: 2,
    borderColor: '#FFE66D',
  },
  rankText: {
    fontSize: 24,
    width: 40,
    textAlign: 'center',
  },
  playerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  playerName: {
    fontSize: 17,
    color: '#fff',
    fontWeight: '600',
  },
  teamIndicator: {
    fontSize: 14,
  },
  playerScore: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4ECDC4',
  },
  actions: {
    width: '100%',
    gap: 12,
    marginTop: 16,
  },
  playAgainButton: {
    backgroundColor: '#4ECDC4',
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  playAgainText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  leaveButton: {
    padding: 16,
    alignItems: 'center',
  },
  leaveButtonText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
  },
  waitingForHost: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  waitingText: {
    fontSize: 16,
    color: '#FFE66D',
    fontWeight: '500',
  },
  tiebreakerButton: {
    backgroundColor: '#FF6B6B',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  tiebreakerText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
});

type Screen = 'home' | 'create' | 'join' | 'lobby' | 'game' | 'finished';

interface MultiplayerAppProps {
  onPlayLocal: () => void;
  onBack: () => void;
}

export const MultiplayerApp: React.FC<MultiplayerAppProps> = ({ onPlayLocal, onBack }) => {
  const [screen, setScreen] = useState<Screen>('home');
  const [timeRemaining, setTimeRemaining] = useState(60);
  const [isRestoring, setIsRestoring] = useState(true);
  const [joinTimeout, setJoinTimeout] = useState<NodeJS.Timeout | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Screen transition animation
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const {
    room,
    players,
    currentPlayer,
    isConnected,
    error,
    drawings,
    messages,
    createRoom,
    joinRoom,
    leaveRoom,
    toggleReady,
    joinTeam,
    startGame,
    tagTeam,
    endRound,
    markCorrectGuess,
    skipWord,
    resetForNewGame,
    startTiebreaker,
    sendEvent,
    sendDrawing,
    sendChat,
  } = useMultiplayer();

  // Check for saved session on mount and offer to rejoin
  useEffect(() => {
    const checkSavedSession = async () => {
      try {
        const savedSession = await getSavedSession();
        
        if (savedSession && isSupabaseConfigured()) {
          // Found a saved session - ask if they want to rejoin
          Alert.alert(
            'Rejoin Game?',
            `You were in a game with room code: ${savedSession.roomCode}\n\nWould you like to rejoin?`,
            [
              {
                text: 'No, Start Fresh',
                style: 'cancel',
                onPress: async () => {
                  await clearSession();
                  setIsRestoring(false);
                },
              },
              {
                text: 'Rejoin',
                onPress: async () => {
                  const success = await joinRoom(savedSession.roomCode, savedSession.playerName);
                  if (success) {
                    setScreen('lobby');
                  } else {
                    // Room no longer exists
                    Alert.alert(
                      'Room Not Found',
                      'The game session has ended. Starting fresh.',
                      [{ text: 'OK' }]
                    );
                    await clearSession();
                  }
                  setIsRestoring(false);
                },
              },
            ]
          );
        } else {
          setIsRestoring(false);
        }
      } catch (e) {
        console.error('Failed to check saved session:', e);
        setIsRestoring(false);
      }
    };
    
    checkSavedSession();
  }, [joinRoom]);

  // Animate screen transitions
  const transitionTo = useCallback((newScreen: Screen) => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setScreen(newScreen);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  }, [fadeAnim]);

  // Timer effect - synced with room state
  useEffect(() => {
    if (room?.status !== 'playing') {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    // Calculate time from round start
    if (room.round_start_time) {
      const startTime = new Date(room.round_start_time).getTime();
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const remaining = Math.max(0, room.settings.timer_seconds - elapsed);
      setTimeRemaining(remaining);
    } else {
      setTimeRemaining(room.settings.timer_seconds);
    }

    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          // Round ended - host handles transition
          if (currentPlayer?.is_host) {
            endRound();
          }
          return room.settings.timer_seconds; // Reset for next round
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [room?.status, room?.round_start_time, room?.current_round, currentPlayer?.is_host, endRound]);

  // Show error
  useEffect(() => {
    if (error) {
      Alert.alert('Error', error);
    }
  }, [error]);

  // Auto-navigate based on room state
  useEffect(() => {
    if (room?.status === 'playing' && screen === 'lobby') {
      transitionTo('game');
    }
    if (room?.status === 'finished' && screen === 'game') {
      transitionTo('finished');
    }
    // Navigate back to lobby when host resets game
    if (room?.status === 'lobby' && screen === 'finished') {
      transitionTo('lobby');
    }
    // Note: Don't auto-navigate to home when room is null - 
    // the lobby screen now shows a loading state while waiting for room sync
  }, [room?.status, screen, transitionTo]);
  
  // Timeout for joining room - if no response from host after 15 seconds
  useEffect(() => {
    if (screen === 'lobby' && !room) {
      const timeout = setTimeout(() => {
        Alert.alert(
          'Connection Timeout',
          'Could not connect to the room. The room may no longer exist.',
          [{
            text: 'OK',
            onPress: () => {
              leaveRoom();
              transitionTo('home');
            }
          }]
        );
      }, 15000); // 15 second timeout
      
      setJoinTimeout(timeout);
      
      return () => clearTimeout(timeout);
    } else if (joinTimeout && room) {
      // Room received, clear timeout
      clearTimeout(joinTimeout);
      setJoinTimeout(null);
    }
  }, [screen, room, leaveRoom, transitionTo]);

  // Handle room creation
  const handleCreateRoom = useCallback(async (playerName: string) => {
    if (!isSupabaseConfigured()) {
      Alert.alert(
        'Setup Required',
        'Multiplayer requires Supabase configuration. Please add your Supabase URL and anon key to the environment.',
        [{ text: 'OK' }]
      );
      return null;
    }
    return await createRoom(playerName);
  }, [createRoom]);

  // Handle room join
  const handleJoinRoom = useCallback(async (code: string, playerName: string) => {
    if (!isSupabaseConfigured()) {
      Alert.alert(
        'Setup Required', 
        'Multiplayer requires Supabase configuration.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return await joinRoom(code, playerName);
  }, [joinRoom]);

  // Handle leave with confirmation
  const handleLeave = useCallback(() => {
    Alert.alert(
      'Leave Game',
      'Are you sure you want to leave?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Leave', 
          style: 'destructive',
          onPress: () => {
            leaveRoom();
            transitionTo('home');
          }
        },
      ]
    );
  }, [leaveRoom, transitionTo]);

  // Handle start game (host only)
  const handleStartGame = useCallback(() => {
    startGame();
    transitionTo('game');
  }, [startGame, transitionTo]);

  // Render current screen
  const renderScreen = () => {
    switch (screen) {
      case 'home':
        return (
          <HomeScreen
            onCreateRoom={() => transitionTo('create')}
            onJoinRoom={() => transitionTo('join')}
            onBack={onBack}
          />
        );

      case 'create':
        return (
          <CreateRoomScreen
            onCreateRoom={handleCreateRoom}
            onBack={() => transitionTo('home')}
            onRoomCreated={() => transitionTo('lobby')}
          />
        );

      case 'join':
        return (
          <JoinRoomScreen
            onJoinRoom={handleJoinRoom}
            onBack={() => transitionTo('home')}
            onJoined={() => transitionTo('lobby')}
          />
        );

      case 'lobby':
        // Show loading while waiting for room state from host
        if (!room || !currentPlayer) {
          return (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FFE66D" />
              <Text style={styles.loadingText}>Joining room...</Text>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => {
                  leaveRoom();
                  transitionTo('home');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          );
        }
        return (
          <LobbyScreen
            room={room}
            players={players}
            currentPlayer={currentPlayer}
            onJoinTeam={joinTeam}
            onToggleReady={toggleReady}
            onStartGame={handleStartGame}
            onLeave={handleLeave}
          />
        );

      case 'game':
        if (!room || !currentPlayer) {
          transitionTo('home');
          return null;
        }
        return (
          <MultiplayerGameScreen
            room={room}
            players={players}
            currentPlayer={currentPlayer}
            messages={messages}
            drawings={drawings}
            word={room.current_word}
            timeRemaining={timeRemaining}
            onSendDrawing={sendDrawing}
            onSendChat={sendChat}
            onTagTeam={tagTeam}
            onCorrectGuess={markCorrectGuess}
            onSkipWord={skipWord}
            onLeave={handleLeave}
          />
        );

      case 'finished':
        return (
          <GameEndScreen
            players={players}
            currentPlayer={currentPlayer}
            onPlayAgain={() => {
              // Host resets and goes back to lobby
              if (currentPlayer?.is_host) {
                resetForNewGame();
              }
              transitionTo('lobby');
            }}
            onTiebreaker={() => {
              if (currentPlayer?.is_host) {
                startTiebreaker();
              }
              transitionTo('game');
            }}
            onLeave={() => {
              leaveRoom();
              transitionTo('home');
            }}
          />
        );

      default:
        return null;
    }
  };

  // Show loading while checking for saved session
  if (isRestoring) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFE66D" />
        <Text style={styles.loadingText}>Checking for saved game...</Text>
      </View>
    );
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {renderScreen()}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#6B4EE6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 16,
    fontWeight: '500',
  },
  cancelButton: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MultiplayerApp;
