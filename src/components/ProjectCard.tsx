import { Component, For, createSignal, Show } from 'solid-js'
import type { ProjectAgent } from '../data/session-types'
import type { Agent } from '../data/agents-generated'

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
  const [isExpanded, setIsExpanded] = createSignal(false)
  
  // Separate active and historical agents
  const activeAgents = () => props.agents.filter(a => a.status === 'active')
  const historicalAgents = () => props.agents.filter(a => a.status === 'historical')
  
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
  
  const toggleExpand = () => {
    setIsExpanded(!isExpanded())
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
          <div class="flex items-center gap-3">
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
            
            <div class="flex flex-wrap gap-2">
              <For each={activeAgents()}>
                {(agent) => (
                  <button
                    class="group relative flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-700 border-2 rounded-xl hover:shadow-md transition-all duration-200 cursor-pointer"
                    style={{
                      'border-color': agent.color,
                      'background-color': `${agent.color}10`,
                    }}
                    onClick={(e) => handleAgentClick(agent.id, e)}
                  >
                    <div
                      class="w-8 h-8 rounded-full flex items-center justify-center text-lg transition-transform group-hover:scale-110"
                      style={{
                        'background-color': agent.color,
                        'border': `2px solid ${agent.color}`,
                      }}
                    >
                      {agent.emoji}
                    </div>
                    <div class="text-left">
                      <p class="text-xs font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                        {agent.name}
                      </p>
                      <p class="text-[10px] text-gray-500 dark:text-gray-400">
                        {agent.messageCount || 0} msgs
                      </p>
                    </div>
                    {/* Activity indicator */}
                    <span class="absolute -top-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-700 rounded-full animate-ping"></span>
                  </button>
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
              <div class="flex flex-wrap gap-2 pl-6">
                <For each={historicalAgents()}>
                  {(agent) => (
                    <button
                      class="group flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-600 rounded-xl hover:shadow-md transition-all duration-200 cursor-pointer opacity-75 hover:opacity-100"
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
                      <div class="text-left">
                        <p class="text-xs font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
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
