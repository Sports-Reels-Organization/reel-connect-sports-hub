
import { supabase } from '@/integrations/supabase/client';

interface ContractData {
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
  async generateContract(contractData: ContractData): Promise<string> {
    try {
      const { data, error } = await supabase.functions.invoke('generate-contract', {
        body: contractData
      });

      if (error) throw error;

      if (data?.success && data?.contractHTML) {
        return data.contractHTML;
      } else {
        throw new Error('Failed to generate contract');
      }
    } catch (error) {
      console.error('Error generating contract:', error);
      throw error;
    }
  },

  async downloadContract(contractHTML: string, fileName: string): Promise<void> {
    try {
      // Create a blob with the HTML content
      const blob = new Blob([contractHTML], { type: 'text/html' });
      
      // Create a temporary URL for the blob
      const url = URL.createObjectURL(blob);
      
      // Create a temporary link element and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
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
