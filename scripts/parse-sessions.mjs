#!/usr/bin/env node

/**
 * Parse Opencode Sessions
 * 
 * Fetches session data from opencode web API and generates
 * project-agent mapping for agents-viz visualization.
 * 
 * Usage:
 *   node scripts/parse-sessions.mjs [baseUrl]
 * 
 * Example:
 *   node scripts/parse-sessions.mjs http://localhost:36059
 */

import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { writeFileSync, mkdirSync, existsSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = join(__dirname, '..')

// Configuration
const BASE_URL = process.argv[2] || 'http://localhost:36059'
const OUTPUT_DIR = join(rootDir, 'src', 'data', 'sessions-cache')

console.log('📦 Opencode Sessions Parser')
console.log('===========================')
console.log('')
console.log(`📍 Base URL: ${BASE_URL}`)
console.log(`📂 Output: ${OUTPUT_DIR}`)
console.log('')

// Ensure output directory exists
if (!existsSync(OUTPUT_DIR)) {
  mkdirSync(OUTPUT_DIR, { recursive: true })
  console.log('✅ Created output directory')
}

// Fetch session list
async function fetchSessions() {
  console.log('📋 Fetching session list...')
  
  try {
    const response = await fetch(`${BASE_URL}/session`)
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const sessions = await response.json()
    console.log(`✅ Found ${sessions.length} sessions`)
    
    return sessions
  } catch (error) {
    console.error('❌ Failed to fetch sessions:', error.message)
    return []
  }
}

// Fetch messages for a session
async function fetchSessionMessages(sessionId) {
  try {
    const response = await fetch(`${BASE_URL}/session/${sessionId}/message`)
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error(`  ⚠️  Failed to fetch messages for ${sessionId}:`, error.message)
    return []
  }
}

// Extract agent from message
function extractAgent(message) {
  return message.info?.agent || null
}

// Extract text from message
function extractText(message) {
  const textParts = message.parts?.filter(p => p.type === 'text') || []
  return textParts.map(p => p.text).join('')
}

// Main execution
async function main() {
  const startTime = Date.now()
  
  // Step 1: Fetch session list
  const sessions = await fetchSessions()
  
  if (sessions.length === 0) {
    console.log('')
    console.log('⚠️  No sessions found. Start a conversation in opencode first.')
    return
  }
  
  // Step 2: Process sessions into projects
  console.log('')
  console.log('📊 Processing sessions...')
  
  const projectMap = new Map()
  const conversations = new Map()
  
  for (const session of sessions) {
    const projectPath = session.directory
    const projectName = projectPath.split('/').pop() || projectPath
    
    // Initialize project if not exists
    if (!projectMap.has(projectPath)) {
      projectMap.set(projectPath, {
        path: projectPath,
        name: projectName,
        sessions: [],
        agents: new Set(),
        lastUpdated: session.time.updated,
        sessionCount: 0,
      })
    }
    
    const project = projectMap.get(projectPath)
    project.sessions.push(session.id)
    project.sessionCount++
    project.lastUpdated = Math.max(project.lastUpdated, session.time.updated)
    
    // Fetch messages for this session
    console.log(`  📝 Processing session: ${session.title} (${session.id})`)
    const messages = await fetchSessionMessages(session.id)
    
    // Extract agents and build conversations
    const agentMessages = new Map()
    
    for (const message of messages) {
      const agentId = extractAgent(message)
      const content = extractText(message)
      const role = message.info?.role
      
      if (!agentId || !content?.trim()) continue
      
      project.agents.add(agentId)
      
      // Collect messages for conversation
      if (!agentMessages.has(agentId)) {
        agentMessages.set(agentId, [])
      }
      
      agentMessages.get(agentId).push({
        role: role === 'assistant' ? 'assistant' : 'user',
        content,
        timestamp: new Date(message.info?.time?.created).toISOString(),
        sessionId: session.id,
        messageId: message.info?.id,
      })
    }
    
    // Store conversations
    for (const [agentId, msgs] of agentMessages) {
      const key = `${projectPath}::${agentId}`
      conversations.set(key, {
        projectId: projectPath,
        projectName,
        agentId,
        messages: msgs.sort((a, b) => 
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        ),
      })
    }
  }
  
  // Step 3: Generate output files
  console.log('')
  console.log('💾 Generating output files...')
  
  // Convert projects to array and sort by lastUpdated
  const projects = Array.from(projectMap.values()).map(p => ({
    ...p,
    agents: Array.from(p.agents),
  })).sort((a, b) => b.lastUpdated - a.lastUpdated)
  
  // Save projects.json
  const projectsFile = join(OUTPUT_DIR, 'projects.json')
  writeFileSync(projectsFile, JSON.stringify(projects, null, 2))
  console.log(`  ✅ Saved ${projects.length} projects to: ${projectsFile}`)
  
  // Save conversations.json
  const conversationsFile = join(OUTPUT_DIR, 'conversations.json')
  const conversationsArray = Array.from(conversations.values())
  writeFileSync(conversationsFile, JSON.stringify(conversationsArray, null, 2))
  console.log(`  ✅ Saved ${conversationsArray.length} conversations to: ${conversationsFile}`)
  
  // Save summary
  const summary = {
    generatedAt: new Date().toISOString(),
    baseUrl: BASE_URL,
    totalSessions: sessions.length,
    totalProjects: projects.length,
    totalConversations: conversationsArray.length,
    projects: projects.map(p => ({
      name: p.name,
      path: p.path,
      sessions: p.sessionCount,
      agents: p.agents.length,
    })),
  }
  
  const summaryFile = join(OUTPUT_DIR, 'summary.json')
  writeFileSync(summaryFile, JSON.stringify(summary, null, 2))
  console.log(`  ✅ Saved summary to: ${summaryFile}`)
  
  // Print summary
  console.log('')
  console.log('📊 Summary')
  console.log('===========')
  console.log(`Total Sessions: ${sessions.length}`)
  console.log(`Total Projects: ${projects.length}`)
  console.log(`Total Conversations: ${conversationsArray.length}`)
  console.log('')
  
  if (projects.length > 0) {
    console.log('Projects:')
    projects.forEach(p => {
      console.log(`  📁 ${p.name}`)
      console.log(`     Sessions: ${p.sessionCount}, Agents: ${p.agents.length}`)
      if (p.agents.length <= 10) {
        console.log(`     Agents: ${p.agents.join(', ')}`)
      }
    })
  }
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(2)
  console.log('')
  console.log(`✅ Completed in ${duration}s`)
  console.log('')
}

// Run
main().catch(error => {
  console.error('❌ Fatal error:', error)
  process.exit(1)
})
