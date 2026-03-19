export interface MusicStats {
  streamsToday: number; streamsDelta: number;
  newReleases: number; podcastsLive: number; listeningHours: number;
  genres: { name: string; pct: number; color: string }[];
  nowPlaying: {
    title: string; artist: string; album: string;
    progress: number; duration: string; elapsed: string;
    gradient: string; emoji: string;
  };
}

export interface Track {
  _id: string; rank: number; title: string; artist: string;
  album: string; duration: string; gradient: string; emoji: string;
  streams: number; genre: string;
}

export interface DrumTrack {
  id:     string;
  name:   string;
  color:  string;
  steps:  number[];   // 0=off, 1=light, 2=medium, 3=hard
  volume: number;
  muted:  boolean;
  solo:   boolean;
  pitch:  number;     // semitone offset -12 to +12
}

export interface PianoKey {
  note:     string;
  freq:     number;
  isBlack:  boolean;
  leftPct:  number;
  widthPct: number;
  label:    string;
}
