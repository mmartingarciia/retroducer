import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SpotifyService } from '../../core/services/spotify.service';
import { EspService } from '../../core/services/esp.service';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.html',
  styles: [`
    :host { display: block; background-color: #121212; min-height: 100vh; color: white; padding-bottom: 80px; }
    
    /* Top Bar */
    .top-bar { background: rgba(0,0,0,0.5); backdrop-filter: blur(10px); z-index: 100; padding: 16px; position: sticky; top: 0; }
    .search-input { 
      background: #242424; border: 1px solid transparent; border-radius: 500px; 
      color: white; padding: 12px 48px; width: 360px; transition: 0.3s;
    }
    .search-input:hover { background: #2a2a2a; border-color: #535353; }
    .search-input:focus { background: #242424; border-color: white; outline: none; }
    .nav-btn { width: 32px; height: 32px; background: rgba(0,0,0,0.7); border: none; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; }
    
    /* Filter Pills */
    .filter-pill { 
      background: rgba(255,255,255,0.07); border: none; color: white; padding: 8px 16px; border-radius: 32px; font-size: 0.875rem; font-weight: 500; cursor: pointer; transition: 0.2s;
    }
    .filter-pill:hover, .filter-pill.active { background: white; color: black; }

    /* Hero Grid */
    .hero-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(270px, 1fr)); gap: 12px; margin-bottom: 24px; }
    .hero-card { 
      background: rgba(255,255,255,0.07); border-radius: 4px; overflow: hidden; display: flex; align-items: center; cursor: pointer; transition: background 0.3s;
    }
    .hero-card:hover { background: rgba(255,255,255,0.15); }
    .hero-img { width: 64px; height: 64px; object-fit: cover; box-shadow: 0 4px 60px rgba(0,0,0,0.5); }
    .hero-text { font-weight: 700; padding: 0 16px; font-size: 0.9rem; }

    /* Sections */
    .section-header { display: flex; justify-content: space-between; align-items: end; margin-bottom: 16px; padding: 0 8px; }
    .section-title { font-size: 1.5rem; font-weight: 700; letter-spacing: -0.04em; cursor: pointer; }
    .section-title:hover { text-decoration: underline; }
    .show-all { font-size: 0.875rem; font-weight: 700; color: #b3b3b3; cursor: pointer; text-decoration: none; text-transform: uppercase; letter-spacing: 0.05em; }
    .show-all:hover { text-decoration: underline; color: white; }

    .horizontal-scroll { display: flex; gap: 24px; overflow-x: auto; padding-bottom: 16px; scrollbar-width: none; }
    .horizontal-scroll::-webkit-scrollbar { display: none; }
    
    .media-card { 
      width: 180px; min-width: 180px; background: #181818; padding: 16px; border-radius: 8px; cursor: pointer; transition: background 0.3s;
    }
    .media-card:hover { background: #282828; }
    .media-img { width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: 6px; margin-bottom: 16px; box-shadow: 0 8px 24px rgba(0,0,0,0.5); }
    .media-title { font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 8px; color: white; }
    .media-desc { font-size: 0.875rem; color: #a7a7a7; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.4; }

    /* Utility */
    .btn-icon { width: 48px; height: 48px; border-radius: 50%; border: none; display: flex; align-items: center; justify-content: center; background: #1f1f1f; color: white; cursor: pointer; }
    .btn-icon:hover { transform: scale(1.05); color: white; }
  `]
})
export class DashboardComponent {
  searchQuery: string = '';
  searchSubject = new Subject<string>();

  searchResults: any = null;
  isLoading: boolean = false;
  hasCredentials: boolean = false;
  isConnected = false;

  // Creds inputs
  clientIdInput: string = '';
  clientSecretInput: string = '';

  // Mock Data for "Home" view
  shortcuts = [
    { title: 'Canciones que te gustan', img: 'https://misc.scdn.co/liked-songs/liked-songs-640.png' }, // Placeholder image
    { title: 'Podcasts', img: 'https://i.scdn.co/image/ab6765630000ba8a8176974db7e2669e759f2371' },
    { title: 'Best of Fallout', img: 'https://i.scdn.co/image/ab67616d0000b273b5a6c0c217462057201c13d8' },
    { title: 'Jazz Classics', img: 'https://i.scdn.co/image/ab67616d0000b2735160b73cb32d207df8cb23e5' },
    { title: 'This Is Ella Fitzgerald', img: 'https://i.scdn.co/image/ab67616d0000b273e9702206bc1ef4dfcf298717' },
    { title: 'Rock Classics', img: 'https://i.scdn.co/image/ab67616d0000b273bd6d6e279313bb652b1b3658' }
  ];

