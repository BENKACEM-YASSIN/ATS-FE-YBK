import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LANGUAGE_LEVELS } from '../../models/cv.model';

@Component({
    selector: 'app-select-level',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div>
        <label class="block text-[10px] text-slate-500 dark:text-slate-400 mb-1 truncate" [title]="label">{{label}}</label>
        <select 
            class="w-full p-1 border border-slate-300 dark:border-slate-700 rounded-md text-xs bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
            [ngModel]="value"
            (ngModelChange)="valueChange.emit($event)"
        >
            <option *ngFor="let l of languageLevels" [value]="l">{{l}}</option>
        </select>
    </div>
  `,
    styles: []
})
export class SelectLevelComponent {
    @Input() label: string = '';
    @Input() value: string = '';
    @Output() valueChange = new EventEmitter<string>();

    languageLevels = LANGUAGE_LEVELS;
}
