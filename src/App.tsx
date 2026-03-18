import { Component, createSignal, createEffect, onCleanup } from 'solid-js'
import { AgentGrid } from './components/AgentGrid'
import { DivisionLegend } from './components/DivisionLegend'
import { SearchBar } from './components/SearchBar'
import { ChatDialog } from './components/ChatDialog'
import { ServerConfig } from './components/ServerConfig'
import { agents as initialAgents, divisions as initialDivisions } from './data/agents'

const App: Component = () => {
  const [agents, setAgents] = createSignal(initialAgents)
  const [selectedAgent, setSelectedAgent] = createSignal<typeof initialAgents[0] | null>(null)
  const [clickPosition, setClickPosition] = createSignal<{ x: number, y: number } | undefined>(undefined)
  const [searchQuery, setSearchQuery] = createSignal('')
  const [selectedDivision, setSelectedDivision] = createSignal<string | null>(null)
  const [sidebarWidth, setSidebarWidth] = createSignal(240)
  const [isResizing, setIsResizing] = createSignal(false)
  const [serverUrl, setServerUrl] = createSignal('http://localhost:36059')
  const [showServerConfig, setShowServerConfig] = createSignal(false)

  const filteredAgents = () => {
    let result = agents()
    
    if (searchQuery()) {
      const query = searchQuery().toLowerCase()
      result = result.filter(agent => 
        agent.name.toLowerCase().includes(query) ||
        agent.description.toLowerCase().includes(query)
      )
    }
    
    if (selectedDivision()) {
      result = result.filter(agent => agent.division === selectedDivision())
    }
    
    return result
  }

  const handleAgentClick = (agent: typeof initialAgents[0], position: { x: number, y: number }) => {
    setSelectedAgent(agent)
    setClickPosition(position)
  }

  const handleCloseDialog = () => {
    setSelectedAgent(null)
    setClickPosition(undefined)
  }

  // Resize handler
  const startResize = (e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsResizing(true)
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing()) return
    e.preventDefault()
    const newWidth = Math.max(180, Math.min(400, e.clientX))
    setSidebarWidth(newWidth)
  }

  const handleMouseUp = () => {
    setIsResizing(false)
  }

  // Global mouse event listeners for resize
  createEffect(() => {
    if (isResizing()) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      
      onCleanup(() => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      })
    }
  })

  return (
    <div class="w-full h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header class="h-16 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-6 flex items-center justify-between shrink-0 shadow-sm">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
            A
          </div>
          <h1 class="text-xl font-bold text-gray-900 dark:text-white">Agents Visualization</h1>
          <span class="text-sm text-gray-500 dark:text-gray-400 ml-2">
            {filteredAgents().length} agents
          </span>
        </div>
        <div class="flex items-center gap-4">
          <button
            class="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-gray-700 dark:text-gray-300 transition-colors flex items-center gap-2"
            onClick={() => setShowServerConfig(true)}
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M12 5l7 7-7 7" />
            </svg>
            Server
          </button>
          <SearchBar 
            value={searchQuery()} 
            onChange={setSearchQuery}
            placeholder="Search agents..."
          />
        </div>
      </header>

      {/* Main Content */}
      <div class="flex-1 flex overflow-hidden relative">
        {/* Division Legend Sidebar */}
        <aside 
          class="border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-y-auto shrink-0 shadow-sm"
          style={{ width: `${sidebarWidth()}px` }}
        >
          <DivisionLegend
            divisions={initialDivisions}
            agents={agents()}
            selectedDivision={selectedDivision()}
            onSelectDivision={setSelectedDivision}
          />
        </aside>

        {/* Resize Handle */}
        <div
          class="w-1 hover:w-1.5 bg-gray-300 dark:bg-gray-600 hover:bg-blue-500 cursor-col-resize transition-all shrink-0 z-20"
          onMouseDown={startResize}
          style={{ width: isResizing() ? '4px' : '1px' }}
        />

        {/* Agent Grid Canvas */}
        <main class="flex-1 overflow-hidden relative min-w-0">
          <AgentGrid
            agents={filteredAgents()}
            onAgentClick={handleAgentClick}
          />
        </main>
      </div>

      {/* Chat Dialog */}
      {selectedAgent() && (
        <ChatDialog
          agent={selectedAgent()!}
          onClose={handleCloseDialog}
          initialPosition={clickPosition()}
          serverUrl={serverUrl()}
          mockMode={false}  // Use real opencode server
        />
      )}

      {/* Server Config Dialog */}
      {showServerConfig() && (
        <ServerConfig
          serverUrl={serverUrl()}
          onServerUrlChange={setServerUrl}
          onClose={() => setShowServerConfig(false)}
        />
      )}
    </div>
  )
}

export default App