  sections = [
    {
      title: 'Hecho para Martin Garcia',
      items: [
        { title: 'Mix diario 1', desc: 'The Kooks, Arctic Monkeys, Tame Impala', img: 'https://dailymix-images.scdn.co/v2/img/ab6761610000e5ebc36dd9eb55fb0db4911f25dd/1/en/default' },
        { title: 'Mix diario 2', desc: 'Kendrick Lamar, Tyler, The Creator', img: 'https://dailymix-images.scdn.co/v2/img/ab6761610000e5eb437b9e2a82505b3d93ff1022/2/en/default' },
        { title: 'Mix diario 3', desc: 'Dire Straits, The Beatles, Cream', img: 'https://dailymix-images.scdn.co/v2/img/ab6761610000e5eb70d44e59074d2091c6e4e757/3/en/default' },
        { title: 'Mix diario 4', desc: 'Maroon 5, Taylor Swift, Dua Lipa', img: 'https://dailymix-images.scdn.co/v2/img/ab6761610000e5eb8ae7f2aaa9817a70a36bd911/4/en/default' }, // Approximate
      ]
    },
    {
      title: 'Soundtrack your Sunday night',
      items: [
        { title: 'Night Rain', desc: 'Pouring rain and occasional rolling thunder.', img: 'https://i.scdn.co/image/ab67616d0000b2731c3bf7e556d1c5211910d68f' },
        { title: 'Deep Sleep', desc: 'Soothing, minimalist ambient for deep sleep.', img: 'https://i.scdn.co/image/ab67616d0000b273cb781216694eb3897f1f0a28' },
        { title: 'Jazz in the Background', desc: 'Soft jazz for all your activities.', img: 'https://i.scdn.co/image/ab67616d0000b273e8e19574da4122d250c60803' },
      ]
    }
  ];

  errorMessage: string = '';
  lastSyncedTracks: any[] = [];

  userProfile: any = null;

  constructor(
    private router: Router,
    private spotify: SpotifyService,
    private espService: EspService
  ) {
    this.hasCredentials = this.spotify.hasCredentials();
    this.espService.status$.subscribe(status => this.isConnected = status.connected);
    this.espService.syncHistory$.subscribe(history => this.lastSyncedTracks = history); // Subscribe to history
    this.espService.checkConnection().subscribe();

    this.checkLoginStatus();

    this.searchSubject.pipe(debounceTime(500), distinctUntilChanged()).subscribe(query => {
      if (!query) { this.searchResults = null; return; }
      this.performSearch(query);
    });
  }

  checkLoginStatus() {
    // Try to fetch profile to see if we are logged in (PKCE)
    this.spotify.getMe().subscribe({
      next: (profile) => {
        this.userProfile = profile;
        this.loadUserData();
      },
      error: () => {
        // Not logged in or token expired, we stay in Guest Mode (Mock Data)
        console.log('Guest Mode Active');
      }
    });
  }

  loadUserData() {
    // 1. Get Top Artists for "Shortcuts"
    this.spotify.getTopArtists().subscribe(res => {
      if (res.items) {
        this.shortcuts = res.items.slice(0, 6).map((artist: any) => ({
          title: artist.name,
          img: artist.images[0]?.url
        }));
      }
    });

    // 2. Get User Playlists
    this.spotify.getUserPlaylists().subscribe(res => {
      if (res.items) {
        this.sections[0] = {
          title: 'Tus Playlists',
          items: res.items.slice(0, 6).map((pl: any) => ({
            title: pl.name,
            desc: 'De ' + pl.owner.display_name,
            img: pl.images[0]?.url
          }))
        };
      }
    });
  }

  login() {
    // User requested to redirect directly, even if credentials might be wrong (Spotify will show error)
    this.spotify.loginWithSpotify();
  }

  toggleProfile() {
    if (this.userProfile) {
      if (confirm('¿Cerrar sesión?')) {
        this.spotify.logout();
        window.location.reload();
      }
    } else {
      this.login();
    }
  }

  onSearchInput() {
    this.searchSubject.next(this.searchQuery);
  }

  showSettings: boolean = false;

  toggleSettings() {
    this.showSettings = !this.showSettings;
    if (this.showSettings) {
      // Pre-fill with current if available
      this.clientIdInput = localStorage.getItem('spotify_client_id') || '';
      this.clientSecretInput = localStorage.getItem('spotify_client_secret') || '';
    }
  }

  saveCredentials() {
    if (this.clientIdInput && this.clientSecretInput) {
      const id = this.clientIdInput.trim();
      const secret = this.clientSecretInput.trim();

      this.spotify.setCredentials(id, secret);
      this.isLoading = true;
      this.spotify.checkCredentials().subscribe(isValid => {
        this.isLoading = false;
        if (isValid) {
          this.hasCredentials = true;
          this.showSettings = false; // Close on success
          this.errorMessage = '';
        } else {
          this.hasCredentials = false;
          this.errorMessage = 'Credenciales inválidas. Por favor verifícalas.';
        }
      });
    }
  }

  performSearch(query: string) {
    this.isLoading = true;
    this.errorMessage = '';
    this.spotify.search(query).subscribe({
      next: (res) => {
        this.searchResults = res;
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        console.error(err);
        this.errorMessage = 'Error al buscar. Verifica tu conexión o credenciales.';
      }
    });
  }

  goToAlbum(id: string) { this.router.navigate(['/album', id]); }

  // Navigate to playlist (Library)
  goToLibrary() { this.router.navigate(['/playlist']); }
}
