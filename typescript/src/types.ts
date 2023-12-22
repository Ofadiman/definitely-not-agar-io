export type ServerToClientEvents = {
  noArguments: () => void
  objectArguments: (data: { foo: string; bar: number }) => void
  objectArgumentsWithAcknowledgement: (
    data: { foo: string; bar: number },
    callback: (response: { foo: string; bar: number }) => void,
  ) => void
}

export type ClientToServerEvents = {
  hello: (data: { foo: string; bar: number }) => void
}

export type InterServerEvents = {
  ping: () => void
}

export type SocketData = {
  name: string
  age: number
}
