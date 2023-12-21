export type Namespace = {
  imageSrc: string
  name: string
  id: string
}

export type Room = {
  id: string
  name: string
  namespaceId: string
}

export type Message = {
  id: string
  content: string
  sender: string
  roomId: string
}

export type ClientToServerEvents = {
  'rooms:join': (roomIds: string[]) => void
  'messages:sent': (message: Message) => void
}

export type ServerToClientEvents = {}

export const EVENTS = {
  ROOMS_JOIN: 'rooms:join',
  MESSAGES_SENT: 'messages:sent',
}
