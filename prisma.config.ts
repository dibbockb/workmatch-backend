import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

export default defineConfig({
    schema: 'prisma/schema',
    migrations: {
        path: 'prisma/migrations',
        seed: "bun run src/app/utils/seed.ts",
    },
    datasource: {
        url: env('DATABASE_URL'),
    },
})
