import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, from, of, switchMap, tap, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class SpotifyService {
    private readonly TOKEN_URL = 'https://accounts.spotify.com/api/token';
    private readonly API_URL = 'https://api.spotify.com/v1';

    private clientId: string = '';
    private clientSecret: string = '';
    private accessToken: string | null = null;
    private tokenExpiration: number = 0;

    constructor(private http: HttpClient) {
        // Load credentials from environment (priority) or local storage
        this.clientId = environment.spotify.clientId || localStorage.getItem('spotify_client_id') || '';
        this.clientSecret = environment.spotify.clientSecret || localStorage.getItem('spotify_client_secret') || '';

        // Save env credentials to local storage to keep logic consistent
        if (environment.spotify.clientId) localStorage.setItem('spotify_client_id', environment.spotify.clientId);
        if (environment.spotify.clientSecret) localStorage.setItem('spotify_client_secret', environment.spotify.clientSecret);
    }

    setCredentials(id: string, secret: string) {
        this.clientId = id;
        this.clientSecret = secret;
        localStorage.setItem('spotify_client_id', id);
        localStorage.setItem('spotify_client_secret', secret);
        this.accessToken = null; // Clear old token
    }

    hasCredentials(): boolean {
        return !!this.clientId && !!this.clientSecret;
    }

    private getAccessToken(): Observable<string> {
        if (this.accessToken && Date.now() < this.tokenExpiration) {
            return of(this.accessToken);
        }

        if (!this.hasCredentials()) {
            return new Observable(observer => {
                observer.error('Credenciales no configuradas');
            });
        }

        const body = new HttpParams()
            .set('grant_type', 'client_credentials')
            .set('client_id', this.clientId)
            .set('client_secret', this.clientSecret);

        const headers = new HttpHeaders({
            'Content-Type': 'application/x-www-form-urlencoded'
        });

        return this.http.post<any>(this.TOKEN_URL, body, { headers }).pipe(
            tap(response => {
                this.accessToken = response.access_token;
                this.tokenExpiration = Date.now() + ((response.expires_in - 60) * 1000);
            }),
            switchMap(response => of(response.access_token)),
            catchError(err => {
                console.error('Error getting Spotify Token:', err);
                throw new Error('Error de autenticación con Spotify. Verifica tu Client ID y Secret.');
            })
        );
    }

    // Method to verify credentials functionality
    checkCredentials(): Observable<boolean> {
        return this.getAccessToken().pipe(
            switchMap(() => of(true)),
            catchError(() => of(false))
        );
    }

    search(query: string, types: string[] = ['album', 'artist', 'track']): Observable<any> {
        return this.getAccessToken().pipe(
            switchMap(token => {
                const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
                const params = new HttpParams()
                    .set('q', query)
                    .set('type', types.join(','))
                    .set('limit', '10');

                return this.http.get(`${this.API_URL}/search`, { headers, params });
            })
        );
    }

    getAlbum(id: string): Observable<any> {
        return this.getAccessToken().pipe(
            switchMap(token => {
                const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
                return this.http.get(`${this.API_URL}/albums/${id}`, { headers });
            })
        );
    }

    getAlbumTracks(id: string): Observable<any> {
        return this.getAccessToken().pipe(
            switchMap(token => {
                const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
                const params = new HttpParams().set('limit', '50');
                return this.http.get(`${this.API_URL}/albums/${id}/tracks`, { headers, params });
            })
        );
    }

    // --- PKCE Auth Flow ---

    async loginWithSpotify() {
        const verifier = this.generateCodeVerifier(128);
        const challenge = await this.generateCodeChallenge(verifier);

        localStorage.setItem('spotify_verifier', verifier);

        const scope = 'user-read-private user-read-email playlist-read-private user-top-read';
        const redirectUri = window.location.origin + '/callback';

        const args = new HttpParams()
            .set('client_id', this.clientId)
            .set('response_type', 'code')
            .set('redirect_uri', redirectUri)
            .set('code_challenge_method', 'S256')
            .set('code_challenge', challenge)
            .set('scope', scope);

        window.location.href = 'https://accounts.spotify.com/authorize?' + args.toString();
    }

    getToken(code: string): Observable<any> {
        const verifier = localStorage.getItem('spotify_verifier') || '';
        const redirectUri = window.location.origin + '/callback';

        const body = new HttpParams()
            .set('grant_type', 'authorization_code')
            .set('client_id', this.clientId)
            .set('code', code)
            .set('redirect_uri', redirectUri)
            .set('code_verifier', verifier);

        const headers = new HttpHeaders({
            'Content-Type': 'application/x-www-form-urlencoded'
        });

        return this.http.post<any>(this.TOKEN_URL, body, { headers }).pipe(
            tap(res => {
                this.accessToken = res.access_token;
                this.tokenExpiration = Date.now() + ((res.expires_in - 60) * 1000);
                if (res.refresh_token) {
                    localStorage.setItem('spotify_refresh_token', res.refresh_token);
                }
            })
        );
    }

    logout() {
        this.accessToken = null;
        localStorage.removeItem('spotify_refresh_token');
        // We might want to keep client ID/Secret for Guest Mode
    }

    // --- User Data ---

    getMe(): Observable<any> {
        return this.getAccessToken().pipe(
            switchMap(token => {
                const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
                return this.http.get(`${this.API_URL}/me`, { headers });
            })
        );
    }

    getUserPlaylists(): Observable<any> {
        return this.getAccessToken().pipe(
            switchMap(token => {
                const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
                return this.http.get(`${this.API_URL}/me/playlists`, { headers });
            })
        );
    }

    getTopArtists(): Observable<any> {
        return this.getAccessToken().pipe(
            switchMap(token => {
                const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
                return this.http.get(`${this.API_URL}/me/top/artists`, { headers });
            })
        );
    }

    // --- PKCE Helpers ---

    private generateCodeVerifier(length: number) {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
        for (let i = 0; i < length; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }

    private async generateCodeChallenge(codeVerifier: string) {
        const data = new TextEncoder().encode(codeVerifier);
        const digest = await window.crypto.subtle.digest('SHA-256', data);
        return this.base64urlencode(new Uint8Array(digest));
    }

    private base64urlencode(a: Uint8Array) {
        let str = '';
        const bytes = Array.from(a);
        for (let i = 0; i < bytes.length; i++) {
            str += String.fromCharCode(bytes[i]);
        }
        return btoa(str)
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');
    }
}
