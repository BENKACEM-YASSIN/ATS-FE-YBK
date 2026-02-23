import {
  Component,
  EventEmitter,
  Output,
  inject,
  NgZone,
  ChangeDetectorRef,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IconsModule } from '../../icons.module';
import { GeminiService, ATSResult } from '../../services/gemini.service';
import { PdfService } from '../../services/pdf.service';
import { CVData } from '../../models/cv.model';
import { LOADING_TIPS } from '../../constants/tips';

@Component({
  selector: 'app-welcome-screen',
  standalone: true,
  imports: [CommonModule, FormsModule, IconsModule],
  templateUrl: './welcome-screen.component.html',
  styles: [],
})
export class WelcomeScreenComponent implements OnInit, OnDestroy {
  @Output() startScratch = new EventEmitter<string>();
  @Output() importData = new EventEmitter<{
    data: CVData;
    jobDescription?: string;
    atsResult?: ATSResult;
  }>();

  activeTab: 'options' | 'ai-paste' = 'options';
  screenState: 'initial' | 'input_jd' | 'ats_result' | 'processing' = 'initial';
  isStartFromScratch = false;

  extractedText: string = '';
  jobDescription: string = '';
  atsResult: ATSResult | null = null;
  pastedText: string = '';

  isLoading = false;
  loadingStep = '';
  error: string | null = null;

  currentTip = '';
  private tipInterval: any;

  private geminiService = inject(GeminiService);
  private pdfService = inject(PdfService);
  private ngZone = inject(NgZone);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit() {
    console.log('WelcomeScreenComponent initialized');
    this.currentTip = LOADING_TIPS[Math.floor(Math.random() * LOADING_TIPS.length)];
  }

  ngOnDestroy() {
    this.stopTipCycle();
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

  onStartScratchClick() {
    this.isStartFromScratch = true;
    this.screenState = 'input_jd';
  }

  handlePdfUpload(event: Event) {
    console.log('PDF upload event triggered');
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      console.log('Selected PDF file:', file.name);
      this.processPdfFile(file);
    } else {
      console.log('No PDF file selected');
    }
  }

  handleJsonUpload(event: Event) {
    console.log('JSON upload event triggered');
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      console.log('Selected JSON file:', file.name);
      this.processJsonFile(file);
    } else {
      console.log('No JSON file selected');
    }
  }

  async processJsonFile(file: File) {
    console.log('Processing JSON file:', file.name);
    try {
      this.isLoading = true;
      this.loadingStep = 'Reading JSON...';
      this.startTipCycle();
      this.cdr.detectChanges();

      const text = await file.text();
      console.log('JSON content read successfully');
      const data = JSON.parse(text) as CVData;
      console.log('JSON parsed successfully:', data);

      this.ngZone.run(() => {
        this.isLoading = false;
        this.stopTipCycle();
        console.log('Emitting importData for JSON');
        this.importData.emit({ data });
        this.cdr.detectChanges();
      });
    } catch (e) {
      console.error('Error processing JSON file:', e);
      this.ngZone.run(() => {
        this.isLoading = false;
        this.stopTipCycle();
        this.error = 'Invalid JSON file';
        this.cdr.detectChanges();
      });
    }
  }

  async processPdfFile(file: File) {
    console.log('Processing PDF file:', file.name);
    try {
      this.isLoading = true;
      this.loadingStep = 'Extracting text from PDF...';
      this.startTipCycle();
      this.cdr.detectChanges();

      const text = await this.pdfService.extractText(file);
      console.log('PDF text extracted successfully, length:', text.length);

      this.ngZone.run(() => {
        this.extractedText = text;
        this.pastedText = text;
        this.screenState = 'input_jd';
        console.log('Changed screenState to input_jd');
        this.isLoading = false;
        this.stopTipCycle();
        this.cdr.detectChanges();
      });
    } catch (e) {
      console.error('Error processing PDF file:', e);
      this.ngZone.run(() => {
        this.error = 'Failed to read PDF';
        this.isLoading = false;
        this.stopTipCycle();
        this.cdr.detectChanges();
      });
    }
  }

  handleManualPasteNext() {
    if (this.pastedText.trim()) {
      this.screenState = 'input_jd';
    }
  }

  async handleAnalyzeATS() {
    if (!this.pastedText || !this.jobDescription) return;

    this.isLoading = true;
    this.loadingStep = 'Analyzing ATS score...';
    this.startTipCycle();
    this.cdr.detectChanges();

    try {
      const ats = await this.geminiService.analyzeATS(this.pastedText, this.jobDescription);

      this.ngZone.run(() => {
        this.atsResult = ats;
        this.screenState = 'ats_result';
        this.isLoading = false;
        this.stopTipCycle();
        this.cdr.detectChanges();
      });
    } catch (e) {
      this.ngZone.run(() => {
        this.error = 'Analysis failed. Please try again.';
        this.isLoading = false;
        this.stopTipCycle();
        this.cdr.detectChanges();
      });
    }
  }

  async handleGenerateCV() {
    if (this.isStartFromScratch) {
      this.startScratch.emit(this.jobDescription);
      return;
    }

    if (!this.pastedText.trim()) return;

    this.isLoading = true;
    this.loadingStep = 'Parsing CV data...';
    this.startTipCycle();
    this.error = null;
    this.cdr.detectChanges();

    try {
      const cvData = await this.geminiService.parseCV(this.pastedText);

      this.ngZone.run(() => {
        this.isLoading = false;
        this.stopTipCycle();
        this.importData.emit({
          data: cvData,
          jobDescription: this.jobDescription,
          atsResult: this.atsResult || undefined,
        });
        this.cdr.detectChanges();
      });
    } catch (e) {
      this.ngZone.run(() => {
        this.error = 'AI Processing failed. Please try again.';
        this.isLoading = false;
        this.stopTipCycle();
        this.cdr.detectChanges();
      });
      console.error(e);
    }
  }

  resetScreen() {
    this.screenState = 'initial';
    this.activeTab = 'options';
    this.isStartFromScratch = false;
    this.pastedText = '';
    this.jobDescription = '';
    this.atsResult = null;
    this.error = null;
    this.isLoading = false;
    this.stopTipCycle();
    setTimeout(() => this.cdr.detectChanges());
  }

  getScoreColor(score: number): string {
    if (score >= 80) return 'text-green-600 border-green-200 bg-green-50';
    if (score >= 50) return 'text-yellow-600 border-yellow-200 bg-yellow-50';
    return 'text-red-600 border-red-200 bg-red-50';
  }

  getScoreProgressColor(score: number): string {
    if (score >= 80) return 'text-green-500';
    if (score >= 50) return 'text-amber-500';
    return 'text-red-500';
  }

  getScoreTextColor(score: number): string {
    if (score >= 80) return 'text-green-600';
    if (score >= 50) return 'text-amber-600';
    return 'text-red-600';
  }
}
