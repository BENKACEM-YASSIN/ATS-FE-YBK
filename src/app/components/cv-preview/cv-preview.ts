import { Component, Input, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconsModule } from '../../icons.module';
import { CVData } from '../../models/cv.model';

@Component({
  selector: 'app-cv-preview',
  standalone: true,
  imports: [CommonModule, IconsModule],
  templateUrl: './cv-preview.html',
  styles: [`
    :host {
      display: block;
      background-color: #f1f5f9;
      min-height: 100vh;
      padding: 2rem 0;
    }

    .cv-page {
      background: white;
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto 2rem auto;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
      position: relative;
      overflow: hidden;
    }

    .print\\:shadow-none { box-shadow: none !important; }
    .print\\:w-full { width: 100% !important; }
    .print\\:w-\\[210mm\\] { width: 210mm !important; }
    .print\\:max-w-none { max-width: none !important; }
    .print\\:max-w-\\[210mm\\] { max-width: 210mm !important; }
    .print\\:mx-0 { margin-left: 0 !important; margin-right: 0 !important; }
    .print\\:min-h-0 { min-height: 0 !important; }
    .print\\:h-auto { height: auto !important; }
    .print\\:flex-row { flex-direction: row !important; }
    .print-break-avoid { page-break-inside: avoid !important; break-inside: avoid !important; }
    .print\:bg-slate-900 { background-color: #0f172a !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .print\:bg-blue-900 { background-color: #1e3a8a !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .print\:bg-slate-50 { background-color: #f8fafc !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .print\:bg-slate-100 { background-color: #f1f5f9 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .print\:text-slate-300 { color: #cbd5e1 !important; }
    .print\:text-white { color: #ffffff !important; }
    .print\:text-blue-200 { color: #bfdbfe !important; }
    .print\:text-blue-100 { color: #dbeafe !important; }
    
    @media print {
      :host {
        background: none !important;
        padding: 0 !important;
      }
      .cv-page {
        margin: 0 !important;
        box-shadow: none !important;
        width: 100% !important;
        min-height: 0 !important;
        overflow: visible !important;
      }
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      html, body {
        height: auto !important;
        overflow: visible !important;
        margin: 0 !important;
        padding: 0 !important;
        background: white !important;
      }
      .no-print {
        display: none !important;
      }
      app-cv-preview {
        display: block !important;
        width: 100% !important;
        height: auto !important;
        min-height: 0 !important;
        overflow: visible !important;
      }
      @page {
        size: A4;
        margin: 0; /* Backgrounds need 0 margin to bleed to edge */
      }
      /* Ensure background colors span the full height across pages */
      .bg-slate-50, .bg-slate-900, .bg-teal-900, .bg-slate-100, .bg-blue-900 {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      /* Content padding to respect printer margins while allowing BG bleed */
      .print-content-padding {
        padding-top: 15mm !important;
        padding-bottom: 15mm !important;
      }
      /* Prevent split of essential HR sections */
      .section-item {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
      /* Fix for sidebar themes (Euro/Executive) to maintain layout on page 2+ */
      .print-flex-container {
        display: flex !important;
        flex-direction: row !important;
        align-items: stretch !important;
      }
      /* Better text flow for ATS */
      .rich-text p, .rich-text li {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        orphans: 3;
        widows: 3;
        line-height: 1.4 !important;
      }
      /* Section headers should stay with their content */
      h1, h2, h3, h4 {
        page-break-after: avoid !important;
        break-after: avoid !important;
        color: #1e3a8a !important; /* Ensure high contrast for ATS/HR */
      }
      .mb-4, .mb-6, .mb-8, .mb-10 {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
    }
  `],
  encapsulation: ViewEncapsulation.None
})
export class CvPreviewComponent {
  @Input() data!: CVData;

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const dateParts = dateStr.split('-');
    if (dateParts.length === 3) {
      const [year, month, day] = dateParts;
      return `${day}/${month}/${year}`;
    }
    if (dateParts.length === 2) {
      const [year, month] = dateParts;
      return `${month}/${year}`;
    }
    return dateStr;
  }

  getSectionTitle(id: string): string {
    if (this.data.sectionTitles && this.data.sectionTitles[id]) {
      return this.data.sectionTitles[id];
    }
    if (id === 'aboutMe') return 'About Me';
    if (id === 'workExperience') return 'Work Experience';
    if (id === 'education') return 'Education and Training';
    if (id === 'skills') return 'Personal Skills';
    if (id.startsWith('custom-')) return this.data.customSections.find(s => s.id === id)?.title || 'Custom Section';
    return '';
  }

  getCustomSection(id: string) {
    return this.data.customSections.find(s => s.id === id);
  }

  getLeftColumnSections(): string[] {
    return this.data.sectionOrder.filter(id => this.data.sectionColumns?.[id] === 'left');
  }

  getRightColumnSections(): string[] {
    return this.data.sectionOrder.filter(id => this.data.sectionColumns?.[id] !== 'left');
  }

  allLevelsSame(lang: any): boolean {
    const levels = [lang.listening, lang.reading, lang.spokenInteraction, lang.spokenProduction, lang.writing];
    return levels.every(level => level === levels[0]);
  }

  getLanguageLevelLabel(level: string): string {
    const labels: { [key: string]: string } = {
      'A1': 'Beginner',
      'A2': 'Elementary',
      'B1': 'Intermediate',
      'B2': 'Upper Intermediate',
      'C1': 'Advanced',
      'C2': 'Proficient'
    };
    return labels[level] || 'User';
  }
}
