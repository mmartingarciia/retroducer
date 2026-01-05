import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface PlaylistTrack {
    id: string; // Spotify ID
    name: string;
    artist: string;
    album: string;
    cover?: string;
    addedAt: number;
    // Local file linkage
    localFile?: File;
    status: 'missing' | 'linked' | 'uploaded';
}

@Injectable({
    providedIn: 'root'
})
export class PlaylistService {
    private readonly STORAGE_KEY = 'virtual_playlist';
    private playlistSubject = new BehaviorSubject<PlaylistTrack[]>([]);
    playlist$ = this.playlistSubject.asObservable();

    constructor() {
        this.loadPlaylist();
    }

    get currentPlaylist(): PlaylistTrack[] {
        return this.playlistSubject.value;
    }

    private loadPlaylist() {
        const saved = localStorage.getItem(this.STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                this.playlistSubject.next(parsed);
            } catch (e) {
                console.error('Failed to load playlist', e);
            }
        }
    }

    private save() {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.currentPlaylist));
    }

    addTrack(spotifyTrack: any, spotifyAlbum: any) {
        const current = this.currentPlaylist;
        // Avoid duplicates
        if (current.find(t => t.id === spotifyTrack.id)) return;

        const newTrack: PlaylistTrack = {
            id: spotifyTrack.id,
            name: spotifyTrack.name,
            artist: spotifyTrack.artists[0].name,
            album: spotifyAlbum.name,
            cover: spotifyAlbum.images[0]?.url,
            addedAt: Date.now(),
            status: 'missing'
        };

        this.playlistSubject.next([...current, newTrack]);
        this.save();
    }

    removeTrack(id: string) {
        const filtered = this.currentPlaylist.filter(t => t.id !== id);
        this.playlistSubject.next(filtered);
        this.save();
    }

    clearPlaylist() {
        this.playlistSubject.next([]);
        this.save();
    }

    // Link a local file to a track metadata
    linkFile(trackId: string, file: File) {
        const playlist = this.currentPlaylist;
        const track = playlist.find(t => t.id === trackId);
        if (track) {
            track.localFile = file; // Note: File object isn't serializable to localStorage! 
            // We need to handle this. For session persistence it's fine in memory, 
            // but if reload page, file ref is lost. 
            // For now, we assume user drags file in the session.
            track.status = 'linked';
            this.playlistSubject.next([...playlist]);
            // Don't save to localStorage with File object
        }
    }
}
