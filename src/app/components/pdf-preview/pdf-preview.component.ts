import { Component, OnInit, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CvPreviewComponent } from '../cv-preview/cv-preview';
import { CVData } from '../../models/cv.model';

@Component({
  selector: 'app-pdf-preview',
  standalone: true,
  imports: [CommonModule, CvPreviewComponent],
  templateUrl: './pdf-preview.html',
  styles: [`
    :host {
      display: block;
      background-color: white;
    }
  `]
})
export class PdfPreviewComponent implements OnInit, AfterViewInit {
  cvData: CVData | null = null;
  
  @ViewChild(CvPreviewComponent, { read: ElementRef }) previewRef!: ElementRef;

  ngOnInit() {
    this.loadData();
  }

  ngAfterViewInit() {
    // Here we can implement the page splitting logic if needed.
    // For now, we wait for the view to initialize.
    setTimeout(() => {
        this.paginate();
    }, 500); // Give it some time to render images/fonts
  }

  loadData() {
    try {
      const storedData = localStorage.getItem('render_cv_data');
      if (storedData) {
        this.cvData = JSON.parse(storedData);
        // Clean up? Maybe not, in case of refresh.
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
    
    // We assume the first child of app-cv-preview is the .cv-page
    let currentPage = previewEl.querySelector('.cv-page') as HTMLElement;
    if (!currentPage) {
        document.body.classList.add('pdf-ready');
        return;
    }

    const A4_HEIGHT_PX = 1122; // 297mm @ 96dpi ~ 1122.5px
    const PAGE_MARGIN_BOTTOM = 50; // Buffer

    // Safety break to prevent infinite loops
    let pageCount = 1;
    const MAX_PAGES = 10;

    // We loop as long as the current page is overflowing
    // Note: scrollHeight includes hidden overflow. 
    while (currentPage.scrollHeight > A4_HEIGHT_PX && pageCount < MAX_PAGES) {
        console.log(`Page ${pageCount} is too tall (${currentPage.scrollHeight}px). Splitting...`);
        
        // 1. Create a new page (clone structure)
        const nextPage = currentPage.cloneNode(true) as HTMLElement;
        
        // 2. Find the split point in the current page
        const contentContainer = this.findContentContainer(currentPage);
        const nextContentContainer = this.findContentContainer(nextPage);

        if (!contentContainer || !nextContentContainer) {
            console.warn('Could not find content container for pagination.');
            break; 
        }

        // 3. Move items from current to next
        const children = Array.from(contentContainer.children) as HTMLElement[];
        let splitIndex = -1;

        for (let i = 0; i < children.length; i++) {
            const child = children[i];
            const rect = child.getBoundingClientRect();
            // We need relative position from the page top
            // But since we are modifying DOM, getBoundingClientRect might change.
            // However, inside this loop we haven't modified yet.
            const pageRect = currentPage.getBoundingClientRect();
            const relativeBottom = rect.bottom - pageRect.top;

            if (relativeBottom > (A4_HEIGHT_PX - PAGE_MARGIN_BOTTOM)) {
                splitIndex = i;
                break;
            }
        }

        if (splitIndex !== -1) {
            // Move elements from splitIndex onwards to nextPage
            
            // In nextPage, remove 0..splitIndex-1 (The ones that stay on Page 1)
            const nextChildren = Array.from(nextContentContainer.children) as HTMLElement[];
            for (let i = 0; i < splitIndex; i++) {
                if (nextChildren[i]) nextChildren[i].remove();
            }

            // In currentPage, remove splitIndex..end (The ones that go to Page 2)
            for (let i = splitIndex; i < children.length; i++) {
                if (children[i]) children[i].remove();
            }

            // Clear Sidebar in nextPage to avoid duplication
            this.clearSidebar(nextPage);

            // Append nextPage to the DOM
            currentPage.parentNode?.insertBefore(nextPage, currentPage.nextSibling);
            
            // Update loop variables
            currentPage = nextPage;
            pageCount++;
        } else {
            // No split point found (maybe one huge element?)
            // If the first element itself is too big, we can't split it easily without breaking internal HTML.
            // We just let it overflow or break.
            console.warn('Could not find a split point in sections. Element might be too large.');
            break;
        }
    }

    document.body.classList.add('pdf-ready');
  }

  findContentContainer(page: HTMLElement): HTMLElement | null {
     if (!this.cvData) return null;
     
     // Selectors based on cv-preview.html structure
     if (this.cvData.theme === 'euro-classic') {
         return page.querySelector('.md\\:w-2\\/3');
     } else if (this.cvData.theme === 'modern-minimal') {
         return page.querySelector('.max-w-2xl');
     } else if (this.cvData.theme === 'executive-dark') {
         return page.querySelector('.md\\:w-\\[65\\%\\]');
     } else if (this.cvData.theme === 'corporate-gray') {
         // Corporate gray: The second child of the main wrapper is the content
         // It doesn't have a unique class like w-2/3. 
         // But it is the second div inside the root > div
         // Structure: <div class="bg-white ..."> <div class="bg-slate-100 p-10 ...">...</div> <div class="p-10 ...">...</div> </div>
         const wrappers = page.querySelectorAll('.print-content-padding');
         if (wrappers.length >= 2) return wrappers[1] as HTMLElement;
         // Fallback if structure is different
         return page.querySelector('.p-10:not(.bg-slate-100)'); 
     }
     return null;
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
          // We keep the container but empty the content so the background color persists if needed
          // But for these themes, the background is on the sidebar div itself.
          sidebar.innerHTML = ''; 
      }
  }
}
