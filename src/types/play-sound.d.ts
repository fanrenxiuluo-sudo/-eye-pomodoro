declare module 'play-sound' {
  interface Options {
    players?: string[]
    player?: string
    mp3?: string
    afplay?: string
    mpg123?: string
    mpg321?: string
    ffplay?: string
    mpg?: string
    sox?: string
    aplay?: string
    paplay?: string
    pulseaudio?: string
  }

  interface Player {
    play(file: string, callback?: (err: Error | null) => void): { kill: () => void }
  }

  function play(options?: Options): Player
  export = play
}
