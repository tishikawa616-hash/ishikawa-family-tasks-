import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { format } from 'date-fns';

/**
 * Generate PDF from an HTML element
 * @param element The HTML element to render
 */
export async function generateReportPDF(element: HTMLElement) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const canvas = await (html2canvas as any)(element, {
      scale: 2, // Improve quality
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`agricultural-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  } catch (error) {
    console.error("Failed to generate PDF:", error);
    alert("PDF生成に失敗しました。");
  }
}

/**
 * Generate PDF for a specific field report
 * @param element The HTML element
 * @param title The title for the file name
 */
export async function generateFieldReportPDF(element: HTMLElement, title: string) {
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const canvas = await (html2canvas as any)(element, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff'
        });
    
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        });
    
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        
        // Sanitize title
        const safeTitle = title.replace(/[^a-zA-Z0-9\u3000-\u303F\u3040-\u309F\u30A0-\u30FF\uFF00-\uFFEF\u4E00-\u9FAF]/g, '_');
        
        pdf.save(`${safeTitle}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      } catch (error) {
        console.error("Failed to generate PDF:", error);
        alert("PDF生成に失敗しました。");
      }
}
