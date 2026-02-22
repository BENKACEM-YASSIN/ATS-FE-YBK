import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { IconsModule } from '../../icons.module';
import { GeminiService, ATSResult } from '../../services/gemini.service';
import { PdfService } from '../../services/pdf.service';
import { ProfileService } from '../../services/profile.service';
import { CVData, WorkExperience, Education, LanguageSkill, CustomSection, CustomSectionItem, DigitalSkillCategory, CVTheme } from '../../models/cv.model';
import { SectionWrapperComponent } from '../section-wrapper/section-wrapper.component';
import { RichTextEditorComponent } from '../rich-text-editor/rich-text-editor.component';
import { AiAssistantComponent } from '../ai-assistant/ai-assistant.component';
import { InputComponent } from './input.component';
import { SelectLevelComponent } from './select-level.component';

@Component({
    selector: 'app-editor',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        IconsModule,
        SectionWrapperComponent,
        RichTextEditorComponent,
        AiAssistantComponent,
        InputComponent,
        SelectLevelComponent
    ],
    templateUrl: './editor.html',
    styles: []
})
export class EditorComponent implements OnInit {
    @Input() cvData!: CVData;
    @Output() cvDataChange = new EventEmitter<CVData>();

    @Input() jobDescription: string = '';
    @Output() jobDescriptionChange = new EventEmitter<string>();

    @Input() atsResult: ATSResult | null = null;
    @Output() atsResultChange = new EventEmitter<ATSResult | null>();

    @Input() showPreviewMobile: boolean = false;
    @Input() isDarkMode: boolean = false;

    @Output() togglePreview = new EventEmitter<void>();
    @Output() toggleTheme = new EventEmitter<void>();
    @Output() backToHome = new EventEmitter<void>();
    @Output() refreshHistory = new EventEmitter<void>();

    private geminiService = inject(GeminiService);
    private pdfService = inject(PdfService);
    private profileService = inject(ProfileService);
    private http = inject(HttpClient);

    isSavingProfile = false;
    profileSaveSuccess = false;

    currentHistoryId: number | null = null;
    currentCvTitle: string | null = null;
    historyItems: any[] = [];

    showAddSectionMenu = false;
    showThemeSelector = false;
    personalInfoExpanded = true;

    showAtsDashboard = false;
    isAnalyzing = false;
    checkedItems = new Set<string>();

    ngOnInit() {
        this.loadHistory();
    }

    async loadHistory() {
        try {
            this.historyItems = await firstValueFrom(this.http.get<any[]>(`${environment.apiUrl}/history`));
        } catch (e) {
            console.error('Failed to load history', e);
        }
    }

    async saveHistoryVersion() {
        try {
            if (!this.currentHistoryId) {
                let title = this.currentCvTitle || '';
                if (!title) {
                    title = prompt('Name your CV (unique):', '') || '';
                }
                title = title.trim();
                if (!title) return;

                try {
                    const res: any = await firstValueFrom(this.http.post(`${environment.apiUrl}/history?title=${encodeURIComponent(title)}`, this.cvData));
                    this.currentCvTitle = title;
                    this.currentHistoryId = res.id;
                    await this.loadHistory();
                    this.refreshHistory.emit();
                    // Move the alert to a separate microtask to avoid NG0100
                    setTimeout(() => alert('CV saved successfully!'), 0);
                } catch (e: any) {
                    if (e.status === 409) {
                        setTimeout(() => alert('Name already exists. Choose a different name.'), 0);
                    } else {
                        setTimeout(() => alert('Failed to save CV.'), 0);
                    }
                }
            } else {
                await firstValueFrom(this.http.put(`${environment.apiUrl}/history/${this.currentHistoryId}`, this.cvData));
                await this.loadHistory();
                this.refreshHistory.emit();
                setTimeout(() => alert('CV updated successfully!'), 0);
            }
        } catch (e) {
            console.error('Save failed', e);
        }
    }

