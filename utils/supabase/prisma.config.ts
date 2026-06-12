// prisma.config.ts
import { defineConfig } from '@prisma/config'

export default defineConfig({
  schema: './prisma/schema.prisma',
  migration: {
    // This tells Prisma where your Supabase database lives during 'db push' or migrations
    url: process.env.DATABASE_URL,
  },
})