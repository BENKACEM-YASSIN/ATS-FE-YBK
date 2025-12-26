import { Component, EventEmitter, Input, Output, inject, NgZone, ChangeDetectorRef, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconsModule } from '../../icons.module';
import { GeminiService } from '../../services/gemini.service';
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
    @Input() type: 'job' | 'summary' | 'skill' = 'summary';
    @Input() label: string = 'Enhance with AI';
    @Input() jobDescription?: string;

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

        if (!cleanText) {
            this.error = "Please enter some text first.";
            return;
        }

        this.loading = true;
        this.startTipCycle();
        this.error = null;
        this.suggestions = null;
        this.bullets = null;
        this.addedBullets.clear();
        this.cdr.detectChanges();

        try {
            if (mode === 'bullets' && this.jobDescription && this.type === 'job') {
                const results = await this.geminiService.generateTailoredBullets(cleanText, this.jobDescription);

                this.ngZone.run(() => {
                    this.bullets = results;
                    this.loading = false;
                    this.stopTipCycle();
                    this.cdr.detectChanges();
                    this.scrollToResults();
                });
            } else {
                const results = await this.geminiService.enhanceText(cleanText, this.type);

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
