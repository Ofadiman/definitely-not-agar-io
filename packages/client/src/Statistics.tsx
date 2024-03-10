import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material'
import { Player } from 'shared'

export const Statistics = (props: { players: readonly Player[] }) => {
  const alivePlayers = props.players.filter((player) => player.isAlive())

  alivePlayers.sort((a, b) => {
    if (a.snapshot.absorbedOrbsCount < b.snapshot.absorbedOrbsCount) {
      return 1
    } else if (a.snapshot.absorbedOrbsCount > b.snapshot.absorbedOrbsCount) {
      return -1
    }

    if (a.snapshot.id.localeCompare(b.snapshot.id)) {
      return 1
    }

    if (b.snapshot.id.localeCompare(a.snapshot.id)) {
      return -1
    }

    return 0
  })

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell align="right">Points</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {alivePlayers.map((row) => (
            <TableRow
              key={row.snapshot.id}
              sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
            >
              <TableCell component="th" scope="row">
                {row.snapshot.username}
              </TableCell>
              <TableCell align="right">{row.snapshot.absorbedOrbsCount}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
