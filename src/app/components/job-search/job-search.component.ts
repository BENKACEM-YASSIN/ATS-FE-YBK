import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { JobSearchService, JobPost } from '../../services/job-search.service';
import { ProfileService } from '../../services/profile.service';
import { IconsModule } from '../../icons.module';

@Component({
  selector: 'app-job-search',
  standalone: true,
  imports: [CommonModule, IconsModule],
  templateUrl: './job-search.component.html',
  styleUrl: './job-search.component.css'
})
export class JobSearchComponent implements OnInit {
  private jobSearchService = inject(JobSearchService);
  private profileService = inject(ProfileService);

  jobs: JobPost[] = [];
  loading = false;
  error: string | null = null;
  selectedJobs: Set<string> = new Set();
  showBulkApply = false;
  searchLocation: string = '';
  searchTitle: string = '';

  ngOnInit() {
    this.loadJobs();
  }

  async loadJobs() {
    this.loading = true;
    this.error = null;
    
    try {
      // Get profile to extract location and title
      const profile = await this.profileService.getLatestProfile();
      let location: string | undefined;
      let jobTitle: string | undefined;

      if (profile?.personalInfo) {
        const info = profile.personalInfo;
        if (info.city) {
          location = info.country ? `${info.city}, ${info.country}` : info.city;
        }
        if (info.title) {
          jobTitle = info.title;
        }
      }

      const response = await this.jobSearchService.searchJobsGet(location, jobTitle, 24);
      this.jobs = response.jobs;
      this.searchLocation = response.searchLocation;
      this.searchTitle = response.searchTitle;
    } catch (err: any) {
      this.error = err.message || 'Failed to load jobs';
      console.error('Error loading jobs:', err);
    } finally {
      this.loading = false;
    }
  }

  toggleJobSelection(jobId: string) {
    if (this.selectedJobs.has(jobId)) {
      this.selectedJobs.delete(jobId);
    } else {
      this.selectedJobs.add(jobId);
    }
    this.showBulkApply = this.selectedJobs.size > 0;
  }

  isSelected(jobId: string): boolean {
    return this.selectedJobs.has(jobId);
  }

  getSelectedJobs(): JobPost[] {
    return this.jobs.filter(job => this.selectedJobs.has(job.id));
  }

  async bulkApply() {
    const selected = this.getSelectedJobs();
    if (selected.length === 0) return;

    // Create mailto links for each selected job
    const emails = selected
      .filter(job => job.email)
      .map(job => job.email)
      .join(',');

    if (emails) {
      // Get profile for email content
      const profile = await this.profileService.getLatestProfile();
      const subject = encodeURIComponent(`Application for ${this.searchTitle} Position`);
      const body = encodeURIComponent(
        `Dear Hiring Manager,\n\n` +
        `I am writing to express my interest in the ${this.searchTitle} position at your company.\n\n` +
        `Please find my resume attached.\n\n` +
        `Best regards,\n` +
        (profile?.personalInfo?.firstName || '') + ' ' + (profile?.personalInfo?.lastName || '')
      );

      // Open email client with BCC to all selected emails
      window.location.href = `mailto:?bcc=${emails}&subject=${subject}&body=${body}`;
    } else {
      alert('No email addresses found in selected jobs');
    }
  }

  openJobUrl(url: string) {
    if (url) {
      window.open(url, '_blank');
    }
  }

  getScoreColor(score: number | null): string {
    if (score === null) return 'gray';
    if (score >= 80) return 'green';
    if (score >= 60) return 'blue';
    if (score >= 40) return 'yellow';
    return 'red';
  }

  getScoreLabel(score: number | null): string {
    if (score === null) return 'Not scored';
    if (score >= 80) return 'Excellent Match';
    if (score >= 60) return 'Good Match';
    if (score >= 40) return 'Fair Match';
    return 'Poor Match';
  }
}
