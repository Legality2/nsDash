import { Injectable, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { UploadedFile } from '../models/files.model';

@Injectable({ providedIn: 'root' })
export class FilesService {
  private api = inject(ApiService);

  files     = signal<UploadedFile[]>([]);
  isLoading = signal<boolean>(false);
  error     = signal<string | null>(null);

  loadFiles(category?: string): void {
    this.isLoading.set(true);
    this.api.getFiles(category).subscribe({
      next: files => { this.files.set(files); this.isLoading.set(false); },
      error: ()   => { this.isLoading.set(false); },
    });
  }

  uploadFile(file: File, category: string): Observable<UploadedFile> {
    return this.api.uploadFile(file, category);
  }

  deleteFile(id: string): Observable<{ message: string }> {
    return this.api.deleteFile(id);
  }

  getDownloadUrl(id: string): string {
    return this.api.getFileDownloadUrl(id);
  }
}
