import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { CVData } from '../models/cv.model';
import { firstValueFrom } from 'rxjs';

export interface ATSResult {
    score: number;
    matchReasoning: string;
    missingKeywords: string[];
    suggestions: string[];
}

export type EnhanceType = 'job' | 'summary' | 'skill' | 'education' | 'custom';

@Injectable({
    providedIn: 'root'
})
export class GeminiService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/ai`;

    async enhanceText(text: string, type: EnhanceType): Promise<string[]> {
        try {
            return await firstValueFrom(
                this.http.post<string[]>(`${this.apiUrl}/enhance-text`, { text, type })
            );
        } catch (error) {
            console.error("Enhance Text Error:", error);
            throw new Error("Failed to enhance text. Please try again.");
        }
    }

    async generateTailoredBullets(
        draftText: string,
        jobDescription: string = '',
        sectionType: EnhanceType = 'job'
    ): Promise<string[]> {
        try {
            return await firstValueFrom(
                this.http.post<string[]>(`${this.apiUrl}/generate-bullets`, { draftText, jobDescription, sectionType })
            );
        } catch (error) {
            console.error("Bullet Generation Error:", error);
            throw new Error("Failed to generate bullets.");
        }
    }

    async parseCV(text: string): Promise<CVData> {
        try {
            const parsed = await firstValueFrom(
                this.http.post<CVData>(`${this.apiUrl}/parse-cv`, { text })
            );

            // Add defaults for UI tracking
            parsed.theme = parsed.theme || 'euro-classic';
            parsed.sectionOrder = parsed.sectionOrder || ['aboutMe', 'workExperience', 'education', 'skills'];
            parsed.customSections = parsed.customSections || [];

            return parsed;
        } catch (error) {
            console.error("CV Parse Error:", error);
            throw new Error("Failed to parse CV text.");
        }
    }

    async analyzeATS(cvText: string, jobDescription: string): Promise<ATSResult> {
        try {
            return await firstValueFrom(
                this.http.post<ATSResult>(`${this.apiUrl}/analyze-ats`, { cvText, jobDescription })
            );
        } catch (error) {
            console.error("ATS Analysis Error:", error);
            return {
                score: 0,
                matchReasoning: "Could not analyze at this time.",
                missingKeywords: [],
                suggestions: ["Try manual comparison."]
            };
        }
    }
}
