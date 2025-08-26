
import jsPDF from 'jspdf';

export class PDFReportService {
  static generateAnalysisReport(videoId: string, analysisData: any): void {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(20);
    doc.text('Video Analysis Report', 20, 30);
    
    // Add video information
    doc.setFontSize(12);
    doc.text(`Video ID: ${videoId}`, 20, 50);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 60);
    
    // Add analysis results
    if (analysisData) {
      doc.text('Analysis Results:', 20, 80);
      doc.text(`Status: ${analysisData.status || 'Unknown'}`, 20, 90);
      doc.text(`Confidence: ${analysisData.confidence || 'N/A'}%`, 20, 100);
    }
    
    // Save the PDF
    doc.save(`video-analysis-${videoId}.pdf`);
  }
}
