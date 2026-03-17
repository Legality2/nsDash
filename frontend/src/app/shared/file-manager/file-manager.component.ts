import { Component, OnInit, Input, Output, EventEmitter, inject, signal } from '@angular/core';
import { ApiService, UploadedFile } from '../../services/api.service';

@Component({
  selector: 'app-file-manager',
  standalone: true,
  imports: [],
  template: `
    <div class="panel fm-panel">

      <!-- Panel header -->
      <div class="panel__head">
        <span class="panel__title">
          <i class="bi bi-folder2-open fm-icon"></i>
          File Manager
          <span class="fm-badge">{{ files().length }}</span>
        </span>
        <button class="panel__action" (click)="toggleExpanded()">
          {{ expanded() ? 'Collapse ▲' : 'Expand ▼' }}
        </button>
      </div>

      @if (expanded()) {
        <div class="panel__body">

          <!-- Drop zone -->
          <div class="fm-dropzone"
               [class.fm-dropzone--active]="isDragging()"
               (dragover)="onDragOver($event)"
               (dragleave)="onDragLeave($event)"
               (drop)="onDrop($event)"
               (click)="fileInput.click()">
            <i class="bi bi-cloud-upload fm-drop-icon"></i>
            <div class="fm-drop-text">
              @if (uploadCount() > 0) {
                <span class="fm-uploading">
                  <span class="fm-spinner"></span>
                  Uploading {{ uploadCount() }} file{{ uploadCount() > 1 ? 's' : '' }}…
                </span>
              } @else {
                Drop files here or <strong>click to browse</strong>
              }
            </div>
            <div class="fm-drop-hint">Max 50 MB · Any file type · Category: <em>{{ category }}</em></div>
            <input #fileInput type="file" multiple hidden (change)="onFileSelect($event)">
          </div>

          <!-- Error -->
          @if (error()) {
            <div class="fm-error">
              <i class="bi bi-exclamation-circle"></i> {{ error() }}
            </div>
          }

          <!-- File list -->
          @if (files().length > 0) {
            <table class="data-table fm-table">
              <thead>
                <tr>
                  <th>File</th>
                  <th>Size</th>
                  <th>Date</th>
                  <th style="text-align:right">Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (f of files(); track f._id) {
                  <tr>
                    <td>
                      <div class="fm-file-cell">
                        <i class="bi {{ fileIcon(f.mimetype) }} fm-file-icon"></i>
                        <span class="fm-file-name">{{ f.filename }}</span>
                      </div>
                    </td>
                    <td class="fm-meta">{{ formatSize(f.size) }}</td>
                    <td class="fm-meta">{{ formatDate(f.uploadedAt) }}</td>
                    <td>
                      <div class="fm-actions">
                        @if (isAudio(f.mimetype)) {
                          <button class="fm-btn fm-btn--play"
                                  title="Play"
                                  (click)="playFile.emit(f)">
                            <i class="bi bi-play-fill"></i>
                          </button>
                        }
                        <a [href]="downloadUrl(f._id)"
                           target="_blank"
                           class="fm-btn fm-btn--dl"
                           title="Download"
                           (click)="$event.stopPropagation()">
                          <i class="bi bi-download"></i>
                        </a>
                        <button class="fm-btn fm-btn--del"
                                title="Delete"
                                (click)="deleteFile(f._id)">
                          <i class="bi bi-trash3"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          } @else if (uploadCount() === 0) {
            <div class="fm-empty">
              <i class="bi bi-archive fm-empty-icon"></i>
              <div>No files uploaded yet for <strong>{{ category }}</strong>.</div>
            </div>
          }

        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }

    .fm-panel { margin-top: 20px; }

    .fm-icon { margin-right: 6px; }

    .fm-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 18px;
      height: 18px;
      padding: 0 5px;
      border-radius: 99px;
      background: var(--page-accent, #2a9d8f);
      color: #fff;
      font-family: 'DM Mono', monospace;
      font-size: 0.6rem;
      margin-left: 8px;
      vertical-align: middle;
    }

    /* ── Drop zone ── */
    .fm-dropzone {
      border: 2px dashed var(--border);
      border-radius: 8px;
      padding: 24px 20px;
      text-align: center;
      cursor: pointer;
      transition: border-color 0.2s, background 0.2s;
      margin-bottom: 16px;
      user-select: none;

      &:hover, &.fm-dropzone--active {
        border-color: var(--page-accent, #2a9d8f);
        background: rgba(0, 0, 0, 0.015);
      }
    }
    .fm-drop-icon {
      font-size: 1.8rem;
      color: var(--muted);
      display: block;
      margin-bottom: 8px;
      pointer-events: none;
    }
    .fm-drop-text {
      font-size: 0.82rem;
      color: var(--ink);
      pointer-events: none;
      strong { color: var(--page-accent, #2a9d8f); }
    }
    .fm-drop-hint {
      font-family: 'DM Mono', monospace;
      font-size: 0.62rem;
      color: var(--muted);
      margin-top: 5px;
      letter-spacing: 0.05em;
      pointer-events: none;
      em { font-style: normal; color: var(--page-accent, #2a9d8f); }
    }

    /* ── Uploading indicator ── */
    .fm-uploading {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      color: var(--page-accent, #2a9d8f);
      font-weight: 700;
    }
    .fm-spinner {
      width: 14px;
      height: 14px;
      border: 2px solid currentColor;
      border-top-color: transparent;
      border-radius: 50%;
      display: inline-block;
      animation: fm-spin 0.7s linear infinite;
    }
    @keyframes fm-spin { to { transform: rotate(360deg); } }

    /* ── Error ── */
    .fm-error {
      background: rgba(212, 85, 106, 0.08);
      color: #a83348;
      border-radius: 6px;
      padding: 8px 12px;
      font-size: 0.78rem;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    /* ── File table ── */
    .fm-table { margin-top: 4px; }

    .fm-file-cell {
      display: flex;
      align-items: center;
      gap: 9px;
    }
    .fm-file-icon {
      color: var(--page-accent, #2a9d8f);
      font-size: 1rem;
      flex-shrink: 0;
    }
    .fm-file-name {
      font-size: 0.8rem;
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 280px;
    }
    .fm-meta {
      font-family: 'DM Mono', monospace;
      font-size: 0.7rem;
      color: var(--muted);
    }

    /* ── Row actions ── */
    .fm-actions {
      display: flex;
      gap: 6px;
      justify-content: flex-end;
    }
    .fm-btn {
      width: 28px;
      height: 28px;
      border-radius: 6px;
      border: 1px solid var(--border);
      background: white;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 0.8rem;
      text-decoration: none;
      color: var(--ink);
      transition: background 0.15s, color 0.15s, border-color 0.15s;
      flex-shrink: 0;

      &--play:hover {
        background: var(--page-accent, #2a9d8f);
        color: #fff;
        border-color: var(--page-accent, #2a9d8f);
      }
      &--dl:hover {
        background: var(--page-accent, #2a9d8f);
        color: #fff;
        border-color: var(--page-accent, #2a9d8f);
      }
      &--del:hover {
        background: var(--accent-rose, #d4556a);
        color: #fff;
        border-color: var(--accent-rose, #d4556a);
      }
    }

    /* ── Empty state ── */
    .fm-empty {
      text-align: center;
      padding: 24px 16px;
      color: var(--muted);
      font-size: 0.8rem;
      line-height: 1.6;
    }
    .fm-empty-icon {
      display: block;
      font-size: 1.8rem;
      margin-bottom: 8px;
      opacity: 0.4;
    }
  `],
})
export class FileManagerComponent implements OnInit {
  @Input()  category = 'general';
  @Output() playFile = new EventEmitter<UploadedFile>();