    async deleteHistoryItem(itemId: number) {
        if (!confirm('Are you sure you want to delete this CV?')) return;
        try {
            await firstValueFrom(this.http.delete(`${environment.apiUrl}/history/${itemId}`));
            if (this.currentHistoryId === itemId) {
                this.currentHistoryId = null;
                this.currentCvTitle = null;
            }
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

    THEMES: { id: CVTheme; name: string; color: string }[] = [
        { id: 'euro-classic', name: 'Euro Classic', color: 'bg-blue-600' },
        { id: 'modern-minimal', name: 'Modern Minimal', color: 'bg-slate-800' },
        { id: 'executive-dark', name: 'Executive Dark', color: 'bg-slate-900' },
        { id: 'corporate-gray', name: 'Corporate Gray', color: 'bg-gray-500' },
        { id: 'creative-teal', name: 'Creative Teal', color: 'bg-teal-600' },
        { id: 'compact-stack', name: 'Compact Stack', color: 'bg-indigo-600' },
        { id: 'serif-elegant', name: 'Serif Elegant', color: 'bg-red-900' },
        { id: 'bold-header', name: 'Bold Header', color: 'bg-blue-800' },
        { id: 'ats-clean-blue', name: 'ATS Clean Blue', color: 'bg-blue-700' },
        { id: 'ats-centered-indigo', name: 'ATS Centered Indigo', color: 'bg-indigo-700' },
    ];

    async handleReAnalyze() {
        if (!this.jobDescription.trim()) return;
        this.isAnalyzing = true;
        try {
            const cvText = JSON.stringify(this.cvData);
            const result = await this.geminiService.analyzeATS(cvText, this.jobDescription);
            this.atsResult = result;
            this.atsResultChange.emit(result);
        } catch (e) {
            console.error("Analysis failed", e);
        } finally {
            this.isAnalyzing = false;
        }
    }

    toggleCheckItem(item: string) {
        if (this.checkedItems.has(item)) {
            this.checkedItems.delete(item);
        } else {
            this.checkedItems.add(item);
        }
    }

    isChecked(item: string): boolean {
        return this.checkedItems.has(item);
    }

    updateCvData(newData: CVData) {
        this.cvData = newData;
        this.cvDataChange.emit(newData);
        this.atsResult = null; // Reset ATS score when CV data changes
        this.atsResultChange.emit(null);
    }

    updatePersonalInfo(field: string, value: string) {
        this.updateCvData({
            ...this.cvData,
            personalInfo: { ...this.cvData.personalInfo, [field]: value }
        });
    }

    moveSection(index: number, direction: 'up' | 'down') {
        const newOrder = [...this.cvData.sectionOrder];
        if (direction === 'up' && index > 0) {
            [newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]];
        } else if (direction === 'down' && index < newOrder.length - 1) {
            [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
        }
        this.updateCvData({ ...this.cvData, sectionOrder: newOrder });
    }

    removeSection(sectionId: string) {
        const isCustom = sectionId.startsWith('custom-');
        let newCustomSections = this.cvData.customSections;
        if (isCustom) {
            newCustomSections = this.cvData.customSections.filter(cs => cs.id !== sectionId);
        }
        this.updateCvData({
            ...this.cvData,
            customSections: newCustomSections,
            sectionOrder: this.cvData.sectionOrder.filter(id => id !== sectionId)
        });
    }

    addSection(sectionId: string) {
        if (sectionId === 'custom') {
            const newId = `custom-${Date.now()}`;
            const newSection: CustomSection = {
                id: newId,
                title: 'New Section',
                items: [],
                type: 'custom'
            };
            this.updateCvData({
                ...this.cvData,
                customSections: [...this.cvData.customSections, newSection],
                sectionOrder: [...this.cvData.sectionOrder, newId]
            });
        } else {
            if (!this.cvData.sectionOrder.includes(sectionId)) {
                this.updateCvData({
                    ...this.cvData,
                    sectionOrder: [...this.cvData.sectionOrder, sectionId]
                });
            }
        }
        this.showAddSectionMenu = false;
    }

    addWorkExperience() {
        const newExp: WorkExperience = {
            id: Date.now().toString(),
            title: '',
            employer: '',
            city: '',
            country: '',
            startDate: '',
            endDate: '',
            current: false,
            description: ''
        };
        this.updateCvData({ ...this.cvData, workExperience: [newExp, ...this.cvData.workExperience] });
    }

    updateWorkExperience(id: string, field: keyof WorkExperience, value: any) {
        this.updateCvData({
            ...this.cvData,
            workExperience: this.cvData.workExperience.map(item => item.id === id ? { ...item, [field]: value } : item)
        });
    }

    removeWorkExperience(id: string) {
        this.updateCvData({
            ...this.cvData,
            workExperience: this.cvData.workExperience.filter(item => item.id !== id)
        });
    }

    addEducation() {
        const newEdu: Education = {
            id: Date.now().toString(),
            degree: '',
            school: '',
            city: '',
            country: '',
            startDate: '',
            endDate: '',
            current: false,
            description: ''
        };
        this.updateCvData({ ...this.cvData, education: [newEdu, ...this.cvData.education] });
    }

    updateEducation(id: string, field: keyof Education, value: any) {
        this.updateCvData({
            ...this.cvData,
            education: this.cvData.education.map(item => item.id === id ? { ...item, [field]: value } : item)
        });
    }

    removeEducation(id: string) {
        this.updateCvData({
            ...this.cvData,
            education: this.cvData.education.filter(item => item.id !== id)
        });
    }

    addLanguage() {
        const newLang: LanguageSkill = {
            id: Date.now().toString(),
            language: '',
            listening: 'B1',
            reading: 'B1',
            spokenInteraction: 'B1',
            spokenProduction: 'B1',
            writing: 'B1'
        };
        this.updateCvData({
            ...this.cvData,
            skills: { ...this.cvData.skills, otherLanguages: [...this.cvData.skills.otherLanguages, newLang] }
        });
    }

    updateLanguage(id: string, field: keyof LanguageSkill, value: string) {
        this.updateCvData({
            ...this.cvData,
            skills: {
                ...this.cvData.skills,
                otherLanguages: this.cvData.skills.otherLanguages.map(l => l.id === id ? { ...l, [field]: value } : l)
            }
        });
    }

    removeLanguage(id: string) {
        this.updateCvData({
            ...this.cvData,
            skills: {
                ...this.cvData.skills,
                otherLanguages: this.cvData.skills.otherLanguages.filter(l => l.id !== id)
            }
        });
    }

    addDigitalSkillCategory() {
        const newCategory: DigitalSkillCategory = {
            id: Date.now().toString(),
            name: '',
            skills: []
        };
        this.updateCvData({
            ...this.cvData,
            skills: { ...this.cvData.skills, digitalSkills: [...this.cvData.skills.digitalSkills, newCategory] }
        });
    }

    updateDigitalSkillCategory(id: string, field: keyof DigitalSkillCategory, value: any) {
        this.updateCvData({
            ...this.cvData,
            skills: {
                ...this.cvData.skills,
                digitalSkills: this.cvData.skills.digitalSkills.map(cat => cat.id === id ? { ...cat, [field]: value } : cat)
            }
        });
    }

    updateDigitalSkills(id: string, skillsString: string) {
        const skillsArray = skillsString.split(',').map(s => s.trim()).filter(Boolean);
        this.updateDigitalSkillCategory(id, 'skills', skillsArray);
    }

    removeDigitalSkillCategory(id: string) {
        this.updateCvData({
            ...this.cvData,
            skills: {
                ...this.cvData.skills,
                digitalSkills: this.cvData.skills.digitalSkills.filter(cat => cat.id !== id)
            }
        });
    }

    setMotherTongue(value: string) {
        this.updateCvData({ ...this.cvData, skills: { ...this.cvData.skills, motherTongue: value } });
    }

    setSoftSkills(value: string) {
        this.updateCvData({ ...this.cvData, skills: { ...this.cvData.skills, softSkills: value.split(',').map(s => s.trim()).filter(Boolean) } });
    }

    addCustomItem(sectionId: string) {
        const newItem: CustomSectionItem = {
            id: Date.now().toString(),
            title: '',
            subtitle: '',
            city: '',
            country: '',
            startDate: '',
            endDate: '',
            current: false,
            description: ''
        };
        this.updateCvData({
            ...this.cvData,
            customSections: this.cvData.customSections.map(cs =>
                cs.id === sectionId ? { ...cs, items: [...cs.items, newItem] } : cs
            )
        });
    }

    updateCustomItem(sectionId: string, itemId: string, field: keyof CustomSectionItem, value: any) {
        this.updateCvData({
            ...this.cvData,
            customSections: this.cvData.customSections.map(cs =>
                cs.id === sectionId
                    ? { ...cs, items: cs.items.map(item => item.id === itemId ? { ...item, [field]: value } : item) }
                    : cs
            )
        });
    }

    removeCustomItem(sectionId: string, itemId: string) {
        this.updateCvData({
            ...this.cvData,
            customSections: this.cvData.customSections.map(cs =>
                cs.id === sectionId ? { ...cs, items: cs.items.filter(i => i.id !== itemId) } : cs
            )
        });
    }

    updateCustomSectionTitle(sectionId: string, title: string) {
        this.updateCvData({
            ...this.cvData,
            customSections: this.cvData.customSections.map(cs => cs.id === sectionId ? { ...cs, title } : cs)
        });
    }

    updateSectionTitle(sectionId: string, title: string) {
        this.updateCvData({
            ...this.cvData,
            sectionTitles: {
                ...this.cvData.sectionTitles,
                [sectionId]: title
            }
        });
    }

    updateSectionColumn(sectionId: string, column: 'left' | 'right') {
        this.updateCvData({
            ...this.cvData,
            sectionColumns: {
                ...this.cvData.sectionColumns,
                [sectionId]: column
            }
        });
    }

    getSectionColumn(sectionId: string): 'left' | 'right' {
        return this.cvData.sectionColumns?.[sectionId] || 'right';
    }

    getSectionTitle(sectionId: string): string {
        return this.cvData.sectionTitles?.[sectionId] || this.getDefaultTitle(sectionId);
    }

    private getDefaultTitle(sectionId: string): string {
        switch (sectionId) {
            case 'aboutMe': return 'About Me';
            case 'workExperience': return 'Work Experience';
            case 'education': return 'Education and Training';
            case 'skills': return 'Personal Skills';
            default: return sectionId;
        }
    }

    setTheme(themeId: CVTheme) {
        this.updateCvData({ ...this.cvData, theme: themeId });
    }



    trackById(index: number, item: any): string {
        return item.id;
    }

    handlePrint() {
        window.print();
    }

    handleDownloadPdfDirect() {
        this.pdfService.generatePdf(this.cvData).subscribe({
            next: (blob) => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `CV_${this.cvData.personalInfo.firstName}_${this.cvData.personalInfo.lastName}.pdf`;
                a.click();
                window.URL.revokeObjectURL(url);
            },
            error: (err) => console.error('PDF generation failed', err)
        });
    }

    async handleSaveProfile() {
        this.isSavingProfile = true;
        try {
            await this.profileService.saveProfile(this.cvData);
            this.isSavingProfile = false;
            this.profileSaveSuccess = true;
            setTimeout(() => this.profileSaveSuccess = false, 3000);
        } catch (err) {
            this.isSavingProfile = false;
            console.error('Failed to save profile', err);
        }
    }

    get availableStandardSections() {
        return [
            { id: 'aboutMe', label: 'About Me' },
            { id: 'workExperience', label: 'Work Experience' },
            { id: 'education', label: 'Education & Training' },
            { id: 'skills', label: 'Personal Skills' },
        ].filter(s => !this.cvData.sectionOrder.includes(s.id));
    }

    scoreColor(score: number): string {
        if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
        if (score >= 50) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
        return 'text-red-600 bg-red-50 border-red-200';
    }
}
