const fs = require('fs')
const path = require('path')

const { agentDivisionMap } = require('./agent-divisions.cjs')

const agentsPath = path.join(__dirname, '../src/data/agents-generated.ts')
let content = fs.readFileSync(agentsPath, 'utf-8')

// Update division for each agent
Object.entries(agentDivisionMap).forEach(([id, division]) => {
  // Match the agent block and update its division
  const regex = new RegExp(
    `("id":\\s*"${id}",\\n[\\s\\S]*?"division":\\s*")[^"]*(")`,
    'g'
  )
  content = content.replace(regex, `$1${division}$2`)
})

fs.writeFileSync(agentsPath, content)
console.log('Updated divisions for', Object.keys(agentDivisionMap).length, 'agents')