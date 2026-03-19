import { Component, OnInit, OnDestroy, inject, signal, computed, HostListener } from '@angular/core';
import { NgClass, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService }           from '../../services/api.service';
import { MusicStats, Track }    from '../../models/music.model';
import { DrumTrack, PianoKey }  from '../../models/music.model';
import { UploadedFile }         from '../../models/files.model';
import { StatCardComponent }    from '../../shared/stat-card/stat-card.component';
import { FileManagerComponent } from '../../shared/file-manager/file-manager.component';
import { BeatService, Beat, BeatLayer } from '../../services/beat.service';

@Component({
  selector: 'app-music',
  standalone: true,
  imports: [NgClass, CommonModule, FormsModule, StatCardComponent, FileManagerComponent],
  templateUrl: './music.component.html',
  styleUrls: ['./music.component.scss'],
})
export class MusicComponent implements OnInit, OnDestroy {
  private api = inject(ApiService);
  beatService = inject(BeatService);
  private wfInterval?: ReturnType<typeof setInterval>;
  private audio = new Audio();

  /* Existing page state */
  stats  = signal<MusicStats | null>(null);
  tracks = signal<Track[]>([]);

  fileNowPlaying = signal<UploadedFile | null>(null);
  isPlaying      = signal(false);
  audioProgress  = signal(0);
  audioElapsed   = signal('0:00');
  audioDuration  = signal('0:00');

  npTitle    = computed(() => this.fileNowPlaying()?.filename ?? this.stats()?.nowPlaying?.title ?? '—');
  npArtist   = computed(() => this.fileNowPlaying() ? '' : (this.stats()?.nowPlaying?.artist ?? ''));
  npAlbum    = computed(() => this.fileNowPlaying() ? null : (this.stats()?.nowPlaying?.album ?? null));
  npProgress = computed(() => this.fileNowPlaying() ? this.audioProgress() : (this.stats()?.nowPlaying?.progress ?? 0));
  npElapsed  = computed(() => this.fileNowPlaying() ? this.audioElapsed() : (this.stats()?.nowPlaying?.elapsed ?? '0:00'));
  npDuration = computed(() => this.fileNowPlaying() ? this.audioDuration() : (this.stats()?.nowPlaying?.duration ?? '0:00'));
  npGradient = computed(() => this.fileNowPlaying()
    ? 'linear-gradient(135deg,#6c63ff,#3b82f6)'
    : (this.stats()?.nowPlaying?.gradient ?? 'linear-gradient(135deg,#6c63ff,#8b5cf6)'));
  npEmoji  = computed(() => this.fileNowPlaying() ? '🎵' : (this.stats()?.nowPlaying?.emoji ?? '🎵'));
  playIcon = computed(() => this.isPlaying() ? 'bi-pause-fill' : 'bi-play-fill');

  wfBars: { height: number }[] = Array.from({ length: 48 }, () => ({ height: Math.random() * 80 + 10 }));

  musicNews = [
    { source: 'Pitchfork · 30m',    title: "Kendrick's GNX dominates streaming for 10th week" },
    { source: 'NME · 2h',           title: 'Coachella 2026 lineup leaked — headliners confirmed' },
    { source: 'Rolling Stone · 4h', title: 'Vinyl sales hit highest point since 1987' },
  ];

  /* BEAT STUDIO STATE */

  synthOpen      = signal(false);
  seqPlaying     = signal(false);
  bpm            = signal(128);
  swing          = signal(0);
  stepCount      = signal(16);
  visualStep     = signal(-1);
  masterVol      = signal(0.75);
  reverbWet      = signal(0.2);
  delayWet       = signal(0.0);
  delayFeedback  = signal(0.35);
  selectedPreset = signal(0);
  drumTracks     = signal<DrumTrack[]>(this.buildDefaultTracks());

  synthOsc = signal<OscillatorType>('square');
  synthAtt = signal(0.01);
  synthDec = signal(0.15);
  synthSus = signal(0.65);
  synthRel = signal(0.4);
  synthVol = signal(0.55);

  pianoOctave = signal(4);
  activeKeys  = signal<Set<string>>(new Set());
  lastNote    = signal<string | null>(null);

  /* BEAT STORAGE & LAYERS */
  currentBeat = signal<Beat | null>(null);
  layers = signal<BeatLayer[]>([]);
  currentLayerIndex = signal(0);
  showSaveDialog = signal(false);
  showLoadDialog = signal(false);
  beatName = signal('');
  beatDescription = signal('');
  isSavingBeat = signal(false);
  isLoadingBeat = signal(false);

  /* INDUSTRY-STANDARD FEATURES */
  metronomeOn  = signal(false);
  isExporting  = signal(false);
  canUndo      = signal(false);
  canRedo      = signal(false);

  private undoStack: string[] = [];
  private redoStack: string[] = [];
  private tapTimes: number[] = [];
  private readonly autoSaveKey = 'nexus-beat-autosave';

  anySolo  = computed(() => this.drumTracks().some(t => t.solo));
  gridCols = computed(() => `90px 50px 26px 26px 60px repeat(${this.stepCount()}, 1fr)`);

  pianoKeys = computed(() => this.buildPianoKeys(this.pianoOctave()));
  stepIndices = computed(() => Array.from({ length: this.stepCount() }, (_, i) => i));

  readonly Math = Math;

  readonly oscTypes: { type: OscillatorType; label: string; icon: string }[] = [
    { type: 'sine',     label: 'Sine',     icon: '∿' },
    { type: 'square',   label: 'Square',   icon: '⊓' },
    { type: 'triangle', label: 'Triangle', icon: '△' },
    { type: 'sawtooth', label: 'Sawtooth', icon: '⋀' },
  ];

