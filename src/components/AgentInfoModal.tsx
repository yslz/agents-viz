import { Component, Show } from 'solid-js'
import type { Agent } from '../data/agents-generated'

interface AgentInfoModalProps {
  agent: Agent | null
  onClose: () => void
}

export const AgentInfoModal: Component<AgentInfoModalProps> = (props) => {
  const handleOverlayClick = (e: MouseEvent) => {
    if (e.target === e.currentTarget) {
      props.onClose()
    }
  }

  return (
    <Show when={props.agent}>
      <div 
        style="position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;"
        onClick={handleOverlayClick}
      >
        <div 
          style="background: white; border-radius: 12px; padding: 24px; max-width: 480px; width: 90%; max-height: 80vh; overflow-y: auto; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);"
          class="dark:bg-gray-800"
        >
          <div style="display: flex; align-items: flex-start; gap: 16px; margin-bottom: 16px;">
            <span style="font-size: 40px;">{props.agent!.emoji}</span>
            <div style="flex: 1;">
              <h2 style="font-size: 20px; font-weight: 600; margin: 0; color: #1f2937;" class="dark:text-white">
                {props.agent!.name}
              </h2>
              <span 
                style={`display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 12px; margin-top: 4px; background: ${props.agent!.color}20; color: ${props.agent!.color};`}
              >
                {props.agent!.division}
              </span>
            </div>
            <button 
              onClick={props.onClose}
              style="padding: 4px; border: none; background: transparent; cursor: pointer; color: #6b7280;"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div style="margin-bottom: 16px;">
            <h3 style="font-size: 14px; font-weight: 600; color: #6b7280; margin: 0 0 8px 0; text-transform: uppercase;">
              Description
            </h3>
            <p style="font-size: 14px; color: #374151; line-height: 1.6; margin: 0;" class="dark:text-gray-300">
              {props.agent!.description}
            </p>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div style="background: #f9fafb; padding: 12px; border-radius: 8px;" class="dark:bg-gray-700">
              <span style="font-size: 12px; color: #6b7280;">ID</span>
              <p style="font-size: 13px; color: #1f2937; margin: 4px 0 0 0; font-family: monospace;" class="dark:text-gray-300">
                {props.agent!.id}
              </p>
            </div>
            <div style="background: #f9fafb; padding: 12px; border-radius: 8px;" class="dark:bg-gray-700">
              <span style="font-size: 12px; color: #6b7280;">Mode</span>
              <p style="font-size: 13px; color: #1f2937; margin: 4px 0 0 0; text-transform: capitalize;" class="dark:text-gray-300">
                {props.agent!.mode}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Show>
  )
}