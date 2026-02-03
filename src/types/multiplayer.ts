// Multiplayer Types for DoodleMania

export interface Player {
  id: string;
  name: string;
  room_id: string | null;
  team: 1 | 2 | null;
  is_drawing: boolean;
  score: number;
  is_ready: boolean;
  is_host: boolean;
  connected_at: string;
}

export interface Room {
  id: string;
  code: string;
  host_id: string;
  status: 'lobby' | 'playing' | 'finished';
  settings: RoomSettings;
  current_round: number;
  total_rounds: number;
  current_word: string | null;
  drawing_team: 1 | 2;
  round_start_time: string | null;
  created_at: string;
}

export interface RoomSettings {
  timer_seconds: number;
  difficulty: 'easy' | 'medium' | 'hard';
  max_players: number;
  allow_tag_team: boolean;
}

export interface DrawingEvent {
  type: 'start' | 'move' | 'end' | 'clear' | 'undo';
  x?: number;
  y?: number;
  color: string;
  brushSize: number;
  timestamp: number;
  player_id: string;
}

export interface DrawingPath {
  id: string;
  points: Array<{ x: number; y: number }>;
  color: string;
  brushSize: number;
  player_id: string;
}

export interface ChatMessage {
  id: string;
  room_id: string;
  player_id: string;
  player_name: string;
  text: string;
  is_correct_guess: boolean;
  timestamp: string;
}

export interface GameState {
  room: Room | null;
  players: Player[];
  currentPlayer: Player | null;
  drawings: DrawingPath[];
  messages: ChatMessage[];
  isConnected: boolean;
  error: string | null;
}

export interface RoundResult {
  round: number;
  word: string;
  drawing_team: 1 | 2;
  guessing_team: 1 | 2;
  guessed_by: string | null;
  time_taken: number | null;
  points_awarded: number;
}

// Realtime payload types
export interface RealtimePresence {
  player_id: string;
  player_name: string;
  online_at: string;
}

export type RoomEvent = 
  | { type: 'player_joined'; player: Player }
  | { type: 'player_left'; player_id: string }
  | { type: 'player_ready'; player_id: string; is_ready: boolean }
  | { type: 'game_started'; word?: string }
  | { type: 'round_started'; round: number; drawing_team: 1 | 2; word?: string }
  | { type: 'tag_team'; new_drawer_id: string }
  | { type: 'correct_guess'; player_id: string; points: number }
  | { type: 'round_ended'; result: RoundResult }
  | { type: 'game_ended'; winner_team: 1 | 2; final_scores: { team1: number; team2: number } }
  | { type: 'drawing'; event: DrawingEvent }
  | { type: 'chat'; message: ChatMessage };
