import { create } from 'zustand';
import { GameState, Player, Room, DrawingPath, ChatMessage, RoomSettings } from '../types/multiplayer';

interface GameStore extends GameState {
  // Actions
  setRoom: (room: Room | null) => void;
  setPlayers: (players: Player[]) => void;
  addPlayer: (player: Player) => void;
  removePlayer: (playerId: string) => void;
  updatePlayer: (playerId: string, updates: Partial<Player>) => void;
  setCurrentPlayer: (player: Player | null) => void;
  
  // Drawing
  addDrawing: (path: DrawingPath) => void;
  updateDrawing: (pathId: string, path: DrawingPath) => void;
  clearDrawings: () => void;
  undoLastDrawing: () => void;
  
  // Chat
  addMessage: (message: ChatMessage) => void;
  clearMessages: () => void;
  
  // Connection
  setConnected: (connected: boolean) => void;
  setError: (error: string | null) => void;
  
  // Game flow
  startGame: () => void;
  endGame: () => void;
  nextRound: () => void;
  
  // Reset
  reset: () => void;
}

const initialState: GameState = {
  room: null,
  players: [],
  currentPlayer: null,
  drawings: [],
  messages: [],
  isConnected: false,
  error: null,
};

export const useGameStore = create<GameStore>((set, get) => ({
  ...initialState,
  
  setRoom: (room) => set({ room }),
  
  setPlayers: (players) => set({ players }),
  
  addPlayer: (player) => set((state) => ({
    players: [...state.players.filter(p => p.id !== player.id), player],
  })),
  
  removePlayer: (playerId) => set((state) => ({
    players: state.players.filter(p => p.id !== playerId),
  })),
  
  updatePlayer: (playerId, updates) => set((state) => ({
    players: state.players.map(p => 
      p.id === playerId ? { ...p, ...updates } : p
    ),
  })),
  
  setCurrentPlayer: (player) => set({ currentPlayer: player }),
  
  addDrawing: (path) => set((state) => ({
    drawings: [...state.drawings.filter(d => d.id !== path.id), path],
  })),
  
  // NEW: Update an existing drawing path (for real-time stroke updates)
  updateDrawing: (pathId, path) => set((state) => ({
    drawings: state.drawings.map(d => d.id === pathId ? path : d),
  })),
  
  clearDrawings: () => set({ drawings: [] }),
  
  undoLastDrawing: () => set((state) => ({
    drawings: state.drawings.slice(0, -1),
  })),
  
  addMessage: (message) => set((state) => ({
    messages: [...state.messages, message].slice(-100), // Keep last 100 messages
  })),
  
  clearMessages: () => set({ messages: [] }),
  
  setConnected: (isConnected) => set({ isConnected }),
  
  setError: (error) => set({ error }),
  
  startGame: () => set((state) => ({
    room: state.room ? { ...state.room, status: 'playing' as const } : null,
    drawings: [],
    messages: [],
  })),
  
  endGame: () => set((state) => ({
    room: state.room ? { ...state.room, status: 'finished' as const } : null,
  })),
  
  nextRound: () => set((state) => ({
    room: state.room ? { 
      ...state.room, 
      current_round: state.room.current_round + 1,
      drawing_team: state.room.drawing_team === 1 ? 2 : 1,
    } : null,
    drawings: [],
  })),
  
  reset: () => set(initialState),
}));

// Selectors
export const selectTeam1Players = (state: GameStore) => 
  state.players.filter(p => p.team === 1);

export const selectTeam2Players = (state: GameStore) => 
  state.players.filter(p => p.team === 2);

export const selectCurrentDrawer = (state: GameStore) => 
  state.players.find(p => p.is_drawing);

export const selectIsHost = (state: GameStore) => 
  state.currentPlayer?.is_host ?? false;

export const selectCanStartGame = (state: GameStore) => {
  const team1 = state.players.filter(p => p.team === 1);
  const team2 = state.players.filter(p => p.team === 2);
  const allReady = state.players.every(p => p.is_ready);
  return team1.length >= 1 && team2.length >= 1 && allReady && state.currentPlayer?.is_host;
};

export default useGameStore;
