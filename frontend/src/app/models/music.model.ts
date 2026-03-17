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
  steps:  boolean[];
  volume: number;
  muted:  boolean;
}

export interface PianoKey {
  note:     string;
  freq:     number;
  isBlack:  boolean;
  leftPct:  number;
  widthPct: number;
  label:    string;
}
