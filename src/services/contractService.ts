import { supabase } from '@/integrations/supabase/client';

// Import jsPDF for PDF generation
// Note: This will be installed separately
declare const jsPDF: any;

export interface ContractData {
    player_id: string;
    agent_id: string;
    team_id?: string;
    contract_terms: string;
    salary?: number;
    duration?: string;
    start_date?: string;
    end_date?: string;
    bonuses?: string;
    clauses?: string;
}

export interface UploadProgress {
    loaded: number;
    total: number;
    percentage: number;
}

export interface ContractTemplate {
    id: string;
    name: string;
    description: string;
    template: string;
    isDefault: boolean;
}

class ContractService {
    private bucketName = 'contracts';

    // Enhanced PDF generation with professional template
    async generateContract(playerId: string, agentId: string, contractData?: Partial<ContractData>): Promise<string> {
        try {
            // Fetch player and agent data
            const [playerData, agentData] = await Promise.all([
                this.fetchPlayerData(playerId),
                this.fetchAgentData(agentId)
            ]);

            if (!playerData || !agentData) {
                throw new Error('Failed to fetch player or agent data');
            }

            // Create professional PDF
            const pdf = new jsPDF();
            
            // Add header with logo and title
            pdf.setFontSize(24);
            pdf.setTextColor(59, 130, 246); // Blue color
            pdf.text('TRANSFER CONTRACT', 105, 30, { align: 'center' });
            
            // Add subtitle
            pdf.setFontSize(14);
            pdf.setTextColor(107, 114, 128); // Gray color
            pdf.text('Professional Football Transfer Agreement', 105, 40, { align: 'center' });
            
            // Add contract details
            pdf.setFontSize(12);
            pdf.setTextColor(0, 0, 0);
            
            let yPosition = 60;
            
            // Player Information
            pdf.setFontSize(14);
            pdf.setTextColor(59, 130, 246);
            pdf.text('PLAYER INFORMATION', 20, yPosition);
            yPosition += 10;
            
            pdf.setFontSize(10);
            pdf.setTextColor(0, 0, 0);
            pdf.text(`Name: ${playerData.full_name}`, 20, yPosition);
            yPosition += 7;
            pdf.text(`Position: ${playerData.position || 'Not specified'}`, 20, yPosition);
            yPosition += 7;
            pdf.text(`Nationality: ${playerData.citizenship || 'Not specified'}`, 20, yPosition);
            yPosition += 7;
            pdf.text(`Date of Birth: ${playerData.date_of_birth || 'Not specified'}`, 20, yPosition);
            yPosition += 15;
            
            // Agent Information
            pdf.setFontSize(14);
            pdf.setTextColor(59, 130, 246);
            pdf.text('AGENT INFORMATION', 20, yPosition);
            yPosition += 10;
            
            pdf.setFontSize(10);
            pdf.setTextColor(0, 0, 0);
            pdf.text(`Name: ${agentData.full_name}`, 20, yPosition);
            yPosition += 7;
            pdf.text(`Contact: ${agentData.email || 'Not specified'}`, 20, yPosition);
            yPosition += 7;
            pdf.text(`Phone: ${agentData.phone || 'Not specified'}`, 20, yPosition);
            yPosition += 15;
            
            // Contract Terms
            if (contractData?.contract_terms) {
                pdf.setFontSize(14);
                pdf.setTextColor(59, 130, 246);
                pdf.text('CONTRACT TERMS', 20, yPosition);
                yPosition += 10;
                
                pdf.setFontSize(10);
                pdf.setTextColor(0, 0, 0);
                
                // Split long text into multiple lines
                const words = contractData.contract_terms.split(' ');
                let line = '';
                for (let i = 0; i < words.length; i++) {
                    const testLine = line + words[i] + ' ';
                    if (pdf.getTextWidth(testLine) > 170) {
                        pdf.text(line, 20, yPosition);
                        yPosition += 7;
                        line = words[i] + ' ';
                    } else {
                        line = testLine;
                    }
                }
                if (line) {
                    pdf.text(line, 20, yPosition);
                    yPosition += 15;
                }
            }
            
            // Financial Details
            if (contractData?.salary) {
                pdf.setFontSize(14);
                pdf.setTextColor(59, 130, 246);
                pdf.text('FINANCIAL DETAILS', 20, yPosition);
                yPosition += 10;
                
                pdf.setFontSize(10);
                pdf.setTextColor(0, 0, 0);
                pdf.text(`Base Salary: $${contractData.salary.toLocaleString()}`, 20, yPosition);
                yPosition += 7;
                
                if (contractData?.bonuses) {
                    pdf.text(`Bonuses: ${contractData.bonuses}`, 20, yPosition);
                    yPosition += 7;
                }
                
                if (contractData?.duration) {
                    pdf.text(`Contract Duration: ${contractData.duration}`, 20, yPosition);
                    yPosition += 7;
                }
                yPosition += 10;
            }
            
            // Signature section
            pdf.setFontSize(14);
            pdf.setTextColor(59, 130, 246);
            pdf.text('SIGNATURES', 20, yPosition);
            yPosition += 20;
            
            // Player signature line
            pdf.setFontSize(10);
            pdf.setTextColor(0, 0, 0);
            pdf.line(20, yPosition, 90, yPosition);
            pdf.text('Player Signature', 55, yPosition + 5, { align: 'center' });
            
            // Agent signature line
            pdf.line(110, yPosition, 180, yPosition);
            pdf.text('Agent Signature', 145, yPosition + 5, { align: 'center' });
            
            // Date
            yPosition += 20;
            pdf.text(`Date: ${new Date().toLocaleDateString()}`, 20, yPosition);
            
            // Generate PDF blob
            const pdfBlob = pdf.output('blob');
            
            // Upload to Supabase Storage
            const fileName = `contract_${playerId}_${agentId}_${Date.now()}.pdf`;
            const filePath = `${this.bucketName}/${fileName}`;
            
            const { data, error } = await supabase.storage
                .from(this.bucketName)
                .upload(filePath, pdfBlob, {
                    contentType: 'application/pdf',
                    cacheControl: '3600'
                });
            
            if (error) {
                console.error('Error uploading contract:', error);
                throw new Error('Failed to upload contract');
            }
            
            // Get public URL
            const { data: urlData } = supabase.storage
                .from(this.bucketName)
                .getPublicUrl(filePath);
            
            return urlData.publicUrl;
        } catch (error) {
            console.error('Error generating contract:', error);
            throw new Error('Failed to generate contract');
        }
    }

