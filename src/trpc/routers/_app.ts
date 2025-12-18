import { messageRoute } from '@/modules/messages/server/procedure';
import { apiKeysRouter } from '@/modules/api-keys/server/procedure';
import { projectRoute } from '@/modules/projects/server/procedure';
import { createTRPCRouter } from '../init';

export const appRouter = createTRPCRouter({
    message: messageRoute,
    apiKeys: apiKeysRouter,
    projects: projectRoute,
})
// export type definition of API
export type AppRouter = typeof appRouter;