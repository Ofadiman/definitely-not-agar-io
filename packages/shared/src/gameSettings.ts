import { z } from 'zod'

export const gameSettingsSchema = z
  .object({
    INITIAL_PLAYER_RADIUS: z.coerce.number().int().gte(5).lte(25).default(10),
    FPS: z
      .union([z.coerce.number().min(30).max(30), z.coerce.number().min(60).max(60)])
      .default(60),
    MAP_HEIGHT: z.coerce.number().int().gte(500).lte(5000).default(1000),
    MAP_WIDTH: z.coerce.number().int().gte(500).lte(5000).default(1000),
    NUMBER_OF_BOTS: z.coerce.number().int().gte(0).lte(100).default(10),
    NUMBER_OF_ORBS: z.coerce.number().int().gte(100).lte(5000).default(1000),
    ORB_RADIUS: z.coerce.number().int().gte(1).lte(10).default(5),
  })
  .strip()

export type GameSettings = z.infer<typeof gameSettingsSchema>
