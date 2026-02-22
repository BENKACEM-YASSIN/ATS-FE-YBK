import { Component, EventEmitter, Input, Output, inject, NgZone, ChangeDetectorRef, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconsModule } from '../../icons.module';
import { GeminiService, EnhanceType } from '../../services/gemini.service';
import { LOADING_TIPS } from '../../constants/tips';

@Component({
    selector: 'app-ai-assistant',
    standalone: true,
    imports: [CommonModule, IconsModule],
    templateUrl: './ai-assistant.component.html',
    styles: []
})
export class AiAssistantComponent implements OnInit, OnDestroy {
    @Input() currentText: string = '';
    @Input() type: EnhanceType = 'summary';
    @Input() label: string = 'Enhance with AI';
    @Input() jobDescription?: string;
    @Input() contextHint: string = '';
    @Input() supportsBullets: boolean = false;

    @Output() apply = new EventEmitter<string>();

    @ViewChild('resultsContainer') resultsContainer!: ElementRef;

    private geminiService = inject(GeminiService);
    private ngZone = inject(NgZone);
    private cdr = inject(ChangeDetectorRef);
    private elementRef = inject(ElementRef);

    loading: boolean = false;
    suggestions: string[] | null = null;
    bullets: string[] | null = null;
    addedBullets = new Set<number>();
    error: string | null = null;

    currentTip = '';
    private tipInterval: any;

    ngOnInit() {
        this.currentTip = LOADING_TIPS[Math.floor(Math.random() * LOADING_TIPS.length)];
    }

    ngOnDestroy() {
        this.stopTipCycle();
    }

    async handleEnhance(mode: 'standard' | 'bullets') {
        const cleanText = this.currentText.replace(/<[^>]*>/g, '').trim();
        const cleanContext = this.contextHint.replace(/<[^>]*>/g, '').trim();

        if (!cleanText) {
            this.error = "Please enter some text first.";
            return;
        }

        const aiInput = cleanContext
            ? `Section Context:\n${cleanContext}\n\nSection Text:\n${cleanText}`
            : cleanText;

        this.loading = true;
        this.startTipCycle();
        this.error = null;
        this.suggestions = null;
        this.bullets = null;
        this.addedBullets.clear();
        this.cdr.detectChanges();

        try {
            if (mode === 'bullets' && this.supportsBullets) {
                const results = await this.geminiService.generateTailoredBullets(
                    aiInput,
                    this.jobDescription ?? '',
                    this.type
                );

                this.ngZone.run(() => {
                    this.bullets = results;
                    this.loading = false;
                    this.stopTipCycle();
                    this.cdr.detectChanges();
                    this.scrollToResults();
                });
            } else {
                const results = await this.geminiService.enhanceText(aiInput, this.type);

                this.ngZone.run(() => {
                    this.suggestions = results;
                    this.loading = false;
                    this.stopTipCycle();
                    this.cdr.detectChanges();
                    this.scrollToResults();
                });
            }
        } catch (err) {
            this.ngZone.run(() => {
                this.error = "Could not generate suggestion.";
                this.loading = false;
                this.stopTipCycle();
                this.cdr.detectChanges();
            });
        }
    }

    get primaryEnhanceMode(): 'standard' | 'bullets' {
        if (!this.supportsBullets) return 'standard';
        return this.type === 'job' ? 'bullets' : 'standard';
    }

    get secondaryEnhanceMode(): 'standard' | 'bullets' {
        return this.primaryEnhanceMode === 'bullets' ? 'standard' : 'bullets';
    }

    get showSecondaryAction(): boolean {
        return this.supportsBullets;
    }

    get primaryActionIcon(): string {
        return this.primaryEnhanceMode === 'bullets' ? 'target' : 'sparkles';
    }

    get secondaryActionIcon(): string {
        return this.secondaryEnhanceMode === 'bullets' ? 'target' : 'sparkles';
    }

    get primaryActionClass(): string {
        return this.primaryEnhanceMode === 'bullets'
            ? 'text-purple-600 hover:text-purple-800'
            : 'text-euro-blue hover:text-euro-dark';
    }

