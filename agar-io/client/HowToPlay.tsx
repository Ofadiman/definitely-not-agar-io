import { DialogContentText } from '@mui/material'

export const HowToPlay = () => {
  return (
    <ul>
      <DialogContentText component="li">
        Move your mouse on the screen to move your character.
      </DialogContentText>
      <DialogContentText component="li">
        Absorb orbs by running over them in order to grow your character.
      </DialogContentText>
      <DialogContentText component="li">The larger you get the slower you are.</DialogContentText>
      <DialogContentText component="li">
        Objective: Absorb other players to get even larger but not lose speed.
      </DialogContentText>
      <DialogContentText component="li">
        The larger player absorbs the smaller player.
      </DialogContentText>
    </ul>
  )
}
