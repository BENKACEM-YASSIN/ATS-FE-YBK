import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-input',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div [class]="fullWidth ? 'col-span-full md:col-span-2' : 'col-span-1'">
        <label class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">{{label}}</label>
        <input 
            [type]="type"
            class="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-md focus:ring-2 focus:ring-euro-blue focus:border-transparent text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder-slate-400"
            [value]="value"
            (input)="onInput($event)"
        />
    </div>
  `,
    styles: []
})
export class InputComponent {
    @Input() label: string = '';
    @Input() value: string = '';
    @Input() type: string = 'text';
    @Input() fullWidth: boolean = false;
    @Output() valueChange = new EventEmitter<string>();

    onInput(event: Event) {
        const val = (event.target as HTMLInputElement).value;
        this.valueChange.emit(val);
    }
}
