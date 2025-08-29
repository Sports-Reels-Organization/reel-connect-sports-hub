
import { supabase } from '@/integrations/supabase/client';
import { enhancedContractService } from './enhancedContractService';
import { EnhancedMessagingService } from './enhancedMessagingService';

export interface ContractWorkflowStep {
  id: string;
  contract_id: string;
  step_type: 'draft_created' | 'sent_to_agent' | 'agent_reviewed' | 'agent_modified' | 'signed' | 'finalized';
  completed_by: string;
  notes?: string;
  created_at: string;
}

export interface ContractFinancials {
  contract_value: number;
  service_charge_rate: number;
  service_charge_amount: number;
  currency: string;
  is_international: boolean;
}

export class ContractWorkflowService {
  // Initialize contract from pitch
  static async initializeContractFromPitch(pitchId: string, additionalTerms?: any): Promise<string> {
    try {
      // Get pitch details first
      const { data: pitch, error: pitchError } = await supabase
        .from('transfer_pitches')
        .select(`
          *,
          teams!inner(team_name, profile_id),
          players!inner(full_name, position)
        `)
        .eq('id', pitchId)
        .single();

      if (pitchError) throw pitchError;

      // Create enhanced contract
      const contractId = await enhancedContractService.createContractFromPitch(pitchId, {
        ...additionalTerms,
        deal_stage: 'draft'
      });

      // Log workflow step
      await this.addWorkflowStep(contractId, 'draft_created', pitch.teams.profile_id, 'Contract initialized from transfer pitch');

      // Update pitch status
      await supabase
        .from('transfer_pitches')
        .update({ 
          deal_stage: 'contract_negotiation',
          contract_finalized: false 
        })
        .eq('id', pitchId);

      return contractId;
    } catch (error) {
      console.error('Error initializing contract:', error);
      throw error;
    }
  }

  // Send contract to agent
  static async sendContractToAgent(contractId: string, agentProfileId: string, message: string): Promise<void> {
    try {
      // Get contract details
      const { data: contract } = await supabase
        .from('contracts')
        .select(`
          *,
          teams!inner(team_name, profile_id),
          players!inner(full_name)
        `)
        .eq('id', contractId)
        .single();

      if (!contract) throw new Error('Contract not found');

      // Send message with contract
      await EnhancedMessagingService.sendMessage({
        receiver_id: agentProfileId,
        pitch_id: contract.pitch_id,
        player_id: contract.player_id,
        content: message,
        message_type: 'contract',
        subject: `Contract for ${contract.players.full_name}`,
        contract_file_url: contract.template_url
      });

      // Update contract stage
      await enhancedContractService.updateContractStage(contractId, 'sent', 'Contract sent to agent for review');

      // Log workflow step
      await this.addWorkflowStep(contractId, 'sent_to_agent', contract.teams.profile_id, 'Contract sent to agent');

      // Create notification for agent
      await this.createNotification(agentProfileId, 'contract', 'New Contract to Review', 
        `You have received a contract for ${contract.players.full_name} from ${contract.teams.team_name}`);

    } catch (error) {
      console.error('Error sending contract to agent:', error);
      throw error;
    }
  }

  // Agent reviews contract
  static async agentReviewContract(contractId: string, agentProfileId: string, action: 'accept' | 'modify' | 'reject', notes?: string): Promise<void> {
    try {
      let newStage = '';
      let workflowStep: ContractWorkflowStep['step_type'] = 'agent_reviewed';

      switch (action) {
        case 'accept':
          newStage = 'agent_accepted';
          break;
        case 'modify':
          newStage = 'agent_modifications';
          workflowStep = 'agent_modified';
          break;
        case 'reject':
          newStage = 'rejected';
          break;
      }

      await enhancedContractService.updateContractStage(contractId, newStage, notes);
      await this.addWorkflowStep(contractId, workflowStep, agentProfileId, notes);

      // Get contract for notifications
      const { data: contract } = await supabase
        .from('contracts')
        .select(`
          *,
          teams!inner(team_name, profile_id),
          players!inner(full_name)
        `)
        .eq('id', contractId)
        .single();

      if (contract) {
        await this.createNotification(
          contract.teams.profile_id, 
          'contract', 
          `Contract ${action}ed`, 
          `Agent has ${action}ed the contract for ${contract.players.full_name}`
        );
      }

    } catch (error) {
      console.error('Error in agent review:', error);
      throw error;
    }
  }

