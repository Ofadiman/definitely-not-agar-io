import { Orb } from './orb'

export type ServerToClientEvents = {
  init: (data: { orbs: Orb[] }) => void
}

export type ClientToServerEvents = {}

export type InterServerEvents = {}

export type SocketData = {}
