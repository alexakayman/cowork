# Debugging: Joiner doesn’t see host’s goal

## Symptom

- You create a session and set a goal.
- A friend joins the session later.
- You see their goal; they don’t see yours (they see “no goal” for you).

## Data flow (relevant parts)

1. **Server** keeps session state in `session.users` (Map of `userId` → `UserState`).  
   `UserState` includes `sessionTodo`, `isFocused`, etc.

2. **Host sets goal**  
   - Client sends `UPDATE` with `sessionTodo`.  
   - Server updates `session.users.get(hostUserId).sessionTodo` (see `handlers.ts` UPDATE).

3. **Friend joins**  
   - Friend sends `JOIN` with their user (including their goal).  
   - Server:  
     - Adds friend to `session.users`.  
     - Sends **only to the friend**: `SESSION_STATE` with `users: Array.from(session.users.values())`.  
     - Broadcasts to **others** (host): `USER_JOINED` with the friend’s user.  

4. **Friend’s view of the host**  
   - Comes **only** from `SESSION_STATE` (friend does not get `USER_JOINED` for themselves).  
   - So the host’s `sessionTodo` on the friend’s client is whatever was in `SESSION_STATE`.

## Root cause (race)

`SESSION_STATE` is built at the moment the server handles the friend’s `JOIN`. If the host’s `UPDATE` (with goal) hasn’t been processed yet (e.g. network order), then `session.users` still has the host **without** `sessionTodo`, and the friend receives that snapshot. So the friend never sees the host’s goal until the host sends another `UPDATE` later.

So the bug is a **race**: friend’s `JOIN` can be handled before the host’s `UPDATE` (goal) is applied.

## How to investigate next time

1. **Confirm server state**  
   In `apps/server/src/handlers.ts`, in the `JOIN` branch, temporarily log the state you send:
   ```ts
   const stateMsg = { type: 'SESSION_STATE', payload: { sessionCode, users: Array.from(session.users.values()) } };
   console.log('[join] SESSION_STATE users', JSON.stringify(stateMsg.payload.users.map(u => ({ id: u.userId.slice(0,8), goal: u.sessionTodo }))));
   ws.send(JSON.stringify(stateMsg));
   ```
   Check whether the host’s `goal` is present when the friend joins.

2. **Confirm client receipt**  
   In `apps/desktop/src/hooks/usePresenceSocket.ts`, in the `SESSION_STATE` handler, log what you store:
   ```ts
   case "SESSION_STATE":
     console.log('[ws] SESSION_STATE users', msg.payload.users.map(u => ({ id: u.userId.slice(0,8), goal: u.sessionTodo })));
     setSession(msg.payload.sessionCode, msg.payload.users);
   ```
   If the server log shows the goal but the client log doesn’t, the issue is serialization/parsing. If the server log already has no goal, the issue is timing (race) or server state.

3. **Reproduce the race**  
   - Host: create session, set goal.  
   - Friend: join as fast as possible (or throttle the host’s `UPDATE` in DevTools to simulate delay).  
   - If the friend sometimes sees the goal and sometimes doesn’t, that supports the race explanation.

## Fix (implemented)

After sending `SESSION_STATE` to the joining user, the server now sends a `USER_UPDATED` to **that socket only** for every **other** user in the session. So the joiner gets the latest `sessionTodo` (and `isFocused`, etc.) for each existing member, even if `SESSION_STATE` was built before a recent `UPDATE`. See `apps/server/src/handlers.ts` (JOIN branch).
