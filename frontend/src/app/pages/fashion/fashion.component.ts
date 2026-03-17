import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { NgClass, DecimalPipe } from '@angular/common';
import { ApiService }           from '../../services/api.service';
import { FashionStats, Look, Brand } from '../../models/fashion.model';
import { DesignLayer }          from '../../models/fashion.model';
import { UploadedFile }         from '../../models/files.model';
import { StatCardComponent }    from '../../shared/stat-card/stat-card.component';
import { FileManagerComponent } from '../../shared/file-manager/file-manager.component';

@Component({
  selector: 'app-fashion',
  standalone: true,
  imports: [NgClass, DecimalPipe, StatCardComponent, FileManagerComponent],
  templateUrl: './fashion.component.html',
  styleUrls: ['./fashion.component.scss'],
})
export class FashionComponent implements OnInit, OnDestroy {
  protected api = inject(ApiService);

  /* Existing page data */
  stats  = signal<FashionStats | null>(null);
  looks  = signal<Look[]>([]);
  brands = signal<Brand[]>([]);

  editorial = [
    { source: 'Vogue · SS26',   title: "Quiet luxury meets streetwear in Milan's new collections" },
    { source: 'WWD · 3h',       title: 'How Gen Z is redefining the luxury handbag market'        },
    { source: 'Hypebeast · 5h', title: 'Supreme × Loewe collab officially confirmed'              },
  ];

  /* Design Studio state */
  studioOpen   = signal(false);
  designName   = signal('Untitled Design');
  layers       = signal<DesignLayer[]>([]);
  selectedId   = signal<string | null>(null);
  canvasBg     = signal('#f8f4f0');
  newColor     = signal('#ff0080');
  newText      = signal('New Text');
  newFontFamily = signal("'DM Serif Display', serif");
  newFontSize  = signal(48);
  storageFiles = signal<UploadedFile[]>([]);
  saveStatus   = signal<'idle' | 'saving' | 'saved' | 'error'>('idle');
  undoStack    = signal<string[]>([]);

  selectedLayer  = computed(() => this.layers().find(l => l.id === this.selectedId()) ?? null);
  storageImages  = computed(() => this.storageFiles().filter(f => f.mimetype?.startsWith('image/')));
  layersReversed = computed(() => [...this.layers()].reverse());

  readonly CW = 560;
  readonly CH = 720;
  readonly Math = Math;

  readonly colorSwatches = [
    '#ff0080', '#ff6b35', '#f59e0b', '#10b981',
    '#06b6d4', '#3b82f6', '#8b5cf6', '#e879f9',
    '#ffffff', '#000000', '#1a1a2e', '#e8d5b7',
    '#f4c2c2', '#b7d5e8', '#d5e8b7', '#e8e4d5',
  ];

  readonly bgPresets = [
    '#ffffff', '#f8f4f0', '#f0f4f8', '#1a1a2e',
    '#0d0d14', '#fdf4e7', '#e8f4f0', '#f4e8f0',
    '#111111', '#fffbf0', '#f0fff4', '#fff0f5',
  ];

  private blobUrls: string[] = [];

  /* Lifecycle */
  ngOnInit() {
    this.api.getFashionStats().subscribe({ next: d => this.stats.set(d) });
    this.api.getLooks(6).subscribe({ next: d => this.looks.set(d) });
    this.api.getBrands().subscribe({ next: d => this.brands.set(d) });
  }

  ngOnDestroy() {
    this.blobUrls.forEach(url => URL.revokeObjectURL(url));
  }

  /* Existing methods */
  toggleSave(look: Look) {
    this.api.toggleSaveLook(look._id).subscribe({
      next: updated => this.looks.update(list => list.map(l => l._id === updated._id ? updated : l)),
    });
  }

  trendEmoji(trend: string): string {
    return ({ Hot: '🔥', Rising: '↑', Steady: '✦', Declining: '↓' } as Record<string, string>)[trend] ?? '';
  }

  /* DESIGN STUDIO */

  openStudio() {
    this.studioOpen.set(true);
    this.api.getFiles('fashion').subscribe({
      next: files => this.storageFiles.set(files),
      error: () => {},
    });
  }

  closeStudio() {
    this.studioOpen.set(false);
    this.blobUrls.forEach(url => URL.revokeObjectURL(url));
    this.blobUrls = [];
    this.layers.set([]);
    this.selectedId.set(null);
    this.undoStack.set([]);
    this.saveStatus.set('idle');
  }

  /* Add Layers */

  addColorLayer() {
    this.pushUndo();
    this._addLayer({
      type: 'color', name: 'Color Block', src: '', text: '',
      fontSize: 0, fontFamily: '', color: this.newColor(),
      x: 60, y: 60, width: 200, height: 200,
      rotation: 0, opacity: 1, visible: true, locked: false,
    });
  }

