import { Component } from 'solid-js'

export interface AgentNodeData {
  id: string
  name: string
  description: string
  color: string
  emoji: string
  division: string
  mode: 'primary' | 'subagent' | 'command'
  size?: 'large' | 'medium' | 'small'
}

export interface AgentNodeProps {
  agent: AgentNodeData
  onClick: (agent: AgentNodeData) => void
}

export const AgentNode: Component<AgentNodeProps> = (props) => {
  const sizeClass = () => {
    if (props.agent.mode === 'primary') return 'w-24 h-24'
    if (props.agent.mode === 'command') return 'w-16 h-16'
    return 'w-14 h-14'
  }

  const emojiSize = () => {
    if (props.agent.mode === 'primary') return 'text-4xl'
    if (props.agent.mode === 'command') return 'text-2xl'
    return 'text-xl'
  }

  const nameSize = () => {
    if (props.agent.mode === 'primary') return 'text-sm'
    return 'text-xs'
  }

  return (
    <div
      class="flex flex-col items-center justify-center cursor-pointer transition-all duration-200 hover:scale-110 group"
      onClick={() => props.onClick(props.agent)}
      title={props.agent.description}
    >
      {/* Avatar Circle */}
      <div
        class={`${sizeClass()} rounded-full flex items-center justify-center shadow-lg border-4 transition-all duration-200 group-hover:shadow-xl`}
        style={{
          'background-color': props.agent.color + '20',
          'border-color': props.agent.color,
        }}
      >
        <span class={emojiSize()}>{props.agent.emoji}</span>
      </div>

      {/* Name Label */}
      <div
        class={`${nameSize()} font-semibold text-gray-700 dark:text-gray-200 mt-2 text-center max-w-[100px] truncate px-1`}
        title={props.agent.name}
      >
        {props.agent.name}
      </div>

      {/* Mode Indicator */}
      {props.agent.mode === 'primary' && (
        <div class="text-[10px] text-blue-600 dark:text-blue-400 font-medium mt-0.5">
          Primary
        </div>
      )}
    </div>
  )
}
