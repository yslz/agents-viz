# Opencode API Integration Fix

## Problem Analysis

The conversation feature was not displaying agent responses even though:
1. Messages were successfully sent via POST to `/session/:sessionID/message`
2. Opencode server showed system messages in its web UI
3. SSE connection was established and receiving events

## Root Cause

The client code was listening for **incorrect event types** from the opencode SSE stream.

### What the client was looking for (WRONG):
- `session.updated` - This event type doesn't exist
- `message.completed` - This event type doesn't exist
- `message.delta` - This event type doesn't exist

### What opencode actually publishes (CORRECT):
- `message.updated` - When a message is updated
- `message.part.updated` - When a message part is updated
- `message.part.delta` - When text is streaming (delta updates)
- `message.removed` - When a message is removed
- `message.part.removed` - When a part is removed

### Event Structure
All opencode events follow this format:
```json
{
  "type": "message.part.delta",
  "properties": {
    "sessionID": "...",
    "messageID": "...",
    "partID": "...",
    "field": "text",
    "delta": "..."
  }
}
```

The client was looking for data in `data.properties.message` or `data.properties.session`, but the actual structure uses:
- `data.properties.info` for `message.updated` events
- `data.properties.part` for `message.part.updated` events
- `data.properties` directly for `message.part.delta` events

## Solution

### 1. Fixed SSE Event Handler
Updated the SSE event listener to handle the correct event types:

```typescript
// Handle message.updated events - complete message updates
if (data.type === 'message.updated') {
  const props = data.properties || {}
  const info = props.info || {}
  if (info.role === 'assistant') {
    fetchMessageWithParts(info.sessionID, info.id)
  }
}

// Handle message.part.updated events - part was updated
if (data.type === 'message.part.updated') {
  const props = data.properties || {}
  const part = props.part || {}
  if (part.type === 'text') {
    fetchMessageWithParts(part.sessionID, part.messageID)
  }
}

// Handle message.part.delta events - streaming text deltas
if (data.type === 'message.part.delta') {
  const props = data.properties || {}
  const { sessionID, messageID, partID, field, delta } = props
  if (field === 'text' && delta) {
    // Accumulate streaming text in real-time
    setMessages(prev => { ... })
  }
}
```

### 2. Added `fetchMessageWithParts` Helper
Created a function to fetch complete message data from the API when an update event is received:

```typescript
const fetchMessageWithParts = async (sessionID: string, messageID: string) => {
  const response = await fetch(`${baseUrl}/session/${sessionID}/message/${messageID}`)
  const data = await response.json()
  const textParts = data.parts?.filter((p: any) => p.type === 'text') || []
  const content = textParts.map((p: any) => p.text).join('')
  // Update messages state with the content
}
```

### 3. Fixed Polling Endpoint
Changed polling from `/session/:id` (returns session info) to `/session/:id/message` (returns messages):

```typescript
// Before (WRONG)
const sessionResponse = await fetch(`${baseUrl}/session/${currentSessionId}`)
const messages = session.messages || []

// After (CORRECT)
const messagesResponse = await fetch(`${baseUrl}/session/${currentSessionId}/message`)
const messages = await messagesResponse.json()
```

### 4. Improved Stream Response Handling
The opencode `/session/:id/message` POST endpoint returns a single JSON object when processing is complete, not streaming chunks. Updated to:
1. Read the complete response
2. Extract text from parts (excluding synthetic system reminders)
3. Rely on SSE events for real-time updates during processing

## Key Opencode API Endpoints Used

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/event` | GET | SSE stream for real-time events |
| `/session` | POST | Create new session |
| `/session/:id/message` | GET | Get all messages in session |
| `/session/:id/message/:messageId` | GET | Get specific message with parts |
| `/session/:id/message` | POST | Send message (returns when complete) |

## Event Types Reference

| Event Type | Properties | Description |
|------------|------------|-------------|
| `server.connected` | `{}` | SSE connection established |
| `server.heartbeat` | `{}` | Heartbeat every 10 seconds |
| `message.updated` | `{ info: MessageInfo }` | Message was updated |
| `message.part.updated` | `{ part: Part }` | Part was updated |
| `message.part.delta` | `{ sessionID, messageID, partID, field, delta }` | Text delta streaming |
| `message.removed` | `{ sessionID, messageID }` | Message was removed |
| `message.part.removed` | `{ sessionID, messageID, partID }` | Part was removed |

## Testing Recommendations

1. **Test SSE Connection**: Verify connection to `/event` endpoint
2. **Test Message Sending**: Send a message and verify it appears in UI
3. **Test Streaming**: Watch for `message.part.delta` events during long responses
4. **Test Polling Fallback**: Verify polling works if SSE events are delayed

## Files Modified

- `src/hooks/useOpencodeRealAPI.ts` - Complete rewrite of SSE event handling
