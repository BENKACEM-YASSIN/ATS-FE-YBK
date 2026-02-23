import { Component, HostListener, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router, NavigationEnd, RouterOutlet, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { environment } from '../environments/environment';
import { WelcomeScreenComponent } from './components/welcome-screen/welcome-screen.component';
import { EditorComponent } from './components/editor/editor.component';
import { CvPreviewComponent } from './components/cv-preview/cv-preview';
import { IconsModule } from './icons.module';
import { CVData } from './models/cv.model';
import { ATSResult } from './services/gemini.service';
import { EMPTY_CV_DATA } from './constants/cv-defaults';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    WelcomeScreenComponent,
    EditorComponent,
    CvPreviewComponent,
    IconsModule,
    RouterOutlet,
    RouterLink,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class AppComponent implements OnInit {
  @ViewChild('editorRef') editorRef: any;
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  cvData: CVData = JSON.parse(JSON.stringify(EMPTY_CV_DATA));
  jobDescription: string = '';
  atsResult: ATSResult | null = null;

  appMode: 'welcome' | 'editor' = 'welcome';
  isRenderMode = false;
  isStandaloneRoute =
    typeof window !== 'undefined' &&
    (window.location.pathname.includes('/pdf-preview') ||
      window.location.pathname.includes('/profile') ||
      window.location.pathname.includes('/jobs'));
  showPreviewMobile: boolean = false;
  isDarkMode: boolean = false;
  isDesktop: boolean = true;

  previewZoom = 1;
  readonly minPreviewZoom = 0.6;
  readonly maxPreviewZoom = 1.8;
  readonly previewZoomStep = 0.05;

  previewPanX = 0;
  previewPanY = 0;
  isPanningPreview = false;
  private previewStartMouseX = 0;
  private previewStartMouseY = 0;
  private previewStartPanX = 0;
  private previewStartPanY = 0;

  isResizing = false;
  editorWidth = 40;

  isSidebarExpanded = true;
  activeSidebarTab: 'history' | 'settings' | 'none' = 'history';

  historyItems: any[] = [];
  pinnedHistory: any[] = [];
  recentHistory: any[] = [];

  ngOnInit() {
    this.updateStandaloneRoute(this.router.url);

    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.updateStandaloneRoute(event.urlAfterRedirects);
      }
    });

    this.checkSize();
    this.loadHistory();
    this.handleRouteParams();

    if (this.isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  private updateStandaloneRoute(url: string) {
    const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
    const effectiveUrl = pathname || url;
    this.isStandaloneRoute =
      effectiveUrl.includes('/pdf-preview') ||
      effectiveUrl.includes('/profile') ||
      effectiveUrl.includes('/jobs');
  }

  private handleRouteParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const isRenderParam = urlParams.get('render') === '1';

    if (isRenderParam) {
      console.log('PDF_RENDER_MODE: Detected via URL params');
      this.isRenderMode = true;
      this.appMode = 'editor';
      this.loadRenderData();
    }

    this.route.queryParams.subscribe((params) => {
      console.log('PDF_RENDER_MODE: Query params changed', params);
      if (params['render'] === '1' && !this.isRenderMode) {
        console.log('PDF_RENDER_MODE: Detected via ActivatedRoute');
        this.isRenderMode = true;
        this.appMode = 'editor';
        this.loadRenderData();
      }
    });
  }

  private loadRenderData() {
    console.log('PDF_RENDER_MODE: Attempting to load data from localStorage...');
    const data = localStorage.getItem('render_cv_data');
    if (data) {
      try {
        this.cvData = JSON.parse(data);
        console.log('PDF_RENDER_MODE: Data loaded successfully. Theme:', this.cvData.theme);
      } catch (e) {
        console.error('PDF_RENDER_MODE: Failed to parse data', e);
      }
    } else {
      console.warn('PDF_RENDER_MODE: No data found in localStorage');
    }
  }

  async loadHistory() {
    try {
      const data = await firstValueFrom(this.http.get<any[]>(`${environment.apiUrl}/history`));
      this.historyItems = data;
      this.pinnedHistory = data.filter((h) => h.pinned);
      this.recentHistory = data.filter((h) => !h.pinned);
    } catch (e) {
      console.error('Failed to load history', e);
    }
  }

  async deleteHistory(id: number) {
    if (!confirm('Are you sure you want to delete this CV?')) return;
    try {
      await firstValueFrom(this.http.delete(`${environment.apiUrl}/history/${id}`));
      await this.loadHistory();
    } catch (e) {
      console.error('Delete failed', e);
    }
  }

  async pinHistory(id: number, pinned: boolean) {
    try {
      await firstValueFrom(
        this.http.patch(`${environment.apiUrl}/history/${id}/pin?pinned=${pinned}`, {}),
      );
      await this.loadHistory();
    } catch (e) {
      console.error('Pin failed', e);
    }
  }

  loadHistoryItem(item: any) {
    let loadedData: CVData | null = null;
    if (item.cvDataJson) {
      try {
        loadedData =
          typeof item.cvDataJson === 'string' ? JSON.parse(item.cvDataJson) : item.cvDataJson;
      } catch (e) {
        console.error('Failed to parse CV data', e);
      }
    } else if (item.cvData) {
      loadedData = item.cvData;
    }

    if (loadedData) {
      if (!loadedData.theme) loadedData.theme = 'euro-classic';
      this.cvData = loadedData;
      this.atsResult = null;
      this.appMode = 'editor';
      if (this.editorRef) {
        this.editorRef.currentHistoryId = item.id;
        this.editorRef.currentCvTitle = item.title;
      }
    }
  }

  toggleSidebar() {
    this.isSidebarExpanded = !this.isSidebarExpanded;
  }

  setSidebarTab(tab: 'history' | 'settings') {
    if (this.activeSidebarTab === tab && this.isSidebarExpanded) {
      this.isSidebarExpanded = false;
    } else {
      this.activeSidebarTab = tab;
      this.isSidebarExpanded = true;
    }
  }

  goHome() {
    this.appMode = 'welcome';
    if (this.editorRef) {
      this.editorRef.currentHistoryId = null;
      this.editorRef.currentCvTitle = null;
    }
  }

  @HostListener('window:resize')
  checkSize() {
    this.isDesktop = window.innerWidth >= 1024;
  }

  startResizing(event: MouseEvent) {
    if (!this.isDesktop) return;
    this.isResizing = true;
    this.isPanningPreview = false;
    event.preventDefault();
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }

  @HostListener('window:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (this.isResizing) {
      const totalWidth = window.innerWidth;
      const newWidth = (event.clientX / totalWidth) * 100;
      if (newWidth > 20 && newWidth < 80) {
        this.editorWidth = newWidth;
      }
      event.preventDefault();
      return;
    }

    if (this.isPanningPreview) {
      const deltaX = event.clientX - this.previewStartMouseX;
      const deltaY = event.clientY - this.previewStartMouseY;
      this.previewPanX = this.previewStartPanX + deltaX;
      this.previewPanY = this.previewStartPanY + deltaY;
      event.preventDefault();
    }
  }

  @HostListener('window:mouseup')
  onMouseUp() {
    const wasResizing = this.isResizing;
    const wasPanningPreview = this.isPanningPreview;

    this.isResizing = false;
    this.isPanningPreview = false;

    if (wasResizing || wasPanningPreview) {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
  }

  togglePreview() {
    this.showPreviewMobile = !this.showPreviewMobile;
  }

  startPreviewPan(event: MouseEvent) {
    if (this.isRenderMode || event.button !== 0) return;

    this.isPanningPreview = true;
    this.previewStartMouseX = event.clientX;
    this.previewStartMouseY = event.clientY;
    this.previewStartPanX = this.previewPanX;
    this.previewStartPanY = this.previewPanY;

    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
    event.preventDefault();
  }

  panPreview(deltaX: number, deltaY = 0) {
    this.previewPanX += deltaX;
    this.previewPanY += deltaY;
  }

  zoomInPreview() {
    this.setPreviewZoom(this.previewZoom + this.previewZoomStep);
  }

  zoomOutPreview() {
    this.setPreviewZoom(this.previewZoom - this.previewZoomStep);
  }

  setPreviewZoomFromSlider(event: Event) {
    const target = event.target as HTMLInputElement | null;
    if (!target) return;
    this.setPreviewZoom(Number(target.value) / 100);
  }

  resetPreviewView() {
    this.previewZoom = 1;
    this.previewPanX = 0;
    this.previewPanY = 0;
  }

  private setPreviewZoom(value: number) {
    this.previewZoom = Math.max(
      this.minPreviewZoom,
      Math.min(this.maxPreviewZoom, Number(value.toFixed(2))),
    );
  }

  toggleTheme() {
    this.isDarkMode = !this.isDarkMode;
    if (this.isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  handleStartScratch(jobDescription: string = '') {
    this.cvData = JSON.parse(JSON.stringify(EMPTY_CV_DATA));
    this.jobDescription = jobDescription;
    this.atsResult = null;
    this.appMode = 'editor';
    if (this.editorRef) {
      this.editorRef.currentHistoryId = null;
      this.editorRef.currentCvTitle = null;
    }
  }

  handleImport(event: { data: CVData; jobDescription?: string; atsResult?: ATSResult }) {
    console.log('AppComponent handleImport triggered with data:', !!event.data);
    if (event.data) {
      if (!event.data.theme) event.data.theme = 'euro-classic';
      this.cvData = event.data;
      if (event.jobDescription) this.jobDescription = event.jobDescription;
      if (event.atsResult) this.atsResult = event.atsResult;
      this.appMode = 'editor';
      console.log('AppComponent mode changed to editor');
    } else {
      console.warn('AppComponent handleImport: no data provided');
    }
  }
}
