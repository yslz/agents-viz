import { Component, createSignal, createEffect, onCleanup, Show, For } from 'solid-js'
import { ProjectCard } from './components/ProjectCard'
import { ChatDialog } from './components/ChatDialog'
import { ServerConfig } from './components/ServerConfig'
import { AgentDirectory } from './components/AgentDirectory'
import { agents as initialAgents, divisions as initialDivisions } from './data/agents'
import { useProjectAgents } from './hooks/useProjectAgents'
import type { ProjectAgent, ProjectWithActivity } from './data/session-types'
import type { Agent } from './data/agents-generated'

const App: Component = () => {
  const [selectedAgent, setSelectedAgent] = createSignal<{
    agent: Agent
    projectId: string
    position: { x: number, y: number }
    conversation: {  // Snapshot of conversation at open time
      projectId: string
      agentId: string
      messages: Array<{
        role: 'user' | 'assistant'
        content: string
        timestamp: Date
        sessionId: string
        messageId: string
      }>
    } | null
  } | null>(null)
  const [sidebarWidth, setSidebarWidth] = createSignal(240)
  const [isResizing, setIsResizing] = createSignal(false)
  const getStoredServerUrl = () => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('opencode-server-url')
      if (stored) return stored
    }
    return ''
  }
  const [serverUrl, setServerUrl] = createSignal(getStoredServerUrl())
  const [showServerConfig, setShowServerConfig] = createSignal(false)
  const [selectedDivision, setSelectedDivision] = createSignal<string | null>(null)
  
  // Use the project agents hook
  const projectAgents = useProjectAgents({
    baseUrl: serverUrl,  // Pass the accessor function directly
    agents: initialAgents,
    pollInterval: 5000,
    enabled: true,
  })
  
  // Get all projects
  const filteredProjects = () => projectAgents.getProjects()
  
  // Get agent by ID from static list
  const getAgentById = (agentId: string): Agent | undefined => {
    return initialAgents.find(a => a.id === agentId)
  }
  
  const handleAgentClick = (agentId: string, event: MouseEvent, projectId: string) => {
    // Find agent in static list, or create a fallback agent
    let agent = getAgentById(agentId)
    
    if (!agent) {
      // Create a fallback agent for agents not in the static list
      agent = {
        id: agentId,
        name: agentId,
        division: 'Unknown',
        description: `Agent: ${agentId}`,
        color: '#6B7280',
        emoji: '🤖',
      }
    }
    
    const rect = (event.target as HTMLElement).getBoundingClientRect()
    const position = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    }
    
    // Get conversation snapshot at open time (won't update until closed and reopened)
    const conversation = projectAgents.getConversation(projectId, agentId)
    
    // Type cast to ensure compatibility
    setSelectedAgent({
      agent: agent as any,
      projectId,
      position,
      conversation,
    })
  }
  
  const handleCloseDialog = () => {
    setSelectedAgent(null)
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
      <header class="h-16 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-between shrink-0 shadow-sm" style={{ 'padding-left': '20px', 'padding-right': '24px' }}>
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
            A
          </div>
          <h1 class="text-xl font-bold text-gray-900 dark:text-white">Agents Visualization</h1>
          <span class="text-sm text-gray-500 dark:text-gray-400 ml-2">
            {filteredProjects().length} projects
          </span>
        </div>
        <button
          class="py-1.5 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-gray-700 dark:text-gray-300 transition-colors flex items-center gap-2 border border-gray-300 dark:border-gray-600"
          style={{ 'margin-right': '105px', 'padding-left': '10px', 'padding-right': '10px' }}
          onClick={() => setShowServerConfig(true)}
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M12 5l7 7-7 7" />
          </svg>
          Server
        </button>
      </header>

      {/* Main Content */}
      <div class="flex-1 flex overflow-hidden relative">
        {/* Agent Directory Sidebar */}
        <aside 
          class="border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-y-auto shrink-0 shadow-sm"
          style={{ width: `${sidebarWidth()}px` }}
        >
          <AgentDirectory
            agents={initialAgents}
            divisions={initialDivisions}
            onSelectAgent={(agentId) => {
              console.log('Selected agent from directory:', agentId)
              // Could implement search/filter by clicking agent
            }}
          />
          
          <div class="py-3 border-t border-gray-200 dark:border-gray-700" style={{ 'padding-left': '5px', 'padding-right': '5px' }}>
            <div class="flex justify-between items-center text-xs text-gray-600 dark:text-gray-400">
              <span>Projects:</span>
              <span class="font-mono">{projectAgents.getProjects().length}</span>
            </div>
            <div class="flex justify-between items-center text-xs text-gray-600 dark:text-gray-400">
              <span>Sessions:</span>
              <span class="font-mono">{projectAgents.projects().length}</span>
            </div>
          </div>
        </aside>

        {/* Resize Handle */}
        <div
          class="w-1 hover:w-1.5 bg-gray-300 dark:bg-gray-600 hover:bg-blue-500 cursor-col-resize transition-all shrink-0 z-20"
          onMouseDown={startResize}
          style={{ width: isResizing() ? '4px' : '1px' }}
        />

        {/* Project Grid Canvas */}
        <main class="flex-1 overflow-y-auto p-6 min-w-0">
          <Show 
            when={filteredProjects().length > 0}
            fallback={
              <div class="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
                <div class="text-6xl mb-4 opacity-50">📭</div>
                <h3 class="text-lg font-semibold mb-2">No projects yet</h3>
                <p class="text-sm text-center max-w-md">
                  Start a conversation in opencode TUI to see your projects here.
                  Projects are automatically detected from your session history.
                </p>
                <div class="mt-6 flex items-center gap-2 text-xs text-orange-600 dark:text-orange-400">
                  <Show when={projectAgents.loading()}>
                    <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Loading projects...
                  </Show>
                </div>
              </div>
            }
          >
            <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <For each={filteredProjects()}>
                {(project) => {
                  const agents = projectAgents.getProjectAgents(project.path)
                  
                  // Filter by division if selected
                  const filteredAgents = selectedDivision()
                    ? agents.filter(a => a.division === selectedDivision())
                    : agents
                  
                  return (
                    <ProjectCard
                      projectPath={project.path}
                      projectName={project.name}
                      agents={filteredAgents}
                      sessionCount={project.sessionCount}
                      lastUpdated={project.lastUpdated}
                      onAgentClick={(agentId, event) => handleAgentClick(agentId, event, project.path)}
                    />
                  )
                }}
              </For>
            </div>
          </Show>
        </main>
      </div>

      {/* Chat Dialog */}
      {selectedAgent() && (
        <ChatDialog
          agent={selectedAgent()!.agent}
          onClose={handleCloseDialog}
          initialPosition={selectedAgent()!.position}
          serverUrl={serverUrl()}
          mockMode={false}
          conversation={selectedAgent()!.conversation || undefined}
          readOnly={true}  // Always in read-only mode for project conversations
        />
      )}

      {/* Server Config Dialog */}
      {showServerConfig() && (
        <ServerConfig
          serverUrl={serverUrl()}
          onServerUrlChange={(url) => { localStorage.setItem('opencode-server-url', url); setServerUrl(url) }}
          onClose={() => setShowServerConfig(false)}
        />
      )}
    </div>
  )
}

export default App
