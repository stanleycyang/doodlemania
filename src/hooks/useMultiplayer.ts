import { useEffect, useCallback, useRef } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase, generateRoomCode, generatePlayerId, isSupabaseConfigured } from '../lib/supabase';
import { useGameStore } from '../lib/gameStore';
import { Player, Room, RoomSettings, DrawingEvent, RoomEvent, ChatMessage, DrawingPath } from '../types/multiplayer';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DEFAULT_SETTINGS: RoomSettings = {
  timer_seconds: 60,
  difficulty: 'medium',
  max_players: 8,
  allow_tag_team: true,
};

// Word lists by difficulty
const WORDS = {
  easy: ['cat', 'dog', 'sun', 'tree', 'house', 'car', 'ball', 'star', 'fish', 'bird', 'hat', 'book', 'cup', 'bed', 'moon'],
  medium: ['elephant', 'guitar', 'pizza', 'rocket', 'beach', 'castle', 'robot', 'dragon', 'unicorn', 'rainbow', 'volcano', 'submarine'],
  hard: ['democracy', 'imagination', 'confusion', 'celebration', 'adventure', 'nightmare', 'electricity', 'jealousy', 'mystery', 'freedom'],
};

export const useMultiplayer = () => {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const playerIdRef = useRef<string | null>(null);
  const currentPathRef = useRef<DrawingPath | null>(null);
  
  const {
    room,
    players,
    currentPlayer,
    isConnected,
    error,
    drawings,
    messages,
    setRoom,
    setPlayers,
    addPlayer,
    removePlayer,
    updatePlayer,
    setCurrentPlayer,
    addDrawing,
    updateDrawing,
    clearDrawings,
    undoLastDrawing,
    addMessage,
    setConnected,
    setError,
    reset,
  } = useGameStore();

  // Initialize player ID on mount
  useEffect(() => {
    const initPlayerId = async () => {
      let playerId = await AsyncStorage.getItem('playerId');
      if (!playerId) {
        playerId = generatePlayerId();
        await AsyncStorage.setItem('playerId', playerId);
      }
      playerIdRef.current = playerId;
    };
    initPlayerId();
  }, []);

  // Clean up channel on unmount
  useEffect(() => {
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  // Get a random word based on difficulty
  const getRandomWord = useCallback((difficulty: 'easy' | 'medium' | 'hard' = 'medium') => {
    const wordList = WORDS[difficulty];
    return wordList[Math.floor(Math.random() * wordList.length)];
  }, []);

  // Create a new room
  const createRoom = useCallback(async (playerName: string): Promise<string | null> => {
    if (!isSupabaseConfigured()) {
      setError('Supabase not configured. Please add credentials.');
      return null;
    }

    try {
      const code = generateRoomCode();
      const playerId = playerIdRef.current || generatePlayerId();
      
      const newRoom: Room = {
        id: `room_${Date.now()}`,
        code,
        host_id: playerId,
        status: 'lobby',
        settings: DEFAULT_SETTINGS,
        current_round: 0,
        total_rounds: 10,
        current_word: null,
        drawing_team: 1,
        round_start_time: null,
        created_at: new Date().toISOString(),
      };

      const hostPlayer: Player = {
        id: playerId,
        name: playerName,
        room_id: newRoom.id,
        team: null,
        is_drawing: false,
        score: 0,
        is_ready: false,
        is_host: true,
        connected_at: new Date().toISOString(),
      };

      setRoom(newRoom);
      setCurrentPlayer(hostPlayer);
      setPlayers([hostPlayer]);
      
      // Join realtime channel
      await joinChannel(code, hostPlayer);
      
      return code;
    } catch (err: any) {
      setError(err.message || 'Failed to create room');
      return null;
    }
  }, [setRoom, setCurrentPlayer, setPlayers, setError]);

  // Join an existing room
  const joinRoom = useCallback(async (code: string, playerName: string): Promise<boolean> => {
    if (!isSupabaseConfigured()) {
      setError('Supabase not configured. Please add credentials.');
      return false;
    }

    try {
      const playerId = playerIdRef.current || generatePlayerId();
      
      const newPlayer: Player = {
        id: playerId,
        name: playerName,
        room_id: null, // Will be set when we receive room state
        team: null,
        is_drawing: false,
        score: 0,
        is_ready: false,
        is_host: false,
        connected_at: new Date().toISOString(),
      };

      setCurrentPlayer(newPlayer);
      
      // Join realtime channel
      const success = await joinChannel(code.toUpperCase(), newPlayer);
      return success;
    } catch (err: any) {
      setError(err.message || 'Failed to join room');
      return false;
    }
  }, [setCurrentPlayer, setError]);

  // Join realtime channel
  const joinChannel = useCallback(async (roomCode: string, player: Player): Promise<boolean> => {
    try {
      // Clean up existing channel
      if (channelRef.current) {
        await supabase.removeChannel(channelRef.current);
      }

      const channel = supabase.channel(`room:${roomCode}`, {
        config: {
          presence: { key: player.id },
          broadcast: { self: true },
        },
      });

      // Handle presence sync (who's online)
      channel.on('presence', { event: 'sync' }, () => {
        const presenceState = channel.presenceState();
        const onlinePlayers: Player[] = [];
        
        Object.entries(presenceState).forEach(([key, value]) => {
          const presence = value[0] as any;
          if (presence?.player) {
            onlinePlayers.push(presence.player);
          }
        });
        
        setPlayers(onlinePlayers);
      });

      // Handle player join
      channel.on('presence', { event: 'join' }, ({ key, newPresences }) => {
        const presence = newPresences[0] as any;
        if (presence?.player) {
          addPlayer(presence.player);
          
          // Host: send current state to new player
          const state = useGameStore.getState();
          if (state.currentPlayer?.is_host && state.room) {
            channel.send({
              type: 'broadcast',
              event: 'room_event',
              payload: { 
                type: 'sync_state', 
                room: state.room,
                players: state.players,
                drawings: state.drawings,
                target_player_id: presence.player.id,
              },
            });
          }
        }
      });

      // Handle player leave
      channel.on('presence', { event: 'leave' }, ({ key }) => {
        removePlayer(key);
      });

      // Handle broadcast events
      channel.on('broadcast', { event: 'room_event' }, ({ payload }) => {
        handleRoomEvent(payload as RoomEvent, channel);
      });

      // Handle drawing events (high frequency)
      channel.on('broadcast', { event: 'drawing' }, ({ payload }) => {
        handleDrawingEvent(payload as DrawingEvent);
      });

      // Subscribe to channel
      const status = await channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track presence
          await channel.track({ player });
          setConnected(true);
          
          // If joining (not host), request current room state
          if (!player.is_host) {
            channel.send({
              type: 'broadcast',
              event: 'room_event',
              payload: { type: 'request_state', player_id: player.id },
            });
          }
        }
      });

      channelRef.current = channel;
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to connect');
      return false;
    }
  }, [setPlayers, addPlayer, removePlayer, setConnected, setError]);

  // Handle room events
  const handleRoomEvent = useCallback((event: any, channel?: RealtimeChannel) => {
    const state = useGameStore.getState();
    
    switch (event.type) {
      case 'player_joined':
        addPlayer(event.player);
        break;
        
      case 'player_left':
        removePlayer(event.player_id);
        break;
        
      case 'player_ready':
        updatePlayer(event.player_id, { is_ready: event.is_ready });
        break;
        
      case 'sync_state':
        // Received room state from host
        if (!event.target_player_id || event.target_player_id === state.currentPlayer?.id) {
          setRoom(event.room);
          setPlayers(event.players);
          if (event.drawings) {
            event.drawings.forEach((d: DrawingPath) => addDrawing(d));
          }
        }
        break;
        
      case 'request_state':
        // Host: respond with current state
        if (state.currentPlayer?.is_host && state.room && channelRef.current) {
          channelRef.current.send({
            type: 'broadcast',
            event: 'room_event',
            payload: { 
              type: 'sync_state', 
              room: state.room,
              players: state.players,
              drawings: state.drawings,
              target_player_id: event.player_id,
            },
          });
        }
        break;
        
      case 'game_started':
        useGameStore.getState().startGame();
        break;
        
      case 'round_started':
        setRoom(state.room ? { 
          ...state.room, 
          current_round: event.round, 
          drawing_team: event.drawing_team,
          current_word: event.word || null,
          round_start_time: new Date().toISOString(),
          status: 'playing',
        } : null);
        clearDrawings();
        break;
        
      case 'new_word':
        // Word selected by drawer, update room state (word is hidden from guessers)
        if (state.room) {
          setRoom({ 
            ...state.room, 
            current_word: event.word,
          });
        }
        break;
        
      case 'tag_team':
        state.players.forEach(p => {
          updatePlayer(p.id, { is_drawing: p.id === event.new_drawer_id });
        });
        break;
        
      case 'correct_guess':
        // Update scores
        const guesser = state.players.find(p => p.id === event.player_id);
        if (guesser) {
          updatePlayer(guesser.id, { score: guesser.score + event.points });
        }
        // Mark message as correct guess
        addMessage({
          id: `msg_${Date.now()}`,
          room_id: state.room?.id || '',
          player_id: event.player_id,
          player_name: event.player_name,
          text: '🎉 Correct!',
          is_correct_guess: true,
          timestamp: new Date().toISOString(),
        });
        break;
        
      case 'round_ended':
        if (state.room) {
          setRoom({
            ...state.room,
            current_round: state.room.current_round + 1,
            drawing_team: state.room.drawing_team === 1 ? 2 : 1,
            current_word: null,
          });
        }
        clearDrawings();
        break;
        
      case 'game_ended':
        useGameStore.getState().endGame();
        break;
        
      case 'chat':
        addMessage(event.message);
        
        // Check if this is a correct guess (only host validates)
        if (state.currentPlayer?.is_host && state.room?.current_word) {
          const guess = event.message.text.toLowerCase().trim();
          const word = state.room.current_word.toLowerCase().trim();
          
          if (guess === word) {
            // Correct guess!
            const points = 10; // Base points
            channelRef.current?.send({
              type: 'broadcast',
              event: 'room_event',
              payload: { 
                type: 'correct_guess', 
                player_id: event.message.player_id,
                player_name: event.message.player_name,
                points,
              },
            });
          }
        }
        break;
    }
  }, [addPlayer, removePlayer, updatePlayer, setRoom, clearDrawings, addMessage, addDrawing]);

  // Handle drawing events - FIXED: Now properly reconstructs paths
  const handleDrawingEvent = useCallback((event: DrawingEvent) => {
    const state = useGameStore.getState();
    
    // Don't process own events (we handle those locally)
    if (event.player_id === state.currentPlayer?.id) return;
    
    switch (event.type) {
      case 'start':
        // Start a new path
        const newPath: DrawingPath = {
          id: `path_${event.player_id}_${event.timestamp}`,
          points: [{ x: event.x!, y: event.y! }],
          color: event.color,
          brushSize: event.brushSize,
          player_id: event.player_id,
        };
        currentPathRef.current = newPath;
        addDrawing(newPath);
        break;
        
      case 'move':
        // Add point to current path
        if (currentPathRef.current && event.x !== undefined && event.y !== undefined) {
          const updatedPath = {
            ...currentPathRef.current,
            points: [...currentPathRef.current.points, { x: event.x, y: event.y }],
          };
          currentPathRef.current = updatedPath;
          updateDrawing(currentPathRef.current.id, updatedPath);
        }
        break;
        
      case 'end':
        // Finalize the path
        currentPathRef.current = null;
        break;
        
      case 'clear':
        clearDrawings();
        break;
        
      case 'undo':
        undoLastDrawing();
        break;
    }
  }, [addDrawing, updateDrawing, clearDrawings, undoLastDrawing]);

  // Send a room event
  const sendEvent = useCallback((event: Record<string, any>) => {
    if (!channelRef.current) return;
    
    channelRef.current.send({
      type: 'broadcast',
      event: 'room_event',
      payload: event,
    });
  }, []);

  // Send drawing data
  const sendDrawing = useCallback((event: Omit<DrawingEvent, 'player_id'>) => {
    if (!channelRef.current || !currentPlayer) return;
    
    channelRef.current.send({
      type: 'broadcast',
      event: 'drawing',
      payload: { ...event, player_id: currentPlayer.id },
    });
  }, [currentPlayer]);

  // Send chat message (also checks for correct guess)
  const sendChat = useCallback((text: string) => {
    if (!channelRef.current || !currentPlayer || !room) return;
    
    const message: ChatMessage = {
      id: `msg_${Date.now()}`,
      room_id: room.id,
      player_id: currentPlayer.id,
      player_name: currentPlayer.name,
      text,
      is_correct_guess: false,
      timestamp: new Date().toISOString(),
    };
    
    sendEvent({ type: 'chat', message });
    addMessage(message);
  }, [currentPlayer, room, sendEvent, addMessage]);

  // Toggle ready state
  const toggleReady = useCallback(() => {
    if (!currentPlayer) return;
    
    const newReady = !currentPlayer.is_ready;
    updatePlayer(currentPlayer.id, { is_ready: newReady });
    setCurrentPlayer({ ...currentPlayer, is_ready: newReady });
    sendEvent({ type: 'player_ready', player_id: currentPlayer.id, is_ready: newReady });
    
    // Update presence
    if (channelRef.current) {
      channelRef.current.track({ player: { ...currentPlayer, is_ready: newReady } });
    }
  }, [currentPlayer, updatePlayer, setCurrentPlayer, sendEvent]);

  // Join a team
  const joinTeam = useCallback((team: 1 | 2) => {
    if (!currentPlayer) return;
    
    updatePlayer(currentPlayer.id, { team });
    setCurrentPlayer({ ...currentPlayer, team });
    
    // Update presence
    if (channelRef.current) {
      channelRef.current.track({ player: { ...currentPlayer, team } });
    }
  }, [currentPlayer, updatePlayer, setCurrentPlayer]);

  // Start game (host only)
  const startGame = useCallback(() => {
    if (!currentPlayer?.is_host || !room) return;
    
    // Pick first drawer from team 1
    const team1Players = players.filter(p => p.team === 1);
    if (team1Players.length > 0) {
      updatePlayer(team1Players[0].id, { is_drawing: true });
      if (team1Players[0].id === currentPlayer.id) {
        setCurrentPlayer({ ...currentPlayer, is_drawing: true });
      }
    }
    
    // Pick a word
    const word = getRandomWord(room.settings.difficulty);
    
    // Broadcast game start with round info
    sendEvent({ 
      type: 'round_started', 
      round: 1, 
      drawing_team: 1,
      word,
    });
    
    useGameStore.getState().startGame();
  }, [currentPlayer, room, players, updatePlayer, setCurrentPlayer, sendEvent, getRandomWord]);

  // Set a new word (for next round or when drawer picks)
  const setWord = useCallback((word: string) => {
    if (!currentPlayer?.is_drawing) return;
    sendEvent({ type: 'new_word', word });
  }, [currentPlayer, sendEvent]);

  // Tag team (pass drawing to teammate)
  const tagTeam = useCallback((newDrawerId: string) => {
    if (!currentPlayer?.is_drawing) return;
    
    sendEvent({ type: 'tag_team', new_drawer_id: newDrawerId });
    updatePlayer(currentPlayer.id, { is_drawing: false });
    updatePlayer(newDrawerId, { is_drawing: true });
    setCurrentPlayer({ ...currentPlayer, is_drawing: false });
  }, [currentPlayer, sendEvent, updatePlayer, setCurrentPlayer]);

  // End round
  const endRound = useCallback(() => {
    if (!currentPlayer?.is_host || !room) return;
    
    sendEvent({ type: 'round_ended', round: room.current_round });
  }, [currentPlayer, room, sendEvent]);

  // Leave room
  const leaveRoom = useCallback(async () => {
    if (channelRef.current) {
      await supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    reset();
  }, [reset]);

  return {
    // State
    room,
    players,
    currentPlayer,
    isConnected,
    error,
    drawings,
    messages,
    
    // Room actions
    createRoom,
    joinRoom,
    leaveRoom,
    
    // Player actions
    toggleReady,
    joinTeam,
    
    // Game actions
    startGame,
    tagTeam,
    setWord,
    endRound,
    getRandomWord,
    
    // Communication
    sendEvent,
    sendDrawing,
    sendChat,
  };
};

export default useMultiplayer;
