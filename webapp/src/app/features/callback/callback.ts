import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SpotifyService } from '../../core/services/spotify.service';

@Component({
    selector: 'app-callback',
    standalone: true,
    template: `
    <div style="height: 100vh; background: #121212; color: white; display: flex; align-items: center; justify-content: center; flex-direction: column;">
      <h2>Autenticando...</h2>
      <p>Por favor espera un momento.</p>
    </div>
  `
})
export class CallbackComponent implements OnInit {
    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private spotify: SpotifyService
    ) { }

    ngOnInit() {
        this.route.queryParams.subscribe(params => {
            const code = params['code'];
            if (code) {
                this.spotify.getToken(code).subscribe({
                    next: () => {
                        // Token retrieved successfully
                        this.router.navigate(['/']);
                    },
                    error: (err) => {
                        console.error('Login failed', err);
                        this.router.navigate(['/']); // Go home anyway but logged out
                    }
                });
            } else {
                this.router.navigate(['/']);
            }
        });
    }
}
