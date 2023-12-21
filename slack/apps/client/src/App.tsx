import { useEffect, useMemo, useState } from 'react'
import { io } from 'socket.io-client'
import {
  AppBar,
  Avatar,
  Box,
  ListItemText,
  MenuItem,
  MenuList,
  Paper,
  Toolbar,
  Typography,
} from '@mui/material'
import Grid from '@mui/material/Unstable_Grid2'
import { Namespace, Room } from 'shared'
import { Socket } from 'socket.io-client'

export const socket = io('http://localhost:3000', {
  autoConnect: false,
})

const sockets = new Map<string, Socket>()

export const App = () => {
  const [isConnected, setIsConnected] = useState(false)
  const [namespaces, setNamespaces] = useState<Namespace[]>([])
  const [selectedNamespace, setSelectedNamespace] = useState<null | Namespace>(null)
  const [selectedRoom, setSelectedRoom] = useState<null | Room>(null)
  const [socketsInRoomCount, setSocketsInRoomCount] = useState(0)

  useEffect(() => {
    const handleConnect = () => {
      setIsConnected(true)
    }

    const handleDisconnect = () => {
      setIsConnected(false)
    }

    const handleListNamespaces = (namespaces: Namespace[]) => {
      setNamespaces(namespaces)
      setSelectedNamespace(namespaces[0])
      setSelectedRoom(namespaces[0].rooms[0])

      namespaces.forEach((namespace) => {
        const existingSocket = sockets.get(namespace.id)
        if (existingSocket) {
          return
        }

        const socket = io(`http://localhost:3000${namespace.endpoint}`, {
          autoConnect: false,
        })

        socket.on('namespace:changed', (updatedNamespace) => {
          setNamespaces((prevNamespaces) => {
            console.log('prevNamespaces', prevNamespaces)
            const newNamespaces = prevNamespaces.map((prevNamespace) => {
              if (prevNamespace.id === updatedNamespace.id) {
                return updatedNamespace
              }
              return prevNamespace
            })

            console.log('newNamespaces', newNamespaces)

            return newNamespaces
          })

          setSelectedNamespace((prevSelectedNamespace) => {
            if (
              prevSelectedNamespace !== null &&
              prevSelectedNamespace.id === updatedNamespace.id
            ) {
              return updatedNamespace
            }
            return prevSelectedNamespace
          })
          console.log(`namespace:changed`, updatedNamespace)
        })

        socket.on('connect', async () => {
          const response = await socket.emitWithAck('rooms:join', namespaces[0].rooms[0].id)

          setSocketsInRoomCount(response.socketsCount)

          console.log('socket connected to namespace', namespace)
        })

        sockets.set(namespace.id, socket)

        socket.connect()
      })
    }

    socket.on('connect', handleConnect)
    socket.on('disconnect', handleDisconnect)
    socket.on('list_namespaces', handleListNamespaces)

    socket.connect()

    return () => {
      socket.off('connect', handleConnect)
      socket.off('disconnect', handleDisconnect)
      socket.off('list_namespaces', handleListNamespaces)

      socket.disconnect()
    }
  }, [])

  return (
    <Box>
      <AppBar position="static">
        <Toolbar variant="dense">
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Socket status: {isConnected ? 'connected' : 'disconnected'}
          </Typography>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Selected room: {selectedRoom?.title}
          </Typography>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Active users: {socketsInRoomCount}
          </Typography>
        </Toolbar>
      </AppBar>
      <Grid container padding={1} spacing={2} disableEqualOverflow>
        <Grid xs={1}>
          <Paper>
            <MenuList>
              {namespaces.map((namespace) => {
                return (
                  <MenuItem
                    selected={selectedNamespace !== null && namespace.id === selectedNamespace.id}
                    key={namespace.name}
                    onClick={() => {
                      setSelectedNamespace(namespace)
                      setSelectedRoom(namespace.rooms[0])
                    }}
                  >
                    <Avatar src={namespace.imageSrc} />
                  </MenuItem>
                )
              })}
            </MenuList>
          </Paper>
        </Grid>
        <Grid xs={2}>
          <Paper>
            <MenuList>
              {selectedNamespace === null
                ? 'no namespace'
                : selectedNamespace.rooms.map((room) => {
                  return (
                    <MenuItem
                      key={room.id}
                      selected={selectedRoom !== null && selectedRoom.id === room.id}
                      onClick={async () => {
                        setSelectedRoom(room)
                        if (selectedNamespace) {
                          const socket = sockets.get(selectedNamespace.id)
                          if (socket) {
                            const response = await socket.emitWithAck('rooms:join', room.id)

                            setSocketsInRoomCount(response.socketsCount)
                            console.log('data after rooms:join', response)
                          } else {
                            console.error(
                              `there is no socket for namespace with id ${selectedNamespace.id}`,
                            )
                          }
                        }
                      }}
                    >
                      <ListItemText>{room.title}</ListItemText>
                    </MenuItem>
                  )
                })}
            </MenuList>
          </Paper>
        </Grid>
        <Grid xs={9}>
          <Paper>rest</Paper>
        </Grid>
      </Grid>
    </Box>
  )
}
