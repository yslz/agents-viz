import { Component, For, createSignal, createMemo, Index } from 'solid-js'
import type { Agent } from '../data/agents-generated'

export interface AgentDirectoryProps {
  agents: Agent[]
  divisions: string[]
  projectAgents?: Map<string, Agent[]>
  selectedProject?: string | null
  onSelectAgent?: (agentId: string) => void
}

export const AgentDirectory: Component<AgentDirectoryProps> = (props) => {
  // Group agents by division
  const agentsByDivision = createMemo(() => {
    const grouped: Record<string, Agent[]> = {}
    
    props.agents.forEach(agent => {
      if (!grouped[agent.division]) {
        grouped[agent.division] = []
      }
      grouped[agent.division].push(agent)
    })
    
    // Sort divisions alphabetically, but put Primary and Commands first
    const sortedDivisions = Object.keys(grouped).sort((a, b) => {
      if (a === 'Primary') return -1
      if (b === 'Primary') return 1
      if (a === 'Commands') return -1
      if (b === 'Commands') return 1
      return a.localeCompare(b)
    })
    
    return {
      grouped,
      sortedDivisions,
    }
  })
  
  // Track expanded divisions
  const [expandedState, setExpandedState] = createSignal<Record<string, boolean>>({
    'Primary': true,
    'Commands': true,
  })
  
  const toggleDivision = (division: string) => {
    setExpandedState(prev => {
      // Ensure division exists in state before toggling
      const currentState = prev[division] ?? false;
      const newState = { ...prev, [division]: !currentState };
      console.log('[AgentDirectory] Toggled', division, '->', newState[division])
      return newState;
    });
  }
  
  const isExpanded = (division: string) => {
    return expandedState()[division] ?? false;
  }
  
  // Create division list once
  const divisionList = createMemo(() => {
    const { sortedDivisions, grouped } = agentsByDivision()
    return sortedDivisions.map(division => ({
      division,
      agents: grouped[division],
    }))
  })
  
  return (
    <div class="p-4">
      <h3 class="text-sm font-bold text-gray-900 dark:text-white mb-3">
        All Agents
      </h3>
      <div class="space-y-1">
        <Index each={divisionList()}>
          {(item) => {
            const division = item().division
            const divisionAgents = item().agents
            const expanded = () => expandedState()[division] ?? (division === 'Primary' || division === 'Commands')
            
            return (
              <div>
                {/* Division Header */}
                <button
                  type="button"
                  class="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    console.log('[AgentDirectory] Click:', division)
                    toggleDivision(division)
                  }}
                >
                  <div class="flex items-center gap-2">
                    <svg 
                      class={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${expanded() ? 'rotate-90' : ''}`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                    <span class="text-gray-700 dark:text-gray-300 font-medium select-none">
                      {division}
                    </span>
                  </div>
                  <span class="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded-full select-none">
                    {divisionAgents.length}
                  </span>
                </button>
                
                {/* Agents List */}
                {expanded() && (
                  <div style="margin-left: 2rem" class="mt-1 space-y-0.5">
                    <Index each={divisionAgents}>
                      {(agent) => (
                        <button
                          class="w-full flex items-center gap-2 px-2 py-1 rounded-lg text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          onClick={() => props.onSelectAgent?.(agent().id)}
                          title={agent().description}
                        >
                          <span class="text-sm">{agent().emoji}</span>
                          <span class="truncate">{agent().name}</span>
                        </button>
                      )}
                    </Index>
                  </div>
                )}
              </div>
            )
          }}
        </Index>
      </div>
    </div>
  )
}
