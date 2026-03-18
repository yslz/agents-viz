import { createSignal, createEffect, onCleanup } from 'solid-js'
import type { SessionListItem, Session, SessionMessage } from '../data/session-types'

export interface UseSessionsOptions {
  baseUrl: string
  pollInterval?: number  // milliseconds, default 5000
  enabled?: boolean      // auto-fetch on mount, default true
}

export function useSessions(options: UseSessionsOptions) {
  const [sessions, setSessions] = createSignal<SessionListItem[]>([])
  const [loading, setLoading] = createSignal(false)
  const [error, setError] = createSignal<string | null>(null)
  const [lastUpdated, setLastUpdated] = createSignal<Date | null>(null)
  
  const pollInterval = options.pollInterval ?? 5000
  const enabled = options.enabled ?? true
  
  let pollTimeout: ReturnType<typeof setTimeout> | null = null
  
  // Fetch session list from opencode web API
  const fetchSessions = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`${options.baseUrl}/session`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      setSessions(data)
      setLastUpdated(new Date())
      
      console.log('[useSessions] Fetched', data.length, 'sessions')
    } catch (err) {
      console.error('[useSessions] Failed to fetch sessions:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch sessions')
    } finally {
      setLoading(false)
    }
  }
  
  // Fetch messages for a specific session
  const fetchSessionMessages = async (sessionId: string): Promise<SessionMessage[]> => {
    try {
      const response = await fetch(`${options.baseUrl}/session/${sessionId}/message`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      return data
    } catch (err) {
      console.error('[useSessions] Failed to fetch session messages:', err)
      throw err
    }
  }
  
  // Fetch a complete session with messages
  const fetchSession = async (sessionId: string): Promise<Session> => {
    const sessionList = sessions()
    const sessionInfo = sessionList.find(s => s.id === sessionId)
    
    if (!sessionInfo) {
      throw new Error(`Session ${sessionId} not found`)
    }
    
    const messages = await fetchSessionMessages(sessionId)
    
    return {
      ...sessionInfo,
      messages,
    }
  }
  
  // Extract agent ID from a message
  const extractAgentFromMessage = (message: SessionMessage): string | null => {
    return message.info?.agent || null
  }
  
  // Extract text content from message parts
  const extractTextFromMessage = (message: SessionMessage): string => {
    const textParts = message.parts.filter(p => p.type === 'text')
    return textParts.map(p => p.text).join('')
  }
  
  // Auto-fetch on mount and set up polling
  if (enabled) {
    fetchSessions()
    
    const setupPolling = () => {
      pollTimeout = setTimeout(() => {
        fetchSessions()
        setupPolling()
      }, pollInterval)
    }
    
    setupPolling()
  }
  
  // Cleanup on unmount
  onCleanup(() => {
    if (pollTimeout) {
      clearTimeout(pollTimeout)
    }
  })
  
  // Manual refresh
  const refresh = () => {
    fetchSessions()
  }
  
  return {
    sessions,
    loading,
    error,
    lastUpdated,
    fetchSession,
    fetchSessionMessages,
    extractAgentFromMessage,
    extractTextFromMessage,
    refresh,
  }
}
