import { PrismaClient } from '@prisma/client';
import { createAgentExtension } from './extensions/swarm-agent-agent/agent_create';
import { agentDeleteExtension } from './extensions/swarm-agent-agent/agent_delete';
import { getAgentExtension } from './extensions/swarm-agent-agent/agent_get';
import { agentUpdateExtension } from './extensions/swarm-agent-agent/agent_update';

const prisma = new PrismaClient();

const extendedClient = prisma
  .$extends(createAgentExtension)
  .$extends(getAgentExtension)
  .$extends(agentUpdateExtension)
  .$extends(agentDeleteExtension);

export default extendedClient;
