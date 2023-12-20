export type Namespace = {
  imageSrc: string
  name: string
  endpoint: string
  id: string
  rooms: Room[]
}

export type Room = {
  id: string
  title: string
  namespaceId: string
  isPrivate: boolean
  history: unknown[]
}
