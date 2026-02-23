import { Component, OnInit, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CvPreviewComponent } from '../cv-preview/cv-preview';
import { CVData } from '../../models/cv.model';

@Component({
  selector: 'app-pdf-preview',
  standalone: true,
  imports: [CommonModule, CvPreviewComponent],
  templateUrl: './pdf-preview.html',
  styles: [
    `
      :host {
        display: block;
        background-color: white;
      }
    `,
  ],
})
export class PdfPreviewComponent implements OnInit, AfterViewInit {
  cvData: CVData | null = null;

  @ViewChild(CvPreviewComponent, { read: ElementRef }) previewRef!: ElementRef;

  ngOnInit() {
    this.loadData();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.paginate();
    }, 500);
  }

  loadData() {
    try {
      const storedData = localStorage.getItem('render_cv_data');
      if (storedData) {
        this.cvData = JSON.parse(storedData);
      } else {
        console.warn('No CV data found in localStorage for PDF preview.');
      }
    } catch (e) {
      console.error('Failed to load CV data', e);
    }
  }

  paginate() {
    console.log('Paginating...');
    const previewEl = this.previewRef?.nativeElement;
    if (!previewEl) return;

    let currentPage = previewEl.querySelector('.cv-page') as HTMLElement;
    if (!currentPage) {
      document.body.classList.add('pdf-ready');
      return;
    }

    const A4_HEIGHT_PX = 1122;
    const PAGE_MARGIN_BOTTOM = 32;
    const PAGE_TOP_SPACER_PX = 0;
    const MAX_CONTENT_HEIGHT = A4_HEIGHT_PX - PAGE_MARGIN_BOTTOM;
    const OVERFLOW_EPS = 2;

    let pageCount = 1;
    const MAX_PAGES = 10;

    while (pageCount < MAX_PAGES) {
      const pageRect = currentPage.getBoundingClientRect();
      const isTwoColumn = this.isTwoColumnTheme();

      if (isTwoColumn) {
        const leftSelector = this.getLeftColumnSelector();
        const rightSelector = this.getRightColumnSelector();
        const leftCol = leftSelector
          ? (currentPage.querySelector(leftSelector) as HTMLElement)
          : null;
        const rightCol = rightSelector
          ? (currentPage.querySelector(rightSelector) as HTMLElement)
          : null;

        if (!leftCol || !rightCol) {
          console.warn('Could not find two-column containers for pagination.');
          break;
        }

        const leftSections = Array.from(
          leftCol.querySelectorAll(':scope > .section-block'),
        ) as HTMLElement[];
        const rightSections = Array.from(
          rightCol.querySelectorAll(':scope > .section-block'),
        ) as HTMLElement[];

        const leftBottom = this.getColumnBottom(leftSections, pageRect);
        const rightBottom = this.getColumnBottom(rightSections, pageRect);
        const maxBottom = Math.max(leftBottom, rightBottom);
        const leftOverflow = leftBottom > MAX_CONTENT_HEIGHT + OVERFLOW_EPS;
        const rightOverflow = rightBottom > MAX_CONTENT_HEIGHT + OVERFLOW_EPS;
        const anyOverflow = maxBottom > MAX_CONTENT_HEIGHT + OVERFLOW_EPS;

        let splitLeft = this.findSplitIndex(leftSections, pageRect, MAX_CONTENT_HEIGHT);
        let splitRight = this.findSplitIndex(rightSections, pageRect, MAX_CONTENT_HEIGHT);

        console.log('PDF PAGINATE (two-column)', {
          pageCount,
          leftCount: leftSections.length,
          rightCount: rightSections.length,
          leftBottom,
          rightBottom,
          max: MAX_CONTENT_HEIGHT,
          splitLeft,
          splitRight,
          leftOverflow,
          rightOverflow,
          anyOverflow,
        });

        if (!anyOverflow) {
          break;
        }

        const nextPage = currentPage.cloneNode(true) as HTMLElement;
        const nextLeftCol = leftSelector
          ? (nextPage.querySelector(leftSelector) as HTMLElement)
          : null;
        const nextRightCol = rightSelector
          ? (nextPage.querySelector(rightSelector) as HTMLElement)
          : null;

        if (!nextLeftCol || !nextRightCol) {
          console.warn('Could not find two-column containers for pagination (next page).');
          break;
        }

        const leftSplitOk = this.applyColumnSplit(
          leftSections,
          nextLeftCol,
          pageRect,
          MAX_CONTENT_HEIGHT,
          leftOverflow,
        );
        const rightSplitOk = this.applyColumnSplit(
          rightSections,
          nextRightCol,
          pageRect,
          MAX_CONTENT_HEIGHT,
          rightOverflow,
        );

        if ((leftOverflow && !leftSplitOk) || (rightOverflow && !rightSplitOk)) {
          console.warn('Could not find split points for two-column layout.');
          break;
        }

        this.stripLeftHeader(nextLeftCol);

        this.addTopSpacerIfNeeded(nextLeftCol, PAGE_TOP_SPACER_PX);
        this.addTopSpacerIfNeeded(nextRightCol, PAGE_TOP_SPACER_PX);

        currentPage.parentNode?.insertBefore(nextPage, currentPage.nextSibling);
        currentPage = nextPage;
        pageCount++;
        continue;
      }

      const contentContainer = this.findContentContainer(currentPage);
      if (!contentContainer) {
        console.warn('Could not find content container for pagination.');
        break;
      }

      const sections = Array.from(
        contentContainer.querySelectorAll(':scope > .section-block'),
      ) as HTMLElement[];
      const contentBottom = this.getColumnBottom(sections, pageRect);
      const overflow = contentBottom > MAX_CONTENT_HEIGHT + OVERFLOW_EPS;

      console.log('PDF PAGINATE (single)', {
        pageCount,
        count: sections.length,
        contentBottom,
        max: MAX_CONTENT_HEIGHT,
        overflow,
      });

      if (!overflow) {
        break;
      }

      const nextPage = currentPage.cloneNode(true) as HTMLElement;
      const nextContentContainer = this.findContentContainer(nextPage);

      if (!nextContentContainer) {
        console.warn('Could not find content container for pagination (next page).');
        break;
      }

      const splitOk = this.applyColumnSplit(
        sections,
        nextContentContainer,
        pageRect,
        MAX_CONTENT_HEIGHT,
        true,
      );

      if (!splitOk) {
        console.warn('Could not find a split point in sections. Element might be too large.');
        break;
      }

      this.stripSingleColumnHeader(nextContentContainer);

      this.addTopSpacerIfNeeded(nextContentContainer, PAGE_TOP_SPACER_PX);

      currentPage.parentNode?.insertBefore(nextPage, currentPage.nextSibling);
      currentPage = nextPage;
      pageCount++;
    }

    document.body.classList.add('pdf-ready');
  }

  findContentContainer(page: HTMLElement): HTMLElement | null {
    if (!this.cvData) return null;

    if (this.cvData.theme === 'euro-classic') {
      return page.querySelector('.md\\:w-2\\/3');
    } else if (this.cvData.theme === 'modern-minimal') {
      return page.querySelector('.max-w-2xl');
    } else if (this.cvData.theme === 'executive-dark') {
      return page.querySelector('.md\\:w-\\[65\\%\\]');
    } else if (this.cvData.theme === 'corporate-gray') {
      const wrappers = page.querySelectorAll('.print-content-padding');
      if (wrappers.length >= 2) return wrappers[1] as HTMLElement;

      return page.querySelector('.p-10:not(.bg-slate-100)');
    } else if (this.cvData.theme === 'creative-teal') {
      return page.querySelector('.space-y-10');
    } else if (this.cvData.theme === 'compact-stack') {
      return page.querySelector('.grid.grid-cols-2');
    } else if (this.cvData.theme === 'serif-elegant') {
      return page.querySelector('.space-y-8');
    } else if (this.cvData.theme === 'bold-header') {
      return page.querySelector('.p-10.space-y-8');
    } else if (this.cvData.theme === 'ats-clean-blue') {
      return page.querySelector('.ats-clean-content');
    } else if (this.cvData.theme === 'ats-centered-indigo') {
      return page.querySelector('.ats-centered-content');
    }

    const firstSection = page.querySelector('.section-block') as HTMLElement | null;
    return firstSection?.parentElement as HTMLElement | null;
  }

  clearSidebar(page: HTMLElement) {
    if (!this.cvData) return;
    let sidebar: HTMLElement | null = null;
    if (this.cvData.theme === 'euro-classic') {
      sidebar = page.querySelector('.md\\:w-1\\/3');
    } else if (this.cvData.theme === 'executive-dark') {
      sidebar = page.querySelector('.md\\:w-\\[35\\%\\]');
    }

    if (sidebar) {
      sidebar.innerHTML = '';
    }
  }

  private findSplitIndex(
    sections: HTMLElement[],
    pageRect: DOMRect,
    maxContentHeight: number,
  ): number {
    for (let i = 0; i < sections.length; i++) {
      const relativeBottom = this.getRelativeBottom(sections[i], pageRect);
      if (relativeBottom > maxContentHeight) {
        return i;
      }
    }
    return -1;
  }

  private getColumnBottom(sections: HTMLElement[], pageRect: DOMRect): number {
    if (sections.length === 0) return 0;
    const last = sections[sections.length - 1];
    return this.getRelativeBottom(last, pageRect);
  }

  private applySplit(
    currentSections: HTMLElement[],
    nextContainer: HTMLElement,
    splitIndex: number,
  ) {
    const nextSections = Array.from(
      nextContainer.querySelectorAll(':scope > .section-block'),
    ) as HTMLElement[];

    if (splitIndex === -1) {
      nextSections.forEach((s) => s.remove());
      return;
    }

    for (let i = 0; i < splitIndex; i++) {
      if (nextSections[i]) nextSections[i].remove();
    }
    for (let i = splitIndex; i < currentSections.length; i++) {
      if (currentSections[i]) currentSections[i].remove();
    }
  }

  private applyColumnSplit(
    sections: HTMLElement[],
    nextContainer: HTMLElement,
    pageRect: DOMRect,
    maxContentHeight: number,
    overflow: boolean,
  ): boolean {
    const nextSections = Array.from(
      nextContainer.querySelectorAll(':scope > .section-block'),
    ) as HTMLElement[];

    if (!overflow) {
      nextSections.forEach((s) => s.remove());
      return true;
    }

    if (sections.length === 0 || nextSections.length === 0) {
      return false;
    }

    const splitIndex = this.findSplitIndex(sections, pageRect, maxContentHeight);

    if (splitIndex > 0) {
      const currentSection = sections[splitIndex];
      const nextSection = nextSections[splitIndex];

      if (currentSection && nextSection) {
        const didChunkSplit = this.splitSectionByChunks(
          currentSection,
          nextSection,
          pageRect,
          maxContentHeight,
        );
        if (didChunkSplit) {
          this.hideSectionTitle(nextSection);

          for (let i = 0; i < splitIndex; i++) {
            if (nextSections[i]) nextSections[i].remove();
          }

          for (let i = splitIndex + 1; i < sections.length; i++) {
            if (sections[i]) sections[i].remove();
          }
          return true;
        }
      }

      this.applySplit(sections, nextContainer, splitIndex);
      return true;
    }

    const didChunkSplit = this.splitSectionByChunks(
      sections[0],
      nextSections[0],
      pageRect,
      maxContentHeight,
    );
    if (!didChunkSplit) {
      return false;
    }
    this.hideSectionTitle(nextSections[0]);

    for (let i = 1; i < sections.length; i++) {
      sections[i].remove();
    }

    return true;
  }

  private splitSectionByChunks(
    currentSection: HTMLElement,
    nextSection: HTMLElement,
    pageRect: DOMRect,
    maxContentHeight: number,
  ): boolean {
    let chunks = this.getSectionChunks(currentSection);
    let nextChunks = this.getSectionChunks(nextSection);

    if (chunks.length === 0 || chunks.length !== nextChunks.length) {
      const fallbackChunks = this.getFallbackChunks(currentSection);
      const fallbackNext = this.getFallbackChunks(nextSection);
      if (fallbackChunks.length > 0 && fallbackChunks.length === fallbackNext.length) {
        chunks = fallbackChunks;
        nextChunks = fallbackNext;
      }
    }

    if (chunks.length === 0 || chunks.length !== nextChunks.length) {
      console.log('PDF CHUNKS: no chunks or mismatch', {
        chunks: chunks.length,
        nextChunks: nextChunks.length,
      });
      return false;
    }

    const splitIndex = this.findSplitIndex(chunks, pageRect, maxContentHeight);
    console.log('PDF CHUNKS: split', { chunks: chunks.length, splitIndex });
    if (splitIndex > 0) {
      const didSplitOverflowingChunk = this.splitInsideChunk(
        chunks[splitIndex],
        nextChunks[splitIndex],
        pageRect,
        maxContentHeight,
      );

      if (didSplitOverflowingChunk) {
        for (let i = 0; i < splitIndex; i++) {
          if (nextChunks[i]) nextChunks[i].remove();
        }

        for (let i = splitIndex + 1; i < chunks.length; i++) {
          if (chunks[i]) chunks[i].remove();
        }
        return true;
      }

      for (let i = 0; i < splitIndex; i++) {
        if (nextChunks[i]) nextChunks[i].remove();
      }
      for (let i = splitIndex; i < chunks.length; i++) {
        if (chunks[i]) chunks[i].remove();
      }
      return true;
    }

    const didInnerSplit = this.splitInsideChunk(
      chunks[0],
      nextChunks[0],
      pageRect,
      maxContentHeight,
    );
    if (!didInnerSplit) return false;

    for (let i = 1; i < chunks.length; i++) {
      if (chunks[i]) chunks[i].remove();
    }

    return true;
  }

  private splitInsideChunk(
    currentChunk: HTMLElement,
    nextChunk: HTMLElement,
    pageRect: DOMRect,
    maxContentHeight: number,
  ): boolean {
    const innerChunks = this.getImmediateChunks(currentChunk);
    const nextInnerChunks = this.getImmediateChunks(nextChunk);
    if (innerChunks.length > 0 && innerChunks.length === nextInnerChunks.length) {
      const innerSplitIndex = this.findSplitIndex(innerChunks, pageRect, maxContentHeight);
      console.log('PDF CHUNKS: inner split', { chunks: innerChunks.length, innerSplitIndex });
      if (innerSplitIndex > 0) {
        for (let i = 0; i < innerSplitIndex; i++) {
          if (nextInnerChunks[i]) nextInnerChunks[i].remove();
        }
        for (let i = innerSplitIndex; i < innerChunks.length; i++) {
          if (innerChunks[i]) innerChunks[i].remove();
        }
        return true;
      }
      if (innerSplitIndex === 0) {
        const didRecursiveInnerSplit = this.splitElementRecursively(
          innerChunks[0],
          nextInnerChunks[0],
          pageRect,
          maxContentHeight,
        );
        if (didRecursiveInnerSplit) {
          for (let i = 1; i < innerChunks.length; i++) {
            if (innerChunks[i]) innerChunks[i].remove();
          }
          return true;
        }
      }
    }

    const currentRichTexts = Array.from(
      currentChunk.querySelectorAll('.rich-text'),
    ) as HTMLElement[];
    const nextRichTexts = Array.from(nextChunk.querySelectorAll('.rich-text')) as HTMLElement[];
    if (currentRichTexts.length > 0 && currentRichTexts.length === nextRichTexts.length) {
      for (let i = 0; i < currentRichTexts.length; i++) {
        if (
          this.splitElementRecursively(
            currentRichTexts[i],
            nextRichTexts[i],
            pageRect,
            maxContentHeight,
          )
        ) {
          return true;
        }
      }
    }

    return this.splitElementRecursively(currentChunk, nextChunk, pageRect, maxContentHeight);
  }

  private splitElementRecursively(
    currentElement: HTMLElement,
    nextElement: HTMLElement,
    pageRect: DOMRect,
    maxContentHeight: number,
    depth = 0,
  ): boolean {
    if (depth > 8) return false;

    const blocks = this.getSplitCandidates(currentElement);
    const nextBlocks = this.getSplitCandidates(nextElement);
    if (blocks.length > 0 && blocks.length === nextBlocks.length) {
      const splitIndex = this.findSplitIndex(blocks, pageRect, maxContentHeight);
      if (splitIndex > 0) {
        for (let i = 0; i < splitIndex; i++) {
          if (nextBlocks[i]) nextBlocks[i].remove();
        }
        for (let i = splitIndex; i < blocks.length; i++) {
          if (blocks[i]) blocks[i].remove();
        }
        return true;
      }
      if (splitIndex === 0) {
        return this.splitElementRecursively(
          blocks[0],
          nextBlocks[0],
          pageRect,
          maxContentHeight,
          depth + 1,
        );
      }
    }

    const currentChildren = Array.from(currentElement.children) as HTMLElement[];
    const nextChildren = Array.from(nextElement.children) as HTMLElement[];
    if (
      currentChildren.length === 1 &&
      nextChildren.length === 1 &&
      currentChildren[0].tagName === nextChildren[0].tagName
    ) {
      return this.splitElementRecursively(
        currentChildren[0],
        nextChildren[0],
        pageRect,
        maxContentHeight,
        depth + 1,
      );
    }

    return this.splitPlainTextByWords(currentElement, nextElement, pageRect, maxContentHeight);
  }

  private getSplitCandidates(container: HTMLElement): HTMLElement[] {
    const directChildren = Array.from(container.children) as HTMLElement[];
    if (directChildren.length > 1) return directChildren;

    if (directChildren.length === 1) {
      const only = directChildren[0];
      const tag = only.tagName.toLowerCase();
      if (tag === 'ul' || tag === 'ol') {
        const listItems = Array.from(only.children) as HTMLElement[];
        if (listItems.length > 1) return listItems;
      }
    }

    const paragraphs = Array.from(container.querySelectorAll(':scope > p')) as HTMLElement[];
    if (paragraphs.length > 1) return paragraphs;

    const listItems = Array.from(
      container.querySelectorAll(':scope > ul > li, :scope > ol > li'),
    ) as HTMLElement[];
    if (listItems.length > 1) return listItems;

    return [];
  }

  private splitPlainTextByWords(
    currentElement: HTMLElement,
    nextElement: HTMLElement,
    pageRect: DOMRect,
    maxContentHeight: number,
  ): boolean {
    if (currentElement.children.length > 0 || nextElement.children.length > 0) return false;

    const originalCurrent = currentElement.textContent || '';
    const originalNext = nextElement.textContent || '';
    const text = originalCurrent.trim();
    if (!text || originalNext.trim().length === 0) return false;

    const words = text.split(/\s+/).filter(Boolean);
    if (words.length < 10) return false;

    let low = 1;
    let high = words.length - 1;
    let best = -1;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      currentElement.textContent = words.slice(0, mid).join(' ');
      nextElement.textContent = words.slice(mid).join(' ');

      const relativeBottom = this.getRelativeBottom(currentElement, pageRect);
      if (relativeBottom <= maxContentHeight) {
        best = mid;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    if (best <= 0 || best >= words.length) {
      currentElement.textContent = originalCurrent;
      nextElement.textContent = originalNext;
      return false;
    }

    currentElement.textContent = words.slice(0, best).join(' ');
    nextElement.textContent = words.slice(best).join(' ');
    return true;
  }

  private getRelativeBottom(element: HTMLElement, pageRect: DOMRect): number {
    const style = window.getComputedStyle(element);
    const marginBottom = parseFloat(style.marginBottom || '0') || 0;
    const rect = element.getBoundingClientRect();
    return rect.bottom - pageRect.top + marginBottom;
  }

  private getSectionChunks(section: HTMLElement): HTMLElement[] {
    const contentRoot = this.findSectionContentRoot(section);
    if (contentRoot) {
      const chunks = this.getImmediateChunks(contentRoot);
      if (chunks.length > 0) return chunks;
    }

    return this.getImmediateChunks(section);
  }

  private getFallbackChunks(section: HTMLElement): HTMLElement[] {
    const contentRoot = this.findSectionContentRoot(section);
    if (!contentRoot) return [];

    const directChildren = Array.from(contentRoot.children) as HTMLElement[];
    if (directChildren.length > 1) return directChildren;

    if (directChildren.length === 1) {
      const only = directChildren[0];
      const tag = only.tagName.toLowerCase();
      if (tag === 'ul' || tag === 'ol') {
        return Array.from(only.children) as HTMLElement[];
      }
      const nested = Array.from(only.querySelectorAll(':scope > p, :scope > div')) as HTMLElement[];
      if (nested.length > 1) return nested;
    }

    const paragraphs = Array.from(contentRoot.querySelectorAll(':scope > p')) as HTMLElement[];
    if (paragraphs.length > 1) return paragraphs;

    const listItems = Array.from(
      contentRoot.querySelectorAll(':scope > ul > li, :scope > ol > li'),
    ) as HTMLElement[];
    if (listItems.length > 1) return listItems;

    return [];
  }

  private getImmediateChunks(container: HTMLElement): HTMLElement[] {
    const chunks = Array.from(container.querySelectorAll('.section-chunk')) as HTMLElement[];
    if (chunks.length === 0) return [];

    return chunks.filter((chunk) => {
      let parent = chunk.parentElement;
      while (parent && parent !== container) {
        if (parent.classList.contains('section-chunk')) return false;
        parent = parent.parentElement;
      }
      return parent === container;
    });
  }

  private findSectionContentRoot(section: HTMLElement): HTMLElement | null {
    const children = Array.from(section.children) as HTMLElement[];
    for (const child of children) {
      if (!/^H[1-4]$/.test(child.tagName)) {
        return child;
      }
    }
    return null;
  }

  private hideSectionTitle(section: HTMLElement) {
    const heading = section.querySelector(
      ':scope > h1, :scope > h2, :scope > h3, :scope > h4',
    ) as HTMLElement | null;
    if (!heading) return;
    heading.style.display = 'none';
    heading.setAttribute('aria-hidden', 'true');
  }

  private stripLeftHeader(leftColumn: HTMLElement) {
    const firstSection = leftColumn.querySelector('.section-block') as HTMLElement | null;
    if (!firstSection) {
      leftColumn.innerHTML = '';
      return;
    }
    let child = leftColumn.firstElementChild as HTMLElement | null;
    while (child && child !== firstSection) {
      const next = child.nextElementSibling as HTMLElement | null;
      child.remove();
      child = next;
    }
  }

  private stripSingleColumnHeader(contentContainer: HTMLElement) {
    const parent = contentContainer.parentElement;
    if (!parent) return;

    let sibling = contentContainer.previousElementSibling as HTMLElement | null;
    while (sibling) {
      const previous = sibling.previousElementSibling as HTMLElement | null;
      sibling.remove();
      sibling = previous;
    }
  }

  private addTopSpacerIfNeeded(container: HTMLElement, spacerPx: number) {
    if (spacerPx <= 0) return;
    const hasSections = container.querySelector('.section-block');
    if (!hasSections) return;
    const spacer = document.createElement('div');
    spacer.style.height = `${spacerPx}px`;
    spacer.setAttribute('aria-hidden', 'true');
    container.insertBefore(spacer, container.firstChild);
  }

  private isTwoColumnTheme(): boolean {
    return this.cvData?.theme === 'euro-classic' || this.cvData?.theme === 'executive-dark';
  }

  private getLeftColumnSelector(): string | null {
    if (!this.cvData) return null;
    if (this.cvData.theme === 'euro-classic') return '.md\\:w-1\\/3';
    if (this.cvData.theme === 'executive-dark') return '.md\\:w-\\[35\\%\\]';
    return null;
  }

  private getRightColumnSelector(): string | null {
    if (!this.cvData) return null;
    if (this.cvData.theme === 'euro-classic') return '.md\\:w-2\\/3';
    if (this.cvData.theme === 'executive-dark') return '.md\\:w-\\[65\\%\\]';
    return null;
  }
}
