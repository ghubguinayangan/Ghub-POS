/**
 * Browser-based receipt printer utility
 * Compatible with any receipt printer that supports standard printing
 * Includes ESC/POS commands for cash drawer control
 */

import type { Sale } from './placeholder-data';

// Minimal Settings interface to avoid circular imports
interface PrinterSettings {
  storeName?: string;
  storeAddress?: string;
  storePhone?: string;
  storeTIN?: string;
  storeLogo?: string | null;
  receiptFooter?: string;
  autoPrintReceipt?: boolean;
  autoOpenDrawer?: boolean;
  [key: string]: any; // Allow additional properties
}

export interface ReceiptData {
  sale: Sale;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  cashier: string;
  change?: number;
  settings: PrinterSettings;
}

/**
 * Generate receipt HTML for printing
 */
export function generateReceiptHTML(data: ReceiptData): string {
  const { sale, items, cashier, change, settings } = data;
  const date = new Date(sale.date);
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Receipt - ${sale.id}</title>
      <style>
        @media print {
          @page {
            size: 80mm auto;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
          }
        }
        body {
          font-family: 'Courier New', monospace;
          width: 80mm;
          margin: 0 auto;
          padding: 10mm;
          font-size: 12px;
          line-height: 1.4;
        }
        .center {
          text-align: center;
        }
        .bold {
          font-weight: bold;
        }
        .large {
          font-size: 16px;
        }
        .divider {
          border-top: 1px dashed #000;
          margin: 8px 0;
        }
        .row {
          display: flex;
          justify-content: space-between;
          margin: 2px 0;
        }
        .item-row {
          margin: 4px 0;
        }
        .logo {
          max-width: 60mm;
          height: auto;
          margin: 0 auto 8px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        td {
          padding: 2px 0;
        }
        .right {
          text-align: right;
        }
        .total-section {
          margin-top: 8px;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="center">
        ${settings.storeLogo ? `<img src="${settings.storeLogo}" alt="Store Logo" class="logo" />` : ''}
        <div class="bold large">${settings.storeName || 'EYIR POS'}</div>
        ${settings.storeAddress ? `<div>${settings.storeAddress}</div>` : ''}
        ${settings.storePhone ? `<div>${settings.storePhone}</div>` : ''}
        ${settings.storeTIN ? `<div>TIN: ${settings.storeTIN}</div>` : ''}
      </div>
      
      <div class="divider"></div>
      
      <div class="row">
        <span>Date:</span>
        <span>${date.toLocaleDateString()} ${date.toLocaleTimeString()}</span>
      </div>
      <div class="row">
        <span>Receipt #:</span>
        <span>${sale.id}</span>
      </div>
      <div class="row">
        <span>Cashier:</span>
        <span>${cashier}</span>
      </div>
      
      <div class="divider"></div>
      
      <table>
        <thead>
          <tr>
            <td class="bold">Item</td>
            <td class="bold center">Qty</td>
            <td class="bold right">Price</td>
            <td class="bold right">Total</td>
          </tr>
        </thead>
        <tbody>
          ${items.map(item => `
            <tr>
              <td>${item.name}</td>
              <td class="center">${item.quantity}</td>
              <td class="right">₱${item.price.toFixed(2)}</td>
              <td class="right">₱${item.total.toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="divider"></div>
      
      <div class="total-section">
        <div class="row bold">
          <span>TOTAL:</span>
          <span>₱${sale.total.toFixed(2)}</span>
        </div>
        <div class="row">
          <span>Payment Method:</span>
          <span>${sale.paymentMethod}</span>
        </div>
        ${change !== undefined && change > 0 ? `
          <div class="row">
            <span>Cash Received:</span>
            <span>₱${(sale.total + change).toFixed(2)}</span>
          </div>
          <div class="row">
            <span>Change:</span>
            <span>₱${change.toFixed(2)}</span>
          </div>
        ` : ''}
      </div>
      
      <div class="divider"></div>
      
      <div class="center">
        ${settings.receiptFooter || 'Thank you for shopping!'}
      </div>
      
      <div class="center" style="margin-top: 16px;">
        <small>Powered by EYIR POS</small>
      </div>
    </body>
    </html>
  `;
}

/**
 * Print receipt using browser's print dialog
 * Compatible with any printer (thermal, regular, PDF)
 */
export function printReceipt(data: ReceiptData): void {
  const html = generateReceiptHTML(data);
  
  // Create a hidden iframe for printing
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';
  
  document.body.appendChild(iframe);
  
  const iframeDoc = iframe.contentWindow?.document;
  if (iframeDoc) {
    iframeDoc.open();
    iframeDoc.write(html);
    iframeDoc.close();
    
    // Wait for content to load, then print
    iframe.onload = () => {
      setTimeout(() => {
        iframe.contentWindow?.print();
        
        // Remove iframe after printing (or if cancelled)
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 100);
      }, 250);
    };
  }
}

/**
 * Generate ESC/POS commands for cash drawer kick
 * This sends the standard drawer kick command
 */
export function generateDrawerKickCommand(): Uint8Array {
  // ESC/POS command: ESC p m t1 t2
  // ESC = 27, p = 112, m = 0 (pin 2), t1 = 50 (on time), t2 = 250 (off time)
  return new Uint8Array([27, 112, 0, 50, 250]);
}

/**
 * Open cash drawer (requires ESC/POS compatible printer)
 * This uses the Web USB API or Web Serial API if available
 */
export async function openCashDrawer(): Promise<boolean> {
  try {
    // Try Web Serial API first (better browser support)
    if ('serial' in navigator) {
      // @ts-ignore - Web Serial API might not be in TypeScript definitions yet
      const port = await navigator.serial.requestPort();
      // @ts-ignore
      await port.open({ baudRate: 9600 });
      
      const writer = port.writable?.getWriter();
      if (writer) {
        await writer.write(generateDrawerKickCommand());
        writer.releaseLock();
        await port.close();
        return true;
      }
    }
    
    // Fallback: Try Web USB API
    // @ts-ignore - Web USB API might not be in TypeScript definitions yet
    if ('usb' in navigator) {
      // This requires user interaction to select the USB device
      console.warn('USB API available but requires manual device selection');
    }
    
    return false;
  } catch (error) {
    console.error('Failed to open cash drawer:', error);
    return false;
  }
}

/**
 * Print receipt and optionally open cash drawer
 */
export async function printReceiptAndOpenDrawer(
  data: ReceiptData,
  openDrawer: boolean = false
): Promise<void> {
  // Print receipt
  printReceipt(data);
  
  // Open drawer if requested and payment is cash
  if (openDrawer && data.sale.paymentMethod === 'Cash') {
    // Small delay to ensure printing starts first
    setTimeout(async () => {
      const success = await openCashDrawer();
      if (!success) {
        console.warn('Could not open cash drawer automatically. Manual opening required.');
      }
    }, 500);
  }
}

/**
 * Download receipt as PDF (alternative to printing)
 */
export function downloadReceiptAsPDF(data: ReceiptData): void {
  const html = generateReceiptHTML(data);
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `receipt-${data.sale.id}.html`;
  link.click();
  URL.revokeObjectURL(url);
}
