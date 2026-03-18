#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { homedir } from 'os'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const AGENTS_DIR = path.join(homedir(), '.opencode', 'agents')
const OUTPUT_FILE = path.join(__dirname, '..', 'src', 'data', 'agents-generated.ts')

// Division keyword mapping for auto-categorization
const divisionKeywords = {
  'Engineering': [
    'developer', 'architect', 'engineer', 'devops', 'firmware', 'embedded',
    'security', 'database', 'cloud', 'infrastructure', 'mobile', 'unity',
    'unreal', 'godot', 'roblox', 'blender', 'shader', 'technical', 'lsp',
    'solidity', 'smart contract', 'blockchain', 'sre', 'mcp', 'feishu',
    'wechat', 'mini program', 'rapid', 'prototyper', 'autonomous', 'optimization'
  ],
  'Marketing': [
    'marketing', 'seo', 'tiktok', 'instagram', 'content', 'social', 'reddit',
    'twitter', 'linkedin', 'xiaohongshu', 'bilibili', 'zhihu', 'baidu',
    'douyin', 'kuaishou', 'weibo', 'podcast', 'livestream', 'carousel',
    'citation', 'app store', 'aso', 'growth', 'book', 'co-author',
    'e-commerce', 'cross-border'
  ],
  'Sales': [
    'sales', 'account', 'pipeline', 'revenue', 'outbound', 'discovery',
    'deal', 'proposal', 'coach', 'engineer', 'strategist'
  ],
  'Design': [
    'designer', 'ui', 'ux', 'brand', 'visual', 'whimsy', 'image', 'prompt',
    'inclusive', 'storyteller'
  ],
  'Product': [
    'product', 'manager', 'researcher', 'feedback', 'trend', 'nudge',
    'behavioral', 'sprint'
  ],
  'Support': [
    'support', 'analytics', 'finance', 'infrastructure', 'legal', 'compliance',
    'executive', 'summary', 'report', 'distribution', 'consolidation',
    'extraction', 'accounts payable', 'identity', 'trust', 'cultural',
    'recruitment', 'study abroad', 'supply chain', 'training', 'corporate',
    'government', 'presales', 'healthcare', 'french', 'korean'
  ],
  'Testing': [
    'test', 'qa', 'evidence', 'reality', 'performance', 'benchmark',
    'api', 'tool', 'evaluator', 'workflow', 'optimizer', 'accessibility',
    'auditor', 'model'
  ],
  'Specialized': [
    'orchestrator', 'zk', 'steward', 'navigator', 'automation', 'governance',
    'identity graph', 'agentic'
  ],
  'Game Development': [
    'game', 'level', 'narrative', 'audio', 'designer'
  ],
  'Academic': [
    'anthropologist', 'geographer', 'historian', 'narratologist', 'psychologist'
  ],
  'Spatial Computing': [
    'spatial', 'xr', 'visionos', 'metal', 'macos', 'cockpit', 'terminal',
    'immersive'
  ],
}

// Emoji inference from name
function inferEmoji(name) {
  const lower = name.toLowerCase()
  
  if (lower.includes('frontend')) return '🖥️'
  if (lower.includes('backend')) return '🏗️'
  if (lower.includes('mobile')) return '📱'
  if (lower.includes('ai')) return '🤖'
  if (lower.includes('devops')) return '🚀'
  if (lower.includes('security')) return '🔒'
  if (lower.includes('marketing')) return '📢'
  if (lower.includes('sales')) return '💼'
  if (lower.includes('design')) return '🎨'
  if (lower.includes('product')) return '📊'
  if (lower.includes('content')) return '📝'
  if (lower.includes('social')) return '📱'
  if (lower.includes('video')) return '🎬'
  if (lower.includes('research')) return '🔍'
  if (lower.includes('data')) return '📈'
  if (lower.includes('cloud')) return '☁️'
  if (lower.includes('database')) return '🗄️'
  if (lower.includes('test')) return '🧪'
  if (lower.includes('doc')) return '📄'
  if (lower.includes('game')) return '🎮'
  if (lower.includes('architect')) return '🏛️'
  if (lower.includes('tiktok')) return '🎵'
  if (lower.includes('instagram')) return '📸'
  if (lower.includes('twitter')) return '🐦'
  if (lower.includes('linkedin')) return '💼'
  if (lower.includes('reddit')) return '🤝'
  if (lower.includes('seo')) return '🔎'
  if (lower.includes('ux')) return '🎯'
  if (lower.includes('ui')) return '🎨'
  if (lower.includes('brand')) return '🛡️'
  if (lower.includes('growth')) return '📈'
  if (lower.includes('finance')) return '💰'
  if (lower.includes('legal')) return '⚖️'
  if (lower.includes('support')) return '💬'
  if (lower.includes('analytics')) return '📊'
  if (lower.includes('writer')) return '✍️'
  if (lower.includes('audio')) return '🔊'
  if (lower.includes('shader')) return '✨'
  if (lower.includes('unity')) return '🎮'
  if (lower.includes('unreal')) return '🎮'
  if (lower.includes('godot')) return '🎮'
  if (lower.includes('roblox')) return '🎮'
  if (lower.includes('blender')) return '🎨'
  if (lower.includes('spatial')) return '🥽'
  if (lower.includes('xr')) return '👓'
  if (lower.includes('vision')) return '👁️'
  if (lower.includes('blockchain')) return '⛓️'
  if (lower.includes('solidity')) return '📜'
  if (lower.includes('embedded')) return '🔌'
  if (lower.includes('firmware')) return '💾'
  if (lower.includes('sre')) return '🛡️'
  if (lower.includes('orchestrator')) return '🎭'
  if (lower.includes('translator')) return '🌐'
  if (lower.includes('triage')) return '📋'
  
  return '👤' // default
}