  readonly PRESETS: { name: string; steps: Record<string, number[]> }[] = [
    {
      name: '4/4 Basic',
      steps: {
        kick:    [3,0,0,0, 3,0,0,0, 3,0,0,0, 3,0,0,0],
        snare:   [0,0,0,0, 3,0,0,0, 0,0,0,0, 3,0,0,0],
        clap:    [0,0,0,0, 3,0,0,0, 0,0,0,0, 3,0,0,0],
        hihat:   [3,0,2,0, 3,0,2,0, 3,0,2,0, 3,0,2,0],
        openhat: [0,0,0,0, 0,0,0,2, 0,0,0,0, 0,0,0,2],
        perc:    [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        '808':   [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        ride:    [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        tom:     [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
      },
    },
    {
      name: 'Hip-Hop',
      steps: {
        kick:    [3,0,0,2, 0,0,3,0, 0,2,0,0, 3,0,0,0],
        snare:   [0,0,0,0, 3,0,0,2, 0,0,0,0, 3,0,0,0],
        clap:    [0,0,0,0, 3,0,0,0, 0,0,0,0, 3,0,0,0],
        hihat:   [0,2,0,2, 0,2,0,2, 0,2,0,2, 0,2,0,0],
        openhat: [0,0,0,0, 0,0,0,3, 0,0,0,0, 0,0,2,0],
        perc:    [2,0,0,0, 0,0,0,0, 2,0,0,0, 0,0,0,1],
        '808':   [3,0,0,0, 0,0,2,0, 0,0,0,0, 0,0,0,0],
        ride:    [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        tom:     [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
      },
    },
    {
      name: 'Trap',
      steps: {
        kick:    [3,0,0,0, 0,0,3,0, 0,0,2,0, 0,0,0,0],
        snare:   [0,0,0,0, 3,0,0,0, 0,0,0,0, 3,0,0,0],
        clap:    [0,0,0,0, 0,0,0,0, 0,0,0,0, 3,0,0,2],
        hihat:   [3,3,3,3, 3,3,3,3, 3,3,3,3, 3,3,3,3],
        openhat: [0,0,0,0, 0,0,0,2, 0,0,0,0, 0,0,2,0],
        perc:    [0,0,2,0, 0,0,0,0, 0,0,2,0, 0,0,0,1],
        '808':   [3,0,0,0, 0,0,3,0, 0,0,2,0, 0,0,0,0],
        ride:    [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        tom:     [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
      },
    },
    {
      name: 'House',
      steps: {
        kick:    [3,0,0,0, 3,0,0,0, 3,0,0,0, 3,0,0,0],
        snare:   [0,0,2,0, 0,0,2,0, 0,0,2,0, 0,0,2,0],
        clap:    [0,0,0,0, 3,0,0,0, 0,0,0,0, 3,0,0,0],
        hihat:   [3,3,3,3, 3,3,3,3, 3,3,3,3, 3,3,3,3],
        openhat: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        perc:    [0,2,0,0, 0,2,0,0, 0,2,0,0, 0,2,0,0],
        '808':   [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        ride:    [2,0,2,0, 2,0,2,0, 2,0,2,0, 2,0,2,0],
        tom:     [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
      },
    },
    {
      name: 'Breakbeat',
      steps: {
        kick:    [3,0,0,0, 0,0,3,0, 0,2,0,0, 0,0,0,0],
        snare:   [0,0,0,0, 3,0,0,2, 0,0,0,0, 3,0,2,0],
        clap:    [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        hihat:   [3,0,2,3, 0,2,0,3, 2,0,3,0, 3,0,2,3],
        openhat: [0,0,0,0, 0,0,0,0, 0,0,0,2, 0,0,0,0],
        perc:    [0,2,0,0, 2,0,0,0, 0,2,0,0, 2,0,0,0],
        '808':   [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        ride:    [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        tom:     [0,0,0,0, 0,0,0,0, 0,0,2,0, 0,0,0,2],
      },
    },
    {
      name: 'Drum & Bass',
      steps: {
        kick:    [3,0,0,0, 0,0,0,2, 0,0,0,0, 3,0,0,0],
        snare:   [0,0,0,0, 3,0,0,0, 0,0,0,0, 3,0,0,0],
        clap:    [0,0,0,0, 3,0,0,0, 0,0,0,0, 3,0,0,0],
        hihat:   [3,2,0,3, 2,0,3,2, 0,3,2,0, 3,2,0,3],
        openhat: [0,0,2,0, 0,2,0,0, 2,0,0,2, 0,0,2,0],
        perc:    [0,0,0,0, 0,1,0,0, 0,0,0,0, 0,1,0,1],
        '808':   [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        ride:    [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        tom:     [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
      },
    },
    {
      name: 'Afrobeats',
      steps: {
        kick:    [3,0,0,0, 0,0,3,0, 0,0,0,0, 3,0,0,0],
        snare:   [0,0,0,0, 3,0,0,0, 0,0,0,0, 3,0,0,0],
        clap:    [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        hihat:   [3,1,2,1, 3,1,2,1, 3,1,2,1, 3,1,2,1],
        openhat: [0,0,0,0, 0,0,0,2, 0,0,0,0, 0,0,0,2],
        perc:    [2,0,0,2, 0,0,2,0, 0,2,0,0, 2,0,0,0],
        '808':   [3,0,0,0, 0,0,0,0, 2,0,0,0, 0,0,0,0],
        ride:    [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        tom:     [0,0,0,0, 0,0,0,0, 0,0,2,0, 0,0,0,0],
      },
    },
    {
      name: 'R&B',
      steps: {
        kick:    [3,0,0,2, 0,0,3,0, 0,0,0,0, 3,0,0,0],
        snare:   [0,0,0,0, 3,0,0,0, 0,0,0,0, 3,0,0,0],
        clap:    [0,0,0,0, 2,0,0,0, 0,0,0,0, 2,0,0,0],
        hihat:   [2,0,2,0, 2,0,2,0, 2,0,2,0, 2,0,2,0],
        openhat: [0,0,0,0, 0,0,0,1, 0,0,0,0, 0,0,0,1],
        perc:    [0,0,0,0, 0,0,0,0, 0,0,1,0, 0,0,0,0],
        '808':   [3,0,0,0, 0,0,2,0, 0,0,0,0, 0,0,0,0],
        ride:    [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        tom:     [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
      },
    },
    {
      name: 'Lo-Fi',
      steps: {
        kick:    [3,0,0,0, 0,0,2,0, 3,0,0,0, 0,0,0,0],
        snare:   [0,0,0,0, 3,0,0,0, 0,0,0,0, 2,0,0,0],
        clap:    [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        hihat:   [1,0,2,0, 1,0,2,0, 1,0,2,0, 1,0,2,1],
        openhat: [0,0,0,0, 0,0,0,2, 0,0,0,0, 0,0,0,0],
        perc:    [0,0,0,1, 0,0,0,0, 0,0,0,1, 0,0,0,0],
        '808':   [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        ride:    [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0],
        tom:     [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
      },
    },
    {
      name: 'Reggaeton',
      steps: {
        kick:    [3,0,0,0, 3,0,0,0, 3,0,0,0, 3,0,0,0],
        snare:   [0,0,0,3, 0,0,0,3, 0,0,0,3, 0,0,0,3],
        clap:    [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        hihat:   [3,0,3,0, 3,0,3,0, 3,0,3,0, 3,0,3,0],
        openhat: [0,0,0,0, 0,0,0,2, 0,0,0,0, 0,0,0,2],
        perc:    [0,0,0,2, 0,0,0,2, 0,0,0,2, 0,0,0,2],
        '808':   [3,0,0,0, 0,0,0,0, 3,0,0,0, 0,0,0,0],
        ride:    [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        tom:     [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
      },
    },
    {
      name: 'Techno',
      steps: {
        kick:    [3,0,0,0, 3,0,0,0, 3,0,0,0, 3,0,0,0],
        snare:   [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        clap:    [0,0,0,0, 3,0,0,0, 0,0,0,0, 3,0,0,0],
        hihat:   [3,3,3,3, 3,3,3,3, 3,3,3,3, 3,3,3,3],
        openhat: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        perc:    [0,0,2,0, 0,0,0,0, 0,0,2,0, 0,0,0,1],
        '808':   [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        ride:    [2,0,2,0, 2,0,2,0, 2,0,2,0, 2,0,2,0],
        tom:     [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,2],
      },
    },
  ];

  /* Web Audio nodes */
  private audioCtx: AudioContext | null = null;
  private masterGain!: GainNode;
  private compressor!: DynamicsCompressorNode;
  private reverbGain!: GainNode;
  private reverbNode!: ConvolverNode;
  private delayNode!: DelayNode;
  private delayFBGain!: GainNode;
  private delayWetGain!: GainNode;
  private noiseBuffer: AudioBuffer | null = null;

  /* Sequencer scheduler */
  private schedulerTimer: ReturnType<typeof setInterval> | null = null;
  private currentStep = 0;
  private nextNoteTime = 0;
  private stepTimeouts: ReturnType<typeof setTimeout>[] = [];

  /* KEYBOARD SHORTCUTS */

  @HostListener('document:keydown', ['$event'])
  handleKeyboard(e: KeyboardEvent) {
    if (!this.synthOpen()) return;
    const tag = (e.target as HTMLElement).tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

    if (e.code === 'Space') {
      e.preventDefault();
      if (this.seqPlaying()) this.stopSequencer(); else this.startSequencer();
    } else if (e.code === 'KeyZ' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      if (e.shiftKey) this.redo(); else this.undo();
    } else if (e.code === 'Escape') {
      this.closeStudio();
    }
  }

  /* LIFECYCLE */

  ngOnInit() {
    this.api.getMusicStats().subscribe({ next: d => this.stats.set(d) });
    this.api.getTracks(5).subscribe({ next: d => this.tracks.set(d) });

    const initialLayer: BeatLayer = {
      name: 'Layer 1',
      bpm: 128,
      swing: 0,
      stepCount: 16,
      synth: {
        osc: 'square',
        attack: 0.01,
        decay: 0.15,
        sustain: 0.65,
        release: 0.4,
        volume: 0.55,
      },
      tracks: this.buildDefaultTracks(),
      pianoNotes: [],
      masterVolume: 0.75,
      reverbWet: 0.2,
      delayWet: 0,
      delayFeedback: 0.35,
    };
    this.layers.set([initialLayer]);

    this.audio.addEventListener('timeupdate', () => {
      const p = this.audio.duration ? (this.audio.currentTime / this.audio.duration) * 100 : 0;
      this.audioProgress.set(p);
      this.audioElapsed.set(this.formatTime(this.audio.currentTime));
    });
    this.audio.addEventListener('loadedmetadata', () => {
      this.audioDuration.set(this.formatTime(this.audio.duration));
    });
    this.audio.addEventListener('ended', () => {
      this.isPlaying.set(false); this.audioProgress.set(0); this.audioElapsed.set('0:00');
    });
    this.audio.addEventListener('play',  () => this.isPlaying.set(true));
    this.audio.addEventListener('pause', () => this.isPlaying.set(false));

    this.wfInterval = setInterval(() => {
      if (this.isPlaying()) {
        this.wfBars = this.wfBars.map(() => ({ height: Math.random() * 80 + 10 }));
      }
    }, 700);
  }

  ngOnDestroy() {
    if (this.wfInterval) clearInterval(this.wfInterval);
    this.audio.pause(); this.audio.src = '';
    this.stopSequencer();
    if (this.audioCtx) { this.audioCtx.close(); this.audioCtx = null; }
  }

  /* EXISTING AUDIO PLAYER */

  playFromFile(file: UploadedFile) {
    this.audio.src = this.api.getFileDownloadUrl(file._id);
    this.fileNowPlaying.set(file);
    this.audioProgress.set(0); this.audioElapsed.set('0:00'); this.audioDuration.set('0:00');
    this.audio.load(); this.audio.play().catch(() => {});
  }
  togglePlayPause() {
    if (!this.fileNowPlaying()) return;
    if (this.audio.paused) this.audio.play().catch(() => {}); else this.audio.pause();
  }
  seekBack()    { if (this.fileNowPlaying()) this.audio.currentTime = Math.max(0, this.audio.currentTime - 15); }
  seekForward() { if (this.fileNowPlaying()) this.audio.currentTime = Math.min(this.audio.duration || 0, this.audio.currentTime + 15); }
  seekToPercent(e: MouseEvent) {
    if (!this.fileNowPlaying() || !this.audio.duration) return;
    const bar = e.currentTarget as HTMLElement;
    this.audio.currentTime = (e.offsetX / bar.clientWidth) * this.audio.duration;
  }
  setNowPlaying(track: Track) {
    this.audio.pause(); this.audio.src = '';
    this.fileNowPlaying.set(null); this.isPlaying.set(false);
    this.stats.update(s => s ? {
      ...s, nowPlaying: {
        ...s.nowPlaying, title: track.title, artist: track.artist,
        album: track.album, gradient: track.gradient, emoji: track.emoji,
        progress: 0, elapsed: '0:00', duration: track.duration,
      },
    } : s);
  }

  /* BEAT STUDIO — OPEN / CLOSE */

  openStudio() {
    this.synthOpen.set(true);
    this.loadAutoSave();
  }
  closeStudio() {
    this.stopSequencer();
    this.autoSave();
    this.synthOpen.set(false);
  }

  /* BEAT STORAGE — SAVE / LOAD / LAYER MANAGEMENT */

  openSaveDialog() {
    this.beatName.set('');
    this.beatDescription.set('');
    this.showSaveDialog.set(true);
  }

  closeSaveDialog() {
    this.showSaveDialog.set(false);
  }

  saveBeat() {
    if (!this.beatName().trim()) {
      alert('Please enter a beat name');
      return;
    }

    this.isSavingBeat.set(true);

    const currentLayer: BeatLayer = {
      name: this.currentLayerIndex() === 0 ? 'Layer ' + (this.currentLayerIndex() + 1) : (this.layers()[this.currentLayerIndex()]?.name || 'Layer ' + (this.currentLayerIndex() + 1)),
      bpm: this.bpm(),
      swing: this.swing(),
      stepCount: this.stepCount(),
      synth: {
        osc: this.synthOsc(),
        attack: this.synthAtt(),
        decay: this.synthDec(),
        sustain: this.synthSus(),
        release: this.synthRel(),
        volume: this.synthVol(),
      },
      tracks: this.drumTracks(),
      pianoNotes: [],
      masterVolume: this.masterVol(),
      reverbWet: this.reverbWet(),
      delayWet: this.delayWet(),
      delayFeedback: this.delayFeedback(),
    };

    const updatedLayers = [...this.layers()];
    if (this.currentLayerIndex() < updatedLayers.length) {
      updatedLayers[this.currentLayerIndex()] = currentLayer;
    } else {
      updatedLayers.push(currentLayer);
    }

    const beatData: Beat = {
      name: this.beatName(),
      description: this.beatDescription(),
      bpm: this.bpm(),
      layers: updatedLayers,
      activeLayerIndex: this.currentLayerIndex(),
      category: 'electronic',
    };

    this.beatService.createBeat(beatData).subscribe({
      next: (savedBeat) => {
        this.currentBeat.set(savedBeat);
        this.isSavingBeat.set(false);
        this.showSaveDialog.set(false);
        alert(`Beat "${savedBeat.name}" saved successfully!`);
      },
      error: (err) => {
        this.isSavingBeat.set(false);
        alert('Error saving beat: ' + err.message);
      },
    });
  }

  openLoadDialog() {
    this.showLoadDialog.set(true);
    this.beatService.getBeats().subscribe({
      error: (err) => alert('Error loading beats: ' + err.message),
    });
  }

  closeLoadDialog() {
    this.showLoadDialog.set(false);
  }

  loadBeat(beat: Beat) {
    this.isLoadingBeat.set(true);

    this.beatService.getBeat(beat._id!).subscribe({
      next: (fullBeat) => {
        this.currentBeat.set(fullBeat);
        this.layers.set(fullBeat.layers);
        this.beatName.set(fullBeat.name);
        this.beatDescription.set(fullBeat.description || '');
        this.loadLayer(fullBeat.activeLayerIndex || 0);
        this.isLoadingBeat.set(false);
        this.showLoadDialog.set(false);
        alert(`Beat "${fullBeat.name}" loaded successfully!`);
      },
      error: (err) => {
        this.isLoadingBeat.set(false);
        alert('Error loading beat: ' + err.message);
      },
    });
  }

  /* LAYER MANAGEMENT */

  getCurrentLayer(): BeatLayer | null {
    const idx = this.currentLayerIndex();
    return this.layers()[idx] || null;
  }

  loadLayer(index: number) {
    if (index < 0 || index >= this.layers().length) return;
    const layer = this.layers()[index];
    if (!layer) return;

    this.currentLayerIndex.set(index);
    this.bpm.set(layer.bpm || 128);
    this.swing.set(layer.swing || 0);
    this.stepCount.set(layer.stepCount || 16);

    // Backward-compat: convert boolean steps to velocity numbers, add solo/pitch
    const tracks = layer.tracks.map(t => ({
      ...t,
      solo: t.solo ?? false,
      pitch: t.pitch ?? 0,
      steps: t.steps.map(s => typeof s === 'boolean' ? (s ? 3 : 0) : s),
    }));
    this.drumTracks.set(tracks as DrumTrack[]);

    this.masterVol.set(layer.masterVolume || 0.75);
    this.reverbWet.set(layer.reverbWet || 0.2);
    this.delayWet.set(layer.delayWet || 0);
    this.delayFeedback.set(layer.delayFeedback || 0.35);

    this.synthOsc.set(layer.synth.osc as OscillatorType);
    this.synthAtt.set(layer.synth.attack);
    this.synthDec.set(layer.synth.decay);
    this.synthSus.set(layer.synth.sustain);
    this.synthRel.set(layer.synth.release);
    this.synthVol.set(layer.synth.volume);
  }

  addNewLayer() {
    const newLayer: BeatLayer = {
      name: `Layer ${this.layers().length + 1}`,
      bpm: this.bpm(),
      swing: this.swing(),
      stepCount: this.stepCount(),
      synth: {
        osc: this.synthOsc(),
        attack: this.synthAtt(),
        decay: this.synthDec(),
        sustain: this.synthSus(),
        release: this.synthRel(),
        volume: this.synthVol(),
      },
      tracks: this.buildDefaultTracks(),
      pianoNotes: [],
      masterVolume: this.masterVol(),
      reverbWet: this.reverbWet(),
      delayWet: this.delayWet(),
      delayFeedback: this.delayFeedback(),
    };

    const beat = this.currentBeat();
    if (beat && beat._id) {
      this.beatService.addLayer(beat._id, newLayer.name).subscribe({
        next: (result) => {
          this.layers.set([...this.layers(), result.layer]);
          this.loadLayer(result.layerIndex);
        },
        error: (err) => alert('Error adding layer: ' + err.message),
      });
    } else {
      const updatedLayers = [...this.layers(), newLayer];
      this.layers.set(updatedLayers);
      this.loadLayer(updatedLayers.length - 1);
    }
  }

  duplicateCurrentLayer() {
    const currentIdx = this.currentLayerIndex();
    const layerToDupe = this.layers()[currentIdx];
    if (!layerToDupe) return;

    const beat = this.currentBeat();
    if (beat && beat._id) {
      this.beatService.duplicateLayer(beat._id, currentIdx).subscribe({
        next: (result) => {
          this.layers.set([...this.layers(), result.layer]);
          this.loadLayer(result.layerIndex);
        },
        error: (err) => alert('Error duplicating layer: ' + err.message),
      });
    } else {
      const duplicated = JSON.parse(JSON.stringify(layerToDupe));
      duplicated.name = `${layerToDupe.name} (Copy)`;
      const updatedLayers = [...this.layers(), duplicated];
      this.layers.set(updatedLayers);
      this.loadLayer(updatedLayers.length - 1);
    }
  }

  deleteCurrentLayer() {
    if (this.layers().length <= 1) { alert('Cannot delete the only layer!'); return; }
    if (!confirm('Delete this layer?')) return;

    const currentIdx = this.currentLayerIndex();
    const beat = this.currentBeat();
    if (beat && beat._id) {
      this.beatService.deleteLayer(beat._id, currentIdx).subscribe({
        next: (result) => {
          const updatedLayers = [...this.layers()];
          updatedLayers.splice(currentIdx, 1);
          this.layers.set(updatedLayers);
          this.loadLayer(result.activeLayerIndex);
        },
        error: (err) => alert('Error deleting layer: ' + err.message),
      });
    } else {
      const updatedLayers = [...this.layers()];
      updatedLayers.splice(currentIdx, 1);
      this.layers.set(updatedLayers);
      this.loadLayer(Math.max(0, currentIdx - 1));
    }
  }

  renameCurrentLayer(newName: string) {
    if (!newName.trim()) return;
    const layers = [...this.layers()];
    const idx = this.currentLayerIndex();
    if (idx >= 0 && idx < layers.length) {
      layers[idx] = { ...layers[idx], name: newName };
      this.layers.set(layers);

      const beat = this.currentBeat();
      if (beat && beat._id) {
        this.beatService.updateBeat(beat._id, { ...beat, layers }).subscribe({
          error: (err) => console.error('Error updating layer name:', err),
        });
      }
    }
  }

  /* STEP SEQUENCER — PATTERN EDITING */

  toggleStep(trackId: string, stepIdx: number) {
    this.pushUndo();
    this.drumTracks.update(tracks =>
      tracks.map(t => t.id === trackId
        ? { ...t, steps: t.steps.map((s, i) => i === stepIdx ? (s > 0 ? 0 : 3) : s) }
        : t
      )
    );
    this.autoSave();
  }

  cycleVelocity(event: MouseEvent, trackId: string, stepIdx: number) {
    event.preventDefault();
    this.pushUndo();
    this.drumTracks.update(tracks =>
      tracks.map(t => t.id === trackId
        ? { ...t, steps: t.steps.map((s, i) => {
            if (i !== stepIdx) return s;
            if (s === 0) return 3;
            if (s === 1) return 0;
            return s - 1;
          }) }
        : t
      )
    );
    this.autoSave();
  }

  setTrackVol(trackId: string, vol: number) {
    this.drumTracks.update(ts => ts.map(t => t.id === trackId ? { ...t, volume: vol } : t));
  }

  toggleMute(trackId: string) {
    this.drumTracks.update(ts => ts.map(t => t.id === trackId ? { ...t, muted: !t.muted } : t));
  }

  toggleSolo(trackId: string) {
    this.drumTracks.update(ts => ts.map(t => t.id === trackId ? { ...t, solo: !t.solo } : t));
  }

  setTrackPitch(trackId: string, pitch: number) {
    this.drumTracks.update(ts => ts.map(t => t.id === trackId ? { ...t, pitch } : t));
  }

  clearPattern() {
    this.pushUndo();
    this.drumTracks.update(ts => ts.map(t => ({ ...t, steps: Array(this.stepCount()).fill(0) })));
    this.autoSave();
  }

  setStepCount(count: number) {
    this.pushUndo();
    this.stepCount.set(count);
    this.drumTracks.update(ts => ts.map(t => {
      const steps = Array(count).fill(0);
      t.steps.forEach((v, i) => { if (i < count) steps[i] = v; });
      return { ...t, steps };
    }));
    this.autoSave();
  }

  loadPreset(idx: number) {
    this.pushUndo();
    this.selectedPreset.set(idx);
    const preset = this.PRESETS[idx];
    this.drumTracks.update(ts => ts.map(t => ({
      ...t,
      steps: preset.steps[t.id] ?? Array(this.stepCount()).fill(0),
    })));
    this.autoSave();
  }

  /* TAP TEMPO */

  tapTempo() {
    const now = performance.now();
    if (this.tapTimes.length > 0 && now - this.tapTimes[this.tapTimes.length - 1] > 2000) {
      this.tapTimes = [];
    }
    this.tapTimes.push(now);
    if (this.tapTimes.length > 5) this.tapTimes.shift();
    if (this.tapTimes.length >= 2) {
      const intervals: number[] = [];
      for (let i = 1; i < this.tapTimes.length; i++) {
        intervals.push(this.tapTimes[i] - this.tapTimes[i - 1]);
      }
      const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      this.bpm.set(Math.max(40, Math.min(300, Math.round(60000 / avg))));
    }
  }

  /* UNDO / REDO */

  private pushUndo() {
    this.undoStack.push(JSON.stringify(this.drumTracks()));
    if (this.undoStack.length > 50) this.undoStack.shift();
    this.redoStack = [];
    this.canUndo.set(true);
    this.canRedo.set(false);
  }

  undo() {
    if (this.undoStack.length === 0) return;
    this.redoStack.push(JSON.stringify(this.drumTracks()));
    this.drumTracks.set(JSON.parse(this.undoStack.pop()!));
    this.canUndo.set(this.undoStack.length > 0);
    this.canRedo.set(true);
    this.autoSave();
  }

  redo() {
    if (this.redoStack.length === 0) return;
    this.undoStack.push(JSON.stringify(this.drumTracks()));
    this.drumTracks.set(JSON.parse(this.redoStack.pop()!));
    this.canRedo.set(this.redoStack.length > 0);
    this.canUndo.set(true);
    this.autoSave();
  }

  /* RANDOMIZE PATTERN */

  randomizePattern() {
    this.pushUndo();
    const densities: Record<string, number> = {
      kick: 0.25, snare: 0.2, clap: 0.12, hihat: 0.5,
      openhat: 0.1, perc: 0.15, '808': 0.15, ride: 0.2, tom: 0.1,
    };
    this.drumTracks.update(ts => ts.map(t => ({
      ...t,
      steps: t.steps.map(() => {
        const d = densities[t.id] ?? 0.15;
        if (Math.random() < d) return Math.ceil(Math.random() * 3);
        return 0;
      }),
    })));
    this.autoSave();
  }

  /* EXPORT WAV */

  async exportWav() {
    this.isExporting.set(true);
    try {
      const sampleRate = 44100;
      const secPerStep = (60 / this.bpm()) / 4;
      const totalDuration = this.stepCount() * secPerStep + 1;
      const offCtx = new OfflineAudioContext(2, Math.ceil(totalDuration * sampleRate), sampleRate);

      const masterGain = offCtx.createGain();
      masterGain.gain.value = this.masterVol();
      const compressor = offCtx.createDynamicsCompressor();
      compressor.threshold.value = -14;
      compressor.ratio.value = 6;
      compressor.attack.value = 0.003;
      compressor.release.value = 0.2;
      masterGain.connect(compressor);
      compressor.connect(offCtx.destination);

      const noiseLen = sampleRate * 2;
      const noiseBuf = offCtx.createBuffer(1, noiseLen, sampleRate);
      const noiseData = noiseBuf.getChannelData(0);
      for (let i = 0; i < noiseLen; i++) noiseData[i] = Math.random() * 2 - 1;

      const hasSolo = this.drumTracks().some(t => t.solo);

      for (let step = 0; step < this.stepCount(); step++) {
        const swingDelay = (step % 2 === 1) ? (this.swing() / 100) * secPerStep * 0.67 : 0;
        const time = step * secPerStep + swingDelay;

        this.drumTracks().forEach(track => {
          const vel = track.steps[step];
          if (vel > 0 && !track.muted && (!hasSolo || track.solo)) {
            const v = track.volume * this.masterVol() * (vel / 3);
            const p = Math.pow(2, track.pitch / 12);
            this.hitDrumCtx(offCtx, masterGain, noiseBuf, track.id, time, v, p);
          }
        });
      }

      const buffer = await offCtx.startRendering();
      const wav = this.encodeWav(buffer);
      const blob = new Blob([wav], { type: 'audio/wav' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `beat-${this.bpm()}bpm-${Date.now()}.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      this.isExporting.set(false);
    }
  }

  /* AUTO-SAVE */

  private autoSave() {
    const data = {
      drumTracks: this.drumTracks(),
      bpm: this.bpm(),
      swing: this.swing(),
      stepCount: this.stepCount(),
      masterVol: this.masterVol(),
      reverbWet: this.reverbWet(),
      delayWet: this.delayWet(),
      delayFeedback: this.delayFeedback(),
      synthOsc: this.synthOsc(),
      synthAtt: this.synthAtt(),
      synthDec: this.synthDec(),
      synthSus: this.synthSus(),
      synthRel: this.synthRel(),
      synthVol: this.synthVol(),
      metronomeOn: this.metronomeOn(),
    };
    try { localStorage.setItem(this.autoSaveKey, JSON.stringify(data)); } catch { /* ignore */ }
  }

  private loadAutoSave() {
    try {
      const raw = localStorage.getItem(this.autoSaveKey);
      if (!raw) return;
      const d = JSON.parse(raw);
      if (d.drumTracks?.length) {
        const tracks = d.drumTracks.map((t: any) => ({
          ...t,
          solo: t.solo ?? false,
          pitch: t.pitch ?? 0,
          steps: (t.steps as any[]).map((s: any) => typeof s === 'boolean' ? (s ? 3 : 0) : s),
        }));
        this.drumTracks.set(tracks);
      }
      if (d.bpm) this.bpm.set(d.bpm);
      if (d.swing !== undefined) this.swing.set(d.swing);
      if (d.stepCount) this.stepCount.set(d.stepCount);
      if (d.masterVol !== undefined) this.masterVol.set(d.masterVol);
      if (d.reverbWet !== undefined) this.reverbWet.set(d.reverbWet);
      if (d.delayWet !== undefined) this.delayWet.set(d.delayWet);
      if (d.delayFeedback !== undefined) this.delayFeedback.set(d.delayFeedback);
      if (d.synthOsc) this.synthOsc.set(d.synthOsc);
      if (d.synthAtt !== undefined) this.synthAtt.set(d.synthAtt);
      if (d.synthDec !== undefined) this.synthDec.set(d.synthDec);
      if (d.synthSus !== undefined) this.synthSus.set(d.synthSus);
      if (d.synthRel !== undefined) this.synthRel.set(d.synthRel);
      if (d.synthVol !== undefined) this.synthVol.set(d.synthVol);
      if (d.metronomeOn !== undefined) this.metronomeOn.set(d.metronomeOn);
    } catch { /* ignore corrupt data */ }
  }

  /* SEQUENCER — SCHEDULER (LOOKAHEAD) */

  startSequencer() {
    this.ensureCtx();
    this.seqPlaying.set(true);
    this.currentStep = 0;
    this.nextNoteTime = this.audioCtx!.currentTime + 0.05;
    this.schedulerTimer = setInterval(() => this.runScheduler(), 25);
  }

  stopSequencer() {
    this.seqPlaying.set(false);
    if (this.schedulerTimer) { clearInterval(this.schedulerTimer); this.schedulerTimer = null; }
    this.stepTimeouts.forEach(t => clearTimeout(t));
    this.stepTimeouts = [];
    this.visualStep.set(-1);
  }

  private runScheduler() {
    const secPerStep = (60 / this.bpm()) / 4;
    while (this.nextNoteTime < this.audioCtx!.currentTime + 0.1) {
      this.scheduleStep(this.currentStep, this.nextNoteTime);
      this.currentStep = (this.currentStep + 1) % this.stepCount();
      this.nextNoteTime += secPerStep;
    }
  }

  private scheduleStep(step: number, baseTime: number) {
    const secPerStep = (60 / this.bpm()) / 4;
    const swingDelay = (step % 2 === 1) ? (this.swing() / 100) * secPerStep * 0.67 : 0;
    const time = baseTime + swingDelay;

    const delay = Math.max(0, (time - this.audioCtx!.currentTime) * 1000);
    const t = setTimeout(() => { if (this.seqPlaying()) this.visualStep.set(step); }, delay);
    this.stepTimeouts.push(t);

    const hasSolo = this.anySolo();

    this.drumTracks().forEach(track => {
      const vel = track.steps[step];
      if (vel > 0 && !track.muted && (!hasSolo || track.solo)) {
        const v = track.volume * this.masterVol() * (vel / 3);
        const p = Math.pow(2, track.pitch / 12);
        this.hitDrumLive(track.id, time, v, p);
      }
    });

    if (this.metronomeOn() && step % 4 === 0) {
      this.synthMetronome(time, step === 0);
    }
  }

  /* DRUM SYNTHESIS — LIVE (uses this.audioCtx / this.masterGain) */

  private hitDrumLive(id: string, time: number, vol: number, pitchMult: number) {
    const ctx = this.audioCtx!;
    const dest = this.masterGain;
    switch (id) {
      case 'kick':    this.synthKick(ctx, dest, null, time, vol, pitchMult); break;
      case 'snare':   this.synthSnare(ctx, dest, null, time, vol, pitchMult); break;
      case 'clap':    this.synthClap(ctx, dest, null, time, vol, pitchMult); break;
      case 'hihat':   this.synthHihat(ctx, dest, null, time, vol, false, pitchMult); break;
      case 'openhat': this.synthHihat(ctx, dest, null, time, vol, true, pitchMult); break;
      case 'perc':    this.synthPerc(ctx, dest, null, time, vol, pitchMult); break;
      case '808':     this.synth808(ctx, dest, time, vol, pitchMult); break;
      case 'ride':    this.synthRide(ctx, dest, null, time, vol, pitchMult); break;
      case 'tom':     this.synthTom(ctx, dest, time, vol, pitchMult); break;
    }
  }

  /* DRUM SYNTHESIS — OFFLINE (for WAV export) */

  private hitDrumCtx(ctx: BaseAudioContext, dest: AudioNode, noiseBuf: AudioBuffer,
                     id: string, time: number, vol: number, pitchMult: number) {
    switch (id) {
      case 'kick':    this.synthKick(ctx, dest, noiseBuf, time, vol, pitchMult); break;
      case 'snare':   this.synthSnare(ctx, dest, noiseBuf, time, vol, pitchMult); break;
      case 'clap':    this.synthClap(ctx, dest, noiseBuf, time, vol, pitchMult); break;
      case 'hihat':   this.synthHihat(ctx, dest, noiseBuf, time, vol, false, pitchMult); break;
      case 'openhat': this.synthHihat(ctx, dest, noiseBuf, time, vol, true, pitchMult); break;
      case 'perc':    this.synthPerc(ctx, dest, noiseBuf, time, vol, pitchMult); break;
      case '808':     this.synth808(ctx, dest, time, vol, pitchMult); break;
      case 'ride':    this.synthRide(ctx, dest, noiseBuf, time, vol, pitchMult); break;
      case 'tom':     this.synthTom(ctx, dest, time, vol, pitchMult); break;
    }
  }

  /* SYNTH ENGINES — parameterized for live + offline */

  private synthKick(ctx: BaseAudioContext, dest: AudioNode, _nb: AudioBuffer | null,
                    time: number, vol: number, p: number) {
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(dest);
    osc.frequency.setValueAtTime(160 * p, time);
    osc.frequency.exponentialRampToValueAtTime(0.001, time + 0.45);
    gain.gain.setValueAtTime(vol * 1.4, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.45);
    osc.start(time); osc.stop(time + 0.5);
  }

  private synthSnare(ctx: BaseAudioContext, dest: AudioNode, noiseBuf: AudioBuffer | null,
                     time: number, vol: number, p: number) {
    const osc     = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(200 * p, time);
    osc.frequency.exponentialRampToValueAtTime(0.001, time + 0.1);
    oscGain.gain.setValueAtTime(vol * 0.7, time);
    oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
    osc.connect(oscGain); oscGain.connect(dest);
    osc.start(time); osc.stop(time + 0.12);

    const noise       = ctx.createBufferSource();
    const noiseFilter = ctx.createBiquadFilter();
    const noiseGain   = ctx.createGain();
    noise.buffer = noiseBuf ?? this.getNoiseBuffer();
    noiseFilter.type = 'highpass'; noiseFilter.frequency.value = 1200 * p;
    noiseGain.gain.setValueAtTime(vol, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.22);
    noise.connect(noiseFilter); noiseFilter.connect(noiseGain); noiseGain.connect(dest);
    noise.start(time); noise.stop(time + 0.24);
  }

  private synthClap(ctx: BaseAudioContext, dest: AudioNode, noiseBuf: AudioBuffer | null,
                    time: number, vol: number, p: number) {
    [0, 0.011, 0.024].forEach(off => {
      const noise  = ctx.createBufferSource();
      const filter = ctx.createBiquadFilter();
      const gain   = ctx.createGain();
      noise.buffer = noiseBuf ?? this.getNoiseBuffer();
      filter.type = 'bandpass'; filter.frequency.value = 2000 * p; filter.Q.value = 0.6;
      gain.gain.setValueAtTime(vol * 0.55, time + off);
      gain.gain.exponentialRampToValueAtTime(0.001, time + off + 0.09);
      noise.connect(filter); filter.connect(gain); gain.connect(dest);
      noise.start(time + off); noise.stop(time + off + 0.1);
    });
  }

  private synthHihat(ctx: BaseAudioContext, dest: AudioNode, noiseBuf: AudioBuffer | null,
                     time: number, vol: number, open: boolean, p: number) {
    const noise  = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const gain   = ctx.createGain();
    noise.buffer = noiseBuf ?? this.getNoiseBuffer();
    filter.type = 'highpass'; filter.frequency.value = 7000 * p;
    const decay = open ? 0.45 : 0.055;
    gain.gain.setValueAtTime(vol * (open ? 0.28 : 0.35), time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + decay);
    noise.connect(filter); filter.connect(gain); gain.connect(dest);
    noise.start(time); noise.stop(time + decay + 0.01);
  }

  private synthPerc(ctx: BaseAudioContext, dest: AudioNode, _nb: AudioBuffer | null,
                    time: number, vol: number, p: number) {
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(320 * p, time);
    osc.frequency.exponentialRampToValueAtTime(80 * p, time + 0.1);
    gain.gain.setValueAtTime(vol * 0.75, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);
    osc.connect(gain); gain.connect(dest);
    osc.start(time); osc.stop(time + 0.2);
  }

  private synth808(ctx: BaseAudioContext, dest: AudioNode,
                   time: number, vol: number, p: number) {
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(55 * p, time);
    osc.frequency.exponentialRampToValueAtTime(0.001, time + 0.8);
    gain.gain.setValueAtTime(vol * 1.5, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.8);
    osc.connect(gain); gain.connect(dest);
    osc.start(time); osc.stop(time + 0.85);

    const osc2  = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(55 * p, time);
    osc2.frequency.exponentialRampToValueAtTime(0.001, time + 0.6);
    gain2.gain.setValueAtTime(vol * 0.5, time);
    gain2.gain.exponentialRampToValueAtTime(0.001, time + 0.6);
    osc2.connect(gain2); gain2.connect(dest);
    osc2.start(time); osc2.stop(time + 0.65);
  }

  private synthRide(ctx: BaseAudioContext, dest: AudioNode, noiseBuf: AudioBuffer | null,
                    time: number, vol: number, p: number) {
    const osc     = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(800 * p, time);
    oscGain.gain.setValueAtTime(vol * 0.15, time);
    oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.6);
    osc.connect(oscGain); oscGain.connect(dest);
    osc.start(time); osc.stop(time + 0.65);

    const noise  = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const gain   = ctx.createGain();
    noise.buffer = noiseBuf ?? this.getNoiseBuffer();
    filter.type = 'bandpass'; filter.frequency.value = 10000 * p; filter.Q.value = 1.5;
    gain.gain.setValueAtTime(vol * 0.25, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.8);
    noise.connect(filter); filter.connect(gain); gain.connect(dest);
    noise.start(time); noise.stop(time + 0.85);
  }

  private synthTom(ctx: BaseAudioContext, dest: AudioNode,
                   time: number, vol: number, p: number) {
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200 * p, time);
    osc.frequency.exponentialRampToValueAtTime(80 * p, time + 0.15);
    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);
    osc.connect(gain); gain.connect(dest);
    osc.start(time); osc.stop(time + 0.35);
  }

  private synthMetronome(time: number, accent: boolean) {
    const ctx = this.audioCtx!;
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(accent ? 1200 : 800, time);
    gain.gain.setValueAtTime(accent ? 0.3 : 0.15, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.03);
    osc.connect(gain); gain.connect(this.masterGain);
    osc.start(time); osc.stop(time + 0.04);
  }

  /* WAV ENCODER */

  private encodeWav(buffer: AudioBuffer): ArrayBuffer {
    const numCh = buffer.numberOfChannels;
    const sr = buffer.sampleRate;
    const bps = 16;
    const blockAlign = numCh * (bps / 8);
    const numFrames = buffer.length;
    const dataSize = numFrames * blockAlign;
    const ab = new ArrayBuffer(44 + dataSize);
    const v = new DataView(ab);

    this.wavStr(v, 0, 'RIFF');
    v.setUint32(4, 36 + dataSize, true);
    this.wavStr(v, 8, 'WAVE');
    this.wavStr(v, 12, 'fmt ');
    v.setUint32(16, 16, true);
    v.setUint16(20, 1, true);
    v.setUint16(22, numCh, true);
    v.setUint32(24, sr, true);
    v.setUint32(28, sr * blockAlign, true);
    v.setUint16(32, blockAlign, true);
    v.setUint16(34, bps, true);
    this.wavStr(v, 36, 'data');
    v.setUint32(40, dataSize, true);

    const channels: Float32Array[] = [];
    for (let ch = 0; ch < numCh; ch++) channels.push(buffer.getChannelData(ch));

    let off = 44;
    for (let i = 0; i < numFrames; i++) {
      for (let ch = 0; ch < numCh; ch++) {
        const s = Math.max(-1, Math.min(1, channels[ch][i]));
        v.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
        off += 2;
      }
    }
    return ab;
  }

  private wavStr(view: DataView, offset: number, str: string) {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  }

  /* SYNTH PIANO */

  playSynthNote(freq: number, noteId: string) {
    this.ensureCtx();
    const ctx  = this.audioCtx!;
    const time = ctx.currentTime;

    this.lastNote.set(noteId);
    this.activeKeys.update(s => new Set([...s, noteId]));

    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = this.synthOsc();
    osc.frequency.value = freq;

    const att = this.synthAtt();
    const dec = this.synthDec();
    const sus = this.synthSus();
    const rel = this.synthRel();
    const vol = this.synthVol() * this.masterVol();

    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(vol, time + att);
    gain.gain.linearRampToValueAtTime(vol * sus, time + att + dec);
    gain.gain.setValueAtTime(vol * sus, time + att + dec + 0.25);
    gain.gain.linearRampToValueAtTime(0, time + att + dec + 0.25 + rel);

    osc.connect(gain); gain.connect(this.masterGain);
    osc.start(time); osc.stop(time + att + dec + 0.25 + rel + 0.05);

    const highlightMs = Math.min(500, (att + dec + 0.25) * 1000);
    setTimeout(() => {
      this.activeKeys.update(s => { const n = new Set(s); n.delete(noteId); return n; });
    }, highlightMs);
  }

  shiftOctave(delta: number) {
    this.pianoOctave.update(o => Math.max(1, Math.min(7, o + delta)));
  }

  /* EFFECTS */

  setMasterVol(v: number) {
    this.masterVol.set(v);
    if (this.masterGain) this.masterGain.gain.value = v;
  }
  setReverbWet(v: number) {
    this.reverbWet.set(v);
    if (this.reverbGain) this.reverbGain.gain.value = v;
  }
  setDelayWet(v: number) {
    this.delayWet.set(v);
    if (this.delayWetGain) this.delayWetGain.gain.value = v;
  }
  setDelayFeedback(v: number) {
    this.delayFeedback.set(v);
    if (this.delayFBGain) this.delayFBGain.gain.value = v;
  }

  /* AUDIO CONTEXT SETUP */

  private ensureCtx() {
    if (!this.audioCtx) {
      this.audioCtx = new AudioContext();
      this.setupAudioChain();
    }
    if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
  }

  private setupAudioChain() {
    const ctx = this.audioCtx!;

    this.masterGain = ctx.createGain();
    this.masterGain.gain.value = this.masterVol();

    this.compressor = ctx.createDynamicsCompressor();
    this.compressor.threshold.value = -14;
    this.compressor.ratio.value     = 6;
    this.compressor.attack.value    = 0.003;
    this.compressor.release.value   = 0.2;

    this.reverbNode = ctx.createConvolver();
    this.reverbNode.buffer = this.buildImpulseResponse(2.0, 2.5);
    this.reverbGain = ctx.createGain();
    this.reverbGain.gain.value = this.reverbWet();

    this.delayNode = ctx.createDelay(2.0);
    this.delayNode.delayTime.value = 60 / this.bpm() / 2;
    this.delayFBGain = ctx.createGain();
    this.delayFBGain.gain.value = this.delayFeedback();
    this.delayWetGain = ctx.createGain();
    this.delayWetGain.gain.value = this.delayWet();

    this.masterGain.connect(this.compressor);

    this.masterGain.connect(this.reverbGain);
    this.reverbGain.connect(this.reverbNode);
    this.reverbNode.connect(this.compressor);

    this.masterGain.connect(this.delayWetGain);
    this.delayWetGain.connect(this.delayNode);
    this.delayNode.connect(this.delayFBGain);
    this.delayFBGain.connect(this.delayNode);
    this.delayNode.connect(this.compressor);

    this.compressor.connect(ctx.destination);
  }

  private buildImpulseResponse(duration: number, decay: number): AudioBuffer {
    const ctx = this.audioCtx!;
    const len = Math.floor(ctx.sampleRate * duration);
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
      }
    }
    return buf;
  }

  private getNoiseBuffer(): AudioBuffer {
    if (!this.noiseBuffer && this.audioCtx) {
      const ctx  = this.audioCtx;
      const len  = ctx.sampleRate * 2;
      const buf  = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      this.noiseBuffer = buf;
    }
    return this.noiseBuffer!;
  }

  /* PIANO KEYBOARD BUILDER */

  private buildPianoKeys(baseOctave: number): PianoKey[] {
    const ALL = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
    const NUM_WHITE = 14;
    const WW = 100 / NUM_WHITE;
    const BW = WW * 0.60;
    const keys: PianoKey[] = [];
    let wi = 0;

    for (let oct = baseOctave; oct <= baseOctave + 1; oct++) {
      for (let i = 0; i < ALL.length; i++) {
        const note    = ALL[i];
        const midi    = (oct + 1) * 12 + i;
        const freq    = 440 * Math.pow(2, (midi - 69) / 12);
        const isBlack = note.includes('#');
        const noteId  = `${note}${oct}`;
        const label   = (note === 'C') ? `C${oct}` : '';

        if (isBlack) {
          keys.push({ note: noteId, freq, isBlack: true, leftPct: wi * WW - BW / 2, widthPct: BW, label: '' });
        } else {
          keys.push({ note: noteId, freq, isBlack: false, leftPct: wi * WW, widthPct: WW, label });
          wi++;
        }
      }
    }
    return keys;
  }

  /* DEFAULTS */

  private buildDefaultTracks(): DrumTrack[] {
    const n = 16;
    return [
      { id: 'kick',    name: 'Kick',     color: '#ff4757', steps: Array(n).fill(0), volume: 0.9,  muted: false, solo: false, pitch: 0 },
      { id: 'snare',   name: 'Snare',    color: '#ff6b81', steps: Array(n).fill(0), volume: 0.8,  muted: false, solo: false, pitch: 0 },
      { id: 'clap',    name: 'Clap',     color: '#ffa502', steps: Array(n).fill(0), volume: 0.7,  muted: false, solo: false, pitch: 0 },
      { id: 'hihat',   name: 'Hi-Hat',   color: '#eccc68', steps: Array(n).fill(0), volume: 0.55, muted: false, solo: false, pitch: 0 },
      { id: 'openhat', name: 'Open Hat', color: '#7bed9f', steps: Array(n).fill(0), volume: 0.5,  muted: false, solo: false, pitch: 0 },
      { id: 'perc',    name: 'Perc',     color: '#70a1ff', steps: Array(n).fill(0), volume: 0.55, muted: false, solo: false, pitch: 0 },
      { id: '808',     name: '808 Bass', color: '#ff6348', steps: Array(n).fill(0), volume: 0.85, muted: false, solo: false, pitch: 0 },
      { id: 'ride',    name: 'Ride',     color: '#2ed573', steps: Array(n).fill(0), volume: 0.45, muted: false, solo: false, pitch: 0 },
      { id: 'tom',     name: 'Tom',      color: '#5352ed', steps: Array(n).fill(0), volume: 0.6,  muted: false, solo: false, pitch: 0 },
    ];
  }

  /* HELPERS */

  formatStreams(n: number): string {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000)     return (n / 1_000).toFixed(0) + 'K';
    return String(n);
  }

  formatTime(s: number): string {
    if (!isFinite(s)) return '0:00';
    return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`;
  }
}