  private api = inject(ApiService);

  files       = signal<UploadedFile[]>([]);
  expanded    = signal(false);
  isDragging  = signal(false);
  uploadCount = signal(0);
  error       = signal<string | null>(null);

  ngOnInit() { this.loadFiles(); }

  loadFiles() {
    this.api.getFiles(this.category).subscribe({
      next: files => this.files.set(files),
      error: ()   => {},
    });
  }

  toggleExpanded() {
    this.expanded.update(v => !v);
  }

  onDragOver(e: DragEvent) {
    e.preventDefault();
    this.isDragging.set(true);
  }

  onDragLeave(e: DragEvent) {
    // Only clear when leaving the dropzone itself, not a child
    if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) {
      this.isDragging.set(false);
    }
  }

  onDrop(e: DragEvent) {
    e.preventDefault();
    this.isDragging.set(false);
    const files = Array.from(e.dataTransfer?.files ?? []);
    files.forEach(f => this.uploadFile(f));
  }

  onFileSelect(e: Event) {
    const input = e.target as HTMLInputElement;
    Array.from(input.files ?? []).forEach(f => this.uploadFile(f));
    input.value = '';
  }

  uploadFile(file: File) {
    this.error.set(null);
    this.uploadCount.update(n => n + 1);

    this.api.uploadFile(file, this.category).subscribe({
      next: uploaded => {
        this.files.update(list => [uploaded, ...list]);
        this.uploadCount.update(n => n - 1);
      },
      error: () => {
        this.error.set('Upload failed. Check file size (max 50 MB) and try again.');
        this.uploadCount.update(n => n - 1);
      },
    });
  }

  deleteFile(id: string) {
    this.error.set(null);
    this.api.deleteFile(id).subscribe({
      next: () => this.files.update(list => list.filter(f => f._id !== id)),
      error: () => this.error.set('Delete failed. Please try again.'),
    });
  }

  downloadUrl(id: string): string {
    return this.api.getFileDownloadUrl(id);
  }

  formatSize(bytes: number): string {
    if (bytes >= 1_000_000) return (bytes / 1_000_000).toFixed(1) + ' MB';
    if (bytes >= 1_000)     return (bytes / 1_000).toFixed(0) + ' KB';
    return bytes + ' B';
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  }

  isAudio(mimetype: string = ''): boolean {
    return mimetype.startsWith('audio/');
  }

  fileIcon(mimetype: string = ''): string {
    if (mimetype.startsWith('image/'))                                         return 'bi-file-image';
    if (mimetype.includes('pdf'))                                              return 'bi-file-pdf';
    if (mimetype.includes('spreadsheet') || mimetype.includes('excel')
        || mimetype.includes('csv'))                                           return 'bi-file-spreadsheet';
    if (mimetype.includes('word') || mimetype.includes('document'))            return 'bi-file-word';
    if (mimetype.includes('zip') || mimetype.includes('rar')
        || mimetype.includes('7z') || mimetype.includes('tar'))                return 'bi-file-zip';
    if (mimetype.startsWith('video/'))                                         return 'bi-file-play';
    if (mimetype.startsWith('audio/'))                                         return 'bi-file-music';
    if (mimetype.startsWith('text/'))                                          return 'bi-file-text';
    return 'bi-file-earmark';
  }
}
