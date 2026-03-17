import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { NgClass } from '@angular/common';
import { ApiService }           from '../../services/api.service';
import { MusicStats, Track }    from '../../models/music.model';
import { DrumTrack, PianoKey }  from '../../models/music.model';
import { UploadedFile }         from '../../models/files.model';
import { StatCardComponent }    from '../../shared/stat-card/stat-card.component';
import { FileManagerComponent } from '../../shared/file-manager/file-manager.component';

@Component({
  selector: 'app-music',
  standalone: true,
  imports: [NgClass, StatCardComponent, FileManagerComponent],
  templateUrl: './music.component.html',
  styleUrls: ['./music.component.scss'],
})
export class MusicComponent implements OnInit, OnDestroy {
  private api = inject(ApiService);
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
        kick:    [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0],
        snare:   [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
        clap:    [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
        hihat:   [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0],
        openhat: [0,0,0,0, 0,0,0,1, 0,0,0,0, 0,0,0,1],
        perc:    [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
      },
    },
    {
      name: 'Hip-Hop',
      steps: {
        kick:    [1,0,0,1, 0,0,1,0, 0,1,0,0, 1,0,0,0],
        snare:   [0,0,0,0, 1,0,0,1, 0,0,0,0, 1,0,0,0],
        clap:    [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
        hihat:   [0,1,0,1, 0,1,0,1, 0,1,0,1, 0,1,0,0],
        openhat: [0,0,0,0, 0,0,0,1, 0,0,0,0, 0,0,1,0],
        perc:    [1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,1],
      },
    },
    {
      name: 'Trap',
      steps: {
        kick:    [1,0,0,0, 0,0,1,0, 0,0,1,0, 0,0,0,0],
        snare:   [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
        clap:    [0,0,0,0, 0,0,0,0, 0,0,0,0, 1,0,0,1],
        hihat:   [1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1],
        openhat: [0,0,0,0, 0,0,0,1, 0,0,0,0, 0,0,1,0],
        perc:    [0,0,1,0, 0,0,0,0, 0,0,1,0, 0,0,0,1],
      },
    },
    {
      name: 'House',
      steps: {
        kick:    [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0],
        snare:   [0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0],
        clap:    [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
        hihat:   [1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1],
        openhat: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        perc:    [0,1,0,0, 0,1,0,0, 0,1,0,0, 0,1,0,0],
      },
    },
    {
      name: 'Breakbeat',
      steps: {
        kick:    [1,0,0,0, 0,0,1,0, 0,1,0,0, 0,0,0,0],
        snare:   [0,0,0,0, 1,0,0,1, 0,0,0,0, 1,0,1,0],
        clap:    [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        hihat:   [1,0,1,1, 0,1,0,1, 1,0,1,0, 1,0,1,1],
        openhat: [0,0,0,0, 0,0,0,0, 0,0,0,1, 0,0,0,0],
        perc:    [0,1,0,0, 1,0,0,0, 0,1,0,0, 1,0,0,0],
      },
    },
    {
      name: 'Drum & Bass',
      steps: {
        kick:    [1,0,0,0, 0,0,0,1, 0,0,0,0, 1,0,0,0],
        snare:   [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
        clap:    [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
        hihat:   [1,1,0,1, 1,0,1,1, 0,1,1,0, 1,1,0,1],
        openhat: [0,0,1,0, 0,1,0,0, 1,0,0,1, 0,0,1,0],
        perc:    [0,0,0,0, 0,1,0,0, 0,0,0,0, 0,1,0,1],
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

  /* LIFECYCLE */

  ngOnInit() {
    this.api.getMusicStats().subscribe({ next: d => this.stats.set(d) });
    this.api.getTracks(5).subscribe({ next: d => this.tracks.set(d) });

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
        this.wfBars = this.wfBars.map(b => ({ height: Math.random() * 80 + 10 }));
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

  openStudio()  { this.synthOpen.set(true); }
  closeStudio() {
    this.stopSequencer();
    this.synthOpen.set(false);
  }

  /* SEQUENCER — PATTERN EDITING */

  toggleStep(trackId: string, stepIdx: number) {
    this.drumTracks.update(tracks =>
      tracks.map(t => t.id === trackId
        ? { ...t, steps: t.steps.map((s, i) => i === stepIdx ? !s : s) }
        : t
      )
    );
  }

  setTrackVol(trackId: string, vol: number) {
    this.drumTracks.update(ts => ts.map(t => t.id === trackId ? { ...t, volume: vol } : t));
  }

  toggleMute(trackId: string) {
    this.drumTracks.update(ts => ts.map(t => t.id === trackId ? { ...t, muted: !t.muted } : t));
  }

  clearPattern() {
    this.drumTracks.update(ts => ts.map(t => ({ ...t, steps: Array(this.stepCount()).fill(false) })));
  }

  setStepCount(count: number) {
    this.stepCount.set(count);
    this.drumTracks.update(ts => ts.map(t => {
      const steps = Array(count).fill(false);
      t.steps.forEach((v, i) => { if (i < count) steps[i] = v; });
      return { ...t, steps };
    }));
  }

  loadPreset(idx: number) {
    this.selectedPreset.set(idx);
    const preset = this.PRESETS[idx];
    this.drumTracks.update(ts => ts.map(t => ({
      ...t,
      steps: (preset.steps[t.id] ?? Array(16).fill(0)).map(Boolean),
    })));
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

    this.drumTracks().forEach(track => {
      if (track.steps[step] && !track.muted) {
        this.hitDrum(track.id, time, track.volume * this.masterVol());
      }
    });
  }

  /* DRUM SYNTHESIS (Web Audio API) */

  private hitDrum(id: string, time: number, vol: number) {
    switch (id) {
      case 'kick':    this.synthKick(time, vol); break;
      case 'snare':   this.synthSnare(time, vol); break;
      case 'clap':    this.synthClap(time, vol); break;
      case 'hihat':   this.synthHihat(time, vol, false); break;
      case 'openhat': this.synthHihat(time, vol, true); break;
      case 'perc':    this.synthPerc(time, vol); break;
    }
  }

  private synthKick(time: number, vol: number) {
    const ctx = this.audioCtx!;
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(this.masterGain);
    osc.frequency.setValueAtTime(160, time);
    osc.frequency.exponentialRampToValueAtTime(0.001, time + 0.45);
    gain.gain.setValueAtTime(vol * 1.4, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.45);
    osc.start(time); osc.stop(time + 0.5);
  }

  private synthSnare(time: number, vol: number) {
    const ctx = this.audioCtx!;
    const osc     = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(200, time);
    osc.frequency.exponentialRampToValueAtTime(0.001, time + 0.1);
    oscGain.gain.setValueAtTime(vol * 0.7, time);
    oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
    osc.connect(oscGain); oscGain.connect(this.masterGain);
    osc.start(time); osc.stop(time + 0.12);
    const noise       = ctx.createBufferSource();
    const noiseFilter = ctx.createBiquadFilter();
    const noiseGain   = ctx.createGain();
    noise.buffer = this.getNoiseBuffer();
    noiseFilter.type = 'highpass'; noiseFilter.frequency.value = 1200;
    noiseGain.gain.setValueAtTime(vol, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.22);
    noise.connect(noiseFilter); noiseFilter.connect(noiseGain); noiseGain.connect(this.masterGain);
    noise.start(time); noise.stop(time + 0.24);
  }

  private synthClap(time: number, vol: number) {
    const ctx = this.audioCtx!;
    [0, 0.011, 0.024].forEach(off => {
      const noise  = ctx.createBufferSource();
      const filter = ctx.createBiquadFilter();
      const gain   = ctx.createGain();
      noise.buffer = this.getNoiseBuffer();
      filter.type = 'bandpass'; filter.frequency.value = 2000; filter.Q.value = 0.6;
      gain.gain.setValueAtTime(vol * 0.55, time + off);
      gain.gain.exponentialRampToValueAtTime(0.001, time + off + 0.09);
      noise.connect(filter); filter.connect(gain); gain.connect(this.masterGain);
      noise.start(time + off); noise.stop(time + off + 0.1);
    });
  }

  private synthHihat(time: number, vol: number, open: boolean) {
    const ctx    = this.audioCtx!;
    const noise  = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const gain   = ctx.createGain();
    noise.buffer = this.getNoiseBuffer();
    filter.type = 'highpass'; filter.frequency.value = 7000;
    const decay = open ? 0.45 : 0.055;
    gain.gain.setValueAtTime(vol * (open ? 0.28 : 0.35), time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + decay);
    noise.connect(filter); filter.connect(gain); gain.connect(this.masterGain);
    noise.start(time); noise.stop(time + decay + 0.01);
  }

  private synthPerc(time: number, vol: number) {
    const ctx  = this.audioCtx!;
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, time);
    osc.frequency.exponentialRampToValueAtTime(80, time + 0.1);
    gain.gain.setValueAtTime(vol * 0.75, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);
    osc.connect(gain); gain.connect(this.masterGain);
    osc.start(time); osc.stop(time + 0.2);
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
      { id: 'kick',    name: 'Kick',     color: '#ff4757', steps: Array(n).fill(false), volume: 0.9, muted: false },
      { id: 'snare',   name: 'Snare',    color: '#ff6b81', steps: Array(n).fill(false), volume: 0.8, muted: false },
      { id: 'clap',    name: 'Clap',     color: '#ffa502', steps: Array(n).fill(false), volume: 0.7, muted: false },
      { id: 'hihat',   name: 'Hi-Hat',   color: '#eccc68', steps: Array(n).fill(false), volume: 0.55, muted: false },
      { id: 'openhat', name: 'Open Hat', color: '#7bed9f', steps: Array(n).fill(false), volume: 0.5,  muted: false },
      { id: 'perc',    name: 'Perc',     color: '#70a1ff', steps: Array(n).fill(false), volume: 0.55, muted: false },
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
