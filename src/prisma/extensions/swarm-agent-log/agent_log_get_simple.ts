import { Prisma } from '@prisma/client'

export const agentLogGetSimpleExtension = Prisma.defineExtension({
  name: 'AgentLogGetSimpleExtension',
  model: {
    agentLog: {
      // Simplified version without complex permission validation
      async getAgentLogsSimple(this: any, filters: any = {}) {
        try {
          console.log('Starting simple agent log get with filters:', filters)

          // Simple query without complex joins or permission checks
          const logs = await this.findMany({
            take: 10,
            orderBy: {
              created_at: 'desc',
            },
          })

          console.log('Simple agent log query successful, found:', logs.length, 'logs')

          // Convert BigInt fields to strings for JSON serialization
          return logs.map((log: any) => ({
            ...log,
            agent_log_id: log.agent_log_id.toString(),
          }))
        } catch (error) {
          console.error('Error in simple agent log get:', error)
          throw error
        }
      },
    },
  },
})