  // Sign contract
  static async signContract(contractId: string, signedBy: string, signatureType: 'team' | 'agent'): Promise<void> {
    try {
      // Update digital signature status
      const { data: contract } = await supabase
        .from('contracts')
        .select('digital_signature_status')
        .eq('id', contractId)
        .single();

      const currentStatus = contract?.digital_signature_status || {};
      const updatedStatus = {
        ...currentStatus,
        [`${signatureType}_signed`]: true,
        [`${signatureType}_signed_at`]: new Date().toISOString(),
        [`${signatureType}_signed_by`]: signedBy
      };

      // Check if both parties have signed
      const bothSigned = updatedStatus.team_signed && updatedStatus.agent_signed;

      await supabase
        .from('contracts')
        .update({
          digital_signature_status: updatedStatus,
          deal_stage: bothSigned ? 'signed' : 'partially_signed',
          status: bothSigned ? 'signed' : 'pending_signature'
        })
        .eq('id', contractId);

      await this.addWorkflowStep(contractId, 'signed', signedBy, `Contract signed by ${signatureType}`);

      if (bothSigned) {
        await this.finalizeContract(contractId);
      }

    } catch (error) {
      console.error('Error signing contract:', error);
      throw error;
    }
  }

  // Finalize contract
  static async finalizeContract(contractId: string): Promise<void> {
    try {
      const { data: contract } = await supabase
        .from('contracts')
        .select(`
          *,
          teams!inner(team_name, profile_id),
          players!inner(full_name, id),
          transfer_pitches!inner(asking_price, currency, is_international)
        `)
        .eq('id', contractId)
        .single();

      if (!contract) throw new Error('Contract not found');

      // Calculate service charge (15%)
      const serviceChargeRate = 0.15;
      const contractValue = contract.contract_value || contract.transfer_pitches.asking_price || 0;
      const serviceChargeAmount = contractValue * serviceChargeRate;

      // Update contract as finalized
      await supabase
        .from('contracts')
        .update({
          deal_stage: 'completed',
          status: 'signed',
          financial_summary: {
            ...contract.financial_summary,
            service_charge_rate: serviceChargeRate,
            service_charge_amount: serviceChargeAmount,
            finalized_at: new Date().toISOString()
          }
        })
        .eq('id', contractId);

      // Update transfer pitch
      if (contract.pitch_id) {
        await supabase
          .from('transfer_pitches')
          .update({
            status: 'completed',
            deal_stage: 'completed',
            contract_finalized: true,
            contract_finalized_at: new Date().toISOString()
          })
          .eq('id', contract.pitch_id);
      }

      // Update player status
      await supabase
        .from('players')
        .update({
          transfer_status: 'transferred',
          current_team_id: contract.team_id
        })
        .eq('id', contract.player_id);

      // Log final workflow step
      await this.addWorkflowStep(contractId, 'finalized', contract.teams.profile_id, 
        `Contract finalized. Service charge: ${serviceChargeAmount} ${contract.transfer_pitches.currency}`);

      // Send notifications
      await this.createNotification(
        contract.teams.profile_id, 
        'success', 
        'Contract Finalized!', 
        `Contract for ${contract.players.full_name} has been completed. Service charge: ${serviceChargeAmount} ${contract.transfer_pitches.currency}`
      );

    } catch (error) {
      console.error('Error finalizing contract:', error);
      throw error;
    }
  }

  // Add workflow step
  static async addWorkflowStep(contractId: string, stepType: ContractWorkflowStep['step_type'], completedBy: string, notes?: string): Promise<void> {
    try {
      await supabase
        .from('contract_workflow_steps')
        .insert({
          contract_id: contractId,
          step_type: stepType,
          completed_by: completedBy,
          notes
        });
    } catch (error) {
      console.error('Error adding workflow step:', error);
    }
  }

  // Get contract workflow steps
  static async getWorkflowSteps(contractId: string): Promise<ContractWorkflowStep[]> {
    try {
      const { data, error } = await supabase
        .from('contract_workflow_steps')
        .select(`
          *,
          profiles!inner(full_name)
        `)
        .eq('contract_id', contractId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching workflow steps:', error);
      return [];
    }
  }

  // Create notification helper
  static async createNotification(userId: string, type: string, title: string, message: string): Promise<void> {
    try {
      await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type,
          title,
          message
        });
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  }

  // Get contract analytics for dashboard
  static async getContractAnalytics(teamId?: string): Promise<any> {
    try {
      return await enhancedContractService.getContractAnalytics(teamId);
    } catch (error) {
      console.error('Error getting contract analytics:', error);
      return null;
    }
  }
}
