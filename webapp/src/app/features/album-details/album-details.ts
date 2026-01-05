import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { SpotifyService } from '../../core/services/spotify.service';
import { PlaylistService } from '../../core/services/playlist.service';

@Component({
  selector: 'app-album-details',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container-fluid p-4" *ngIf="album">
      <!-- Header -->
      <div class="d-flex align-items-end mb-4 gap-4">
        <img [src]="album.images[0]?.url" class="shadow-lg rounded" style="width: 200px; height: 200px;">
        <div>
          <h5 class="text-uppercase text-muted small fw-bold">Álbum</h5>
          <h1 class="display-4 fw-bold mb-2">{{ album.name }}</h1>
          <div class="d-flex align-items-center text-muted">
            <span class="fw-bold text-white">{{ album.artists[0].name }}</span>
            <span class="mx-2">•</span>
            <span>{{ album.release_date | date:'yyyy' }}</span>
            <span class="mx-2">•</span>
            <span>{{ album.total_tracks }} canciones</span>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="mb-4 d-flex gap-3">
        <button class="btn btn-success rounded-pill px-4 py-2 fw-bold text-black" (click)="addAllToPlaylist()">
          <i class="bi bi-plus-lg"></i> Añadir todo a Playlist
        </button>
        <button class="btn btn-outline-light rounded-pill px-4 py-2 fw-bold" (click)="goToPlaylist()">
          <i class="bi bi-music-note-list"></i> Ver Playlist
        </button>
      </div>

      <!-- Tracks List -->
      <div class="list-group list-group-flush">
        <div *ngFor="let track of tracks; let i = index" class="list-group-item bg-transparent text-white border-0 d-flex align-items-center py-2 hover-bg">
          <div class="text-muted text-end me-3" style="width: 30px;">{{ i + 1 }}</div>
          <div class="flex-grow-1">
            <div class="fw-bold">{{ track.name }}</div>
            <div class="small text-muted">{{ track.artists[0].name }}</div>
          </div>
          <button class="btn btn-sm btn-outline-light rounded-pill" (click)="addToPlaylist(track)">
            <i class="bi bi-plus"></i>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; background: linear-gradient(to bottom, #404040, #121212); min-height: 100vh; color: white; }
    .hover-bg:hover { background-color: rgba(255,255,255,0.1) !important; border-radius: 5px; }
  `]
})
export class AlbumDetailsComponent implements OnInit {
  album: any;
  tracks: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private spotify: SpotifyService,
    private playlistService: PlaylistService
  ) { }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const albumId = params.get('id');
      if (albumId) {
        this.loadAlbum(albumId);
      }
    });
  }

  loadAlbum(id: string) {
    this.spotify.getAlbum(id).subscribe(album => this.album = album);
    this.spotify.getAlbumTracks(id).subscribe(res => this.tracks = res.items);
  }

  addToPlaylist(track: any) {
    this.playlistService.addTrack(track, this.album);
    // Visual feedback? Toast?
  }

  addAllToPlaylist() {
    this.tracks.forEach(track => {
      this.playlistService.addTrack(track, this.album);
    });
    this.goToPlaylist();
  }

  goToPlaylist() {
    this.router.navigate(['/playlist']);
  }
}
