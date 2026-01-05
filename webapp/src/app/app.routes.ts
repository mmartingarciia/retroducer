import { Routes } from '@angular/router';
import { DashboardComponent } from './features/dashboard/dashboard';
import { LibraryManagerComponent } from './features/library-manager/library-manager';
import { AlbumDetailsComponent } from './features/album-details/album-details';
import { CallbackComponent } from './features/callback/callback';

export const routes: Routes = [
    { path: '', component: DashboardComponent },
    { path: 'playlist', component: LibraryManagerComponent },
    { path: 'album/:id', component: AlbumDetailsComponent },
    { path: 'callback', component: CallbackComponent },
    { path: '**', redirectTo: '' }
];
