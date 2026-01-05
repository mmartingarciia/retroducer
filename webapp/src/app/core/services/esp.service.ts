import { Injectable } from '@angular/core';
import { HttpClient, HttpEventType } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, timeout } from 'rxjs/operators';

export interface EspStatus {
    connected: boolean;
    freeSpace?: number;
    totalSpace?: number;
    ip?: string;
}

export interface EspFile {
    name: string;
    size: number;
}

@Injectable({
    providedIn: 'root'
})
export class EspService {
    private _ip = new BehaviorSubject<string>('192.168.4.1');
    ip$ = this._ip.asObservable();

    private _status = new BehaviorSubject<EspStatus>({ connected: false });
    status$ = this._status.asObservable();

    private _syncHistory = new BehaviorSubject<any[]>([]);
    syncHistory$ = this._syncHistory.asObservable();

    constructor(private http: HttpClient) {
        // Try to restore IP from local storage if needed, or default
        const savedIp = localStorage.getItem('esp_ip');
        if (savedIp) this._ip.next(savedIp);

        // Load history
        const savedHistory = localStorage.getItem('esp_sync_history');
        if (savedHistory) {
            try { this._syncHistory.next(JSON.parse(savedHistory)); } catch { }
        }
    }

    addToHistory(track: { name: string, artist: string, cover?: string }) {
        const current = this._syncHistory.value;
        // Add to beginning, limit to 10
        const newItem = { ...track, syncedAt: Date.now() };
        const updated = [newItem, ...current].slice(0, 10);

        this._syncHistory.next(updated);
        localStorage.setItem('esp_sync_history', JSON.stringify(updated));
    }

    setIp(ip: string) {
        this._ip.next(ip);
        localStorage.setItem('esp_ip', ip);
        this.checkConnection();
    }

    getIp(): string {
        return this._ip.value;
    }

    checkConnection(): Observable<boolean> {
        const url = `http://${this._ip.value}/status`;
        return this.http.get(url).pipe(
            timeout(3000), // 3s timeout
            map((res: any) => {
                const status = {
                    connected: true,
                    freeSpace: res.fs_free, // Assuming ESP returns JSON with fs_free
                    totalSpace: res.fs_total,
                    ip: this._ip.value
                };
                this._status.next(status);
                return true;
            }),
            catchError(() => {
                this._status.next({ connected: false, ip: this._ip.value });
                return of(false);
            })
        );
    }

    uploadFile(file: File, remoteName: string): Observable<number> {
        const url = `http://${this._ip.value}/upload`;
        const formData = new FormData();
        formData.append('file', file, remoteName);

        return this.http.post(url, formData, {
            reportProgress: true,
            observe: 'events',
            responseType: 'text'
        }).pipe(
            map(event => {
                if (event.type === HttpEventType.UploadProgress && event.total) {
                    return Math.round(100 * event.loaded / event.total);
                } else if (event.type === HttpEventType.Response) {
                    return 100;
                }
                return 0;
            })
        );
    }
}
