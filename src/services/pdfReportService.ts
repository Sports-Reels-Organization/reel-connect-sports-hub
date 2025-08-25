
import jsPDF from 'jspdf';

interface ReportData {
  title: string;
  analysisDetails: any;
  videoId: string;
  teamId?: string;
}

export const generatePDFReport = async (reportData: ReportData) => {
  try {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(20);
    doc.text(reportData.title, 20, 30);
    
    // Add analysis details
    doc.setFontSize(12);
    doc.text(`Video ID: ${reportData.videoId}`, 20, 50);
    
    if (reportData.teamId) {
      doc.text(`Team ID: ${reportData.teamId}`, 20, 60);
    }
    
    // Add analysis data
    doc.text('Analysis Details:', 20, 80);
    const analysisText = JSON.stringify(reportData.analysisDetails, null, 2);
    const lines = doc.splitTextToSize(analysisText, 170);
    doc.text(lines, 20, 90);
    
    // Save the PDF
    doc.save(`video-analysis-report-${reportData.videoId}.pdf`);
    
    return true;
  } catch (error) {
    console.error('Error generating PDF report:', error);
    throw new Error('Failed to generate PDF report');
  }
};
