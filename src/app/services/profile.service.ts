import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { CVData } from '../models/cv.model';
import { firstValueFrom } from 'rxjs';

export interface ProfileDTO {
  firstName: string;
  lastName: string;
  title: string;
  email: string;
  motto: string;
  summary: string;
  photoUrl: string;
  drivingLicence: string;
  hobbies: string[];
  interests: string[];
  profileProgress: number;
  lastVisit: string;
  lastEditedFileName: string;
  lastEditedDate: string;
  
  // Stats
  cvCount: number;
  coverLetterCount: number;
  yearsOfExperience: number;
  workExperienceCount: number;
  educationCount: number;
  skillsCount: number;
  languagesCount: number;
}

@Injectable({
    providedIn: 'root'
})
export class ProfileService {
    private apiUrl = environment.apiUrl + '/profile';

    constructor(private http: HttpClient) {}

    async saveProfile(data: CVData): Promise<void> {
        await firstValueFrom(this.http.post(`${this.apiUrl}`, data));
    }

    async getLatestProfile(): Promise<CVData | null> {
        try {
            return await firstValueFrom(this.http.get<CVData>(`${this.apiUrl}/latest`));
        } catch (error) {
            return null;
        }
    }
    
    async getProfileDashboard(): Promise<ProfileDTO | null> {
        try {
            return await firstValueFrom(this.http.get<ProfileDTO>(`${this.apiUrl}/dashboard`));
        } catch (error) {
            console.error('Failed to fetch dashboard', error);
            return null;
        }
    }
    
    async updateProfileDetails(update: Partial<ProfileDTO>): Promise<void> {
        await firstValueFrom(this.http.patch(`${this.apiUrl}`, update));
    }
}
