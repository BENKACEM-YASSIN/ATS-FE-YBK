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

const SAMPLE_DATA: CVData = {
  theme: 'euro-classic',
  personalInfo: {
    firstName: 'John',
    lastName: 'Doe',
    title: 'Software Developer',
    email: 'john.doe@example.com',
    phone: '+1 234 567 890',
    address: '123 Main St',
    city: 'New York',
    postalCode: '10001',
    country: 'USA',
    website: 'johndoe.dev',
    linkedin: 'linkedin.com/in/johndoe',
    aboutMe: 'Experienced software developer with a passion for building scalable web applications. Proficient in React, TypeScript, and Cloud technologies.'
  },
  workExperience: [
    {
      id: '1',
      title: 'Senior Frontend Engineer',
      employer: 'Tech Solutions Inc.',
      city: 'San Francisco',
      country: 'USA',
      startDate: '2020-03-01',
      endDate: '',
      current: true,
      description: '<ul><li>Led the migration of legacy code to React 18.</li><li>Mentored junior developers and conducted code reviews.</li><li>Improved site performance scores by 40%.</li></ul>'
    }
  ],
  education: [
    {
      id: '1',
      degree: 'BSc Computer Science',
      school: 'University of Technology',
      city: 'Boston',
      country: 'USA',
      startDate: '2015-09-01',
      endDate: '2019-06-30',
      current: false,
      description: 'Graduated with Honors. Specialization in Artificial Intelligence.'
    }
  ],
  skills: {
    motherTongue: 'English',
    otherLanguages: [
      { id: '1', language: 'Spanish', listening: 'B2', reading: 'B2', spokenInteraction: 'B1', spokenProduction: 'B1', writing: 'A2' }
    ],
    digitalSkills: [
      { id: '1', name: 'Frontend', skills: ['React', 'TypeScript', 'Tailwind CSS', 'Next.js'] },
      { id: '2', name: 'Backend', skills: ['Node.js', 'PostgreSQL', 'Docker', 'AWS'] }
    ],
    softSkills: ['Leadership', 'Communication', 'Problem Solving']
  },
  customSections: [],
  sectionOrder: ['aboutMe', 'workExperience', 'education', 'skills'],
  sectionTitles: {
    aboutMe: 'About Me',
    workExperience: 'Work Experience',
    education: 'Education and Training',
    skills: 'Personal Skills'
  }
};

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, WelcomeScreenComponent, EditorComponent, CvPreviewComponent, IconsModule, RouterOutlet, RouterLink],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class AppComponent implements OnInit {
  @ViewChild('editorRef') editorRef: any;
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  cvData: CVData = SAMPLE_DATA;
  jobDescription: string = '';
  atsResult: ATSResult | null = null;

  appMode: 'welcome' | 'editor' = 'welcome';
  isRenderMode = false;
  isStandaloneRoute = false;
  showPreviewMobile: boolean = false;
  isDarkMode: boolean = false;
  isDesktop: boolean = true;

  isResizing = false;
  editorWidth = 40;

  isSidebarExpanded = true;
  activeSidebarTab: 'history' | 'settings' | 'none' = 'history';

  historyItems: any[] = [];
  pinnedHistory: any[] = [];
  recentHistory: any[] = [];

  ngOnInit() {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.isStandaloneRoute = event.urlAfterRedirects.includes('/pdf-preview') || 
                                 event.urlAfterRedirects.includes('/profile');
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

  private handleRouteParams() {
    // Robust check for render mode using both ActivatedRoute and window.location
    const urlParams = new URLSearchParams(window.location.search);
    const isRenderParam = urlParams.get('render') === '1';
    
    if (isRenderParam) {
      console.log('PDF_RENDER_MODE: Detected via URL params');
      this.isRenderMode = true;
      this.appMode = 'editor';
      this.loadRenderData();
    }

    // Also subscribe to queryParams for standard SPA navigation
    this.route.queryParams.subscribe(params => {
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
      this.pinnedHistory = data.filter(h => h.pinned);
      this.recentHistory = data.filter(h => !h.pinned);
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
      await firstValueFrom(this.http.patch(`${environment.apiUrl}/history/${id}/pin?pinned=${pinned}`, {}));
      await this.loadHistory();
    } catch (e) {
      console.error('Pin failed', e);
    }
  }

  loadHistoryItem(item: any) {
    let loadedData: CVData | null = null;
    if (item.cvDataJson) {
      try {
        loadedData = typeof item.cvDataJson === 'string' ? JSON.parse(item.cvDataJson) : item.cvDataJson;
      } catch (e) {
        console.error('Failed to parse CV data', e);
      }
    } else if (item.cvData) {
      loadedData = item.cvData;
    }
    
    if (loadedData) {
      if (!loadedData.theme) loadedData.theme = 'euro-classic';
      this.cvData = loadedData;
      this.atsResult = null; // Reset ATS score when loading a different CV
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
    event.preventDefault();
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }

  @HostListener('window:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (!this.isResizing) return;
    const totalWidth = window.innerWidth;
    const newWidth = (event.clientX / totalWidth) * 100;
    if (newWidth > 20 && newWidth < 80) {
      this.editorWidth = newWidth;
    }
    event.preventDefault();
  }

  @HostListener('window:mouseup')
  onMouseUp() {
    if (this.isResizing) {
      this.isResizing = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
  }

  togglePreview() {
    this.showPreviewMobile = !this.showPreviewMobile;
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
    this.cvData = JSON.parse(JSON.stringify(SAMPLE_DATA));
    this.jobDescription = jobDescription;
    this.atsResult = null;
    this.appMode = 'editor';
    if (this.editorRef) {
      this.editorRef.currentHistoryId = null;
      this.editorRef.currentCvTitle = null;
    }
  }

  handleImport(event: { data: CVData, jobDescription?: string, atsResult?: ATSResult }) {
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
