import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Share,
  Animated,
  Easing,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Player, Room } from '../types/multiplayer';

interface LobbyScreenProps {
  room: Room;
  players: Player[];
  currentPlayer: Player | null;
  onJoinTeam: (team: 1 | 2) => void;
  onToggleReady: () => void;
  onStartGame: () => void;
  onLeave: () => void;
}

export const LobbyScreen: React.FC<LobbyScreenProps> = ({
  room,
  players,
  currentPlayer,
  onJoinTeam,
  onToggleReady,
  onStartGame,
  onLeave,
}) => {
  const team1Players = players.filter(p => p.team === 1);
  const team2Players = players.filter(p => p.team === 2);
  const unassignedPlayers = players.filter(p => p.team === null);
  const allReady = players.length >= 2 && players.every(p => p.is_ready);
  const canStart = currentPlayer?.is_host && allReady && team1Players.length >= 1 && team2Players.length >= 1;

  // Animations
  const headerAnim = useRef(new Animated.Value(0)).current;
  const team1Anim = useRef(new Animated.Value(100)).current;
  const team2Anim = useRef(new Animated.Value(-100)).current;
  const vsScale = useRef(new Animated.Value(0)).current;
  const actionsAnim = useRef(new Animated.Value(50)).current;
  const readyButtonScale = useRef(new Animated.Value(1)).current;
  const startButtonScale = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const team1ButtonScale = useRef(new Animated.Value(1)).current;
  const team2ButtonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Entrance animations
    Animated.parallel([
      Animated.timing(headerAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(team1Anim, {
        toValue: 0,
        friction: 6,
        tension: 80,
        delay: 200,
        useNativeDriver: true,
      }),
      Animated.spring(team2Anim, {
        toValue: 0,
        friction: 6,
        tension: 80,
        delay: 300,
        useNativeDriver: true,
      }),
      Animated.spring(vsScale, {
        toValue: 1,
        friction: 4,
        tension: 100,
        delay: 400,
        useNativeDriver: true,
      }),
      Animated.spring(actionsAnim, {
        toValue: 0,
        friction: 6,
        tension: 80,
        delay: 500,
        useNativeDriver: true,
      }),
    ]).start();

    // Pulse animation for waiting
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.02,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Share.share({
        message: `Join my DoodleMania game! 🎨\n\nRoom Code: ${room.code}\n\nDownload the app and enter this code to play!`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleReadyPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.sequence([
      Animated.timing(readyButtonScale, { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.spring(readyButtonScale, { toValue: 1, friction: 3, useNativeDriver: true }),
    ]).start();
    onToggleReady();
  };

  const handleStartPress = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Animated.sequence([
      Animated.timing(startButtonScale, { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.spring(startButtonScale, { toValue: 1, friction: 3, useNativeDriver: true }),
    ]).start(onStartGame);
  };

  const handleTeamPress = (team: 1 | 2) => {
    const scale = team === 1 ? team1ButtonScale : team2ButtonScale;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 3, useNativeDriver: true }),
    ]).start();
    onJoinTeam(team);
  };

  const renderPlayer = (player: Player, index: number) => {
    return (
      <Animated.View 
        key={player.id} 
        style={[
          styles.playerCard,
          player.id === currentPlayer?.id && styles.currentPlayerCard,
        ]}
      >
        <View style={styles.playerInfo}>
          <Text style={styles.playerName}>
            {player.name}
            {player.is_host && ' 👑'}
          </Text>
          {player.id === currentPlayer?.id && (
            <Text style={styles.youLabel}>(You)</Text>
          )}
        </View>
        <View style={[
          styles.readyBadge,
          player.is_ready ? styles.readyBadgeActive : styles.readyBadgeInactive,
        ]}>
          <Text style={styles.readyText}>
            {player.is_ready ? '✓ Ready' : 'Waiting'}
          </Text>
        </View>
      </Animated.View>
    );
  };

  const isOnTeam1 = currentPlayer?.team === 1;
  const isOnTeam2 = currentPlayer?.team === 2;
  const hasNoTeam = !currentPlayer?.team;

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.header, { opacity: headerAnim }]}>
        <TouchableOpacity style={styles.leaveButton} onPress={onLeave}>
          <Text style={styles.leaveText}>← Leave</Text>
        </TouchableOpacity>
        <View style={styles.roomInfo}>
          <Text style={styles.roomCode}>{room.code}</Text>
          <TouchableOpacity onPress={handleShare} style={styles.shareButtonContainer}>
            <Text style={styles.shareButton}>📤 Share</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Instruction Banner */}
        {hasNoTeam && (
          <Animated.View style={[styles.instructionBanner, { transform: [{ scale: pulseAnim }] }]}>
            <Text style={styles.instructionIcon}>👇</Text>
            <Text style={styles.instructionText}>Choose your team below!</Text>
          </Animated.View>
        )}

        {/* Unassigned Players */}
        {unassignedPlayers.length > 0 && (
          <View style={styles.unassignedSection}>
            <Text style={styles.sectionTitle}>👋 Waiting for team</Text>
            {unassignedPlayers.map((p, i) => renderPlayer(p, i))}
          </View>
        )}

        {/* Teams Container */}
        <View style={styles.teamsContainer}>
          {/* Team 1 - Blue */}
          <Animated.View style={[
            styles.teamSection,
            { transform: [{ translateX: team1Anim }, { scale: team1ButtonScale }] },
            isOnTeam1 && styles.myTeamSection,
          ]}>
            <TouchableOpacity
              style={[styles.teamCard, styles.team1Card]}
              onPress={() => handleTeamPress(1)}
              disabled={isOnTeam1}
              activeOpacity={0.8}
            >
              <View style={styles.teamHeaderRow}>
                <Text style={styles.teamEmoji}>🔵</Text>
                <View style={styles.teamHeaderText}>
                  <Text style={styles.teamTitle}>Team Blue</Text>
                  <Text style={styles.teamCount}>{team1Players.length} player{team1Players.length !== 1 ? 's' : ''}</Text>
                </View>
                {!isOnTeam1 && (
                  <View style={styles.joinBadge}>
                    <Text style={styles.joinBadgeText}>JOIN</Text>
                  </View>
                )}
                {isOnTeam1 && (
                  <View style={styles.yourTeamBadge}>
                    <Text style={styles.yourTeamText}>YOUR TEAM</Text>
                  </View>
                )}
              </View>
              
              <View style={styles.teamPlayers}>
                {team1Players.length === 0 ? (
                  <Text style={styles.emptyTeam}>Be the first to join!</Text>
                ) : (
                  team1Players.map((p, i) => renderPlayer(p, i))
                )}
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* VS Badge */}
          <Animated.View style={[styles.vsContainer, { transform: [{ scale: vsScale }] }]}>
            <Text style={styles.vsText}>VS</Text>
          </Animated.View>

          {/* Team 2 - Red */}
          <Animated.View style={[
            styles.teamSection,
            { transform: [{ translateX: team2Anim }, { scale: team2ButtonScale }] },
            isOnTeam2 && styles.myTeamSection,
          ]}>
            <TouchableOpacity
              style={[styles.teamCard, styles.team2Card]}
              onPress={() => handleTeamPress(2)}
              disabled={isOnTeam2}
              activeOpacity={0.8}
            >
              <View style={styles.teamHeaderRow}>
                <Text style={styles.teamEmoji}>🔴</Text>
                <View style={styles.teamHeaderText}>
                  <Text style={styles.teamTitle}>Team Red</Text>
                  <Text style={styles.teamCount}>{team2Players.length} player{team2Players.length !== 1 ? 's' : ''}</Text>
                </View>
                {!isOnTeam2 && (
                  <View style={[styles.joinBadge, styles.joinBadgeRed]}>
                    <Text style={styles.joinBadgeText}>JOIN</Text>
                  </View>
                )}
                {isOnTeam2 && (
                  <View style={styles.yourTeamBadge}>
                    <Text style={styles.yourTeamText}>YOUR TEAM</Text>
                  </View>
                )}
              </View>
              
              <View style={styles.teamPlayers}>
                {team2Players.length === 0 ? (
                  <Text style={styles.emptyTeam}>Be the first to join!</Text>
                ) : (
                  team2Players.map((p, i) => renderPlayer(p, i))
                )}
              </View>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <Animated.View style={[styles.actions, { transform: [{ translateY: actionsAnim }] }]}>
        {currentPlayer?.team ? (
          <>
            <Animated.View style={{ transform: [{ scale: readyButtonScale }] }}>
              <TouchableOpacity
                style={[
                  styles.readyButton,
                  currentPlayer?.is_ready && styles.readyButtonActive,
                ]}
                onPress={handleReadyPress}
                activeOpacity={0.9}
              >
                <Text style={styles.readyButtonText}>
                  {currentPlayer?.is_ready ? '✓ Ready!' : '🎯 Ready Up'}
                </Text>
              </TouchableOpacity>
            </Animated.View>

            {currentPlayer?.is_host && (
              <Animated.View style={{ transform: [{ scale: startButtonScale }] }}>
                <TouchableOpacity
                  style={[
                    styles.startButton,
                    !canStart && styles.startButtonDisabled,
                  ]}
                  onPress={handleStartPress}
                  disabled={!canStart}
                  activeOpacity={0.9}
                >
                  <Text style={styles.startButtonText}>
                    {canStart ? '🎮 Start Game!' : 'Waiting for players...'}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            )}
          </>
        ) : (
          <Animated.View style={[styles.joinTeamPrompt, { transform: [{ scale: pulseAnim }] }]}>
            <Text style={styles.joinTeamEmoji}>☝️</Text>
            <Text style={styles.joinTeamText}>Tap a team card above to join!</Text>
          </Animated.View>
        )}
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#6B4EE6',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  leaveButton: {
    padding: 8,
  },
  leaveText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  roomInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  roomCode: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFE66D',
    letterSpacing: 3,
  },
  shareButtonContainer: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  shareButton: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  instructionBanner: {
    backgroundColor: '#FFE66D',
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 8,
  },
  instructionIcon: {
    fontSize: 24,
  },
  instructionText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#5B3EE6',
  },
  unassignedSection: {
    marginBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 12,
  },
  teamsContainer: {
    gap: 12,
  },
  teamSection: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  myTeamSection: {
    shadowColor: '#FFE66D',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  teamCard: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  team1Card: {
    backgroundColor: 'rgba(78, 205, 196, 0.25)',
    borderColor: 'rgba(78, 205, 196, 0.5)',
  },
  team2Card: {
    backgroundColor: 'rgba(255, 107, 107, 0.25)',
    borderColor: 'rgba(255, 107, 107, 0.5)',
  },
  teamHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.15)',
    gap: 12,
  },
  teamEmoji: {
    fontSize: 32,
  },
  teamHeaderText: {
    flex: 1,
  },
  teamTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  teamCount: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  joinBadge: {
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  joinBadgeRed: {
    backgroundColor: '#FF6B6B',
  },
  joinBadgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  yourTeamBadge: {
    backgroundColor: '#FFE66D',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  yourTeamText: {
    color: '#5B3EE6',
    fontWeight: 'bold',
    fontSize: 12,
  },
  teamPlayers: {
    padding: 16,
    gap: 10,
    minHeight: 80,
  },
  emptyTeam: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.6)',
    fontStyle: 'italic',
    fontSize: 16,
    paddingVertical: 16,
  },
  playerCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 14,
    borderRadius: 14,
  },
  currentPlayerCard: {
    backgroundColor: 'rgba(255,230,109,0.35)',
    borderWidth: 2,
    borderColor: '#FFE66D',
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  playerName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
  },
  youLabel: {
    fontSize: 13,
    color: '#FFE66D',
    fontWeight: '700',
  },
  readyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  readyBadgeActive: {
    backgroundColor: '#4ECDC4',
  },
  readyBadgeInactive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  readyText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  vsContainer: {
    alignItems: 'center',
    marginVertical: -8,
    zIndex: 1,
  },
  vsText: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFE66D',
    backgroundColor: '#6B4EE6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  actions: {
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  readyButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  readyButtonActive: {
    backgroundColor: '#4ECDC4',
    borderColor: '#4ECDC4',
  },
  readyButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  startButton: {
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
  startButtonDisabled: {
    backgroundColor: 'rgba(255,107,107,0.4)',
    shadowOpacity: 0,
  },
  startButtonText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  joinTeamPrompt: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: 'rgba(255,230,109,0.2)',
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#FFE66D',
    gap: 8,
  },
  joinTeamEmoji: {
    fontSize: 32,
  },
  joinTeamText: {
    fontSize: 18,
    color: '#FFE66D',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default LobbyScreen;