    get secondaryActionClass(): string {
        return this.secondaryEnhanceMode === 'bullets'
            ? 'text-purple-600 hover:text-purple-800'
            : 'text-euro-blue hover:text-euro-dark';
    }

    get primaryActionLabel(): string {
        return this.getActionLabel(this.primaryEnhanceMode);
    }

    get secondaryActionLabel(): string {
        return this.getActionLabel(this.secondaryEnhanceMode);
    }

    get primaryActionTitle(): string {
        return this.getActionTitle(this.primaryEnhanceMode);
    }

    get secondaryActionTitle(): string {
        return this.getActionTitle(this.secondaryEnhanceMode);
    }

    get bulletPanelTitle(): string {
        if (this.type === 'job') {
            return this.jobDescription?.trim() ? 'ATS Tailored Bullets' : 'Experience Bullets';
        }
        if (this.type === 'education') {
            return 'Education Bullet Suggestions';
        }
        if (this.type === 'custom') {
            return 'Section Bullet Suggestions';
        }
        if (this.type === 'summary') {
            return 'Summary Bullet Suggestions';
        }
        return 'Bullet Suggestions';
    }

    get bulletSortHint(): string {
        if (this.type === 'job' && this.jobDescription?.trim()) {
            return 'Sorted by ATS impact (high to low)';
        }
        return 'Sorted by relevance and impact';
    }

    private getActionLabel(mode: 'standard' | 'bullets'): string {
        if (mode === 'bullets') {
            if (this.type === 'job') {
                return this.jobDescription?.trim() ? 'Generate ATS Bullets' : 'Generate Bullets';
            }
            if (this.type === 'education') return 'Generate Education Bullets';
            if (this.type === 'custom') return 'Generate Section Bullets';
            if (this.type === 'summary') return 'Generate Summary Bullets';
            return 'Generate Bullets';
        }
        if (this.type === 'job') return 'Rewrite Paragraph';
        return this.label;
    }

    private getActionTitle(mode: 'standard' | 'bullets'): string {
        if (mode === 'bullets') {
            if (this.type === 'job') {
                return this.jobDescription?.trim()
                    ? 'Generate ATS-focused bullets ranked by job-description relevance'
                    : 'Generate high-impact bullets from this section';
            }
            if (this.type === 'education') {
                return 'Generate education-focused bullet points from this content';
            }
            if (this.type === 'custom') {
                return 'Generate concise bullets tailored for this custom section';
            }
            if (this.type === 'summary') {
                return 'Generate concise summary bullets';
            }
            return 'Generate bullet points';
        }
        return 'Rewrite this section as a stronger paragraph';
    }

    private startTipCycle() {
        this.currentTip = LOADING_TIPS[Math.floor(Math.random() * LOADING_TIPS.length)];
        this.tipInterval = setInterval(() => {
            this.ngZone.run(() => {
                this.currentTip = LOADING_TIPS[Math.floor(Math.random() * LOADING_TIPS.length)];
                this.cdr.detectChanges();
            });
        }, 4000);
    }

    private stopTipCycle() {
        if (this.tipInterval) {
            clearInterval(this.tipInterval);
            this.tipInterval = null;
        }
    }

    private scrollToResults() {
        setTimeout(() => {
            // Scroll the whole component into view, centered, to avoid getting hidden behind sticky headers
            this.elementRef.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
        }, 100);
    }

    handleAcceptSuggestion(suggestion: string) {
        this.apply.emit(suggestion);
        this.suggestions = null;
    }

    handleAddBullet(bullet: string, index: number) {
        const cleanBullet = `<li>${bullet}</li>`;
        let newText = this.currentText;

        if (!newText.includes('<ul>')) {
            newText = `<ul>${cleanBullet}</ul>` + newText;
        } else {
            newText = newText.replace('</ul>', `${cleanBullet}</ul>`);
        }

        this.apply.emit(newText);

        this.addedBullets.add(index);
    }

    handleDiscard() {
        this.suggestions = null;
        this.bullets = null;
        this.addedBullets.clear();
    }

    get isTextEmpty(): boolean {
        return !this.currentText.replace(/<[^>]*>/g, '').trim();
    }

    isBulletAdded(index: number): boolean {
        return this.addedBullets.has(index);
    }
}