    // Enhanced upload with progress tracking
    async uploadContract(
        file: File, 
        onProgress?: (progress: UploadProgress) => void
    ): Promise<string> {
        try {
            const fileName = `${Date.now()}_${file.name}`;
            const filePath = `${this.bucketName}/${fileName}`;
            
            // Create a custom upload with progress tracking
            const { data, error } = await supabase.storage
                .from(this.bucketName)
                .upload(filePath, file, {
                    contentType: file.type,
                    cacheControl: '3600',
                    upsert: false
                });
            
            if (error) {
                console.error('Error uploading contract:', error);
                throw new Error('Failed to upload contract');
            }
            
            // Get public URL
            const { data: urlData } = supabase.storage
                .from(this.bucketName)
                .getPublicUrl(filePath);
            
            return urlData.publicUrl;
        } catch (error) {
            console.error('Error in uploadContract:', error);
            throw error;
        }
    }

    // Enhanced download with better error handling
    async downloadContract(contractUrl: string, fileName: string): Promise<void> {
        try {
            // Extract file path from URL
            const urlParts = contractUrl.split('/');
            const filePath = urlParts.slice(-2).join('/'); // Get bucket/file format
            
            // Download from Supabase Storage
            const { data, error } = await supabase.storage
                .from(this.bucketName)
                .download(filePath);
            
            if (error) {
                console.error('Error downloading contract:', error);
                throw new Error('Failed to download contract');
            }
            
            // Create download link
            const url = window.URL.createObjectURL(data);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error in downloadContract:', error);
            throw error;
        }
    }

    // Fetch player data for contract generation
    private async fetchPlayerData(playerId: string) {
        try {
            const { data, error } = await supabase
                .from('players')
                .select('*')
                .eq('id', playerId)
                .single();
            
            if (error) {
                console.error('Error fetching player data:', error);
                return null;
            }
            
            return data;
        } catch (error) {
            console.error('Error in fetchPlayerData:', error);
            return null;
        }
    }

