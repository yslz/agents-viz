import { Component, createSignal, For, onMount, onCleanup, createEffect, createMemo } from 'solid-js'
import type { AgentNodeData } from './AgentNode'
import { useOpencodeRealAPI } from '../hooks/useOpencodeRealAPI'

export interface ChatDialogProps {
  agent: AgentNodeData
  onClose: () => void
  initialPosition?: { x: number; y: number }
  serverUrl?: string
  mockMode?: boolean
}

export const ChatDialog: Component<ChatDialogProps> = (props) => {
  const [message, setMessage] = createSignal('')
  const [position, setPosition] = createSignal({ x: 100, y: 100 })
  const [isDragging, setIsDragging] = createSignal(false)
  const [dragOffset, setDragOffset] = createSignal({ x: 0, y: 0 })
  const [isMaximized, setIsMaximized] = createSignal(false)
  
  let messagesEndRef: HTMLDivElement | undefined
  let dialogRef: HTMLDivElement | undefined
  let headerRef: HTMLDivElement | undefined

  // Use the opencode real API hook
  const api = useOpencodeRealAPI({
    agentId: props.agent.id,
    agentName: props.agent.name,  // Pass the display name
    baseUrl: props.serverUrl,  // Use server URL from props (no default)
  })

  // Initialize position from click location
  createEffect(() => {
    if (props.initialPosition) {
      const dialogWidth = isMaximized() ? window.innerWidth * 0.9 : 600
      const dialogHeight = isMaximized() ? window.innerHeight * 0.9 : 500
      const x = props.initialPosition!.x - dialogWidth / 2
      const y = props.initialPosition!.y - dialogHeight / 2
      
      const minX = 20
      const minY = 60
      const maxX = window.innerWidth - dialogWidth - 20
      const maxY = window.innerHeight - dialogHeight - 20
      
      setPosition({
        x: Math.max(minX, Math.min(x, maxX)),
        y: Math.max(minY, Math.min(y, maxY)),
      })
    }
  })

  // Auto-scroll to bottom when new message arrives
  createEffect(() => {
    if (messagesEndRef && api.messages().length > 0) {
      setTimeout(() => {
        messagesEndRef?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    }
  })

  const handleDragStart = (e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
    const rect = dialogRef!.getBoundingClientRect()
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
  }

  const handleDrag = (e: MouseEvent) => {
    if (!isDragging()) return
    
    const newX = e.clientX - dragOffset().x
    const newY = e.clientY - dragOffset().y
    
    const dialogWidth = isMaximized() ? window.innerWidth * 0.9 : 600
    const dialogHeight = isMaximized() ? window.innerHeight * 0.9 : 500
    const minX = 20
    const minY = 60
    const maxX = window.innerWidth - dialogWidth - 20
    const maxY = window.innerHeight - dialogHeight - 20
    
    setPosition({
      x: Math.max(minX, Math.min(newX, maxX)),
      y: Math.max(minY, Math.min(newY, maxY)),
    })
  }

  const handleDragEnd = () => {
    setIsDragging(false)
  }

  createEffect(() => {
    if (isDragging()) {
      document.addEventListener('mousemove', handleDrag, { passive: false })
      document.addEventListener('mouseup', handleDragEnd)
      
      onCleanup(() => {
        document.removeEventListener('mousemove', handleDrag)
        document.removeEventListener('mouseup', handleDragEnd)
      })
    }
  })

  onCleanup(() => {
    document.removeEventListener('mousemove', handleDrag)
    document.removeEventListener('mouseup', handleDragEnd)
  })

  const handleSend = async () => {
    const content = message().trim()
    if (!content || api.loading()) return

    setMessage('')

    // Send message via API
    // The loading state is managed by the hook
    await api.sendMessage(content, props.agent.id)
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const formatContent = (content: string) => {
    // Simple markdown-like formatting
    return content
      .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre class="bg-gray-100 dark:bg-gray-800 p-3 rounded my-2 overflow-x-auto"><code>$2</code></pre>')
      .replace(/`([^`]+)`/g, '<code class="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm">$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br/>')
  }

  return (
    <div class="fixed inset-0 z-50" onClick={props.onClose}>
      <div
        ref={dialogRef}
        class={`bg-white dark:bg-gray-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-200 ${
          isMaximized() ? 'w-[90vw] h-[90vh]' : 'w-[600px] h-[500px]'
        }`}
        style={{
          position: 'absolute',
          left: `${position().x}px`,
          top: `${position().y}px`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Drag Handle */}
        <div
          ref={headerRef}
          class="flex items-center justify-between px-4 py-3 cursor-grab active:cursor-grabbing select-none border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-750"
          onMouseDown={handleDragStart}
        >
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0"
              style={{
                'background-color': props.agent.color + '40',
                'border': `3px solid ${props.agent.color}`,
              }}
            >
              {props.agent.emoji}
            </div>
            <div class="min-w-0">
              <h2 class="text-base font-bold text-gray-900 dark:text-white truncate">{props.agent.name}</h2>
              <div class="flex items-center gap-2">
                <p class="text-xs text-gray-600 dark:text-gray-400 truncate">{props.agent.division}</p>
                {api.connected() && (
                  <span class="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                    <span class="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                    {props.mockMode ? 'Mock' : 'Connected'}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <button
              class="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
              onClick={() => setIsMaximized(!isMaximized())}
              title={isMaximized() ? 'Restore' : 'Maximize'}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <svg class="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMaximized() ? (
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 4H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2v-2M16 4h2a2 2 0 012 2v2M16 20h2a2 2 0 002-2v-2" />
                ) : (
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4a2 2 0 012-2h4M20 8v8a2 2 0 01-2 2H8M4 16v4a2 2 0 002 2h4M16 4h4a2 2 0 012 2v4" />
                )}
              </svg>
            </button>
            <button
              class="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
              onClick={props.onClose}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <svg class="w-5 h-5 text-gray-600 dark:text-gray-400 hover:text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div class="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-900 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
          {api.messages().length === 0 ? (
            <div class="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
              <div class="text-5xl mb-4 opacity-80">{props.agent.emoji}</div>
              <p class="text-sm text-center max-w-xs">{props.agent.description}</p>
              <p class="text-xs mt-2 opacity-60">Start a conversation...</p>
              {!api.connected() && (
                <div class="mt-4 flex items-center gap-2 text-xs text-orange-600 dark:text-orange-400">
                  <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Connecting to server...
                </div>
              )}
            </div>
          ) : (
            <For each={api.messages()}>
              {(msg) => (
                <div
                  class={`flex ${msg.role === 'user' ? 'justify-end' : msg.role === 'system' ? 'justify-center' : 'justify-start'}`}
                >
                  {msg.role === 'system' ? (
                    <div class="max-w-[90%] rounded-lg px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-sm">
                      {msg.content}
                    </div>
                  ) : (
                    <div
                      class={`max-w-[80%] rounded-2xl px-4 py-2.5 shadow-sm ${
                        msg.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      <div 
                        class="text-sm prose dark:prose-invert prose-sm max-w-none"
                        innerHTML={formatContent(msg.content)}
                      />
                      <p class={`text-xs mt-1 ${
                        msg.role === 'user' ? 'text-blue-200' : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </For>
          )}
          {api.loading() && (
            <div class="flex justify-start">
              <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-3 shadow-sm">
                <div class="flex gap-1.5">
                  <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ 'animation-delay': '0ms' }} />
                  <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ 'animation-delay': '150ms' }} />
                  <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ 'animation-delay': '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div class="border-t border-gray-200 dark:border-gray-700 p-3 bg-white dark:bg-gray-800">
          <div class="flex gap-2">
            <textarea
              class="flex-1 px-3 py-2.5 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-500"
              placeholder={`Message ${props.agent.name}...`}
              rows={2}
              value={message()}
              onInput={(e) => setMessage(e.currentTarget.value)}
              onKeyDown={handleKeyDown}
              disabled={api.loading() || !api.connected()}
            />
            <button
              class="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              onClick={handleSend}
              disabled={!message().trim() || api.loading() || !api.connected()}
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
          {api.error() && (
            <p class="text-xs text-red-600 dark:text-red-400 mt-2">{api.error()}</p>
          )}
        </div>
      </div>
    </div>
  )
}
