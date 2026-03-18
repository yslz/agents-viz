import { createSignal, onCleanup, createEffect } from 'solid-js'

export interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
}

export interface UseOpencodeAPIOptions {
  agentId?: string
  baseUrl?: string
  onConnectionChange?: (connected: boolean) => void
  mockMode?: boolean  // If true, use mock responses for testing
}

export function useOpencodeAPI(options: UseOpencodeAPIOptions = {}) {
  const [connected, setConnected] = createSignal(false)
  const [loading, setLoading] = createSignal(false)
  const [error, setError] = createSignal<string | null>(null)
  const [messages, setMessages] = createSignal<Message[]>([])
  
  let eventSource: EventSource | null = null
  let reconnectTimeout: ReturnType<typeof setTimeout> | null = null
  
  const baseUrl = options.baseUrl || 'http://localhost:3000'
  const mockMode = options.mockMode ?? false
  
  // Notify parent of connection state changes
  createEffect(() => {
    options.onConnectionChange?.(connected())
  })
  
  // Connect to SSE endpoint
  const connect = () => {
    if (mockMode) {
      // Mock mode - just mark as connected
      setConnected(true)
      console.log('[Mock] Connected (mock mode)')
      return
    }
    
    try {
      if (eventSource) {
        eventSource.close()
      }
      
      eventSource = new EventSource(`${baseUrl}/event`)
      
      eventSource.onopen = () => {
        setConnected(true)
        setError(null)
        console.log('[SSE] Connected to', baseUrl)
      }
      
      eventSource.onerror = (err) => {
        console.error('[SSE] Error:', err)
        setConnected(false)
        
        reconnectTimeout = setTimeout(() => {
          connect()
        }, 3000)
      }
      
      eventSource.addEventListener('message', (event) => {
        try {
          const data = JSON.parse(event.data)
          console.log('[SSE] Event received:', data.type, data)
          
          // Handle different event types from opencode
          switch (data.type) {
            case 'server.connected':
              console.log('[SSE] Server connected')
              break
              
            case 'server.heartbeat':
              // Ignore heartbeat
              break
              
            case 'message.created':
            case 'message.delta':
            case 'message.completed':
              if (data.content) {
                setMessages(prev => {
                  const lastMsg = prev[prev.length - 1]
                  if (lastMsg && lastMsg.role === 'assistant') {
                    return prev.map((msg, idx) => 
                      idx === prev.length - 1 
                        ? { ...msg, content: msg.content + data.content }
                        : msg
                    )
                  } else {
                    return [...prev, {
                      role: 'assistant',
                      content: data.content,
                      timestamp: new Date(),
                    }]
                  }
                })
              }
              break
              
            case 'response':
            case 'message':
              setMessages(prev => [...prev, {
                role: 'assistant',
                content: data.content || data.message || JSON.stringify(data),
                timestamp: new Date(),
              }])
              break
              
            case 'error':
              setMessages(prev => [...prev, {
                role: 'system',
                content: data.message || 'An error occurred',
                timestamp: new Date(),
              }])
              break
              
            case 'tui.prompt.append':
              console.log('[SSE] Prompt appended, waiting for response...')
              break
              
            default:
              // Try to extract useful information from unknown events
              if (data.properties || data.content || data.message) {
                console.log('[SSE] Event with data:', data.type, data)
                const content = data.properties?.content || data.content || data.message
                if (content && typeof content === 'string') {
                  setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: typeof content === 'string' ? content : JSON.stringify(content),
                    timestamp: new Date(),
                  }])
                }
              } else {
                console.log('[SSE] Unknown event type:', data.type)
              }
          }
        } catch (e) {
          console.error('[SSE] Failed to parse event:', e, event.data)
        }
      })
      
    } catch (err) {
      console.error('[SSE] Failed to connect:', err)
      setError('Failed to connect to server')
      setConnected(false)
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
    
    if (mockMode) {
      // Mock mode - simulate a response
      console.log('[Mock] Sending message:', content)
      
      setTimeout(() => {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `Hello! I'm ${agentId || 'an assistant'}. This is a mock response since we're in mock mode. You said: "${content}"`,
          timestamp: new Date(),
        }])
        setLoading(false)
      }, 1000)
      
      return
    }
    
    try {
      const targetAgent = agentId ? `@${agentId}` : ''
      const fullText = targetAgent ? `${targetAgent} ${content}` : content
      
      console.log('[API] Sending message:', fullText)
      
      const response = await fetch(`${baseUrl}/tui/append-prompt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: fullText,
        }),
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const result = await response.json()
      console.log('[API] Message sent, response:', result)
      
      // In real mode, we wait for SSE response
      // Set a timeout to stop loading after 30 seconds
      setTimeout(() => {
        setLoading(false)
      }, 30000)
      
    } catch (err) {
      console.error('[API] Failed to send message:', err)
      setError(err instanceof Error ? err.message : 'Failed to send message')
      
      setMessages(prev => [...prev, {
        role: 'system',
        content: `Error: ${err instanceof Error ? err.message : 'Failed to send message'}`,
        timestamp: new Date(),
      }])
      
      setLoading(false)
    }
  }
  
  // Clear messages
  const clearMessages = () => {
    setMessages([])
  }
  
  // Disconnect
  const disconnect = () => {
    if (eventSource) {
      eventSource.close()
      eventSource = null
    }
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout)
      reconnectTimeout = null
    }
    setConnected(false)
  }
  
  // Auto-connect on mount
  connect()
  
  // Cleanup on unmount
  onCleanup(() => {
    disconnect()
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
    sendMessage,
    clearMessages,
    reconnect: connect,
    disconnect,
  }
}
