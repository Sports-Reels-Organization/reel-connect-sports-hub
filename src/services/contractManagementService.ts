import { supabase } from '@/integrations/supabase/client';
import { contractService, PermanentTransferContract, LoanTransferContract } from './contractService';

export interface CreateContractData {
  pitchId: string;
  agentId: string;
  teamId: string;
  transferType: 'permanent' | 'loan';
  contractValue: number;
  currency: string;
  contractDetails?: {
    duration?: string;
    salary?: number;
    signOnBonus?: number;
    performanceBonus?: number;
    relocationSupport?: number;
  };
}

export interface ContractAction {
  contractId: string;
  action: 'approve' | 'reject' | 'request-changes' | 'finalize' | 'complete';
  details?: string;
  userId: string;
}

export interface ContractActionResult {
  success: boolean;
  newStatus: 'draft' | 'pending' | 'approved' | 'rejected' | 'completed';
  newStep: 'draft' | 'review' | 'negotiation' | 'finalization' | 'completed';
}

export const contractManagementService = {
  // Create a new contract
  async createContract(data: CreateContractData) {
    try {
      const { data: contract, error } = await supabase
        .from('contracts')
        .insert({
          pitch_id: data.pitchId,
          agent_id: data.agentId,
          team_id: data.teamId,
          transfer_type: data.transferType,
          contract_value: data.contractValue,
          currency: data.currency,
          status: 'draft',
          current_step: 'draft',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_activity: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Create initial message
      await supabase
        .from('contract_messages')
        .insert({
          contract_id: contract.id,
          sender_id: data.agentId,
          content: `Contract created for ${data.transferType} transfer`,
          message_type: 'system'
        });

      return contract;
    } catch (error) {
      console.error('Error creating contract:', error);
      throw error;
    }
  },

  // Get contract with all related data
  async getContract(contractId: string) {
    try {
      const { data, error } = await supabase
        .from('contracts')
        .select(`
          *,
          pitch:transfer_pitches(
            player_name,
            player_position,
            player_nationality,
            asking_price,
            loan_fee,
            status
          ),
          agent:agents(
            profile:profiles(
              full_name,
              email,
              user_type
            )
          ),
          team:teams(
            team_name,
            country,
            logo_url
          )
        `)
        .eq('id', contractId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching contract:', error);
      throw error;
    }
  },

  // Get all contracts for a user (agent or team)
  async getUserContracts(userId: string, userType: 'agent' | 'team') {
    try {
      let query = supabase
        .from('contracts')
        .select(`
          *,
          pitch:transfer_pitches(
            player_name,
            player_position,
            asking_price
          ),
          agent:agents(
            profile:profiles(
              full_name,
              email
            )
          ),
          team:teams(
            team_name,
            country
          )
        `);

      if (userType === 'agent') {
        query = query.eq('agent_id', userId);
      } else {
        query = query.eq('team_id', userId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching user contracts:', error);
      throw error;
    }
  },

  // Update contract status and step
  async updateContractStatus(contractId: string, status: string, step: string) {
    try {
      const { data, error } = await supabase
        .from('contracts')
        .update({
          status,
          current_step: step,
          last_activity: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', contractId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating contract status:', error);
      throw error;
    }
  },

  // Add message to contract discussion
  async addContractMessage(contractId: string, senderId: string, content: string, messageType: string = 'discussion', relatedField?: string) {
    try {
      const { data, error } = await supabase
        .from('contract_messages')
        .insert({
          contract_id: contractId,
          sender_id: senderId,
          content,
          message_type: messageType,
          related_field: relatedField,
          created_at: new Date().toISOString()
        })
        .select(`
          *,
          sender_profile:profiles(
            full_name,
            user_type
          )
        `)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding contract message:', error);
      throw error;
    }
  },

  // Get contract messages
  async getContractMessages(contractId: string) {
    try {
      const { data, error } = await supabase
        .from('contract_messages')
        .select(`
          *,
          sender_profile:profiles(
            full_name,
            user_type
          )
        `)
        .eq('contract_id', contractId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching contract messages:', error);
      throw error;
    }
  },

  // Handle contract action (approve, reject, etc.)
  async handleContractAction(actionData: ContractAction): Promise<ContractActionResult> {
    try {
      let newStatus: 'draft' | 'pending' | 'approved' | 'rejected' | 'completed' = 'draft';
      let newStep: 'draft' | 'review' | 'negotiation' | 'finalization' | 'completed' = 'draft';

      switch (actionData.action) {
        case 'approve':
          newStatus = 'approved';
          newStep = 'finalization';
          break;
        case 'reject':
          newStatus = 'rejected';
          newStep = 'completed';
          break;
        case 'request-changes':
          newStatus = 'pending';
          newStep = 'negotiation';
          break;
        case 'finalize':
          newStatus = 'completed';
          newStep = 'completed';
          break;
        case 'complete':
          newStatus = 'completed';
          newStep = 'completed';
          break;
      }

      // Update contract status
      await this.updateContractStatus(actionData.contractId, newStatus, newStep);

      // Add action message
      await this.addContractMessage(
        actionData.contractId,
        actionData.userId,
        `Contract ${actionData.action.replace('-', ' ')}${actionData.details ? `: ${actionData.details}` : ''}`,
        'action',
        actionData.action
      );

      return { success: true, newStatus, newStep };
    } catch (error) {
      console.error('Error handling contract action:', error);
      throw error;
    }
  },

  // Complete player transfer
  async completeTransfer(contractId: string, pitchId: string) {
    try {
      // Update player status to transferred
      const { error: playerError } = await supabase
        .from('players')
        .update({ status: 'transferred' })
        .eq('id', pitchId);

      if (playerError) throw playerError;

      // Update pitch status to completed
      const { error: pitchError } = await supabase
        .from('transfer_pitches')
        .update({ status: 'completed' })
        .eq('id', pitchId);

      if (pitchError) throw pitchError;

      // Update contract status
      await this.updateContractStatus(contractId, 'completed', 'completed');

      return { success: true };
    } catch (error) {
      console.error('Error completing transfer:', error);
      throw error;
    }
  },

  // Upload contract document
  async uploadContractDocument(contractId: string, file: File) {
    try {
      const fileName = `contract-${contractId}-${Date.now()}.pdf`;
      
      const { data, error } = await supabase.storage
        .from('contracts')
        .upload(fileName, file);

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('contracts')
        .getPublicUrl(fileName);

      // Update contract with document URL
      const { error: updateError } = await supabase
        .from('contracts')
        .update({
          document_url: urlData.publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', contractId);

      if (updateError) throw updateError;

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading contract document:', error);
      throw error;
    }
  },

  // Generate contract preview
  async generateContractPreview(contractData: any) {
    try {
      if (contractData.transfer_type === 'permanent') {
        const contractDataForPreview: PermanentTransferContract = {
          playerName: contractData.pitch?.player_name || 'Player Name',
          playerPosition: contractData.pitch?.player_position || 'Position',
          playerNationality: contractData.pitch?.player_nationality || 'Nationality',
          teamName: contractData.team?.team_name || 'Acquiring Club',
          teamCountry: contractData.team?.country || 'Country',
          contractDate: new Date().toISOString().split('T')[0],
          transferFee: contractData.contract_value,
          currency: contractData.currency,
          contractDuration: '3 years',
          playerSalary: {
            annual: contractData.contract_value * 0.1,
            monthly: (contractData.contract_value * 0.1) / 12,
            weekly: (contractData.contract_value * 0.1) / 52
          },
          signOnBonus: contractData.contract_value * 0.05,
          performanceBonus: {
            appearance: 10000,
            goal: 5000,
            assist: 3000,
            cleanSheet: 2000,
            teamSuccess: 50000
          },
          relocationSupport: {
            housing: 50000,
            transportation: 20000,
            familySupport: 30000,
            languageTraining: 10000
          },
          medicalInsurance: true,
          imageRights: {
            percentage: 50,
            terms: 'Standard image rights agreement'
          },
          releaseClause: contractData.contract_value * 1.5,
          sellOnPercentage: 20,
          buybackClause: {
            active: false,
            amount: 0,
            duration: ''
          }
        };

        return await contractService.generatePermanentTransferContract(contractDataForPreview);
      } else {
        // Loan transfer contract
        const contractDataForPreview: LoanTransferContract = {
          playerName: contractData.pitch?.player_name || 'Player Name',
          playerPosition: contractData.pitch?.player_position || 'Position',
          playerNationality: contractData.pitch?.player_nationality || 'Nationality',
          parentClub: contractData.team?.team_name || 'Parent Club',
          loanClub: contractData.team?.team_name || 'Loan Club',
          contractDate: new Date().toISOString().split('T')[0],
          currency: contractData.currency,
          loanDuration: '1 year',
          loanType: 'with-options',
          loanFee: {
            base: contractData.contract_value,
            withOptions: contractData.contract_value * 1.2,
            withoutOptions: contractData.contract_value * 0.8,
            withObligations: contractData.contract_value * 1.5
          },
          salaryCoverage: {
            parentClub: 50,
            loanClub: 50,
            percentage: 100
          },
          appearanceClause: 20,
          goalBonus: 5000,
          assistBonus: 3000,
          promotionBonus: 25000,
          purchaseOption: {
            active: true,
            amount: contractData.contract_value * 1.2,
            conditions: ['Minimum appearances', 'Performance targets']
          },
          obligationToBuy: {
            active: false,
            amount: 0,
            triggers: ['Promotion achieved', 'Appearance targets met']
          },
          recallClause: {
            active: false,
            conditions: ['Injury crisis', 'Performance issues'],
            noticePeriod: '7 days'
          },
          extensionOption: {
            active: false,
            duration: '1 year',
            conditions: ['Mutual agreement', 'Performance targets met']
          }
        };

        return await contractService.generateLoanTransferContract(contractDataForPreview);
      }
    } catch (error) {
      console.error('Error generating contract preview:', error);
      throw error;
    }
  }
};
