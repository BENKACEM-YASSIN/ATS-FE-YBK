import { Component, ElementRef, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconsModule } from '../../icons.module';

@Component({
    selector: 'app-rich-text-editor',
    standalone: true,
    imports: [CommonModule, IconsModule],
    templateUrl: './rich-text-editor.component.html',
    styles: [`
    .rich-text ul { list-style-type: disc; margin-left: 1.5rem; }
    .rich-text ol { list-style-type: decimal; margin-left: 1.5rem; }
  `],
    encapsulation: ViewEncapsulation.None
})
export class RichTextEditorComponent implements OnChanges {
    @Input() value: string = '';
    @Input() placeholder: string = '';
    @Input() className: string = '';
    @Output() valueChange = new EventEmitter<string>();

    @ViewChild('editor', { static: true }) editorRef!: ElementRef<HTMLDivElement>;

    isFocused: boolean = false;

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['value']) {
            const editor = this.editorRef.nativeElement;
            if (editor && editor.innerHTML !== this.value) {
                if (document.activeElement !== editor) {
                    editor.innerHTML = this.value || '';
                } else if (!this.value) {
                    editor.innerHTML = '';
                }
            }
        }
    }

    onInput() {
        const html = this.editorRef.nativeElement.innerHTML;
        this.valueChange.emit(html);
    }

    execCommand(command: string, value: string | undefined = undefined) {
        document.execCommand(command, false, value);
        this.editorRef.nativeElement.focus();
        this.onInput();
    }

    onFocus() { this.isFocused = true; }
    onBlur() { this.isFocused = false; }
}
