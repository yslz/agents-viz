import { Component, For, createSignal, Show, createMemo } from 'solid-js'
import type { ProjectAgent } from '../data/session-types'
import type { Agent } from '../data/agents-generated'

interface AgentWithChildren extends ProjectAgent {
  children: AgentWithChildren[]
}

interface AgentTreeNode {
  agent: ProjectAgent
  level: number
  hasLine: boolean
}

// Persist expanded state across re-renders
const expandedProjects = new Set<string>()

export interface ProjectCardProps {
  projectPath: string
  projectName: string
  agents: ProjectAgent[]
  sessionCount: number
  lastUpdated: number
  onAgentClick: (agentId: string, event: MouseEvent) => void
  onProjectClick?: () => void
}

export const ProjectCard: Component<ProjectCardProps> = (props) => {
  const [renderTick, setRenderTick] = createSignal(0)
  
  const isExpanded = () => {
    renderTick() // Subscribe to re-renders
    return expandedProjects.has(props.projectPath)
  }
  
  const toggleExpand = () => {
    if (expandedProjects.has(props.projectPath)) {
      expandedProjects.delete(props.projectPath)
    } else {
      expandedProjects.add(props.projectPath)
    }
    setRenderTick(t => t + 1)
  }
  
  // Separate active and historical agents
  const activeAgents = () => props.agents.filter(a => a.status === 'active')
  const historicalAgents = () => props.agents.filter(a => a.status === 'historical')

  // Build tree structure with parent-child relationships
  const activeAgentTree = createMemo(() => {
    const agents = activeAgents()
    
    const agentMap = new Map<string, AgentWithChildren>()
    
    // First pass: create nodes for all agents
    agents.forEach(agent => {
      agentMap.set(agent.id, { ...agent, children: [] })
    })
    
    // Second pass: build relationships
    const rootAgents: AgentWithChildren[] = []
    const childIds = new Set<string>()
    
    agents.forEach(agent => {
      const node = agentMap.get(agent.id)!
      const parentAgents = agent.parentAgents || []
      
      if (parentAgents.length > 0) {
        parentAgents.forEach(parentId => {
          const parentNode = agentMap.get(parentId)
          if (parentNode) {
            // Don't create circular references or self-references
            if (parentNode.id !== node.id && !childIds.has(node.id)) {
              parentNode.children.push(node)
              childIds.add(node.id)
            }
          }
        })
      }
    })
    
    // Root agents are those not children of any other active agent
    agentMap.forEach((node, id) => {
      if (!childIds.has(id)) {
        rootAgents.push(node)
      }
    })
    
    return rootAgents
  })

  // Flatten tree with level info for rendering
  const flattenAgentTree = (nodes: AgentWithChildren[], level: number = 0): AgentTreeNode[] => {
    const result: AgentTreeNode[] = []
    nodes.forEach(node => {
      result.push({ agent: node, level, hasLine: level > 0 })
      if (node.children.length > 0) {
        result.push(...flattenAgentTree(node.children, level + 1))
      }
    })
    return result
  }
  
  // Format last updated time
  const formatLastUpdated = (timestamp: number) => {
    const now = Date.now()
    const diff = now - timestamp
    
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }
  
  const handleAgentClick = (agentId: string, event: MouseEvent) => {
    event.stopPropagation()
    props.onAgentClick(agentId, event)
  }
  
  return (
    <div 
      class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-shadow duration-200"
      onClick={props.onProjectClick}
    >
      {/* Project Header */}
      <div class="px-5 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-750">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
              📁
            </div>
            <div>
              <h3 class="text-lg font-bold text-gray-900 dark:text-white">
                {props.projectName}
              </h3>
              <p class="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
                {props.projectPath}
              </p>
            </div>
          </div>
          <div class="flex items-center gap-3" style="margin-right: 4px;">
            <div class="text-right">
              <p class="text-xs text-gray-500 dark:text-gray-400">
                {props.sessionCount} sessions
              </p>
              <p class="text-xs text-gray-400 dark:text-gray-500">
                Updated {formatLastUpdated(props.lastUpdated)}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Agents Section */}
      <div class="p-5">
        {/* Active Agents */}
        <Show when={activeAgents().length > 0}>
          <div class="mb-4">
            <div class="flex items-center gap-2 mb-3">
              <div class="flex items-center gap-1.5">
                <span class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <span class="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Active Agents
                </span>
              </div>
              <span class="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                {activeAgents().length}
              </span>
            </div>
            
            <div style={{ 'display': 'flex', 'flex-direction': 'column', 'gap': '5px' }}>
              <For each={activeAgentTree()}>
                {(rootAgent) => (
                  <div>
                    {/* Root agent */}
                    <button
                      class="group relative flex items-center gap-3 bg-white dark:bg-gray-700 border-2 rounded-lg hover:shadow-md transition-all duration-200 cursor-pointer text-left"
                      style={{
                        'border-color': rootAgent.color,
                        'background-color': `${rootAgent.color}10`,
                        'padding': '5px 8px',
                        'width': 'fit-content',
                        'min-width': '160px',
                      }}
                      onClick={(e) => handleAgentClick(rootAgent.id, e)}
                    >
                      <div
                        class="w-8 h-8 rounded-full flex items-center justify-center text-lg transition-transform group-hover:scale-110 shrink-0"
                        style={{
                          'background-color': rootAgent.color,
                          'border': `2px solid ${rootAgent.color}`,
                        }}
                      >
                        {rootAgent.emoji}
                      </div>
                      <div class="text-left min-w-0 flex-1">
                        <p class="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {rootAgent.name}
                        </p>
                        <p class="text-xs text-gray-500 dark:text-gray-400">
                          {rootAgent.messageCount || 0} msgs
                        </p>
                      </div>
                      <span class="absolute -top-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-700 rounded-full animate-ping"></span>
                    </button>
                    
                    {/* Child agents - indented below parent */}
                    <Show when={rootAgent.children.length > 0}>
                      <div class="border-l-2 border-gray-200 dark:border-gray-700" style={{ 'margin-top': '5px', 'padding-left': '25px', 'display': 'flex', 'flex-direction': 'column', 'gap': '5px' }}>
<For each={rootAgent.children}>
                           {(childAgent) => (
                             <button
                               class="group relative flex items-center gap-2.5 bg-white dark:bg-gray-700 border-2 rounded-lg hover:shadow-md transition-all duration-200 cursor-pointer text-left opacity-90 hover:opacity-100"
                               style={{
                                 'border-color': childAgent.color,
                                 'background-color': `${childAgent.color}08`,
                                 'padding': '5px 8px',
                                 'width': 'fit-content',
                                 'min-width': '140px',
                               }}
                               onClick={(e) => handleAgentClick(childAgent.id, e)}
                             >
                              <div
                                class="w-6 h-6 rounded-full flex items-center justify-center text-sm transition-transform group-hover:scale-110 shrink-0"
                                style={{
                                  'background-color': childAgent.color,
                                  'border': `2px solid ${childAgent.color}`,
                                }}
                              >
                                {childAgent.emoji}
                              </div>
                              <div class="text-left min-w-0 flex-1">
                                <p class="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">
                                  {childAgent.name}
                                </p>
                                <p class="text-[10px] text-gray-500 dark:text-gray-400">
                                  {childAgent.messageCount || 0} msgs
                                </p>
                              </div>
                            </button>
                          )}
                        </For>
                      </div>
                    </Show>
                  </div>
                )}
              </For>
            </div>
          </div>
        </Show>
        
        {/* Historical Agents */}
        <Show when={historicalAgents().length > 0}>
          <div>
            <button
              class="flex items-center gap-2 mb-3 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              onClick={toggleExpand}
            >
              <svg 
                class={`w-4 h-4 transition-transform duration-200 ${isExpanded() ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
              <span>Historical Agents</span>
              <span class="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                {historicalAgents().length}
              </span>
            </button>
            
            <Show when={isExpanded()}>
              <div class="space-y-1"> {/* Changed from flex flex-wrap gap-2 to space-y-1 for consistency */}
                <For each={historicalAgents()}>
                  {(agent) => (
                    <button
                      class="group flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-600 rounded-xl hover:shadow-md transition-all duration-200 cursor-pointer opacity-75 hover:opacity-100 w-full text-left"
                      onClick={(e) => handleAgentClick(agent.id, e)}
                    >
                      <div
                        class="w-8 h-8 rounded-full flex items-center justify-center text-lg grayscale group-hover:grayscale-0 transition-all"
                        style={{
                          'background-color': `${agent.color}40`,
                          'border': `2px solid ${agent.color}60`,
                        }}
                      >
                        {agent.emoji}
                      </div>
                      <div class="text-left min-w-0 flex-1">
                        <p class="text-xs font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap truncate">
                          {agent.name}
                        </p>
                        <p class="text-[10px] text-gray-500 dark:text-gray-400">
                          {agent.messageCount || 0} msgs
                        </p>
                      </div>
                    </button>
                  )}
                </For>
              </div>
            </Show>
          </div>
        </Show>
        
        {/* Empty State */}
        <Show when={props.agents.length === 0}>
          <div class="flex flex-col items-center justify-center py-8 text-gray-400 dark:text-gray-500">
            <span class="text-4xl mb-2 opacity-50">📭</span>
            <p class="text-sm">No conversations yet</p>
            <p class="text-xs mt-1 opacity-60">Start chatting in opencode TUI</p>
          </div>
        </Show>
      </div>
    </div>
  )
}
