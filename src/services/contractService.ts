
import { supabase } from '@/integrations/supabase/client';

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
    signOnBonus: number;
    performanceBonus: number;
    relocationSupport: number;
  };
}

export const contractService = {
  async generateContract(contractData: ContractData): Promise<string> {
    try {
      // Generate contract HTML content
      const contractHtml = `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto;">
          <h1 style="text-align: center; color: #333;">TRANSFER CONTRACT</h1>
          
          <div style="margin: 20px 0;">
            <h2>Contract Details</h2>
            <p><strong>Player:</strong> ${contractData.playerName}</p>
            <p><strong>Team:</strong> ${contractData.teamName}</p>
            <p><strong>Transfer Type:</strong> ${contractData.transferType === 'permanent' ? 'Permanent Transfer' : 'Loan Agreement'}</p>
            ${contractData.transferType === 'permanent' 
              ? `<p><strong>Transfer Fee:</strong> ${contractData.currency} ${contractData.askingPrice?.toLocaleString()}</p>`
              : `<p><strong>Loan Fee:</strong> ${contractData.currency} ${contractData.loanFee?.toLocaleString()}</p>`
            }
          </div>

          <div style="margin: 20px 0;">
            <h2>Financial Terms</h2>
            <p><strong>Contract Duration:</strong> ${contractData.contractDetails.duration}</p>
            <p><strong>Monthly Salary:</strong> ${contractData.currency} ${contractData.contractDetails.salary.toLocaleString()}</p>
            <p><strong>Sign-on Bonus:</strong> ${contractData.currency} ${contractData.contractDetails.signOnBonus.toLocaleString()}</p>
            <p><strong>Performance Bonus:</strong> ${contractData.currency} ${contractData.contractDetails.performanceBonus.toLocaleString()}</p>
            <p><strong>Relocation Support:</strong> ${contractData.currency} ${contractData.contractDetails.relocationSupport.toLocaleString()}</p>
          </div>

          <div style="margin: 40px 0; text-align: center;">
            <p>Generated on: ${new Date().toLocaleDateString()}</p>
          </div>
        </div>
      `;

      return contractHtml;
    } catch (error) {
      console.error('Error generating contract:', error);
      throw error;
    }
  },

  async downloadContract(contractHtml: string, fileName: string): Promise<void> {
    try {
      // Create a blob with the HTML content
      const blob = new Blob([contractHtml], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      // Create download link
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading contract:', error);
      throw error;
    }
  },

  async previewContract(contractHtml: string): Promise<void> {
    try {
      // Open contract in new window for preview
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(contractHtml);
        newWindow.document.close();
      }
    } catch (error) {
      console.error('Error previewing contract:', error);
      throw error;
    }
  },

  async testBucketAccess(): Promise<boolean> {
    try {
      const { data, error } = await supabase.storage.getBucket('contracts');
      return !error && data !== null;
    } catch (error) {
      console.error('Error testing bucket access:', error);
      return false;
    }
  }
};
