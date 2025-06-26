import { PrismaClient } from '@prisma/client'

export interface AuditInfo {
  userId: string
  userRole?: string
  operation: string
  resource: string
  resourceId?: string
  metadata?: any
}

export class ExtensionContext {
  private static operationCount = 0
  private static basePrismaClient: PrismaClient | null = null

  /**
   * Set the base Prisma client for raw queries
   */
  static setBasePrismaClient(client: PrismaClient) {
    this.basePrismaClient = client
  }

  /**
   * Get the base Prisma client for raw queries
   */
  static getBasePrismaClient(): PrismaClient | null {
    return this.basePrismaClient
  }

  /**
   * Execute database operation with proper extension context
   */
  static async execute<T>(prisma: any, operation: () => Promise<T>, auditInfo: AuditInfo): Promise<T> {
    const operationId = ++this.operationCount

    try {
      // Log operation start
      await this.logOperationStart(prisma, auditInfo, operationId)

      // Execute operation without role elevation - extensions handle permissions

      // Execute the operation
      const startTime = Date.now()
      const result = await operation()
      const executionTime = Date.now() - startTime

      // Log successful completion
      await this.logOperationSuccess(prisma, auditInfo, operationId, executionTime)

      return result
    } catch (error) {
      // Log operation failure
      await this.logOperationFailure(prisma, auditInfo, operationId, error)
      throw error
    } finally {
      // No role cleanup needed since we don't elevate privileges
      // Extensions handle their own permission validation
    }
  }

  private static async logOperationStart(prisma: any, auditInfo: AuditInfo, operationId: number): Promise<void> {
    try {
      // Skip audit logging to avoid raw query issues
      // Audit logging can be implemented later with proper model access
      console.log(`[AUDIT] Operation start: ${auditInfo.operation} by ${auditInfo.userId} (${auditInfo.userRole})`)
    } catch (error) {
      console.error('Failed to log operation start:', error)
      // Don't throw - logging failure shouldn't block operation
    }
  }

  private static async logOperationSuccess(prisma: any, auditInfo: AuditInfo, operationId: number, executionTime: number): Promise<void> {
    try {
      // Skip audit logging to avoid raw query issues
      console.log(`[AUDIT] Operation success: ${auditInfo.operation} by ${auditInfo.userId} (${auditInfo.userRole}) - ${executionTime}ms`)
    } catch (error) {
      console.error('Failed to log operation success:', error)
    }
  }

  private static async logOperationFailure(prisma: any, auditInfo: AuditInfo, operationId: number, error: any): Promise<void> {
    try {
      // Skip audit logging to avoid raw query issues
      console.log(
        `[AUDIT] Operation failure: ${auditInfo.operation} by ${auditInfo.userId} (${auditInfo.userRole}) - ${error instanceof Error ? error.message : String(error)}`,
      )
    } catch (logError) {
      console.error('Failed to log operation failure:', logError)
    }
  }
}
