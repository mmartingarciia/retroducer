import { Routes } from '@angular/router';
import { LibraryManagerComponent } from './features/library-manager/library-manager';
import { DashboardComponent } from './features/dashboard/dashboard';

export const routes: Routes = [
    { path: '', component: DashboardComponent },
    { path: 'playlist', component: LibraryManagerComponent }
];
