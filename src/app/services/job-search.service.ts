import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { firstValueFrom } from 'rxjs';

export interface JobPost {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  url: string;
  email: string | null;
  postedDate: string;
  matchScore: number | null;
  matchReasoning: string | null;
  requiredSkills: string[];
  jobType: string;
  salary: string | null;
}

export interface JobSearchRequest {
  location?: string;
  jobTitle?: string;
  maxResults?: number;
  daysBack?: number;
}

export interface JobSearchResponse {
  jobs: JobPost[];
  totalFound: number;
  searchLocation: string;
  searchTitle: string;
}

@Injectable({
  providedIn: 'root'
})
export class JobSearchService {
  private apiUrl = environment.apiUrl + '/jobs';

  constructor(private http: HttpClient) {}

  async searchJobs(request: JobSearchRequest): Promise<JobSearchResponse> {
    return firstValueFrom(
      this.http.post<JobSearchResponse>(`${this.apiUrl}/search`, request)
    );
  }

  async searchJobsGet(location?: string, jobTitle?: string, maxResults: number = 24): Promise<JobSearchResponse> {
    const params: any = { maxResults };
    if (location) params.location = location;
    if (jobTitle) params.jobTitle = jobTitle;
    
    const queryString = new URLSearchParams(params).toString();
    return firstValueFrom(
      this.http.get<JobSearchResponse>(`${this.apiUrl}/search?${queryString}`)
    );
  }
}