  addTextLayer() {
    this.pushUndo();
    this._addLayer({
      type: 'text', name: this.newText() || 'Text', src: '',
      text: this.newText() || 'Fashion Text',
      color: this.newColor(),
      fontSize: this.newFontSize(),
      fontFamily: this.newFontFamily(),
      x: 60, y: 100, width: 440, height: 120,
      rotation: 0, opacity: 1, visible: true, locked: false,
    });
  }

  onImageFile(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    Array.from(input.files).forEach(file => {
      if (!file.type.startsWith('image/')) return;
      const url = URL.createObjectURL(file);
      this.blobUrls.push(url);
      this.pushUndo();
      this._addLayer({
        type: 'image', name: file.name.replace(/\.\w+$/, ''), src: url, color: '',
        text: '', fontSize: 0, fontFamily: '',
        x: 40, y: 40, width: 220, height: 280,
        rotation: 0, opacity: 1, visible: true, locked: false,
      });
    });
    input.value = '';
  }

  addStorageLayer(file: UploadedFile) {
    this.pushUndo();
    this._addLayer({
      type: 'image', name: file.filename, src: this.api.getFileDownloadUrl(file._id), color: '',
      text: '', fontSize: 0, fontFamily: '',
      x: 40, y: 40, width: 220, height: 280,
      rotation: 0, opacity: 1, visible: true, locked: false,
    });
  }