// Infer division from name and description
function inferDivision(name, description) {
  const text = (name + ' ' + description).toLowerCase()
  
  for (const [division, keywords] of Object.entries(divisionKeywords)) {
    for (const keyword of keywords) {
      if (text.includes(keyword.toLowerCase())) {
        return division
      }
    }
  }
  
  return 'Specialized' // default
}

// Parse frontmatter from markdown file
function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/)
  if (!match) return {}
  
  const frontmatter = {}
  const lines = match[1].split('\n')
  
  for (const line of lines) {
    const [key, ...valueParts] = line.split(':')
    if (key && valueParts.length > 0) {
      const value = valueParts.join(':').trim().replace(/^["']|["']$/g, '')
      frontmatter[key.trim()] = value
    }
  }
  
  return frontmatter
}

// Main parsing function
async function parseAgents() {
  console.log('🔍 Parsing agents from', AGENTS_DIR)
  
  const files = fs.readdirSync(AGENTS_DIR).filter(f => f.endsWith('.md'))
  console.log(`📄 Found ${files.length} agent files`)
  
  const agents = []
  
  for (const file of files) {
    try {
      const filePath = path.join(AGENTS_DIR, file)
      const content = fs.readFileSync(filePath, 'utf-8')
      const frontmatter = parseFrontmatter(content)
      
      if (!frontmatter.name) {
        console.warn(`⚠️  Skipping ${file}: no name in frontmatter`)
        continue
      }
      
      const id = file.replace('.md', '')
      const name = frontmatter.name
      const description = frontmatter.description || 'No description'
      const color = frontmatter.color || '#9CA3AF'
      const mode = frontmatter.mode || 'subagent'
      const emoji = frontmatter.emoji || inferEmoji(name)
      const division = frontmatter.division || inferDivision(name, description)
      
      agents.push({
        id,
        name,
        description,
        color,
        emoji,
        division,
        mode,
      })
      
      console.log(`✓ Parsed: ${name} (${division})`)
    } catch (error) {
      console.error(`✗ Error parsing ${file}:`, error.message)
    }
  }
  
  // Sort agents by division, then by name
  agents.sort((a, b) => {
    if (a.division !== b.division) {
      return a.division.localeCompare(b.division)
    }
    return a.name.localeCompare(b.name)
  })
  
  // Generate TypeScript file
  const divisions = [...new Set(agents.map(a => a.division))].sort()
  
  const output = `// Auto-generated agent data
// Generated by scripts/parse-agents.mjs
// Do not edit manually

import { primaryAgents, commandAgents } from './primary-agents'

export const divisions = ${JSON.stringify(divisions, null, 2)}

export const subAgents = ${JSON.stringify(agents, null, 2)}

export const agents = [
  ...primaryAgents,
  ...commandAgents,
  ...subAgents,
]

export type Agent = typeof agents[number]
`
  
  fs.writeFileSync(OUTPUT_FILE, output)
  console.log(`\n✅ Generated ${OUTPUT_FILE}`)
  console.log(`📊 Total agents: ${agents.length + primaryAgents.length + commandAgents.length}`)
  console.log(`   - Primary: ${primaryAgents.length}`)
  console.log(`   - Commands: ${commandAgents.length}`)
  console.log(`   - Subagents: ${agents.length}`)
}

// Import primary agents for counting
const primaryAgents = [
  { id: 'plan', name: 'Plan' },
  { id: 'build', name: 'Build' },
  { id: 'general', name: 'General' },
  { id: 'explore', name: 'Explore' },
  { id: 'triage', name: 'Triage' },
  { id: 'duplicate-pr', name: 'Duplicate PR' },
  { id: 'docs', name: 'Docs' },
  { id: 'translator', name: 'Translator' },
]

const commandAgents = [
  { id: 'commit', name: 'Commit' },
  { id: 'learn', name: 'Learn' },
  { id: 'issues', name: 'Issues' },
]

parseAgents().catch(console.error)
