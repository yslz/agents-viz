import { Component, createSignal, onMount, onCleanup, For } from 'solid-js'
import { AgentNode, type AgentNodeData } from './AgentNode'

export interface AgentGridProps {
  agents: AgentNodeData[]
  onAgentClick: (agent: AgentNodeData, position: { x: number, y: number }) => void
}

export const AgentGrid: Component<AgentGridProps> = (props) => {
  const [containerRef, setContainerRef] = createSignal<HTMLDivElement | null>(null)
  const [scale, setScale] = createSignal(1)
  const [position, setPosition] = createSignal({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = createSignal(false)
  const [dragStart, setDragStart] = createSignal({ x: 0, y: 0 })

  let container: HTMLDivElement | null = null

  onMount(() => {
    container = containerRef()
    if (!container) return

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
        const delta = e.deltaY > 0 ? -0.1 : 0.1
        setScale(prev => Math.min(Math.max(prev + delta, 0.3), 2))
      }
    }

    container.addEventListener('wheel', handleWheel, { passive: false })

    onCleanup(() => {
      container?.removeEventListener('wheel', handleWheel)
    })
  })

  const handleMouseDown = (e: MouseEvent) => {
    if ((e.target as HTMLElement).closest('.agent-node')) return
    setIsDragging(true)
    setDragStart({ x: e.clientX - position().x, y: e.clientY - position().y })
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging()) return
    e.preventDefault()
    setPosition({
      x: e.clientX - dragStart().x,
      y: e.clientY - dragStart().y,
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleAgentClick = (agent: AgentNodeData, e: MouseEvent) => {
    e.stopPropagation()
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const clickPosition = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    }
    props.onAgentClick(agent, clickPosition)
  }

  const primaryAgents = () => props.agents.filter(a => a.mode === 'primary')
  const commandAgents = () => props.agents.filter(a => a.mode === 'command')
  const subAgents = () => props.agents.filter(a => a.mode === 'subagent')

  const groupedSubAgents = () => {
    const groups: Record<string, typeof subAgents> = {}
    subAgents().forEach(agent => {
      if (!groups[agent.division]) {
        groups[agent.division] = []
      }
      groups[agent.division].push(agent)
    })
    return groups
  }

  const getDivisionRows = () => {
    const groups = groupedSubAgents()
    const entries = Object.entries(groups)
    
    const engineering = entries.find(([name]) => name === 'Engineering')
    const others = entries.filter(([name]) => name !== 'Engineering')
    
    const rows: Array<Array<[string, typeof subAgents]>> = []
    
    if (engineering) {
      rows.push([engineering])
    }
    
    const marketing = others.find(([name]) => name === 'Marketing')
    const product = others.find(([name]) => name === 'Product')
    if (marketing || product) {
      const row = []
      if (marketing) row.push(marketing)
      if (product) row.push(product)
      rows.push(row)
    }
    
    const design = others.find(([name]) => name === 'Design')
    const sales = others.find(([name]) => name === 'Sales')
    if (design || sales) {
      const row = []
      if (design) row.push(design)
      if (sales) row.push(sales)
      rows.push(row)
    }
    
    const testing = others.find(([name]) => name === 'Testing')
    const support = others.find(([name]) => name === 'Support')
    if (testing || support) {
      const row = []
      if (testing) row.push(testing)
      if (support) row.push(support)
      rows.push(row)
    }
    
    const academic = others.find(([name]) => name === 'Academic')
    const gameDev = others.find(([name]) => name === 'Game Development')
    const spatial = others.find(([name]) => name === 'Spatial Computing')
    const remaining = others.filter(([name]) => 
      !['Marketing', 'Product', 'Design', 'Sales', 'Testing', 'Support', 
        'Academic', 'Game Development', 'Spatial Computing', 'Engineering'].includes(name)
    )
    
    const smallGroupRow = []
    if (academic) smallGroupRow.push(academic)
    if (gameDev) smallGroupRow.push(gameDev)
    if (spatial) smallGroupRow.push(spatial)
    remaining.forEach(item => smallGroupRow.push(item))
    
    if (smallGroupRow.length > 0) {
      rows.push(smallGroupRow)
    }
    
    return rows
  }

  const getGridCols = (count: number) => {
    if (count >= 50) return 'grid-cols-10'
    if (count === 1) return 'grid-cols-1'
    if (count === 2) return 'grid-cols-2'
    if (count <= 5) return 'grid-cols-5'
    return 'grid-cols-5'
  }

  const getDivisionWidth = (division: string, count: number) => {
    if (division === 'Engineering') return 'w-[1500px]'
    if (['Marketing', 'Product', 'Design', 'Sales', 'Testing', 'Support'].includes(division)) {
      return 'w-[700px]'
    }
    return 'w-[300px]'
  }

  const dynamicPadding = () => {
    return Math.max(100, Math.min(500, 200 * scale()))
  }

  return (
    <div
      ref={setContainerRef}
      class="w-full h-full overflow-auto cursor-grab active:cursor-grabbing bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div
        class="absolute transition-transform duration-75 ease-out"
        style={{
          transform: `translate(${position().x}px, ${position().y}px) scale(${scale()})`,
          'transform-origin': '0 0',
          padding: `${dynamicPadding()}px`,
          'min-width': '100%',
          'min-height': '100%',
        }}
      >
        {/* Primary Agents Section */}
        {primaryAgents().length > 0 && (
          <div class="flex justify-center gap-8 mb-12 p-6 bg-white/60 dark:bg-gray-800/60 rounded-2xl backdrop-blur-sm shadow-lg mx-auto max-w-5xl border border-white/20 dark:border-gray-700/30">
            <For each={primaryAgents()}>
              {(agent) => (
                <div 
                  class="agent-node"
                  onClick={(e) => handleAgentClick(agent, e)}
                >
                  <AgentNode agent={agent} onClick={() => {}} />
                </div>
              )}
            </For>
          </div>
        )}

        {/* Command Agents Section */}
        {commandAgents().length > 0 && (
          <div class="flex justify-center gap-6 mb-10 p-4 bg-white/40 dark:bg-gray-800/40 rounded-xl mx-auto max-w-3xl border border-white/20 dark:border-gray-700/30">
            <For each={commandAgents()}>
              {(agent) => (
                <div 
                  class="agent-node"
                  onClick={(e) => handleAgentClick(agent, e)}
                >
                  <AgentNode agent={agent} onClick={() => {}} />
                </div>
              )}
            </For>
          </div>
        )}

        {/* Subagents - Custom arranged rows */}
        <div class="flex flex-col gap-6 items-start">
          {getDivisionRows().map((row) => (
            <div class="flex gap-6 justify-center w-full flex-nowrap">
              <For each={row}>
                {([division, agents]) => {
                  const cols = getGridCols(agents.length)
                  const widthClass = getDivisionWidth(division, agents.length)
                  return (
                    <div class={`${widthClass} bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow flex-shrink-0`}>
                      <h3 class="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4 pb-3 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
                        <div class="w-1 h-6 rounded-full" style={{ 'background-color': getDivisionColor(division) }} />
                        {division}
                        <span class="text-sm font-normal text-gray-500 dark:text-gray-400 ml-auto">({agents.length})</span>
                      </h3>
                      <div class={`grid ${cols} gap-2`}>
                        <For each={agents}>
                          {(agent) => (
                            <div 
                              class="agent-node hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg p-1.5 -m-1.5 transition-colors"
                              onClick={(e) => handleAgentClick(agent, e)}
                            >
                              <AgentNode agent={agent} onClick={() => {}} />
                            </div>
                          )}
                        </For>
                      </div>
                    </div>
                  )
                }}
              </For>
            </div>
          ))}
        </div>
      </div>

      {/* Zoom Controls */}
      <div class="absolute bottom-4 right-4 flex flex-col gap-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl p-2 border border-gray-200 dark:border-gray-700 z-10">
        <button
          class="w-9 h-9 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-lg font-bold text-gray-700 dark:text-gray-300"
          onClick={() => setScale(prev => Math.min(prev + 0.1, 2))}
        >
          +
        </button>
        <div class="text-xs text-center text-gray-600 dark:text-gray-400 py-1.5 font-medium">
          {Math.round(scale() * 100)}%
        </div>
        <button
          class="w-9 h-9 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-lg font-bold text-gray-700 dark:text-gray-300"
          onClick={() => setScale(prev => Math.max(prev - 0.1, 0.3))}
        >
          −
        </button>
        <button
          class="w-9 h-9 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors mt-1 text-gray-600 dark:text-gray-400"
          onClick={() => {
            setScale(1)
            setPosition({ x: 0, y: 0 })
          }}
          title="Reset view"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* Help Tooltip */}
      <div class="absolute top-4 left-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-lg p-3 border border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-400 z-10">
        <div class="flex items-center gap-4">
          <span class="flex items-center gap-1.5">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
            </svg>
            Drag background to pan
          </span>
          <span class="flex items-center gap-1.5">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
            </svg>
            Ctrl + Scroll to zoom
          </span>
          <span class="flex items-center gap-1.5">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
            </svg>
            Click agent to chat
          </span>
        </div>
      </div>
    </div>
  )
}

function getDivisionColor(division: string): string {
  const colors: Record<string, string> = {
    'Engineering': '#10B981',
    'Marketing': '#F59E0B',
    'Sales': '#EF4444',
    'Design': '#8B5CF6',
    'Product': '#EC4899',
    'Support': '#6B7280',
    'Testing': '#14B8A6',
    'Specialized': '#6366F1',
    'Game Development': '#F97316',
    'Academic': '#84CC16',
    'Spatial Computing': '#A855F7',
    'Primary': '#3B82F6',
    'Commands': '#6366F1',
  }
  return colors[division] || '#9CA3AF'
}
