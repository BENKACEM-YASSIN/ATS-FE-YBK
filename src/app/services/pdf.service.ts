import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
import * as pdfjsLib from 'pdfjs-dist';

@Injectable({
    providedIn: 'root'
})
export class PdfService {
    private http = inject(HttpClient);
    private apiUrl = environment.apiUrl + '/pdf';

    constructor() {
        const pdfjs = (pdfjsLib as any).default || pdfjsLib;
        if (pdfjs.GlobalWorkerOptions) {
            pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
        }
    }

    generatePdf(data: any): Observable<Blob> {
        return this.http.post(`${this.apiUrl}/render`, data, { responseType: 'blob' });
    }

    async extractText(file: File): Promise<string> {
        const pdfjs = (pdfjsLib as any).default || pdfjsLib;

        try {
            const arrayBuffer = await file.arrayBuffer();

            // Load the PDF document
            const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
            const pdf = await loadingTask.promise;

            let fullText = '';

            // Iterate through all pages
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();

                // Extract text items
                const pageText = textContent.items
                    .map((item: any) => item.str || '')
                    .join(' ');

                fullText += pageText + '\n\n';
            }

            return fullText;
        } catch (error) {
            console.error("PDF Extraction Error:", error);
            throw new Error("Failed to extract text from PDF file. Ensure the file is a valid text-based PDF.");
        }
    }
}
