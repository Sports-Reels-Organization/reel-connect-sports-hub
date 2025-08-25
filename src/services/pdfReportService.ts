
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { supabase } from '@/integrations/supabase/client';

export interface PDFReportData {
  videoTitle: string;
  videoType: string;
  analysisDate: string;
  overview: string;
  keyEvents: any[];
  recommendations: string[];
  taggedPlayerAnalysis: any;
  eventTimeline: any[];
  visualSummary: any;
  snapshotUrls: string[];
  teamName?: string;
}

export class PDFReportService {
  async generateComprehensiveReport(
    reportData: PDFReportData,
    videoId: string,
    teamId: string
  ): Promise<string> {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 20;

    // Header
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 100, 200);
    doc.text('AI Video Analysis Report', pageWidth / 2, yPosition, { align: 'center' });

    yPosition += 15;
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text(reportData.videoTitle, pageWidth / 2, yPosition, { align: 'center' });

    yPosition += 10;
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`${reportData.videoType.toUpperCase()} • ${reportData.analysisDate}`, pageWidth / 2, yPosition, { align: 'center' });

    yPosition += 20;

    // Overview Section
    this.addSection(doc, 'Overview', reportData.overview, yPosition);
    yPosition += this.calculateTextHeight(doc, reportData.overview, pageWidth - 40) + 20;

    // Key Events Section
    if (yPosition > pageHeight - 60) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 100, 200);
    doc.text('Key Events Timeline', 20, yPosition);
    yPosition += 10;

    reportData.keyEvents.forEach((event, index) => {
      if (yPosition > pageHeight - 30) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text(`${this.formatTimestamp(event.timestamp)} - ${event.event}`, 20, yPosition);
      yPosition += 6;

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 60);
      const eventText = doc.splitTextToSize(event.description, pageWidth - 40);
      doc.text(eventText, 20, yPosition);
      yPosition += eventText.length * 4 + 8;
    });

    // Tagged Player Analysis
    if (yPosition > pageHeight - 60) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 100, 200);
    doc.text('Tagged Player Analysis', 20, yPosition);
    yPosition += 15;

    Object.entries(reportData.taggedPlayerAnalysis).forEach(([playerId, analysis]: [string, any]) => {
      if (yPosition > pageHeight - 50) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text(`Player ${playerId}`, 20, yPosition);
      yPosition += 8;

      // Presence indicator
      doc.setFontSize(12);
      if (analysis.present) {
        doc.setTextColor(0, 150, 0);
        doc.text('✓ Present in video', 25, yPosition);
      } else {
        doc.setTextColor(200, 0, 0);
        doc.text('✗ Not found in video', 25, yPosition);
      }
      yPosition += 8;

      if (analysis.present) {
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');
        
        // Performance rating
        doc.text(`Performance Rating: ${analysis.performanceRating}/100`, 25, yPosition);
        yPosition += 6;

        // Involvement
        const involvementText = doc.splitTextToSize(analysis.involvement, pageWidth - 50);
        doc.text(involvementText, 25, yPosition);
        yPosition += involvementText.length * 4 + 8;
      }

      yPosition += 5;
    });

    // Recommendations Section
    if (yPosition > pageHeight - 60) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 100, 200);
    doc.text('Recommendations', 20, yPosition);
    yPosition += 15;

    reportData.recommendations.forEach((recommendation, index) => {
      if (yPosition > pageHeight - 20) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      
      const recText = doc.splitTextToSize(`${index + 1}. ${recommendation}`, pageWidth - 40);
      doc.text(recText, 20, yPosition);
      yPosition += recText.length * 4 + 6;
    });

    // Video Snapshots
    if (reportData.snapshotUrls && reportData.snapshotUrls.length > 0) {
      doc.addPage();
      yPosition = 20;

      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 100, 200);
      doc.text('Video Analysis Snapshots', 20, yPosition);
      yPosition += 20;

      for (let i = 0; i < Math.min(reportData.snapshotUrls.length, 4); i++) {
        try {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = reportData.snapshotUrls[i];
          });

          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = img.width;
          canvas.height = img.height;
          ctx?.drawImage(img, 0, 0);

          const imgData = canvas.toDataURL('image/jpeg', 0.8);
          const imgWidth = 80;
          const imgHeight = (img.height / img.width) * imgWidth;

          if (yPosition + imgHeight > pageHeight - 20) {
            doc.addPage();
            yPosition = 20;
          }

          doc.addImage(imgData, 'JPEG', 20, yPosition, imgWidth, imgHeight);
          
          doc.setFontSize(10);
          doc.setTextColor(100, 100, 100);
          doc.text(`Snapshot ${i + 1}`, 20, yPosition + imgHeight + 5);
          
          yPosition += imgHeight + 15;
        } catch (error) {
          console.error('Error adding snapshot to PDF:', error);
        }
      }
    }

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(
        `Generated by Reel Connect AI • Page ${i} of ${pageCount}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }

    // Save to Supabase Storage
    const pdfBlob = doc.output('blob');
    const fileName = `analysis-report-${videoId}-${Date.now()}.pdf`;
    
    const { data, error } = await supabase.storage
      .from('video-analysis-reports')
      .upload(fileName, pdfBlob);

    if (error) {
      throw new Error(`Failed to save PDF report: ${error.message}`);
    }

    const { data: urlData } = supabase.storage
      .from('video-analysis-reports')
      .getPublicUrl(fileName);

    // Save report record to database
    await supabase
      .from('ai_analysis_reports')
      .insert({
        video_id: videoId,
        team_id: teamId,
        report_type: 'comprehensive',
        pdf_url: urlData.publicUrl,
        report_data: reportData
      });

    return urlData.publicUrl;
  }

  private addSection(doc: jsPDF, title: string, content: string, yPosition: number): void {
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 100, 200);
    doc.text(title, 20, yPosition);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    const splitContent = doc.splitTextToSize(content, doc.internal.pageSize.getWidth() - 40);
    doc.text(splitContent, 20, yPosition + 10);
  }

  private calculateTextHeight(doc: jsPDF, text: string, maxWidth: number): number {
    const splitText = doc.splitTextToSize(text, maxWidth);
    return splitText.length * 4;
  }

  private formatTimestamp(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
}
