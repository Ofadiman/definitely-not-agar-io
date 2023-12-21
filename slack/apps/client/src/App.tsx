import { useEffect, useMemo, useState } from 'react'
import { io } from 'socket.io-client'
import {
  AppBar,
  Avatar,
  Button,
  ListItemText,
  MenuItem,
  MenuList,
  TextField,
  Toolbar,
  Typography,
} from '@mui/material'
import Grid from '@mui/material/Unstable_Grid2'
import { EVENTS, Message, Namespace, Room } from 'shared'
import { Socket } from 'socket.io-client'

const sockets = new Map<string, Socket>()

const username = prompt('username')

export const App = () => {
  const [namespaces, setNamespaces] = useState<Namespace[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [selectedNamespaceId, setSelectedNamespaceId] = useState<null | string>(null)
  const [selectedRoomId, setSelectedRoomId] = useState<null | string>(null)
  const [socketsInRoomCount, setSocketsInRoomCount] = useState(0)
  const [content, setContent] = useState('')
  const [messages, setMessages] = useState<Message[]>([])

  useEffect(() => {
    void (async () => {
      const namespaces: Namespace[] = await (await fetch('http://localhost:3000/namespaces')).json()
      console.log({ namespaces })
      const rooms: Room[] = await (
        await fetch(`http://localhost:3000/namespaces/${namespaces[0].id}/rooms`)
      ).json()
      console.log({ rooms })

      setNamespaces(namespaces)
      setRooms(rooms)
      setSelectedNamespaceId(namespaces[0].id)
      setSelectedRoomId(rooms[0].id)

      namespaces.forEach(async (namespace) => {
        const existingSocket = sockets.get(namespace.id)
        if (existingSocket) {
          return
        }

        const socket = io('http://localhost:3000/' + namespace.id)
        sockets.set(namespace.id, socket)

        socket.on('connect', () => {
          console.log('socket connected')
        })

        socket.on(EVENTS.MESSAGES_SENT, (message: Message) => {
          if (message.sender === username) {
            return
          }
          setMessages((prevMessages) => [...prevMessages, message])
        })

        const response = await socket.emitWithAck(EVENTS.ROOMS_JOIN, rooms[0].id)

        setSocketsInRoomCount(response.socketsCount)
      })
    })()
  }, [])

  return (
    <>
      <AppBar position="static" elevation={0}>
        <Toolbar variant="dense">
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Selected room: todo
          </Typography>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Active users: {socketsInRoomCount}
          </Typography>
        </Toolbar>
      </AppBar>
      <Grid sx={{ flexGrow: 1 }} container disableEqualOverflow>
        <Grid xs="auto" sx={(theme) => ({ borderRight: 1, borderColor: theme.palette.divider })}>
          <MenuList sx={{ flexGrow: 1 }}>
            {namespaces.map((namespace) => {
              return (
                <MenuItem
                  sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                  selected={selectedNamespaceId !== null && namespace.id === selectedNamespaceId}
                  key={namespace.name}
                  onClick={async () => {
                    setSelectedNamespaceId(namespace.id)

                    const rooms = await (
                      await fetch(`http://localhost:3000/namespaces/${namespace.id}/rooms`)
                    ).json()
                    setRooms(rooms)
                    setSelectedRoomId(rooms[0].id)

                    if (selectedNamespaceId) {
                      const socket = sockets.get(selectedNamespaceId)
                      if (socket) {
                        const response = await socket.emitWithAck(EVENTS.ROOMS_JOIN, rooms[0].id)
                        setSocketsInRoomCount(response.socketsCount)
                      }
                    }
                  }}
                >
                  <Avatar src={namespace.imageSrc} />
                </MenuItem>
              )
            })}
          </MenuList>
        </Grid>
        <Grid xs={'auto'} sx={(theme) => ({ borderRight: 1, borderColor: theme.palette.divider })}>
          <MenuList>
            {selectedNamespaceId === null
              ? 'no namespace'
              : rooms.map((room) => {
                return (
                  <MenuItem
                    key={room.id}
                    selected={selectedRoomId !== null && selectedRoomId === room.id}
                    onClick={async () => {
                      setSelectedRoomId(room.id)
                      setMessages([])

                      if (selectedNamespaceId) {
                        const socket = sockets.get(selectedNamespaceId)
                        if (socket) {
                          const response = await socket.emitWithAck(EVENTS.ROOMS_JOIN, [room.id])

                          setSocketsInRoomCount(response.socketsCount)
                          console.log('data after rooms:join', response)
                        } else {
                          console.error(
                            `there is no socket for namespace with id ${selectedNamespaceId}`,
                          )
                        }
                      }
                    }}
                  >
                    <ListItemText>{room.name}</ListItemText>
                  </MenuItem>
                )
              })}
          </MenuList>
        </Grid>
        <Grid xs sx={{ padding: 2, flexFlow: 'column' }} container>
          <Grid sx={{ flexGrow: 1, marginBottom: 2, overflowY: 'auto' }}>
            {messages.map((message) => {
              return (
                <Typography key={message.id}>
                  {message.sender}: {message.content}
                </Typography>
              )
            })}
          </Grid>
          <Grid
            container
            component="form"
            columnGap={2}
            onSubmit={(event) => {
              event.preventDefault()

              if (!selectedNamespaceId || !selectedRoomId) {
                return
              }

              const socket = sockets.get(selectedNamespaceId)
              if (!socket) {
                return
              }

              const message: Message = {
                id: Math.random().toString(),
                sender: username as string,
                content: content,
                roomId: selectedRoomId,
              }

              setContent('')
              setMessages((prevMessages) => [...prevMessages, message])
              socket.emit(EVENTS.MESSAGES_SENT, message)
            }}
          >
            <TextField
              sx={{ flexGrow: 1 }}
              id="message"
              label="Message"
              variant="outlined"
              value={content}
              onChange={(event) => {
                setContent(event.currentTarget.value)
              }}
            />
            <Button type="submit" variant="contained">
              submit
            </Button>
          </Grid>
        </Grid>
      </Grid>
    </>
  )
}
