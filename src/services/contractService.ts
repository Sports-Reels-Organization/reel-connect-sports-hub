import { supabase } from '@/integrations/supabase/client';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export interface ContractData {
  pitchId: string;
  playerName: string;
  teamName: string;
  transferType: 'permanent' | 'loan';
  askingPrice?: number;
  loanFee?: number;
  currency: string;
  contractDetails: {
    duration: string;
    salary: number;
    signOnBonus?: number;
    performanceBonus?: number;
    relocationSupport?: number;
  };
}

export const contractService = {
  async testBucketAccess(): Promise<boolean> {
    try {
      console.log('Testing bucket access...');
      const { data: buckets, error } = await supabase.storage.listBuckets();

      if (error) {
        console.error('Error listing buckets:', error);
        return false;
      }

      console.log('Available buckets:', buckets?.map(b => b.name));
      const contractsBucket = buckets?.find(b => b.name === 'contracts');

      if (contractsBucket) {
        console.log('Contracts bucket found:', contractsBucket);
        return true;
      } else {
        console.log('Contracts bucket not found');
        return false;
      }
    } catch (error) {
      console.error('Error testing bucket access:', error);
      return false;
    }
  },

  async generateContract(contractData: ContractData): Promise<string> {
    console.log('generateContract called with data:', contractData);

    try {
      console.log('Step 1: Invoking Supabase Edge Function...');

      const { data, error } = await supabase.functions.invoke('generate-contract', {
        body: contractData
      });

      console.log('Step 2: Edge function response received');
      console.log('Response data:', data);
      console.log('Response error:', error);

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }

      if (data?.success && data?.contractHTML) {
        console.log('Step 3: Contract HTML generated successfully, length:', data.contractHTML.length);
        return data.contractHTML;
      } else {
        console.error('Step 3 ERROR: Invalid response format:', data);
        throw new Error(data?.error || 'Failed to generate contract - invalid response format');
      }
    } catch (error) {
      console.error('Error generating contract:', error);

      // Check if it's a network error or function not found
      if (error.message?.includes('fetch') || error.message?.includes('network') ||
        error.message?.includes('function') || error.message?.includes('not found')) {
        console.log('Edge function not available, using fallback generation...');
        return this.generateContractFallback(contractData);
      }

      throw error;
    }
  },

  generateContractFallback(contractData: ContractData): string {
    console.log('Using fallback contract generation...');

    const currentDate = new Date().toLocaleDateString();

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Transfer Contract - ${contractData.playerName}</title>
        <style>
          body { 
            font-family: 'Times New Roman', serif; 
            line-height: 1.6; 
            color: #333; 
            max-width: 800px; 
            margin: 0 auto; 
            padding: 40px 20px; 
          }
          .header { text-align: center; margin-bottom: 40px; }
          .title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
          .subtitle { font-size: 16px; color: #666; }
          .section { margin: 30px 0; }
          .section-title { font-size: 18px; font-weight: bold; margin-bottom: 15px; border-bottom: 2px solid #333; padding-bottom: 5px; }
          .clause { margin: 15px 0; }
          .amount { font-weight: bold; color: #d4af37; }
          .signature-section { margin-top: 60px; display: flex; justify-content: space-between; }
          .signature-box { width: 200px; border-top: 1px solid #333; padding-top: 10px; text-align: center; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          th { background-color: #f5f5f5; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">PROFESSIONAL FOOTBALL TRANSFER AGREEMENT</div>
          <div class="subtitle">Transfer of ${contractData.playerName} to ${contractData.teamName}</div>
          <div class="subtitle">Date: ${currentDate}</div>
        </div>

        <div class="section">
          <div class="section-title">1. PARTIES</div>
          <div class="clause">
            <strong>Player:</strong> ${contractData.playerName}<br>
            <strong>Acquiring Club:</strong> ${contractData.teamName}<br>
            <strong>Transfer Type:</strong> ${contractData.transferType.toUpperCase()}
          </div>
        </div>

        <div class="section">
          <div class="section-title">2. TRANSFER TERMS</div>
          <table>
            <tr>
              <th>Item</th>
              <th>Amount</th>
            </tr>
            ${contractData.transferType === 'permanent' && contractData.askingPrice ? `
              <tr>
                <td>Transfer Fee</td>
                <td class="amount">${contractData.currency} ${contractData.askingPrice.toLocaleString()}</td>
              </tr>
            ` : ''}
            ${contractData.transferType === 'loan' && contractData.loanFee ? `
              <tr>
                <td>Loan Fee</td>
                <td class="amount">${contractData.currency} ${contractData.loanFee.toLocaleString()}</td>
              </tr>
            ` : ''}
            <tr>
              <td>Player Salary (Annual)</td>
              <td class="amount">${contractData.currency} ${contractData.contractDetails.salary.toLocaleString()}</td>
            </tr>
            ${contractData.contractDetails.signOnBonus ? `
              <tr>
                <td>Sign-on Bonus</td>
                <td class="amount">${contractData.currency} ${contractData.contractDetails.signOnBonus.toLocaleString()}</td>
              </tr>
            ` : ''}
            ${contractData.contractDetails.performanceBonus ? `
              <tr>
                <td>Performance Bonus</td>
                <td class="amount">${contractData.currency} ${contractData.contractDetails.performanceBonus.toLocaleString()}</td>
              </tr>
            ` : ''}
            ${contractData.contractDetails.relocationSupport ? `
              <tr>
                <td>Relocation Support</td>
                <td class="amount">${contractData.currency} ${contractData.contractDetails.relocationSupport.toLocaleString()}</td>
              </tr>
            ` : ''}
          </table>
        </div>

        <div class="section">
          <div class="section-title">3. CONTRACT DURATION</div>
          <div class="clause">
            This agreement shall be valid for a period of <strong>${contractData.contractDetails.duration}</strong> 
            commencing from the date of signature by all parties.
          </div>
        </div>

        <div class="section">
          <div class="section-title">4. TERMS AND CONDITIONS</div>
          <div class="clause">
            4.1. The player agrees to perform their duties with the highest level of professionalism and commitment.
          </div>
          <div class="clause">
            4.2. The acquiring club agrees to provide all necessary facilities and support for the player's development.
          </div>
          <div class="clause">
            4.3. All payments shall be made according to the agreed schedule and currency specified above.
          </div>
          <div class="clause">
            4.4. This agreement is subject to the rules and regulations of the relevant football governing bodies.
          </div>
        </div>

        <div class="section">
          <div class="section-title">5. GOVERNING LAW</div>
          <div class="clause">
            This agreement shall be governed by and construed in accordance with applicable football regulations 
            and the laws of the jurisdiction where the acquiring club is registered.
          </div>
        </div>

        <div class="signature-section">
          <div class="signature-box">
            <div>Player Signature</div>
            <div style="margin-top: 10px; font-size: 14px;">${contractData.playerName}</div>
          </div>
          <div class="signature-box">
            <div>Club Representative</div>
            <div style="margin-top: 10px; font-size: 14px;">${contractData.teamName}</div>
          </div>
          <div class="signature-box">
            <div>Date</div>
            <div style="margin-top: 10px; font-size: 14px;">${currentDate}</div>
          </div>
        </div>
      </body>
      </html>
    `;
  },

  async uploadContract(file: File, onProgress?: (progress: { percentage: number }) => void): Promise<string> {
    console.log('uploadContract called with file:', file.name, 'size:', file.size, 'type:', file.type);

    try {
      // Generate unique file path
      const timestamp = Date.now();
      const fileName = `${timestamp}-${file.name}`;
      const filePath = `contracts/${fileName}`;

      console.log('Uploading to path:', filePath);

      // Upload the file to message-attachments bucket (which we know exists)
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('message-attachments')
        .upload(filePath, file, {
          contentType: file.type,
          upsert: true
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      console.log('File uploaded successfully:', uploadData);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('message-attachments')
        .getPublicUrl(filePath);

      console.log('Public URL generated:', urlData.publicUrl);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error in uploadContract:', error);
      throw new Error('Failed to upload contract. Please check your permissions and try again.');
    }
  },

  async saveContract(contractData: any): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('contracts')
        .insert({
          contract_type: contractData.transferType || 'transfer',
          player_id: contractData.playerId,
          team_id: contractData.teamId,
          agent_id: contractData.agentId,
          terms: contractData,
          status: 'draft'
        })
        .select()
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Error saving contract:', error);
      throw error;
    }
  },

  async downloadContract(contractHTML: string, fileName: string): Promise<void> {
    try {
      // Create a temporary div to render the HTML with proper styling
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = contractHTML;
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '0';
      tempDiv.style.width = '800px';
      tempDiv.style.backgroundColor = 'white';
      tempDiv.style.color = 'black';
      tempDiv.style.fontFamily = 'Arial, sans-serif';
      tempDiv.style.fontSize = '12px';
      tempDiv.style.lineHeight = '1.4';
      tempDiv.style.padding = '20px';
      document.body.appendChild(tempDiv);

      // Wait a bit for styles to apply
      await new Promise(resolve => setTimeout(resolve, 100));

      try {
        // Convert to canvas with better settings
        const canvas = await html2canvas(tempDiv, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          width: 800,
          height: tempDiv.scrollHeight,
          logging: false
        });

        // Remove temporary div
        document.body.removeChild(tempDiv);

        // Create PDF
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgData = canvas.toDataURL('image/png');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(fileName.replace('.html', '.pdf'));
      } catch (canvasError) {
        console.warn('Canvas conversion failed, using fallback method:', canvasError);

        // Remove temporary div
        document.body.removeChild(tempDiv);

        // Fallback: Create a simple text-based PDF
        const pdf = new jsPDF('p', 'mm', 'a4');

        // Extract text content from HTML
        const textContent = tempDiv.textContent || tempDiv.innerText || '';
        const lines = textContent.split('\n').filter(line => line.trim());

        let yPosition = 20;
        const lineHeight = 7;
        const pageHeight = pdf.internal.pageSize.getHeight();

        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'normal');

        for (const line of lines) {
          if (yPosition > pageHeight - 20) {
            pdf.addPage();
            yPosition = 20;
          }

          pdf.text(line.trim(), 20, yPosition);
          yPosition += lineHeight;
        }

        pdf.save(fileName.replace('.html', '.pdf'));
      }
    } catch (error) {
      console.error('Error downloading contract:', error);
      throw error;
    }
  },

  async previewContract(contractHTML: string): Promise<void> {
    try {
      // Open the HTML content in a new window for preview
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(contractHTML);
        newWindow.document.close();
      } else {
        throw new Error('Unable to open preview window. Please check your popup blocker.');
      }
    } catch (error) {
      console.error('Error previewing contract:', error);
      throw error;
    }
  }
};