  private _addLayer(opts: Omit<DesignLayer, 'id'>) {
    const id = `l-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
    this.layers.update(list => [...list, { id, ...opts }]);
    this.selectedId.set(id);
  }

  /* Layer Selection & Mutation */

  selectLayer(id: string)  { this.selectedId.set(id); }
  deselectAll()            { this.selectedId.set(null); }

  patchLayer(id: string, patch: Partial<DesignLayer>) {
    this.layers.update(list => list.map(l => l.id === id ? { ...l, ...patch } : l));
  }

  /* Drag */

  onLayerDown(event: MouseEvent, layer: DesignLayer) {
    event.stopPropagation();
    this.selectLayer(layer.id);
    if (layer.locked) return;

    this.pushUndo();
    const sx = event.clientX, sy = event.clientY;
    const ox = layer.x,       oy = layer.y;

    const move = (e: MouseEvent) => {
      this.patchLayer(layer.id, {
        x: Math.max(0, Math.min(this.CW - layer.width,  ox + (e.clientX - sx))),
        y: Math.max(0, Math.min(this.CH - layer.height, oy + (e.clientY - sy))),
      });
    };
    const up = () => {
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseup',  up);
    };
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup',   up);
  }

  /* Resize */

  onResizeDown(event: MouseEvent, layer: DesignLayer,
               handle: 'nw'|'ne'|'sw'|'se'|'n'|'s'|'e'|'w') {
    event.stopPropagation();
    this.pushUndo();

    const sx = event.clientX, sy = event.clientY;
    const { x: ox, y: oy, width: ow, height: oh } = layer;
    const MIN = 20;

    const move = (e: MouseEvent) => {
      const dx = e.clientX - sx, dy = e.clientY - sy;
      let x = ox, y = oy, w = ow, h = oh;

      if (handle.includes('e'))  { w = Math.max(MIN, ow + dx); }
      if (handle.includes('s'))  { h = Math.max(MIN, oh + dy); }
      if (handle.includes('w'))  { const nw = Math.max(MIN, ow - dx); x = ox + (ow - nw); w = nw; }
      if (handle.includes('n'))  { const nh = Math.max(MIN, oh - dy); y = oy + (oh - nh); h = nh; }

      this.patchLayer(layer.id, { x, y, width: w, height: h });
    };
    const up = () => {
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseup',   up);
    };
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup',   up);
  }

  /* Layer Panel Operations */

  bringForward(id: string) {
    this.layers.update(list => {
      const i = list.findIndex(l => l.id === id);
      if (i >= list.length - 1) return list;
      const c = [...list];
      [c[i], c[i + 1]] = [c[i + 1], c[i]];
      return c;
    });
  }

  sendBack(id: string) {
    this.layers.update(list => {
      const i = list.findIndex(l => l.id === id);
      if (i <= 0) return list;
      const c = [...list];
      [c[i], c[i - 1]] = [c[i - 1], c[i]];
      return c;
    });
  }

  toggleVisible(id: string) {
    const cur = this.layers().find(l => l.id === id)?.visible ?? true;
    this.patchLayer(id, { visible: !cur });
  }

  toggleLock(id: string) {
    const cur = this.layers().find(l => l.id === id)?.locked ?? false;
    this.patchLayer(id, { locked: !cur });
  }

  dupeLayer(id: string) {
    const orig = this.layers().find(l => l.id === id);
    if (!orig) return;
    this.pushUndo();
    const { id: _id, ...rest } = orig;
    this._addLayer({ ...rest, name: orig.name + ' Copy', x: orig.x + 20, y: orig.y + 20 });
  }

  deleteLayer(id: string) {
    this.pushUndo();
    this.layers.update(list => list.filter(l => l.id !== id));
    if (this.selectedId() === id) this.selectedId.set(null);
  }

  clearAll() {
    this.pushUndo();
    this.layers.set([]);
    this.selectedId.set(null);
  }

  /* Undo */

  pushUndo() {
    const snap = JSON.stringify(this.layers());
    this.undoStack.update(s => {
      const next = [...s, snap];
      if (next.length > 25) next.shift();
      return next;
    });
  }

  undo() {
    const stack = this.undoStack();
    if (!stack.length) return;
    const prev = stack[stack.length - 1];
    this.undoStack.update(s => s.slice(0, -1));
    this.layers.set(JSON.parse(prev));
    if (!this.layers().find(l => l.id === this.selectedId())) {
      this.selectedId.set(null);
    }
  }

  /* Export & Save */

  async exportPng() {
    try {
      const canvas = await this._renderCanvas();
      const a = document.createElement('a');
      a.download = `${this.designName()}.png`;
      a.href = canvas.toDataURL('image/png');
      a.click();
    } catch (e) { console.error('Export failed', e); }
  }

  async saveToLibrary() {
    if (this.saveStatus() === 'saving') return;
    this.saveStatus.set('saving');
    try {
      const canvas = await this._renderCanvas();
      const blob = await new Promise<Blob>((res, rej) =>
        canvas.toBlob(b => b ? res(b) : rej(new Error('toBlob returned null')), 'image/png')
      );
      const file = new File([blob], `${this.designName()}.png`, { type: 'image/png' });
      this.api.uploadFile(file, 'fashion').subscribe({
        next: () => {
          this.saveStatus.set('saved');
          setTimeout(() => this.saveStatus.set('idle'), 2500);
          this.api.getFiles('fashion').subscribe({
            next: files => this.storageFiles.set(files),
            error: () => {},
          });
        },
        error: () => {
          this.saveStatus.set('error');
          setTimeout(() => this.saveStatus.set('idle'), 2500);
        },
      });
    } catch (e) {
      console.error('Save failed', e);
      this.saveStatus.set('error');
      setTimeout(() => this.saveStatus.set('idle'), 2500);
    }
  }

  /* Canvas Rendering (for export) */

  private async _renderCanvas(): Promise<HTMLCanvasElement> {
    const canvas = document.createElement('canvas');
    canvas.width  = this.CW;
    canvas.height = this.CH;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = this.canvasBg();
    ctx.fillRect(0, 0, this.CW, this.CH);

    for (const layer of this.layers()) {
      if (!layer.visible) continue;
      ctx.save();
      ctx.globalAlpha = layer.opacity;
      const cx = layer.x + layer.width  / 2;
      const cy = layer.y + layer.height / 2;
      ctx.translate(cx, cy);
      ctx.rotate((layer.rotation * Math.PI) / 180);

      if (layer.type === 'color') {
        ctx.fillStyle = layer.color;
        ctx.fillRect(-layer.width / 2, -layer.height / 2, layer.width, layer.height);

      } else if (layer.type === 'image' && layer.src) {
        try {
          const img = await this._loadImg(layer.src);
          ctx.drawImage(img, -layer.width / 2, -layer.height / 2, layer.width, layer.height);
        } catch { /* skip failed images */ }

      } else if (layer.type === 'text' && layer.text) {
        ctx.fillStyle = layer.color || '#000000';
        ctx.font = `${layer.fontSize}px ${layer.fontFamily}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const words = layer.text.split(' ');
        const lineH = layer.fontSize * 1.25;
        let lines: string[] = [];
        let cur = '';
        for (const w of words) {
          const test = cur ? `${cur} ${w}` : w;
          if (ctx.measureText(test).width > layer.width - 8) {
            if (cur) lines.push(cur);
            cur = w;
          } else { cur = test; }
        }
        if (cur) lines.push(cur);
        const totalH = lines.length * lineH;
        lines.forEach((line, i) => {
          const lx = 0;
          const ly = -totalH / 2 + i * lineH + lineH / 2;
          ctx.fillText(line, lx, ly);
        });
      }
      ctx.restore();
    }
    return canvas;
  }

  private _loadImg(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload  = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }
}
