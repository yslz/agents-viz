import { Component, For, createSignal, createMemo, Index, Show } from 'solid-js'
import type { Agent } from '../data/agents-generated'
import { AgentInfoModal } from './AgentInfoModal'

export interface AgentDirectoryProps {
  agents: Agent[]
  divisions: string[]
  projectAgents?: Map<string, Agent[]>
  selectedProject?: string | null
  onSelectAgent?: (agentId: string) => void
}

export const AgentDirectory: Component<AgentDirectoryProps> = (props) => {
  // Modal state for showing agent info
  const [selectedAgent, setSelectedAgent] = createSignal<Agent | null>(null)

  // Division display config with icons and descriptions
  const divisionConfig: Record<string, { icon: string; tagline: string }> = {
    'Primary': { icon: '⭐', tagline: 'Core agents' },
    'Commands': { icon: '⚡', tagline: 'Quick commands' },
    'Engineering': { icon: '💻', tagline: 'Building the future' },
    'Design': { icon: '🎨', tagline: 'Beautiful, usable, delightful' },
    'Paid Media': { icon: '💰', tagline: 'Turning spend into outcomes' },
    'Sales': { icon: '💼', tagline: 'Pipeline into revenue' },
    'Marketing': { icon: '📢', tagline: 'Growing your audience' },
    'Product': { icon: '📊', tagline: 'Building the right thing' },
    'Project Management': { icon: '🎬', tagline: 'Trains on time' },
    'Testing': { icon: '🧪', tagline: 'Breaking things safely' },
    'Support': { icon: '🛟', tagline: 'The backbone' },
    'Spatial Computing': { icon: '🥽', tagline: 'The immersive future' },
    'Specialized': { icon: '🎯', tagline: 'Unique specialists' },
    'Game Development': { icon: '🎮', tagline: 'Building worlds' },
    'Academic': { icon: '📚', tagline: 'Scholarly rigor' },
  }
  
  // Group agents by division
  const agentsByDivision = createMemo(() => {
    const grouped: Record<string, Agent[]> = {}
    
    props.agents.forEach(agent => {
      if (!grouped[agent.division]) {
        grouped[agent.division] = []
      }
      grouped[agent.division].push(agent)
    })
    
    // Sort divisions by README order, Primary and Commands first
    const divisionOrder = [
      'Primary',
      'Commands',
      'Engineering',
      'Design',
      'Paid Media',
      'Sales',
      'Marketing',
      'Product',
      'Project Management',
      'Testing',
      'Support',
      'Spatial Computing',
      'Specialized',
      'Game Development',
      'Academic',
    ]
    
    const sortedDivisions = Object.keys(grouped).sort((a, b) => {
      const aIndex = divisionOrder.indexOf(a)
      const bIndex = divisionOrder.indexOf(b)
      if (aIndex === -1 && bIndex === -1) return a.localeCompare(b)
      if (aIndex === -1) return 1
      if (bIndex === -1) return -1
      return aIndex - bIndex
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
    <div class="py-4" style={{ 'padding-left': '5px', 'padding-right': '5px' }}>
      <h3 class="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center justify-between">
        <span>All Agents</span>
        <span class="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded-full">
          {props.agents.length}
        </span>
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
            {divisionConfig[division]?.icon || ''} {division}
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
                          type="button"
                          class="w-full flex items-center gap-2 px-2 py-1 rounded-lg text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          onClick={() => props.onSelectAgent?.(agent().id)}
                          onDblClick={() => setSelectedAgent(agent())}
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

      <AgentInfoModal 
        agent={selectedAgent()} 
        onClose={() => setSelectedAgent(null)} 
      />
    </div>
  )
}
