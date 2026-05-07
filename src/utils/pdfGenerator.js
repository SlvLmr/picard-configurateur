import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export async function generatePdfFromElement(element, fileName = 'picard-configuration.pdf') {
  if (!element) return;
  const canvas = await html2canvas(element, {
    backgroundColor: '#FAF7F2',
    scale: window.devicePixelRatio > 1 ? 2 : 1.5,
    useCORS: true,
    logging: false,
  });
  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const ratio = canvas.height / canvas.width;
  const imgWidth = pageWidth - 20;
  const imgHeight = imgWidth * ratio;
  const offsetY = Math.max(10, (pageHeight - imgHeight) / 2);
  pdf.addImage(imgData, 'PNG', 10, offsetY, imgWidth, imgHeight, undefined, 'FAST');
  pdf.save(fileName);
}
