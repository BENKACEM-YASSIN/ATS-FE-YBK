import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SectionWrapper } from './section-wrapper';

describe('SectionWrapper', () => {
  let component: SectionWrapper;
  let fixture: ComponentFixture<SectionWrapper>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SectionWrapper]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SectionWrapper);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
