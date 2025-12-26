import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IconsModule } from '../../icons.module';

@Component({
    selector: 'app-section-wrapper',
    standalone: true,
    imports: [CommonModule, FormsModule, IconsModule],
    templateUrl: './section-wrapper.component.html',
    styles: []
})
export class SectionWrapperComponent {
    @Input() title: string = '';
    @Input() isFirst: boolean = false;
    @Input() isLast: boolean = false;
    @Input() enableCustomTitle: boolean = false;
    @Input() column: 'left' | 'right' = 'right';

    @Output() moveUp = new EventEmitter<void>();
    @Output() moveDown = new EventEmitter<void>();
    @Output() remove = new EventEmitter<void>();
    @Output() titleChange = new EventEmitter<string>();
    @Output() columnChange = new EventEmitter<'left' | 'right'>();

    isExpanded: boolean = true;

    toggleExpand() {
        this.isExpanded = !this.isExpanded;
    }

    onTitleChange(newTitle: string) {
        this.titleChange.emit(newTitle);
    }

    onColumnToggle(event: Event) {
        const isLeft = (event.target as HTMLInputElement).checked;
        this.columnChange.emit(isLeft ? 'left' : 'right');
    }
}
