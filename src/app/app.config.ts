import { ApplicationConfig } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter, Routes } from '@angular/router';
import { PdfPreviewComponent } from './components/pdf-preview/pdf-preview.component';
import { UserProfileComponent } from './components/user-profile/user-profile.component';
import { JobSearchComponent } from './components/job-search/job-search.component';

const routes: Routes = [
  { path: 'pdf-preview', component: PdfPreviewComponent },
  { path: 'profile', component: UserProfileComponent },
  { path: 'jobs', component: JobSearchComponent }
];

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(),
    provideRouter(routes)
  ]
};
