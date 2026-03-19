import { createSignal, createMemo, createEffect, onCleanup } from 'solid-js'
import { useSessions } from './useSessions'
import type { Project, ProjectWithActivity, ProjectAgent, ProjectConversation } from '../data/session-types'
import type { Agent } from '../data/agents-generated'

export interface UseProjectAgentsOptions {
  baseUrl: () => string  // Changed to accessor function for reactivity
  agents: Agent[]  // Static agent list
  pollInterval?: number
  enabled?: boolean
}

// Active threshold: 24 hours in milliseconds
const ACTIVE_THRESHOLD = 24 * 60 * 60 * 1000

export function useProjectAgents(options: UseProjectAgentsOptions) {
  console.log('[useProjectAgents] Hook initialized')
  const sessions = useSessions({
    baseUrl: options.baseUrl,
    pollInterval: options.pollInterval,
    enabled: options.enabled,
  })
  
  const [projects, setProjects] = createSignal<ProjectWithActivity[]>([])
  const [projectAgents, setProjectAgents] = createSignal<Map<string, ProjectAgent[]>>(new Map())
  const [conversations, setConversations] = createSignal<Map<string, ProjectConversation>>(new Map())
  const [loading, setLoading] = createSignal(false)
  
  // Process sessions into projects
  const processSessions = createMemo(() => {
    const sessionList = sessions.sessions()
    const now = Date.now()
    
    // Group sessions by directory (project)
    const projectMap = new Map<string, Project>()
    
    sessionList.forEach(session => {
      const projectPath = session.directory
      const projectName = projectPath.split('/').pop() || projectPath
      
      if (!projectMap.has(projectPath)) {
        projectMap.set(projectPath, {
          path: projectPath,
          name: projectName,
          sessions: [],
          agents: [],
          lastUpdated: session.time.updated,
          sessionCount: 0,
        })
      }
      
      const project = projectMap.get(projectPath)!
      project.sessions.push(session.id)
      project.sessionCount++
      project.lastUpdated = Math.max(project.lastUpdated, session.time.updated)
    })
    
    return Array.from(projectMap.values())
  })
  
  // Store previous conversations to prevent unnecessary updates
  let previousConversations = new Map<string, ProjectConversation>()
  
  // Helper: check if two conversation messages are equal
  const messagesEqual = (
    a: Array<{role: string; content: string; messageId: string}>,
    b: Array<{role: string; content: string; messageId: string}>
  ): boolean => {
    if (a.length !== b.length) return false
    for (let i = 0; i < a.length; i++) {
      if (a[i].messageId !== b[i].messageId || a[i].content !== b[i].content) {
        return false
      }
    }
    return true
  }
  
  // Fetch messages and extract agent activity
  const updateProjectAgents = async () => {
    setLoading(true)
    
    try {
      const projectList = processSessions()
      const projectAgentsMap = new Map<string, ProjectAgent[]>()
      const conversationsMap = new Map<string, ProjectConversation>()
      let hasChanges = false
      
      // Process each project
      for (const project of projectList) {
        const agentActivityMap = new Map<string, {
          sessionCount: number
          messageCount: number
          lastActive: number
          parentAgents: Set<string>
        }>()
        
        // Fetch messages for each session in the project
        for (const sessionId of project.sessions) {
          try {
            const messages = await sessions.fetchSessionMessages(sessionId)
            
            // Build a map of messageID -> agentID for looking up parent agents
            const messageToAgent = new Map<string, string>()
            messages.forEach(message => {
              const agentId = sessions.extractAgentFromMessage(message)
              if (agentId && message.info.id) {
                messageToAgent.set(message.info.id, agentId)
              }
            })
            
            // Extract agent from each message - count ALL messages (user + assistant)
            messages.forEach(message => {
              const agentId = sessions.extractAgentFromMessage(message)
              if (!agentId) return
              
              const timestamp = message.info.time.created
              
              if (!agentActivityMap.has(agentId)) {
                agentActivityMap.set(agentId, {
                  sessionCount: 0,
                  messageCount: 0,
                  lastActive: 0,
                  parentAgents: new Set<string>(),
                })
              }
              
              const activity = agentActivityMap.get(agentId)!
              // Count ALL messages for this agent
              activity.messageCount++
              activity.lastActive = Math.max(activity.lastActive, timestamp)
              
              // Track parent agent from tool calls (e.g., task tool with subagent_type)
              const parts = message.parts || []
              parts.forEach(part => {
                if (part.tool === 'task') {
                  const state = part.state as any
                  const input = state?.input || {}
                  const subagentType = input?.subagent_type
                  if (subagentType && subagentType !== agentId) {
                    // This agent called a sub-agent
                    if (!agentActivityMap.has(subagentType)) {
                      agentActivityMap.set(subagentType, {
                        sessionCount: 0,
                        messageCount: 0,
                        lastActive: 0,
                        parentAgents: new Set<string>(),
                      })
                    }
                    const subActivity = agentActivityMap.get(subagentType)!
                    subActivity.parentAgents.add(agentId)
                    console.log('[useProjectAgents] Task call found:', agentId, '->', subagentType, 'parentAgents now:', Array.from(subActivity.parentAgents))
                  }
                }
              })
            })
            
            // Count unique sessions per agent
            const sessionAgents = new Set<string>()
            messages.forEach(message => {
              const agentId = sessions.extractAgentFromMessage(message)
              if (agentId) {
                sessionAgents.add(agentId)
              }
            })
            
            sessionAgents.forEach(agentId => {
              const activity = agentActivityMap.get(agentId)!
              activity.sessionCount++
            })
            
            // Build conversations for each agent
            const agentMessages = new Map<string, Array<{
              role: 'user' | 'assistant'
              content: string
              timestamp: Date
              sessionId: string
              messageId: string
            }>>()
            
            // Track sub-agent content from task calls
            const subAgentMessages = new Map<string, Array<{
              role: 'user' | 'assistant'
              content: string
              timestamp: Date
              sessionId: string
              messageId: string
            }>>()
            
            messages.forEach(message => {
              const agentId = sessions.extractAgentFromMessage(message)
              const content = sessions.extractTextFromMessage(message)
              const role = message.info.role
              
              if (!agentId || !content.trim()) return
              
              if (!agentMessages.has(agentId)) {
                agentMessages.set(agentId, [])
              }
              
              agentMessages.get(agentId)!.push({
                role: role === 'assistant' ? 'assistant' : 'user',
                content,
                timestamp: new Date(message.info.time.created),
                sessionId,
                messageId: message.info.id,
              })
            })
            
            // Extract sub-agent session IDs from task calls and fetch their messages
            const subAgentSessionIds: Array<{subagentType: string, sessionId: string}> = []
            messages.forEach(message => {
              const parts = message.parts || []
              parts.forEach(part => {
                if (part.tool === 'task') {
                  const state = part.state as any
                  const input = state?.input || {}
                  const subagentType = input?.subagent_type
                  const subSessionId = state?.metadata?.sessionId
                  if (subagentType && subSessionId) {
                    subAgentSessionIds.push({ subagentType, sessionId: subSessionId })
                  }
                }
              })
            })
            
            // Fetch messages from sub-agent sessions
            for (const { subagentType, sessionId: subSessionId } of subAgentSessionIds) {
              try {
                const subMessages = await sessions.fetchSessionMessages(subSessionId)
                subMessages.forEach(subMsg => {
                  const subContent = sessions.extractTextFromMessage(subMsg)
                  const subRole = subMsg.info?.role
                  
                  if (!subContent.trim()) return
                  
                  // Update activity stats for sub-agent
                  if (!agentActivityMap.has(subagentType)) {
                    agentActivityMap.set(subagentType, {
                      sessionCount: 0,
                      messageCount: 0,
                      lastActive: 0,
                      parentAgents: new Set<string>(),
                    })
                  }
                  const activity = agentActivityMap.get(subagentType)!
                  activity.messageCount++
                  activity.lastActive = Math.max(activity.lastActive, subMsg.info.time.created)
                  
                  if (!subAgentMessages.has(subagentType)) {
                    subAgentMessages.set(subagentType, [])
                  }
                  
                  subAgentMessages.get(subagentType)!.push({
                    role: subRole === 'assistant' ? 'assistant' : 'user',
                    content: subContent,
                    timestamp: new Date(subMsg.info.time.created),
                    sessionId: subSessionId,
                    messageId: subMsg.info.id,
                  })
                })
              } catch (e) {
                console.error('[useProjectAgents] Failed to fetch sub-agent session:', subSessionId, e)
              }
            }
            
            // Merge sub-agent messages into agentMessages
            subAgentMessages.forEach((msgs, subAgentId) => {
              if (!agentMessages.has(subAgentId)) {
                agentMessages.set(subAgentId, msgs)
              } else {
                // Merge with existing messages
                const existing = agentMessages.get(subAgentId)!
                agentMessages.set(subAgentId, [...existing, ...msgs])
              }
            })
            
            // Store conversations - MERGE with existing conversations for same agent
            agentMessages.forEach((msgs, agentId) => {
              const key = `${project.path}::${agentId}`
              
              // Get existing conversation if any
              const existing = conversationsMap.get(key)
              const mergedMessages = existing 
                ? [...existing.messages, ...msgs]
                : msgs
              
              // Sort and deduplicate by messageId
              const uniqueMessages = mergedMessages.filter(
                (msg, idx, arr) => arr.findIndex(m => m.messageId === msg.messageId) === idx
              )
              const sorted = uniqueMessages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
              
              // Check if conversation actually changed (compare message IDs and content)
              const prevConv = previousConversations.get(key)
              const hasChanged = !prevConv || !messagesEqual(
                prevConv.messages.map(m => ({ role: m.role, content: m.content, messageId: m.messageId })),
                sorted.map(m => ({ role: m.role, content: m.content, messageId: m.messageId }))
              )
              
              if (hasChanged) {
                hasChanges = true
                console.log('[useProjectAgents] Conversation updated for', agentId, 
                           'in', project.name, 
                           'messages:', sorted.length)
                conversationsMap.set(key, {
                  projectId: project.path,
                  agentId,
                  messages: sorted,
                })
              } else {
                // Reuse previous conversation object to prevent unnecessary re-renders
                conversationsMap.set(key, prevConv)
              }
            })
            
          } catch (err) {
            console.error('[useProjectAgents] Failed to fetch messages for session:', sessionId, err)
          }
        }
        
        // Convert to ProjectAgent array
        const now = Date.now()
        const projectAgentsList: ProjectAgent[] = []
        
        agentActivityMap.forEach((activity, agentId) => {
          // Find static agent definition
          const staticAgent = options.agents.find(a => a.id === agentId)
          
          // Get agent info - use static data or create fallback
          const name = staticAgent?.name || agentId
          const description = staticAgent?.description || ''
          const division = staticAgent?.division || 'Unknown'
          const color = staticAgent?.color || '#6B7280'
          const emoji = staticAgent?.emoji || '🤖'
          
          const isActive = (now - activity.lastActive) < ACTIVE_THRESHOLD
          
          projectAgentsList.push({
            id: agentId,
            name,
            description,
            division,
            color,
            emoji,
            status: isActive ? 'active' : 'historical',
            lastActive: activity.lastActive,
            messageCount: activity.messageCount,
            parentAgents: Array.from(activity.parentAgents),
          })
          

        })
        
        // Deduplicate agents by ID - this handles cases where the same agent ID appears
        // in both primary and subAgents (like 'explore' agent)
        const uniqueAgents = new Set<string>()
        const deduplicatedAgents: ProjectAgent[] = []
        
        projectAgentsList.forEach(agent => {
          if (!uniqueAgents.has(agent.id)) {
            uniqueAgents.add(agent.id)
            deduplicatedAgents.push(agent)
          }
        })
        
        // Sort: active first, then by lastActive
        deduplicatedAgents.sort((a, b) => {
          if (a.status === 'active' && b.status !== 'active') return -1
          if (a.status !== 'active' && b.status === 'active') return 1
          return (b.lastActive || 0) - (a.lastActive || 0)
        })
        
        projectAgentsMap.set(project.path, deduplicatedAgents)
      }
      
      // Only update state if conversations actually changed
      if (hasChanges) {
        console.log('[useProjectAgents] Updating state, conversations changed')
        
        setProjects(projectList.map(project => ({
          ...project,
          agentActivity: Array.from(
            project.agents.map(agentId => {
              const activity = Array.from(
                projectAgentsMap.get(project.path) || []
              ).find(a => a.id === agentId)
              
              return {
                agentId,
                sessionCount: 0,
                messageCount: activity?.messageCount || 0,
                lastActive: activity?.lastActive || 0,
                isActive: activity?.status === 'active',
              }
            })
          ),
        })))
        
        setProjectAgents(projectAgentsMap)
        setConversations(conversationsMap)
      } else {
        console.log('[useProjectAgents] No changes, skipping state update')
      }
      
      // Update previous conversations reference
      previousConversations = conversationsMap
      
      console.log('[useProjectAgents] Processed', projectList.length, 'projects')
    } catch (err) {
      console.error('[useProjectAgents] Error processing sessions:', err)
    } finally {
      setLoading(false)
    }
  }
  
  // Update project agents when sessions change
  createEffect(() => {
    if (sessions.sessions().length > 0) {
      updateProjectAgents()
    }
  })
  
  // Get agents for a specific project
  const getProjectAgents = (projectPath: string): ProjectAgent[] => {
    return projectAgents().get(projectPath) || []
  }
  
  // Get conversation for a specific project + agent
  const getConversation = (projectPath: string, agentId: string): ProjectConversation | null => {
    const key = `${projectPath}::${agentId}`
    return conversations().get(key) || null
  }
  
  // Get all projects
  const getProjects = (): ProjectWithActivity[] => {
    return projects()
  }
  
  // Check if an agent is active (has recent messages)
  const isAgentActive = (agentId: string, projectPath?: string): boolean => {
    const now = Date.now()
    
    if (projectPath) {
      const agents = projectAgents().get(projectPath) || []
      const agent = agents.find(a => a.id === agentId)
      return agent?.status === 'active'
    }
    
    // Check across all projects
    for (const agents of projectAgents().values()) {
      const agent = agents.find(a => a.id === agentId)
      if (agent?.status === 'active') return true
    }
    
    return false
  }
  
  return {
    projects,
    projectAgents,
    conversations,
    loading,
    getProjectAgents,
    getConversation,
    getProjects,
    isAgentActive,
    refresh: sessions.refresh,
  }
}
