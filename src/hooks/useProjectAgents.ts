import { createSignal, createMemo, createEffect, onCleanup } from 'solid-js'
import { useSessions } from './useSessions'
import type { Project, ProjectWithActivity, ProjectAgent, ProjectConversation } from '../data/session-types'
import type { Agent } from '../data/agents-generated'

export interface UseProjectAgentsOptions {
  baseUrl: string
  agents: Agent[]  // Static agent list
  pollInterval?: number
  enabled?: boolean
}

// Active threshold: 24 hours in milliseconds
const ACTIVE_THRESHOLD = 24 * 60 * 60 * 1000

export function useProjectAgents(options: UseProjectAgentsOptions) {
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
        }>()
        
        // Fetch messages for each session in the project
        for (const sessionId of project.sessions) {
          try {
            const messages = await sessions.fetchSessionMessages(sessionId)
            
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
                })
              }
              
              const activity = agentActivityMap.get(agentId)!
              // Count ALL messages for this agent
              activity.messageCount++
              activity.lastActive = Math.max(activity.lastActive, timestamp)
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
              
              // Check if conversation actually changed
              const prevConv = previousConversations.get(key)
              const hasChanged = !prevConv || 
                                 prevConv.messages.length !== sorted.length ||
                                 prevConv.messages[prevConv.messages.length - 1]?.messageId !== sorted[sorted.length - 1]?.messageId
              
              if (hasChanged) {
                hasChanges = true
                console.log('[useProjectAgents] Conversation updated for', agentId, 
                           'in', project.name, 
                           'messages:', sorted.length)
              }
              
              conversationsMap.set(key, {
                projectId: project.path,
                agentId,
                messages: sorted,
              })
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
          
          if (staticAgent) {
            const isActive = (now - activity.lastActive) < ACTIVE_THRESHOLD
            
            projectAgentsList.push({
              id: agentId,
              name: staticAgent.name,
              description: staticAgent.description,
              division: staticAgent.division,
              color: staticAgent.color,
              emoji: staticAgent.emoji,
              status: isActive ? 'active' : 'historical',
              lastActive: activity.lastActive,
              messageCount: activity.messageCount,
            })
          }
        })
        
        // Sort: active first, then by lastActive
        projectAgentsList.sort((a, b) => {
          if (a.status === 'active' && b.status !== 'active') return -1
          if (a.status !== 'active' && b.status === 'active') return 1
          return (b.lastActive || 0) - (a.lastActive || 0)
        })
        
        projectAgentsMap.set(project.path, projectAgentsList)
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
