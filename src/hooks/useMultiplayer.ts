import { useEffect, useCallback, useRef } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase, generateRoomCode, generatePlayerId, isSupabaseConfigured } from '../lib/supabase';
import { useGameStore } from '../lib/gameStore';
import { Player, Room, RoomSettings, DrawingEvent, RoomEvent, ChatMessage, DrawingPath } from '../types/multiplayer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WORDS } from '../lib/words';

// Storage keys for session persistence
const STORAGE_KEYS = {
  PLAYER_ID: 'playerId',
  PLAYER_NAME: 'playerName',
  ROOM_CODE: 'roomCode',
  SESSION_ACTIVE: 'sessionActive',
};

const DEFAULT_SETTINGS: RoomSettings = {
  timer_seconds: 60,
  difficulty: 'medium',
  max_players: 8,
  allow_tag_team: true,
};

// Session persistence helpers
export const saveSession = async (roomCode: string, playerName: string) => {
  try {
    await AsyncStorage.multiSet([
      [STORAGE_KEYS.ROOM_CODE, roomCode],
      [STORAGE_KEYS.PLAYER_NAME, playerName],
      [STORAGE_KEYS.SESSION_ACTIVE, 'true'],
    ]);
  } catch (e) {
    console.error('Failed to save session:', e);
  }
};

export const clearSession = async () => {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.ROOM_CODE,
      STORAGE_KEYS.SESSION_ACTIVE,
    ]);
  } catch (e) {
    console.error('Failed to clear session:', e);
  }
};

export const getSavedSession = async (): Promise<{ roomCode: string; playerName: string } | null> => {
  try {
    const [[, roomCode], [, playerName], [, sessionActive]] = await AsyncStorage.multiGet([
      STORAGE_KEYS.ROOM_CODE,
      STORAGE_KEYS.PLAYER_NAME,
      STORAGE_KEYS.SESSION_ACTIVE,
    ]);
    
    if (sessionActive === 'true' && roomCode && playerName) {
      return { roomCode, playerName };
    }
    return null;
  } catch (e) {
    console.error('Failed to get saved session:', e);
    return null;
  }
};

