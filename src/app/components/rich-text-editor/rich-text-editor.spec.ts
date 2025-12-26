import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RichTextEditor } from './rich-text-editor';

describe('RichTextEditor', () => {
  let component: RichTextEditor;
  let fixture: ComponentFixture<RichTextEditor>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RichTextEditor]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RichTextEditor);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
