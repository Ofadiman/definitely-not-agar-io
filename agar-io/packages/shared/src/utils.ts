export type Collideable = {
  location: {
    x: number
    y: number
  }
  size: number
}

export const loop = (args: { fps: number; callback: () => void }): (() => void) => {
  const intervalId = setInterval(args.callback, 1000 / args.fps)

  const cancel = () => {
    clearInterval(intervalId)
  }

  return cancel
}
