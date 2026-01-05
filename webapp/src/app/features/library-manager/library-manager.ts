import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http'; // Still needed? Maybe not if fully moved
import { FormsModule } from '@angular/forms';
import { PlaylistService, PlaylistTrack } from '../../core/services/playlist.service';
import { EspService } from '../../core/services/esp.service';

@Component({
  selector: 'app-library-manager',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './library-manager.html',
  styles: [`
    .song-list { max-height: 75vh; overflow-y: auto; }
    .cover-img { width: 40px; height: 40px; object-fit: cover; border-radius: 4px; }
    .status-badge { width: 80px; text-align: center; }
  `]
})
export class LibraryManagerComponent implements OnInit {
  playlist: PlaylistTrack[] = [];
  espIp: string = '';

  constructor(
    private playlistService: PlaylistService,
    private espService: EspService
  ) { }

  ngOnInit() {
    this.playlistService.playlist$.subscribe(list => {
      this.playlist = list;
    });
    this.espIp = this.espService.getIp();
  }

  updateIp() {
    this.espService.setIp(this.espIp);
  }

  // File Linking Logic
  triggerFileSelect(trackId: string) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'audio/*';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        this.playlistService.linkFile(trackId, file);
      }
    };
    input.click();
  }

  removeTrack(id: string) {
    this.playlistService.removeTrack(id);
  }

  clearPlaylist() {
    if (confirm('¿Borrar toda la lista?')) {
      this.playlistService.clearPlaylist();
    }
  }

  async syncToEsp() {
    this.updateIp(); // Ensure IP is current

    const tracksToUpload = this.playlist.filter(t => t.status === 'linked' && t.localFile);

    if (tracksToUpload.length === 0) {
      alert('No hay canciones listas para subir (vincula archivos MP3 primero).');
      return;
    }

    for (const track of tracksToUpload) {
      if (!track.localFile) continue;

      // Filename: Artist - Title.mp3 (Sanitized)
      const safeName = `${track.artist} - ${track.name}.mp3`.replace(/[^a-zA-Z0-9.\- ]/g, '');

      track.status = 'uploaded'; // Set to uploading/optimistic for now. Ideally should be 'uploading'

      // Subscribe to upload
      try {
        await new Promise<void>((resolve, reject) => {
          this.espService.uploadFile(track.localFile!, safeName).subscribe({
            next: (progress) => {
              // Could update progress here if we added a progress field to PlaylistTrack
              if (progress === 100) resolve();
            },
            error: (err) => {
              console.error('Upload failed', err);
              track.status = 'linked'; // Revert
              resolve(); // Don't break loop, just skip
            }
          });
        });
        track.status = 'uploaded';

        // Add to history
        this.espService.addToHistory({
          name: track.name,
          artist: track.artist,
          cover: track.cover
        });

      } catch (e) {
        // Handled in error callback
      }
    }
  }
}