export const useMultiplayer = () => {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const playerIdRef = useRef<string | null>(null);
  const currentPathRef = useRef<DrawingPath | null>(null);
  const usedWordsRef = useRef<Set<string>>(new Set());
  
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
    clearMessages,
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

  // Get a random word based on difficulty (never repeats within a game)
  const getRandomWord = useCallback((difficulty: 'easy' | 'medium' | 'hard' = 'medium') => {
    const wordList = WORDS[difficulty];
    // Filter out already used words
    const availableWords = wordList.filter(w => !usedWordsRef.current.has(w));
    
    // If all words used, reset (shouldn't happen with enough words)
    if (availableWords.length === 0) {
      usedWordsRef.current.clear();
      const word = wordList[Math.floor(Math.random() * wordList.length)];
      usedWordsRef.current.add(word);
      return word;
    }
    
    const word = availableWords[Math.floor(Math.random() * availableWords.length)];
    usedWordsRef.current.add(word);
    return word;
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
      
      // Save session for reconnection
      await saveSession(code, playerName);
      
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
      
      // Save session for reconnection
      if (success) {
        await saveSession(code.toUpperCase(), playerName);
      }
      
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
    // Always get fresh state
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
        // Clear all drawers first, then set the new drawer
        state.players.forEach(p => {
          if (p.is_drawing) {
            updatePlayer(p.id, { is_drawing: false });
          }
        });
        
        // Set the new drawer
        if (event.drawer_id) {
          updatePlayer(event.drawer_id, { is_drawing: true });
          // Update currentPlayer if it's us
          if (state.currentPlayer && state.currentPlayer.id === event.drawer_id) {
            setCurrentPlayer({ ...state.currentPlayer, is_drawing: true });
          } else if (state.currentPlayer?.is_drawing && state.currentPlayer) {
            setCurrentPlayer({ ...state.currentPlayer, is_drawing: false });
          }
        }
        
        // Clear drawings, messages, and reset path tracking for new round
        currentPathRef.current = null;
        clearDrawings();
        clearMessages();
        
        // Add a system message about who's drawing
        const drawerName = state.players.find(p => p.id === event.drawer_id)?.name || 'Someone';
        const teamName = event.drawing_team === 1 ? 'Blue' : 'Red';
        addMessage({
          id: `msg_round_${Date.now()}`,
          room_id: state.room?.id || '',
          player_id: 'system',
          player_name: 'System',
          text: `🎨 Round ${event.round}: ${drawerName} (Team ${teamName}) is drawing!`,
          is_correct_guess: false,
          timestamp: new Date().toISOString(),
        });
        
        // FIX: Only store the word if we are the drawer
        const isDrawer = state.currentPlayer?.id === event.drawer_id;
        const roundWord = isDrawer ? (event.word || null) : null;

        setRoom(state.room ? { 
          ...state.room, 
          current_round: event.round, 
          drawing_team: event.drawing_team,
          current_word: roundWord,
          round_start_time: new Date().toISOString(),
          status: 'playing',
        } : null);
        break;
        
      case 'new_word':
        // Word selected by drawer, update room state (word is hidden from guessers)
        if (state.room) {
          // FIX: Only store the word if we are the drawer
          if (state.currentPlayer?.is_drawing) {
            setRoom({
              ...state.room,
              current_word: event.word,
            });
          }
        }
        break;
        
      case 'tag_team':
        state.players.forEach(p => {
          updatePlayer(p.id, { is_drawing: p.id === event.new_drawer_id });
        });
        break;
        
      case 'correct_guess':
        // FIX: Fetch latest state to avoid stale closure
        const latestState = useGameStore.getState();
        const guesser = latestState.players.find(p => p.id === event.player_id);
        const guesserPoints = event.guesser_points || event.points || 0; // Default to 0 if not present

        if (guesser && guesserPoints > 0) {
          const newGuesserScore = guesser.score + guesserPoints;
          updatePlayer(guesser.id, { score: newGuesserScore });
          // Also update currentPlayer if it's us
          if (latestState.currentPlayer && latestState.currentPlayer.id === guesser.id) {
            setCurrentPlayer({ ...latestState.currentPlayer, score: newGuesserScore });
          }
        }
        
        // Update drawer's score (if different from guesser)
        if (event.drawer_id && event.drawer_id !== event.player_id) {
          const drawer = latestState.players.find(p => p.id === event.drawer_id);
          const drawerPoints = event.drawer_points || 0; // Default to 0

          if (drawer && drawerPoints > 0) {
            const newDrawerScore = drawer.score + drawerPoints;
            updatePlayer(drawer.id, { score: newDrawerScore });
            // Also update currentPlayer if it's us
            if (latestState.currentPlayer && latestState.currentPlayer.id === drawer.id) {
              setCurrentPlayer({ ...latestState.currentPlayer, score: newDrawerScore });
            }
          }
        } else if (event.drawer_id === event.player_id && event.drawer_points > 0) {
           // Case where drawer got points (e.g. manual verify) but it was sent as separate field
           // Usually we handled it in guesser block if player_id was drawer
           // But if manual mode sent guesser_points: 0, drawer_points: 1
           const drawer = latestState.players.find(p => p.id === event.drawer_id);
           if (drawer) {
              const newDrawerScore = drawer.score + event.drawer_points;
              updatePlayer(drawer.id, { score: newDrawerScore });
              if (latestState.currentPlayer && latestState.currentPlayer.id === drawer.id) {
                setCurrentPlayer({ ...latestState.currentPlayer, score: newDrawerScore });
              }
           }
        }
        
        // Mark message as correct guess
        // FIX: Use the word from the event payload if available, or reveal stored word
        const revealedWord = event.word || state.room?.current_word || "???";

        addMessage({
          id: `msg_${Date.now()}`,
          room_id: state.room?.id || '',
          player_id: event.player_id,
          player_name: event.player_name,
          text: `🎉 Correct! The word was "${revealedWord}"`,
          is_correct_guess: true,
          timestamp: new Date().toISOString(),
        });
        
        // Host triggers new round after a short delay
        if (state.currentPlayer?.is_host) {
          setTimeout(() => {
            channelRef.current?.send({
              type: 'broadcast',
              event: 'room_event',
              payload: { type: 'round_ended', round: state.room?.current_round },
            });
          }, 2000); // 2 second delay to show the correct answer
        }
        break;
        
      case 'round_ended':
        if (state.room) {
          const nextRound = state.room.current_round + 1;
          const nextDrawingTeam = state.room.drawing_team === 1 ? 2 : 1;
          
          // Clear current drawer's status
          state.players.forEach(p => {
            if (p.is_drawing) {
              updatePlayer(p.id, { is_drawing: false });
            }
          });
          
          // Clear drawings and reset path tracking
          currentPathRef.current = null;
          clearDrawings();
          
          // Update room state
          setRoom({
            ...state.room,
            current_round: nextRound,
            drawing_team: nextDrawingTeam,
            current_word: null,
            round_start_time: null,
          });
          
          // Check if game should end
          if (nextRound > state.room.total_rounds) {
            channelRef.current?.send({
              type: 'broadcast',
              event: 'room_event',
              payload: { type: 'game_ended' },
            });
            return;
          }
          
          // Host starts the next round after a brief pause
          if (state.currentPlayer?.is_host) {
            setTimeout(() => {
              // Get players from next drawing team
              const nextTeamPlayers = state.players
                .filter(p => p.team === nextDrawingTeam)
                .sort((a, b) => a.id.localeCompare(b.id)); // Sort by ID for deterministic order

              if (nextTeamPlayers.length > 0) {
                // FIX: Round Robin selection
                // Round 1 (Team 1) -> Index 0
                // Round 2 (Team 2) -> Index 0
                // Round 3 (Team 1) -> Index 1
                // Round 4 (Team 2) -> Index 1
                // Formula: floor((round - 1) / 2) % length
                const playerIndex = Math.floor((nextRound - 1) / 2) % nextTeamPlayers.length;
                const nextDrawer = nextTeamPlayers[playerIndex];
                
                // Pick a word that hasn't been used yet
                const difficulty = state.room?.settings.difficulty || 'medium';
                const wordList = WORDS[difficulty];
                const availableWords = wordList.filter(w => !usedWordsRef.current.has(w));
                const newWord = availableWords.length > 0
                  ? availableWords[Math.floor(Math.random() * availableWords.length)]
                  : wordList[Math.floor(Math.random() * wordList.length)];
                usedWordsRef.current.add(newWord);
                
                channelRef.current?.send({
                  type: 'broadcast',
                  event: 'room_event',
                  payload: { 
                    type: 'round_started', 
                    round: nextRound, 
                    drawing_team: nextDrawingTeam,
                    drawer_id: nextDrawer.id,
                    word: newWord,
                  },
                });
              }
            }, 1500);
          }
        }
        break;
        
      case 'game_ended':
        useGameStore.getState().endGame();
        break;
        
      case 'game_reset':
        // Reset for new game
        state.players.forEach(player => {
          updatePlayer(player.id, { 
            score: 0, 
            is_ready: false, 
            is_drawing: false 
          });
        });
        if (state.currentPlayer) {
          setCurrentPlayer({ 
            ...state.currentPlayer, 
            score: 0, 
            is_ready: false, 
            is_drawing: false 
          });
        }
        clearDrawings();
        clearMessages();
        usedWordsRef.current.clear(); // Reset word tracking for new game
        setRoom(event.room);
        break;
        
      case 'word_skipped':
        // Show skip message to all players
        addMessage({
          id: `msg_skip_${Date.now()}`,
          room_id: state.room?.id || '',
          player_id: 'system',
          player_name: 'System',
          text: `⏭️ Word skipped! It was "${event.word || state.room?.current_word}"`,
          is_correct_guess: false,
          timestamp: new Date().toISOString(),
        });
        break;
        
      case 'chat':
        // Don't add our own messages (already added locally in sendChat for instant feedback)
        if (event.message.player_id !== state.currentPlayer?.id) {
          addMessage(event.message);
        }
        
        // Check if this is a correct guess (FIX: Only DRAWER validates)
        // Only the drawer knows the word and can validate
        if (state.currentPlayer?.is_drawing && state.room?.current_word) {
          // Find the player who sent the message
          const guessingPlayer = state.players.find(p => p.id === event.message.player_id);
          
          // Only players on the DRAWING team can guess (Pictionary rules)
          // The drawer's teammates guess, not the other team
          if (guessingPlayer?.team !== state.room.drawing_team) {
            // Wrong team trying to guess - ignore
            break;
          }
          
          const guess = event.message.text.toLowerCase().trim();
          const word = state.room.current_word.toLowerCase().trim();
          
          if (guess === word) {
            // Correct guess! Award points to both guesser and drawer
            const guesserPoints = 1;
            const drawerPoints = 1;
            const currentDrawer = state.players.find(p => p.is_drawing);
            
            channelRef.current?.send({
              type: 'broadcast',
              event: 'room_event',
              payload: { 
                type: 'correct_guess', 
                player_id: event.message.player_id,
                player_name: event.message.player_name,
                guesser_points: guesserPoints,
                drawer_id: currentDrawer?.id,
                drawer_points: drawerPoints,
                word: word, // Send word so everyone can see it
              },
            });
          }
        }
        break;
    }
  }, [addPlayer, removePlayer, updatePlayer, setRoom, setCurrentPlayer, clearDrawings, clearMessages, addMessage, addDrawing]);

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
        currentPathRef.current = null; // Reset path tracking
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
    
    // Clear any leftover messages from previous games
    clearMessages();
    // Don't reset word tracking here so we don't repeat words in the same session
    
    // Pick first drawer from team 1
    const team1Players = players
      .filter(p => p.team === 1)
      .sort((a, b) => a.id.localeCompare(b.id));

    if (team1Players.length === 0) return; // Need at least one player on team 1
    
    // Round Robin: Round 1 (Team 1) -> Index 0
    const firstDrawer = team1Players[0];
    
    // Pick a word
    const word = getRandomWord(room.settings.difficulty);
    
    // Broadcast game start with round info (including drawer_id)
    sendEvent({ 
      type: 'round_started', 
      round: 1, 
      drawing_team: 1,
      drawer_id: firstDrawer.id,
      word,
    });
    
    useGameStore.getState().startGame();
  }, [currentPlayer, room, players, sendEvent, getRandomWord, clearMessages]);

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

  // Mark correct guess (drawer manually confirms their team got it)
  const markCorrectGuess = useCallback(() => {
    if (!currentPlayer?.is_drawing || !room) return;
    
    // Award points - drawer gets points for successful drawing
    const drawerPoints = 1;
    
    sendEvent({ 
      type: 'correct_guess', 
      player_id: currentPlayer.id, // drawer gets the points for manual confirm
      player_name: currentPlayer.name,
      guesser_points: 0, // Manual confirm means we don't know who guessed, or it was verbal. Only drawer points.
      drawer_id: currentPlayer.id,
      drawer_points: drawerPoints,
      word: room.current_word, // Send word to reveal
      manual: true,
    });
  }, [currentPlayer, room, sendEvent]);

  // Skip current word (drawer gives up on this word)
  const skipWord = useCallback(() => {
    if (!currentPlayer?.is_drawing || !room) return;
    
    // Add a message that word was skipped
    addMessage({
      id: `msg_${Date.now()}`,
      room_id: room.id,
      player_id: 'system',
      player_name: 'System',
      text: `⏭️ Word skipped! It was "${room.current_word}"`,
      is_correct_guess: false,
      timestamp: new Date().toISOString(),
    });
    
    // Broadcast skip and trigger round end
    sendEvent({ type: 'word_skipped', word: room.current_word });
    sendEvent({ type: 'round_ended', round: room.current_round });
  }, [currentPlayer, room, sendEvent, addMessage]);

  // Reset game for "play again" (host only)
  const resetForNewGame = useCallback(() => {
    if (!currentPlayer?.is_host || !room) return;
    
    // Reset all players' scores and ready status
    const state = useGameStore.getState();
    state.players.forEach(player => {
      updatePlayer(player.id, { 
        score: 0, 
        is_ready: false, 
        is_drawing: false 
      });
    });
    
    // Reset current player
    setCurrentPlayer({ 
      ...currentPlayer, 
      score: 0, 
      is_ready: false, 
      is_drawing: false 
    });
    
    // Clear game state
    clearDrawings();
    clearMessages();
    // Don't reset word tracking here so we don't repeat words in the same session
    
    // Update room to lobby status
    const newRoom: Room = {
      ...room,
      status: 'lobby',
      current_round: 0,
      current_word: null,
      drawing_team: 1,
      round_start_time: null,
    };
    setRoom(newRoom);
    
    // Broadcast reset to all players
    sendEvent({ 
      type: 'game_reset',
      room: newRoom,
    });
    
    // Update presence
    if (channelRef.current) {
      channelRef.current.track({ 
        player: { 
          ...currentPlayer, 
          score: 0, 
          is_ready: false, 
          is_drawing: false 
        } 
      });
    }
  }, [currentPlayer, room, updatePlayer, setCurrentPlayer, clearDrawings, clearMessages, setRoom, sendEvent]);

  // Leave room
  const leaveRoom = useCallback(async () => {
    // Clear saved session
    await clearSession();
    
    if (channelRef.current) {
      await supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    usedWordsRef.current.clear(); // Reset word tracking
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
    markCorrectGuess,
    skipWord,
    resetForNewGame,
    
    // Communication
    sendEvent,
    sendDrawing,
    sendChat,
  };
};

export default useMultiplayer;