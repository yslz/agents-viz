import { Component, createSignal, For } from 'solid-js'

export interface ServerConfigProps {
  serverUrl: string
  onServerUrlChange: (url: string) => void
  onClose: () => void
}

export const ServerConfig: Component<ServerConfigProps> = (props) => {
  const [inputValue, setInputValue] = createSignal(props.serverUrl)

  const handleSave = () => {
    props.onServerUrlChange(inputValue())
    props.onClose()
  }

  const presets = [
    { label: 'Localhost:36059', url: 'http://localhost:36059' },
    { label: 'Localhost:3000', url: 'http://localhost:3000' },
    { label: 'Localhost:4096', url: 'http://localhost:4096' },
  ]

  return (
    <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={props.onClose}>
      <div 
        class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-[500px]"
        style={{ padding: '29px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 class="text-xl font-bold text-gray-900 dark:text-white" style={{ 'margin-bottom': '21px' }}>Server Configuration</h2>
        
        <div class="space-y-5">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300" style={{ 'margin-bottom': '13px' }}>
              Opencode Server URL
            </label>
            <input
              type="text"
              class="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={inputValue()}
              onInput={(e) => setInputValue(e.currentTarget.value)}
              placeholder="http://localhost:4096"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300" style={{ 'margin-bottom': '13px' }}>
              Quick Select
            </label>
            <div class="flex" style={{ gap: '13px' }}>
              <For each={presets}>
                {(preset) => (
                  <button
                    class="px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 transition-colors"
                    onClick={() => setInputValue(preset.url)}
                  >
                    {preset.label}
                  </button>
                )}
              </For>
            </div>
          </div>

          <div class="flex" style={{ gap: '17px', 'padding-top': '21px' }}>
            <button
              class="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-gray-700 dark:text-gray-300 transition-colors"
              onClick={props.onClose}
            >
              Cancel
            </button>
            <button
              class="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              onClick={handleSave}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
