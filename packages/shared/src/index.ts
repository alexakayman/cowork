// === Activity Types ===
export enum ActivityType {
  CODING        = 'coding',
  WRITING       = 'writing',
  EMAIL         = 'email',
  BROWSING      = 'browsing',
  DESIGNING     = 'designing',
  COMMUNICATING = 'communicating',
  SPREADSHEET   = 'spreadsheet',
  MEETING       = 'meeting',
  TERMINAL      = 'terminal',
  MEDIA         = 'media',
  FOCUS         = 'focus',    // DND / manual focus mode
  IDLE          = 'idle',     // no window or unknown app
}

// === User State ===
export interface UserState {
  userId:      string;        // UUID v4, generated on first launch
  displayName: string;
  avatarId:    string;        // sprite key from avatar manifest
  activity:    ActivityType;
  appName:     string;        // human-readable app name, e.g. 'VS Code'
  updatedAt:   number;        // Unix ms timestamp
  activityStartedAt: number;  // Unix ms — when current activity began (for rich presence duration)
}

// === Client → Server Messages ===
export type ClientMessage =
  | { type: 'JOIN';   payload: JoinPayload   }
  | { type: 'LEAVE';  payload: LeavePayload  }
  | { type: 'UPDATE'; payload: UpdatePayload }
  | { type: 'PING';   payload: PingPayload   };

export interface JoinPayload {
  sessionCode: string;
  user:        UserState;
}

export interface LeavePayload {
  userId: string;
}

export interface UpdatePayload {
  userId:            string;
  displayName:       string;
  avatarId:          string;
  activity:          ActivityType;
  appName:           string;
  activityStartedAt: number;  // Unix ms — when this activity began
}

export interface PingPayload {
  clientTime: number;
}

// === Server → Client Messages ===
export type ServerMessage =
  | { type: 'SESSION_STATE'; payload: SessionStatePayload }
  | { type: 'USER_JOINED';   payload: UserJoinedPayload   }
  | { type: 'USER_LEFT';     payload: UserLeftPayload     }
  | { type: 'USER_UPDATED';  payload: UserUpdatedPayload  }
  | { type: 'PONG';          payload: PongPayload         }
  | { type: 'ERROR';         payload: ErrorPayload        };

export interface SessionStatePayload {
  sessionCode: string;
  users:       UserState[];
}

export interface UserJoinedPayload  { user:    UserState; }
export interface UserLeftPayload    { userId:  string;    }
export interface UserUpdatedPayload { user:    UserState; }
export interface PongPayload        { serverTime: number; }
export interface ErrorPayload       { code: string; message: string; }
