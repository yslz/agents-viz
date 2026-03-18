import { createSignal, onCleanup } from 'solid-js'

export interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  messageID?: string  // Track opencode message ID for streaming accumulation
}

export interface UseOpencodeRealAPIOptions {
  agentId?: string      // e.g., "technical-artist"
  agentName?: string    // e.g., "Technical Artist"
  baseUrl?: string
  onConnectionChange?: (connected: boolean) => void
}

export function useOpencodeRealAPI(options: UseOpencodeRealAPIOptions = {}) {
  const [connected, setConnected] = createSignal(false)
  const [loading, setLoading] = createSignal(false)
  const [error, setError] = createSignal<string | null>(null)
  const [messages, setMessages] = createSignal<Message[]>([])
  const [sessionId, setSessionId] = createSignal<string | null>(null)
  
  // Use provided baseUrl, no default - must be passed from parent
  const baseUrl = options.baseUrl
  
  let eventSource: EventSource | null = null
  
  // Notify parent of connection state changes
  if (options.onConnectionChange) {
    options.onConnectionChange(connected())
  }
  
  // Connect to SSE endpoint to listen for messages
  const connectSSE = () => {
    if (eventSource) {
      eventSource.close()
    }
    
    try {
      eventSource = new EventSource(`${baseUrl}/event`)
      
      eventSource.onopen = () => {
        console.log('[SSE] Connected to event stream')
      }
      
      eventSource.onerror = (err) => {
        console.error('[SSE] Error:', err)
      }
      
      eventSource.addEventListener('message', (event) => {
        const fullEventText = event.data
        console.log('[SSE] Full event text:', fullEventText.substring(0, 1000))
        
        // CRITICAL: Extract system reminder from ANYWHERE in the event text
        const systemReminderMatch = fullEventText.match(/<system-reminder>([\s\S]*?)<\/system-reminder>/i)
        if (systemReminderMatch && systemReminderMatch[1].trim()) {
          const systemMessage = systemReminderMatch[1].trim()
          console.log('[SSE] ✅ EXTRACTED SYSTEM MESSAGE:', systemMessage.substring(0, 200))
          
          // Display system message immediately
          setMessages(prev => {
            // Check if we already have this system message
            const alreadyExists = prev.some(m => 
              m.role === 'system' && m.content.includes(systemMessage.substring(0, 50))
            )
            
            if (!alreadyExists) {
              return [...prev, {
                role: 'system',
                content: systemMessage,
                timestamp: new Date(),
              }]
            }
            return prev
          })
        }
        
        try {
          // Extract JSON part (everything before the first < or the whole thing if no tags)
          const jsonEndIndex = fullEventText.indexOf('<')
          const jsonPart = jsonEndIndex > 0 ? fullEventText.substring(0, jsonEndIndex).trim() : fullEventText
          
          // Try to parse JSON part
          const data = JSON.parse(jsonPart)
          console.log('[SSE] Event:', data.type, 'Properties:', data.properties ? Object.keys(data.properties).join(', ') : 'none')
          
          // Handle message events
          if (data.type === 'message.updated') {
            const props = data.properties || {}
            const info = props.info || {}
            
            if (info.role === 'assistant') {
              fetchMessageWithParts(info.sessionID, info.id)
            }
          }
          
          if (data.type === 'message.part.updated') {
            const props = data.properties || {}
            const part = props.part || {}
            
            if (part.type === 'text') {
              fetchMessageWithParts(part.sessionID, part.messageID)
            }
          }
          
          if (data.type === 'message.part.delta') {
            const props = data.properties || {}
            const { sessionID, messageID, field, delta } = props
            
            if (field === 'text' && delta) {
              setMessages(prev => {
                const userMessages = prev.filter(m => m.role === 'user')
                const existingAssistant = prev.find(m => m.role === 'assistant' && (m as any).messageID === messageID)
                
                if (existingAssistant) {
                  return prev.map(m => 
                    m.role === 'assistant' && (m as any).messageID === messageID
                      ? { ...m, content: (m.content || '') + delta }
                      : m
                  )
                } else {
                  return [...userMessages, {
                    role: 'assistant',
                    content: delta,
                    timestamp: new Date(),
                    messageID,
                  } as any]
                }
              })
            }
          }
          
          if (data.type === 'message.removed') {
            const props = data.properties || {}
            const { sessionID, messageID } = props
            setMessages(prev => prev.filter(m => (m as any).messageID !== messageID))
          }
          
        } catch (e) {
          console.log('[SSE] Event data is not pure JSON (may contain system message)')
        }
      })
      
      setConnected(true)
    } catch (err) {
      console.error('[SSE] Failed to connect:', err)
      setConnected(false)
    }
  }
  
  // Connect SSE on mount
  connectSSE()
  
  // Fetch a complete message with parts from the API
  const fetchMessageWithParts = async (sessionID: string, messageID: string) => {
    try {
      const response = await fetch(`${baseUrl}/session/${sessionID}/message/${messageID}`, {
        method: 'GET',
      })
      
      if (!response.ok) {
        console.error('[API] Failed to fetch message:', response.status)
        return
      }
      
      const data = await response.json()
      console.log('[API] Fetched message:', messageID, 'Parts:', data.parts?.length || 0)
      
      // Extract text content from parts
      const textParts = data.parts?.filter((p: any) => p.type === 'text') || []
      const content = textParts.map((p: any) => p.text).join('')
      
      if (content && content.trim().length > 0) {
        setMessages(prev => {
          const userMessages = prev.filter(m => m.role === 'user')
          const existingAssistant = prev.find(m => m.role === 'assistant' && (m as any).messageID === messageID)
          
          if (existingAssistant) {
            // Update existing assistant message
            return prev.map(m => 
              m.role === 'assistant' && (m as any).messageID === messageID
                ? { ...m, content }
                : m
            )
          } else {
            // Add new assistant message
            return [...userMessages, {
              role: 'assistant',
              content,
              timestamp: new Date(),
              messageID,
            }]
          }
        })
        console.log('[API] Displayed assistant message:', content.substring(0, 200))
      }
    } catch (err) {
      console.error('[API] Error fetching message:', err)
    }
  }
  
  // Create a new session
  const createSession = async () => {
    try {
      const response = await fetch(`${baseUrl}/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),  // Empty body is required
      })
      
      if (response.ok) {
        const session = await response.json()
        setSessionId(session.id)
        console.log('[Session] Created session:', session.id)
        return session.id
      } else {
        const errorText = await response.text()
        console.error('[Session] Failed to create session:', response.status, errorText)
        return null
      }
    } catch (err) {
      console.error('[Session] Error creating session:', err)
      return null
    }
  }
  
  // Send a message to the agent
  const sendMessage = async (content: string, agentId?: string) => {
    if (!content.trim()) return
    
    setLoading(true)
    setError(null)
    
    // Add user message immediately
    setMessages(prev => [...prev, {
      role: 'user',
      content,
      timestamp: new Date(),
    }])
    
    try {
      // Get or create session
      let currentSessionId = sessionId()
      if (!currentSessionId) {
        currentSessionId = await createSession()
        if (!currentSessionId) {
          throw new Error('Failed to create session')
        }
      }
      
      const targetAgentId = agentId || options.agentId
      const targetAgentName = options.agentName  // Use the display name for opencode
      
      console.log('[API] Sending message to session', currentSessionId, ':', content, 'agent:', targetAgentName || targetAgentId)
      
      // Send message using /session/:sessionID/message endpoint
      const response = await fetch(`${baseUrl}/session/${currentSessionId}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          parts: [{
            type: 'text',
            text: targetAgentName ? `@${targetAgentName} ${content}` : content,
          }],
          agent: targetAgentName,
        }),
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('[API] Server error:', response.status, errorText)
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }
      
      // Read the response - opencode returns a single JSON object when complete
      // Real-time updates come via SSE events
      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No response body')
      }
      
      const decoder = new TextDecoder()
      let responseText = ''
      let chunkCount = 0
      
      console.log('[API] Starting to read response stream...')
      
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) {
            console.log('[API] Stream finished, received', chunkCount, 'chunks')
            break
          }
          
          const chunk = decoder.decode(value, { stream: true })
          chunkCount++
          responseText += chunk
          console.log('[API] Received chunk', chunkCount, ':', chunk.substring(0, 200))
        }
        
        // Parse the complete response
        if (responseText.trim()) {
          // FIRST: Extract system reminder from response text BEFORE parsing JSON
          const systemReminderMatch = responseText.match(/<system-reminder>([\s\S]*?)<\/system-reminder>/i)
          if (systemReminderMatch) {
            const systemMessage = systemReminderMatch[1].trim()
            console.log('[API] Extracted system reminder from response:', systemMessage)
            
            // Display system message
            setMessages(prev => [...prev, {
              role: 'system',
              content: systemMessage,
              timestamp: new Date(),
            }])
          }
          
          // Extract JSON part (everything before the first < or the whole thing if no tags)
          const jsonEndIndex = responseText.indexOf('<')
          const jsonPart = jsonEndIndex > 0 ? responseText.substring(0, jsonEndIndex).trim() : responseText
          
          // Also capture any text AFTER the JSON (after </system-reminder> or after JSON if no tags)
          let textAfterJson = ''
          if (jsonEndIndex > 0) {
            textAfterJson = responseText.substring(jsonEndIndex).trim()
            // Remove the system reminder tags but keep the content
            const textAfterJsonCleaned = textAfterJson.replace(/<\/?system-reminder>/gi, '').trim()
            if (textAfterJsonCleaned.length > 0 && !systemReminderMatch) {
              // If we didn't already extract via regex, capture this text
              console.log('[API] Found text after JSON:', textAfterJsonCleaned.substring(0, 500))
              if (textAfterJsonCleaned.length > 10) {
                setMessages(prev => [...prev, {
                  role: 'system',
                  content: textAfterJsonCleaned,
                  timestamp: new Date(),
                }])
              }
            }
          }
          
          try {
            const data = JSON.parse(jsonPart)
            console.log('[API] Response data:', { 
              info: data.info ? { role: data.info.role, id: data.info.id } : 'none',
              parts: data.parts?.length || 0 
            })
            
            if (data.info && data.info.role === 'assistant') {
              // Extract text from parts (excluding synthetic system reminders)
              const textParts = data.parts?.filter((p: any) => p.type === 'text' && !p.synthetic) || []
              const content = textParts.map((p: any) => p.text).join('')
              
              if (content && content.trim().length > 0) {
                setMessages(prev => {
                  const userMessages = prev.filter(m => m.role === 'user')
                  return [...userMessages, {
                    role: 'assistant',
                    content,
                    timestamp: new Date(),
                    messageID: data.info.id,
                  }]
                })
                console.log('[API] Got response from stream:', content.substring(0, 200))
                return  // Exit early when we get a response from stream
              }
            }
          } catch (e) {
            console.error('[API] Failed to parse response:', e, 'Text:', jsonPart.substring(0, 500))
          }
        }
      } catch (readError) {
        console.error('[API] Error reading stream:', readError)
      }
      
      // If no response from stream, poll for response via SSE events
      if (chunkCount === 0) {
        console.log('[API] No chunks received, polling for response...')
        
        let lastAssistantMessageID: string | null = null
        let lastAssistantText = ''
        
        // Poll session messages endpoint multiple times
        for (let pollAttempt = 0; pollAttempt < 15; pollAttempt++) {
          await new Promise(resolve => setTimeout(resolve, 800))
          
          try {
            // Use /session/:id/message endpoint to get messages
            const messagesResponse = await fetch(`${baseUrl}/session/${currentSessionId}/message`, {
              method: 'GET',
            })
            
            if (messagesResponse.ok) {
              const messages = await messagesResponse.json()
              console.log('[API] Poll attempt', pollAttempt + 1, '- Messages count:', messages?.length || 0)
              
              // Find the last assistant message that came after the user message
              for (let i = messages.length - 1; i >= 0; i--) {
                const msg = messages[i]
                const msgInfo = msg.info || msg
                console.log('[API] Checking message', i, '- Role:', msgInfo.role, 'Parts:', msg.parts?.length || 0)
                
                if (msgInfo.role === 'assistant') {
                  const textParts = msg.parts?.filter((p: any) => p.type === 'text' && !p.synthetic) || []
                  const text = textParts.map((p: any) => p.text).join('')
                  
                  console.log('[API] Found assistant message with text length:', text?.length || 0, 'ID:', msgInfo.id)
                  
                  // Collect text content
                  if (text && text.trim().length > 0) {
                    lastAssistantMessageID = msgInfo.id
                    lastAssistantText = text
                    break
                  }
                }
              }
              
              // If we have content, display it
              if (lastAssistantText) {
                setMessages(prev => {
                  // Remove any existing assistant messages
                  const userMessages = prev.filter(m => m.role === 'user')
                  return [...userMessages, {
                    role: 'assistant',
                    content: lastAssistantText,
                    timestamp: new Date(),
                    messageID: lastAssistantMessageID || undefined,
                  }]
                })
                console.log('[API] Got response via polling (attempt', pollAttempt + 1, '):', lastAssistantText.substring(0, 200))
                return  // Exit early when we get a response
              }
            } else {
              console.error('[API] Poll failed:', messagesResponse.status)
            }
          } catch (e) {
            console.error('[API] Polling error:', e)
          }
        }
        
        console.log('[API] Polling finished, no response found')
      }
      
      console.log('[API] Message complete')
      
    } catch (err) {
      console.error('[API] Failed to send message:', err)
      setError(err instanceof Error ? err.message : 'Failed to send message')
      
      setMessages(prev => [...prev, {
        role: 'system',
        content: `Error: ${err instanceof Error ? err.message : 'Failed to send message'}`,
        timestamp: new Date(),
      }])
    } finally {
      setLoading(false)
    }
  }
  
  // Clear messages
  const clearMessages = () => {
    setMessages([])
    setSessionId(null)
  }
  
  // Initialize connection
  const init = async () => {
    try {
      // Test connection by listing sessions
      const response = await fetch(`${baseUrl}/session`, {
        method: 'GET',
      })
      
      if (response.ok) {
        setConnected(true)
        console.log('[API] Connected to opencode server')
      } else {
        throw new Error(`HTTP ${response.status}`)
      }
    } catch (err) {
      console.error('[API] Connection failed:', err)
      setConnected(false)
      setError('Failed to connect to server')
    }
  }
  
  // Auto-connect on mount
  init()
  
  // Cleanup on unmount
  onCleanup(() => {
    if (eventSource) {
      eventSource.close()
      eventSource = null
    }
  })
  
  // Expose loading state
  const isLoading = () => {
    const msgList = messages()
    const lastMsg = msgList[msgList.length - 1]
    return loading() && lastMsg?.role === 'user'
  }
  
  return {
    connected,
    loading: isLoading,
    error,
    messages,
    sessionId,
    sendMessage,
    clearMessages,
  }
}
