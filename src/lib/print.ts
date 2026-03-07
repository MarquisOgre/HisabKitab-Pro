export function printPage() {
  window.print();
}

export function printElement(elementId: string, title?: string) {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id "${elementId}" not found`);
    return;
  }

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    console.error('Could not open print window');
    return;
  }

  // Clone the element and compute all styles inline
  const clonedElement = element.cloneNode(true) as HTMLElement;
  
  // Get computed styles and apply them inline to all elements
  const applyInlineStyles = (source: HTMLElement, target: HTMLElement) => {
    const computedStyle = window.getComputedStyle(source);
    const importantStyles = [
      'color', 'background-color', 'background', 'font-family', 'font-size', 
      'font-weight', 'padding', 'margin', 'border', 'border-radius',
      'display', 'flex-direction', 'justify-content', 'align-items', 'gap',
      'width', 'height', 'max-width', 'min-width', 'text-align',
      'line-height', 'letter-spacing', 'box-shadow', 'opacity'
    ];
    
    importantStyles.forEach(prop => {
      const value = computedStyle.getPropertyValue(prop);
      if (value && value !== 'none' && value !== 'normal' && value !== '0px') {
        target.style.setProperty(prop, value);
      }
    });
    
    // Recursively apply to children
    const sourceChildren = source.children;
    const targetChildren = target.children;
    for (let i = 0; i < sourceChildren.length; i++) {
      if (sourceChildren[i] instanceof HTMLElement && targetChildren[i] instanceof HTMLElement) {
        applyInlineStyles(sourceChildren[i] as HTMLElement, targetChildren[i] as HTMLElement);
      }
    }
  };
  
  applyInlineStyles(element, clonedElement);

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title || 'Print'}</title>
        <style>
          @media print {
            body {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }
          * {
            box-sizing: border-box;
          }
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            padding: 20px;
            margin: 0;
            background: white;
            color: #1a1a2e;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th, td {
            padding: 10px 8px;
            text-align: left;
            border-bottom: 1px solid #e5e7eb;
          }
          th {
            font-weight: 600;
            background-color: #f9fafb;
          }
          img {
            max-width: 100%;
            height: auto;
          }
        </style>
      </head>
      <body>
        ${clonedElement.outerHTML}
      </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();

  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 500);
}

interface PrintTableOptions {
  title: string;
  subtitle?: string;
  columns: string[];
  rows: (string | number)[][];
  summary?: { label: string; value: string }[];
  logoUrl?: string;
}

export function printTable(options: PrintTableOptions) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    console.error('Could not open print window');
    return;
  }

  const tableRows = options.rows.map(row => 
    `<tr>${row.map(cell => `<td style="padding: 8px; border: 1px solid #ddd;">${cell}</td>`).join('')}</tr>`
  ).join('');

  const tableHeaders = options.columns.map(col => 
    `<th style="padding: 8px; border: 1px solid #ddd; background: #3b82f6; color: white;">${col}</th>`
  ).join('');

  const summaryHtml = options.summary ? `
    <div style="margin-top: 20px; padding: 15px; background: #f5f5f5; border-radius: 4px;">
      <h3 style="margin: 0 0 10px 0;">Summary</h3>
      ${options.summary.map(item => `<p style="margin: 5px 0;"><strong>${item.label}:</strong> ${item.value}</p>`).join('')}
    </div>
  ` : '';

  const logoHtml = options.logoUrl ? `
    <div style="text-align: center; margin-bottom: 15px;">
      <img src="${options.logoUrl}" alt="Logo" style="max-height: 50px; max-width: 100px; object-fit: contain;" />
    </div>
  ` : '';

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${options.title}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
            max-width: 1000px;
            margin: 0 auto;
          }
          h1 { color: #333; margin-bottom: 5px; }
          h2 { color: #666; font-weight: normal; margin-top: 0; }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        ${logoHtml}
        <h1>${options.title}</h1>
        ${options.subtitle ? `<h2>${options.subtitle}</h2>` : ''}
        <p>Generated on: ${new Date().toLocaleDateString()}</p>
        <table>
          <thead><tr>${tableHeaders}</tr></thead>
          <tbody>${tableRows}</tbody>
        </table>
        ${summaryHtml}
      </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();

  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 250);
}
