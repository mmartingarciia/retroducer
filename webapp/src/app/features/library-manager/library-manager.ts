import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpEventType, HttpHeaders, HttpParams } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
// @ts-ignore
import * as jsmediatags from 'jsmediatags/dist/jsmediatags.min.js';

interface SongFile {
  file: File;
  title: string;
  artist: string;
  album: string;
  cover?: string;
  status: 'pending' | 'uploading' | 'done' | 'error';
  progress?: number;
  matchedSpotifyId?: string;
}

interface SpotifyTrack {
  name: string;
  artist: string;
  id: string;
}

@Component({
  selector: 'app-library-manager',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './library-manager.html',
  styles: [`
    .song-list { max-height: 60vh; overflow-y: auto; }
    .cover-img { width: 50px; height: 50px; object-fit: cover; border-radius: 4px; }
    .progress { height: 5px; }
  `]
})
export class LibraryManagerComponent {
  songs: SongFile[] = [];
  espIp: string = '192.168.4.1'; // Default AP IP

  // Spotify Config
  spotifyClientId: string = '';
  spotifyClientSecret: string = '';
  spotifyPlaylistId: string = '';
  spotifyTracks: SpotifyTrack[] = [];

  get matchPercentage(): number {
    if (this.spotifyTracks.length === 0) return 0;
    const matches = this.songs.filter(s => s.matchedSpotifyId).length;
    return Math.round((matches / this.spotifyTracks.length) * 100);
  }

  constructor(private http: HttpClient) {
    const savedId = localStorage.getItem('spotify_client_id');
    const savedSecret = localStorage.getItem('spotify_client_secret');
    if (savedId) this.spotifyClientId = savedId;
    if (savedSecret) this.spotifyClientSecret = savedSecret;
  }

  onFilesSelected(event: any) {
    const files = event.target.files;
    if (files) {
      for (let i = 0; i < files.length; i++) {
        this.processFile(files[i]);
      }
    }
  }

  async processFile(file: File) {
    if (!file.type.startsWith('audio/') && !file.name.endsWith('.mp3')) return;
    const metadata = await this.readTags(file);
    this.songs.push({
      file: file,
      title: metadata.title || file.name,
      artist: metadata.artist || 'Unknown Artist',
      album: metadata.album || 'Unknown Album',
      cover: metadata.cover,
      status: 'pending',
      progress: 0
    });
    this.matchSongs();
  }

  async fetchSpotifyPlaylist() {
    if (!this.spotifyClientId || !this.spotifyClientSecret || !this.spotifyPlaylistId) {
      alert('Please fill in Client ID, Secret and Playlist!');
      return;
    }

    // Save creds
    localStorage.setItem('spotify_client_id', this.spotifyClientId);
    localStorage.setItem('spotify_client_secret', this.spotifyClientSecret);

    try {
      // 1. Get Token
      const body = new HttpParams()
        .set('grant_type', 'client_credentials')
        .set('client_id', this.spotifyClientId)
        .set('client_secret', this.spotifyClientSecret);

      const tokenRes: any = await this.http.post('https://accounts.spotify.com/api/token', body, {
        headers: new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' })
      }).toPromise();

      const token = tokenRes.access_token;

      // 2. Parse Playlist ID from URL if needed
      let id = this.spotifyPlaylistId;
      if (id.includes('playlist/')) {
        id = id.split('playlist/')[1].split('?')[0];
      }

      // 3. Get Tracks
      const playlistRes: any = await this.http.get(`https://api.spotify.com/v1/playlists/${id}/tracks`, {
        headers: new HttpHeaders({ 'Authorization': `Bearer ${token}` })
      }).toPromise();

      this.spotifyTracks = playlistRes.items.map((item: any) => ({
        name: item.track.name,
        artist: item.track.artists[0].name,
        id: item.track.id
      }));

      console.log('Spotify Tracks Loaded:', this.spotifyTracks);
      this.matchSongs();

    } catch (e) {
      console.error(e);
      alert('Error fetching playlist. Check credentials.');
    }
  }

  matchSongs() {
    // Simple loose matching
    this.songs.forEach(song => {
      const match = this.spotifyTracks.find(t =>
        t.name.toLowerCase().includes(song.title.toLowerCase()) ||
        song.title.toLowerCase().includes(t.name.toLowerCase())
      );
      if (match) {
        song.matchedSpotifyId = match.id;
        // Optionally update metadata from Spotify?
      }
    });
  }

  readTags(file: File): Promise<{ title?: string, artist?: string, album?: string, cover?: string }> {
    return new Promise((resolve) => {
      jsmediatags.read(file as any, {
        onSuccess: (tag: any) => {
          let coverUrl = '';
          if (tag.tags.picture) {
            const { data, format } = tag.tags.picture;
            let base64String = '';
            for (let i = 0; i < data.length; i++) {
              base64String += String.fromCharCode(data[i]);
            }
            coverUrl = `data:${format};base64,${window.btoa(base64String)}`;
          }
          resolve({
            title: tag.tags.title,
            artist: tag.tags.artist,
            album: tag.tags.album,
            cover: coverUrl
          });
        },
        onError: () => resolve({})
      });
    });
  }

  async uploadAll() {
    for (const song of this.songs) {
      if (song.status === 'pending') {
        await this.uploadSong(song);
      }
    }
  }

  uploadSong(song: SongFile): Promise<void> {
    return new Promise((resolve) => {
      song.status = 'uploading';
      const formData = new FormData();
      // Ensure filename is safe (remove special chars)
      const safeName = song.file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      formData.append('file', song.file, safeName);

      this.http.post(`http://${this.espIp}/upload`, formData, {
        reportProgress: true,
        observe: 'events',
        responseType: 'text'
      }).subscribe({
        next: (event: any) => {
          if (event.type === HttpEventType.UploadProgress && event.total) {
            song.progress = Math.round(100 * event.loaded / event.total);
          } else if (event.type === HttpEventType.Response) {
            song.status = 'done';
            resolve();
          }
        },
        error: (err) => {
          console.error(err);
          song.status = 'error';
          resolve(); // Resolve anyway to continue queue
        }
      });
    });
  }
}
