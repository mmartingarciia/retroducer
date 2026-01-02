import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styles: [`
    :host { display: block; background-color: #121212; min-height: 100vh; color: white; }
    .search-bar { background: #2a2a2a; border: none; color: white; border-radius: 20px; padding: 10px 20px; }
    .section-title { font-weight: bold; margin-bottom: 15px; font-size: 1.2rem; }
    
    .recent-item { 
      width: 120px; height: 120px; background: #333; border-radius: 8px; 
      margin-right: 15px; flex-shrink: 0; display: flex; align-items: center; justify-content: center;
    }

    .action-card {
      background: #1e1e1e; border-radius: 12px; padding: 20px; height: 100%;
      border: 1px solid #333; transition: transform 0.2s;
    }
    .action-card:hover { transform: translateY(-5px); border-color: #1db954; }
    
    .card-title { font-size: 1.1rem; font-weight: bold; margin-bottom: 10px; }
    .input-dark { background: #333; border: none; color: white; margin-bottom: 10px; }
    .btn-spotify { background-color: #1db954; color: black; font-weight: bold; border-radius: 20px; border: none; }
  `]
})
export class DashboardComponent {

  // Mock Data for "Recently Played"
  recentItems = [1, 2, 3, 4, 5];

  constructor(private router: Router) { }

  goToPlaylistEditor() {
    this.router.navigate(['/playlist']);
  }
}
