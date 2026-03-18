import { Component, For, createMemo } from 'solid-js'
import type { AgentNodeData } from './AgentNode'

export interface DivisionLegendProps {
  divisions: string[]
  agents: AgentNodeData[]
  selectedDivision: string | null
  onSelectDivision: (division: string | null) => void
}

export const DivisionLegend: Component<DivisionLegendProps> = (props) => {
  const divisionCounts = createMemo(() => {
    const counts: Record<string, number> = {}
    props.agents.forEach(agent => {
      counts[agent.division] = (counts[agent.division] || 0) + 1
    })
    return counts
  })

  const divisionColors: Record<string, string> = {
    'Primary': '#3B82F6',
    'Commands': '#6366F1',
    'Engineering': '#10B981',
    'Marketing': '#F59E0B',
    'Sales': '#EF4444',
    'Design': '#8B5CF6',
    'Product': '#EC4899',
    'Support': '#6B7280',
    'Testing': '#14B8A6',
    'Specialized': '#06B6D4',
    'Game Development': '#F97316',
    'Academic': '#84CC16',
    'Spatial Computing': '#A855F7',
  }

  return (
    <div class="p-4">
      <h2 class="text-sm font-bold text-gray-700 dark:text-gray-200 mb-3 uppercase tracking-wider">
        Divisions
      </h2>
      <div class="space-y-1">
        {/* All Agents Option */}
        <button
          class={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
            props.selectedDivision === null
              ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
              : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
          onClick={() => props.onSelectDivision(null)}
        >
          <div class="flex items-center justify-between">
            <span>All Agents</span>
            <span class="text-xs opacity-60">{props.agents.length}</span>
          </div>
        </button>

        <For each={props.divisions}>
          {(division) => (
            <button
              class={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                props.selectedDivision === division
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
              onClick={() => props.onSelectDivision(division)}
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <div
                    class="w-3 h-3 rounded-full"
                    style={{ 'background-color': divisionColors[division] || '#9CA3AF' }}
                  />
                  <span>{division}</span>
                </div>
                <span class="text-xs opacity-60">{divisionCounts()[division] || 0}</span>
              </div>
            </button>
          )}
        </For>
      </div>
    </div>
  )
}