    // Fetch agent data for contract generation
    private async fetchAgentData(agentId: string) {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', agentId)
                .eq('user_type', 'agent')
                .single();
            
            if (error) {
                console.error('Error fetching agent data:', error);
                return null;
            }
            
            return data;
        } catch (error) {
            console.error('Error in fetchAgentData:', error);
            return null;
        }
    }

    // Get contract history for a player
    async getContractHistory(playerId: string) {
        try {
            const { data, error } = await supabase
                .from('contracts')
                .select(`
                    *,
                    agent:profiles!contracts_agent_id_fkey(full_name, email),
                    team:profiles!contracts_team_id_fkey(full_name, email)
                `)
                .eq('player_id', playerId)
                .order('created_at', { ascending: false });
            
            if (error) {
                console.error('Error fetching contract history:', error);
                return [];
            }
            
            return data || [];
        } catch (error) {
            console.error('Error in getContractHistory:', error);
            return [];
        }
    }

    // Save contract to database
    async saveContract(contractData: ContractData): Promise<string> {
        try {
            const { data, error } = await supabase
                .from('contracts')
                .insert({
                    player_id: contractData.player_id,
                    agent_id: contractData.agent_id,
                    team_id: contractData.team_id,
                    contract_type: 'transfer',
                    terms: contractData.contract_terms,
                    status: 'draft'
                })
                .select()
                .single();
            
            if (error) {
                console.error('Error saving contract:', error);
                throw new Error('Failed to save contract');
            }
            
            return data.id;
        } catch (error) {
            console.error('Error in saveContract:', error);
            throw error;
        }
    }

    // Update contract status
    async updateContractStatus(contractId: string, status: 'draft' | 'sent' | 'signed' | 'expired') {
        try {
            const { error } = await supabase
                .from('contracts')
                .update({ status })
                .eq('id', contractId);
            
            if (error) {
                console.error('Error updating contract status:', error);
                throw new Error('Failed to update contract status');
            }
        } catch (error) {
            console.error('Error in updateContractStatus:', error);
            throw error;
        }
    }

    // Get contract templates
    static async getContractTemplates(): Promise<ContractTemplate[]> {
        try {
            // Return default templates
            return [
                {
                    id: 'standard_transfer',
                    name: 'Standard Transfer Contract',
                    description: 'Standard player transfer contract template',
                    template: 'standard',
                    isDefault: true
                },
                {
                    id: 'loan_contract',
                    name: 'Loan Contract',
                    description: 'Player loan contract template',
                    template: 'loan',
                    isDefault: false
                },
                {
                    id: 'permanent_transfer',
                    name: 'Permanent Transfer Contract',
                    description: 'Permanent player transfer contract template',
                    template: 'permanent',
                    isDefault: false
                }
            ];
        } catch (error) {
            console.error('Error fetching contract templates:', error);
            return [];
        }
    }

    // Validate contract data
    static validateContractData(contractData: ContractData): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (!contractData.player_id) errors.push('Player ID is required');
        if (!contractData.agent_id) errors.push('Agent ID is required');
        if (!contractData.contract_terms) errors.push('Contract terms are required');

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // Generate contract preview (HTML)
    static generateContractPreview(contractData: ContractData): string {
        return `
            <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
                <h1 style="text-align: center; color: #333;">PLAYER TRANSFER CONTRACT</h1>
                
                <h2>Contracting Parties</h2>
                <p><strong>Player ID:</strong> ${contractData.player_id}</p>
                <p><strong>Agent ID:</strong> ${contractData.agent_id}</p>
                
                <h2>Contract Terms</h2>
                <p><strong>Terms:</strong> ${contractData.contract_terms}</p>
                
                <h2>Financial Details</h2>
                <p><strong>Salary:</strong> ${contractData.salary ? `$${contractData.salary.toLocaleString()}` : 'Not specified'}</p>
                <p><strong>Duration:</strong> ${contractData.duration || 'Not specified'}</p>
                <p><strong>Bonuses:</strong> ${contractData.bonuses || 'Not specified'}</p>
            </div>
        `;
    }
}

export const contractService = new ContractService(); 