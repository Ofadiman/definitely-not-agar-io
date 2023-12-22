import { io, Socket } from 'socket.io-client'
import { ClientToServerEvents, ServerToClientEvents } from './types'

const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io()

socket.on('noArguments', () => { })
socket.on('objectArguments', (data) => {
  console.log({ foo: data.foo, bar: data.bar })
})
socket.on('objectArgumentsWithAcknowledgement', (data, callback) => {
  console.log({ foo: data.foo, bar: data.bar })
  callback({
    foo: 'foo',
    bar: 0,
  })
})

socket.emit('hello', { foo: 'foo', bar: 0 })
