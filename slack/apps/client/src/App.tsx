import { useEffect, useMemo, useState } from 'react'
import { io } from 'socket.io-client'
import {
  AppBar,
  Avatar,
  Box,
  IconButton,
  ListItemText,
  MenuItem,
  MenuList,
  Paper,
  Toolbar,
  Typography,
} from '@mui/material'
import Grid from '@mui/material/Unstable_Grid2'
import { Namespace, Room } from 'shared'

export const socket = io('http://localhost:3000', {
  autoConnect: false,
})

export const App = () => {
  const [isConnected, setIsConnected] = useState(false)
  const [namespaces, setNamespaces] = useState<Namespace[]>([])
  const [selectedNamespace, setSelectedNamespace] = useState<null | Namespace>(null)
  const [selectedRoom, setSelectedRoom] = useState<null | Room>(null)

  useEffect(() => {
    socket.connect()

    const handleConnect = () => {
      setIsConnected(true)
    }

    const handleDisconnect = () => {
      setIsConnected(false)
    }

    const handleListNamespaces = (data: Namespace[]) => {
      setNamespaces(data)
      setSelectedNamespace(data[0])
      setSelectedRoom(data[0].rooms[0])
    }

    socket.on('connect', handleConnect)
    socket.on('disconnect', handleDisconnect)
    socket.on('list_namespaces', handleListNamespaces)

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
                      onClick={() => {
                        setSelectedRoom(room)
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
