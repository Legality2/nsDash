import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

export interface BeatLayer {
  name: string;
  bpm?: number;
  swing: number;
  stepCount: number;
  synth: {
    osc: string;
    attack: number;
    decay: number;
    sustain: number;
    release: number;
    volume: number;
  };
  tracks: Array<{
    id: string;
    name: string;
    color: string;
    volume: number;
    muted: boolean;
    solo: boolean;
    pitch: number;
    steps: number[];
  }>;
  pianoNotes: Array<{
    key: string;
    octave: number;
    startStep: number;
    duration: number;
  }>;
  masterVolume: number;
  reverbWet: number;
  delayWet: number;
  delayFeedback: number;
}

export interface Beat {
  _id?: string;
  name: string;
  description?: string;
  creator?: string;
  public?: boolean;
  bpm: number;
  timeSignature?: string;
  layers: BeatLayer[];
  activeLayerIndex: number;
  tags?: string[];
  category?: string;
  plays?: number;
  likes?: string[];
  duration?: number;
  isTemplate?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class BeatService {
  private apiUrl = '/api/music/beats';
  
  // State signals
  beats = signal<Beat[]>([]);
  currentBeat = signal<Beat | null>(null);
  isLoading = signal(false);
  error = signal<string | null>(null);
  
  constructor(private http: HttpClient) {}
  
  /**
   * Load all beats (public + user's own)
   */
  getBeats(category?: string, tags?: string[]): Observable<Beat[]> {
    this.isLoading.set(true);
    this.error.set(null);
    
    let url = this.apiUrl;
    const params = new URLSearchParams();
    
    if (category && category !== 'all') {
      params.append('category', category);
    }
    if (tags && tags.length > 0) {
      tags.forEach(tag => params.append('tags', tag));
    }
    
    if (params.toString()) {
      url += '?' + params.toString();
    }
    
    return this.http.get<Beat[]>(url).pipe(
      tap((data) => {
        this.beats.set(data);
        this.isLoading.set(false);
      }),
      catchError((err) => {
        this.error.set(err.message);
        this.isLoading.set(false);
        return of([]);
      })
    );
  }
  
  /**
   * Load a single beat by ID
   */
  getBeat(id: string): Observable<Beat> {
    this.isLoading.set(true);
    this.error.set(null);
    
    return this.http.get<Beat>(`${this.apiUrl}/${id}`).pipe(
      tap((data) => {
        this.currentBeat.set(data);
        this.isLoading.set(false);
      }),
      catchError((err) => {
        this.error.set(err.message);
        this.isLoading.set(false);
        throw err;
      })
    );
  }
  
  /**
   * Create a new beat
   */
  createBeat(beat: Beat): Observable<Beat> {
    this.isLoading.set(true);
    this.error.set(null);
    
    return this.http.post<Beat>(this.apiUrl, beat).pipe(
      tap((data) => {
        const currentBeats = this.beats();
        this.beats.set([data, ...currentBeats]);
        this.currentBeat.set(data);
        this.isLoading.set(false);
      }),
      catchError((err) => {
        this.error.set(err.message);
        this.isLoading.set(false);
        throw err;
      })
    );
  }
  
  /**
   * Update an existing beat
   */
  updateBeat(id: string, beat: Partial<Beat>): Observable<Beat> {
    this.isLoading.set(true);
    this.error.set(null);
    
    return this.http.put<Beat>(`${this.apiUrl}/${id}`, beat).pipe(
      tap((data) => {
        const currentBeats = this.beats();
        const updatedBeats = currentBeats.map(b => b._id === id ? data : b);
        this.beats.set(updatedBeats);
        if (this.currentBeat()?._id === id) {
          this.currentBeat.set(data);
        }
        this.isLoading.set(false);
      }),
      catchError((err) => {
        this.error.set(err.message);
        this.isLoading.set(false);
        throw err;
      })
    );
  }
  
  /**
   * Delete a beat
   */
  deleteBeat(id: string): Observable<void> {
    this.isLoading.set(true);
    this.error.set(null);
    
    return new Observable(observer => {
      this.http.delete<void>(`${this.apiUrl}/${id}`).subscribe({
        next: () => {
          const currentBeats = this.beats();
          this.beats.set(currentBeats.filter(b => b._id !== id));
          if (this.currentBeat()?._id === id) {
            this.currentBeat.set(null);
          }
          this.isLoading.set(false);
          observer.next();
          observer.complete();
        },
        error: (err) => {
          this.error.set(err.message);
          this.isLoading.set(false);
          observer.error(err);
        }
      });
    });
  }
  
  /**
   * Add a new layer to a beat
   */
  addLayer(beatId: string, layerName?: string): Observable<{ layer: BeatLayer; layerIndex: number }> {
    this.isLoading.set(true);
    this.error.set(null);
    
    return this.http.post<{ layer: BeatLayer; layerIndex: number }>(
      `${this.apiUrl}/${beatId}/layers`,
      { layerName }
    ).pipe(
      tap((data) => {
        const beat = this.currentBeat();
        if (beat) {
          beat.layers.push(data.layer);
          this.currentBeat.set({ ...beat });
        }
        this.isLoading.set(false);
      }),
      catchError((err) => {
        this.error.set(err.message);
        this.isLoading.set(false);
        throw err;
      })
    );
  }
  
  /**
   * Duplicate a layer in a beat
   */
  duplicateLayer(beatId: string, layerIndex: number): Observable<{ layer: BeatLayer; layerIndex: number }> {
    this.isLoading.set(true);
    this.error.set(null);
    
    return this.http.post<{ layer: BeatLayer; layerIndex: number }>(
      `${this.apiUrl}/${beatId}/layers/duplicate`,
      { layerIndex }
    ).pipe(
      tap((data) => {
        const beat = this.currentBeat();
        if (beat) {
          beat.layers.push(data.layer);
          this.currentBeat.set({ ...beat });
        }
        this.isLoading.set(false);
      }),
      catchError((err) => {
        this.error.set(err.message);
        this.isLoading.set(false);
        throw err;
      })
    );
  }
  
  /**
   * Delete a layer from a beat
   */
  deleteLayer(beatId: string, layerIndex: number): Observable<{ message: string; activeLayerIndex: number }> {
    this.isLoading.set(true);
    this.error.set(null);
    
    return this.http.delete<{ message: string; activeLayerIndex: number }>(
      `${this.apiUrl}/${beatId}/layers`,
      { body: { layerIndex } }
    ).pipe(
      tap((data) => {
        const beat = this.currentBeat();
        if (beat) {
          beat.layers.splice(layerIndex, 1);
          beat.activeLayerIndex = data.activeLayerIndex;
          this.currentBeat.set({ ...beat });
        }
        this.isLoading.set(false);
      }),
      catchError((err) => {
        this.error.set(err.message);
        this.isLoading.set(false);
        throw err;
      })
    );
  }
  
  /**
   * Like or unlike a beat
   */
  likeBeat(beatId: string): Observable<{ likes: number; isLiked: boolean }> {
    return this.http.post<{ likes: number; isLiked: boolean }>(
      `${this.apiUrl}/${beatId}/like`,
      {}
    );
  }
  
  /**
   * Increment play count
   */
  recordPlay(beatId: string): Observable<{ plays: number }> {
    return this.http.post<{ plays: number }>(
      `${this.apiUrl}/${beatId}/play`,
      {}
    );
  }
}
