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
  playerId?: string; // Added for permanent transfer
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
      // If playerId is not provided, try to get it from the pitch
      let playerId = data.playerId;
      if (!playerId && data.pitchId) {
        const { data: pitchData } = await supabase
          .from('transfer_pitches')
          .select('player_id')
          .eq('id', data.pitchId)
          .single();
        playerId = pitchData?.player_id;
      }

      if (!playerId) {
        throw new Error('Player ID is required to create a contract');
      }

      // Get the actual agent and team IDs from their respective tables
      let agentId = null;
      let teamId = null;

      if (data.agentId) {
        const { data: agentData } = await supabase
          .from('agents')
          .select('id')
          .eq('profile_id', data.agentId)
          .single();
        agentId = agentData?.id;
      }

      if (data.teamId) {
        const { data: teamData } = await supabase
          .from('teams')
          .select('id')
          .eq('profile_id', data.teamId)
          .single();
        teamId = teamData?.id;
      }

      if (!agentId || !teamId) {
        throw new Error('Missing team or agent information');
      }

      // Map transfer type to contract type
      const contractType = data.transferType === 'permanent' ? 'transfer' : 'loan';

      // Create terms object from contract details
      const terms = {
        transferFee: data.contractValue,
        currency: data.currency,
        duration: data.contractDetails?.duration,
        salary: data.contractDetails?.salary,
        signOnBonus: data.contractDetails?.signOnBonus,
        performanceBonus: data.contractDetails?.performanceBonus,
        relocationSupport: data.contractDetails?.relocationSupport
      };

      const { data: contract, error } = await supabase
        .from('contracts')
        .insert({
          player_id: playerId,
          agent_id: agentId,
          team_id: teamId,
          contract_type: contractType,
          status: 'draft',
          terms: terms,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
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
            id,
            transfer_type,
            asking_price,
            currency,
            status,
            player:players(
              full_name,
              position,
              citizenship
            )
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
            id,
            transfer_type,
            asking_price,
            currency,
            player:players(
              full_name,
              position
            )
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
        // Filter by agent's profile_id
        query = query.eq('agent.profile.id', userId);
      } else {
        // Filter by team's profile_id
        query = query.eq('team.profile_id', userId);
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
        .select()
        .single();

      if (error) {
        console.error('Error inserting contract message:', error);
        // Return a fallback message object
        return {
          id: `temp-${Date.now()}`,
          contract_id: contractId,
          sender_id: senderId,
          content,
          message_type: messageType,
          related_field: relatedField,
          created_at: new Date().toISOString(),
          sender_profile: {
            full_name: 'Unknown User',
            user_type: 'unknown'
          }
        };
      }

      // Get sender profile data separately
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, user_type')
        .eq('id', senderId)
        .single();

      return {
        ...data,
        sender_profile: profileData || { full_name: 'Unknown User', user_type: 'unknown' }
      };
    } catch (error) {
      console.error('Error adding contract message:', error);
      // Return a fallback message object
      return {
        id: `temp-${Date.now()}`,
        contract_id: contractId,
        sender_id: senderId,
        content,
        message_type: messageType,
        related_field: relatedField,
        created_at: new Date().toISOString(),
        sender_profile: {
          full_name: 'Unknown User',
          user_type: 'unknown'
        }
      };
    }
  },

  // Get contract messages
  async getContractMessages(contractId: string) {
    try {
      const { data, error } = await supabase
        .from('contract_messages')
        .select('*')
        .eq('contract_id', contractId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching contract messages:', error);
        return []; // Return empty array if table doesn't exist
      }

      // Get sender profiles for all messages
      const messagesWithProfiles = await Promise.all(
        data.map(async (message) => {
          try {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('full_name, user_type')
              .eq('id', message.sender_id)
              .single();

            return {
              ...message,
              sender_profile: profileData || { full_name: 'Unknown User', user_type: 'unknown' }
            };
          } catch (profileError) {
            console.error('Error fetching profile for message:', profileError);
            return {
              ...message,
              sender_profile: { full_name: 'Unknown User', user_type: 'unknown' }
            };
          }
        })
      );

      return messagesWithProfiles;
    } catch (error) {
      console.error('Error fetching contract messages:', error);
      return []; // Return empty array on error
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
      // Ensure we have valid contract values
      const contractValue = contractData.contract_value || 0;
      const currency = contractData.currency || 'USD';

      if (contractData.transfer_type === 'permanent') {
        const contractDataForPreview: PermanentTransferContract = {
          playerName: contractData.pitch?.player?.full_name || 'Player Name',
          playerPosition: contractData.pitch?.player?.position || 'Position',
          playerNationality: contractData.pitch?.player?.citizenship || 'Nationality',
          teamName: contractData.team?.team_name || 'Acquiring Club',
          teamCountry: contractData.team?.country || 'Country',
          contractDate: new Date().toISOString().split('T')[0],
          transferFee: contractValue,
          currency: currency,
          contractDuration: '3 years',
          playerSalary: {
            annual: contractValue * 0.1,
            monthly: (contractValue * 0.1) / 12,
            weekly: (contractValue * 0.1) / 52
          },
          signOnBonus: contractValue * 0.05,
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
          releaseClause: contractValue * 1.5,
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
          playerName: contractData.pitch?.player?.full_name || 'Player Name',
          playerPosition: contractData.pitch?.player?.position || 'Position',
          playerNationality: contractData.pitch?.player?.citizenship || 'Nationality',
          parentClub: contractData.team?.team_name || 'Parent Club',
          loanClub: contractData.team?.team_name || 'Loan Club',
          contractDate: new Date().toISOString().split('T')[0],
          currency: currency,
          loanDuration: '1 year',
          loanType: 'with-options',
          loanFee: {
            base: contractValue,
            withOptions: contractValue * 1.2,
            withoutOptions: contractValue * 0.8,
            withObligations: contractValue * 1.5
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
            amount: contractValue * 1.2,
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
      // Return a simple fallback HTML instead of throwing
      return `
        <div style="padding: 20px; font-family: Arial, sans-serif;">
          <h2>Contract Preview</h2>
          <p>Contract preview could not be generated due to missing data.</p>
          <p>Please ensure all contract details are properly filled.</p>
        </div>
      `;
    }
  }
};
