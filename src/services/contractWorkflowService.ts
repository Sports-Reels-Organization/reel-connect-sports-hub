
import { supabase } from '@/integrations/supabase/client';

export interface ContractWorkflowStep {
  id: string;
  contract_id: string;
  step_type: 'draft' | 'review' | 'negotiation' | 'signed' | 'finalized';
  completed_by: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ContractDetails {
  id: string;
  player_id: string;
  team_id?: string;
  agent_id?: string;
  pitch_id?: string;
  contract_type: string;
  status: string;
  terms?: any;
  contract_value?: number;
  currency?: string;
  created_at: string;
  updated_at: string;
}

export class ContractWorkflowService {
  
  // Create a new contract from a pitch
  static async createContractFromPitch(pitchId: string, contractType: 'permanent' | 'loan') {
    try {
      // Get pitch details
      const { data: pitch, error: pitchError } = await supabase
        .from('transfer_pitches')
        .select(`
          *,
          players (id, full_name),
          teams (id, team_name)
        `)
        .eq('id', pitchId)
        .single();

      if (pitchError) throw pitchError;

      // Create contract record
      const contractData = {
        player_id: pitch.player_id,
        team_id: pitch.team_id,
        pitch_id: pitchId,
        contract_type: contractType,
        status: 'draft',
        currency: pitch.currency || 'USD',
        contract_value: pitch.asking_price || 0,
        terms: {
          transfer_type: pitch.transfer_type,
          asking_price: pitch.asking_price,
          sign_on_bonus: 0,
          performance_bonus: 0,
          player_salary: 0,
          relocation_support: 0,
          loan_fee: contractType === 'loan' ? 0 : null,
          loan_with_option: contractType === 'loan' ? false : null,
          loan_with_obligation: contractType === 'loan' ? false : null
        }
      };

      const { data: contract, error: contractError } = await supabase
        .from('contracts')
        .insert(contractData)
        .select()
        .single();

      if (contractError) throw contractError;

      // Create initial workflow step
      await this.createWorkflowStep(contract.id, 'draft', 'System generated contract');

      return { success: true, contract };
    } catch (error) {
      console.error('Error creating contract:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Get contract workflow steps
  static async getContractWorkflow(contractId: string): Promise<ContractWorkflowStep[]> {
    try {
      const { data, error } = await supabase
        .from('contract_workflow_steps')
        .select('*')
        .eq('contract_id', contractId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching workflow:', error);
      return [];
    }
  }

  // Create workflow step
  static async createWorkflowStep(
    contractId: string,
    stepType: ContractWorkflowStep['step_type'],
    notes?: string
  ) {
    try {
      const { data, error } = await supabase
        .from('contract_workflow_steps')
        .insert({
          contract_id: contractId,
          step_type: stepType,
          completed_by: 'current_user', // This should be the actual user ID
          notes: notes || ''
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, step: data };
    } catch (error) {
      console.error('Error creating workflow step:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Update contract status
  static async updateContractStatus(contractId: string, status: string, notes?: string) {
    try {
      const { data, error } = await supabase
        .from('contracts')
        .update({ 
          status,
          last_activity: new Date().toISOString()
        })
        .eq('id', contractId)
        .select()
        .single();

      if (error) throw error;

      // Create workflow step for status change
      if (status === 'signed' || status === 'finalized') {
        await this.createWorkflowStep(contractId, status as any, notes);
      }

      return { success: true, contract: data };
    } catch (error) {
      console.error('Error updating contract:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Finalize contract and apply service charge
  static async finalizeContract(contractId: string) {
    try {
      // Get contract details
      const { data: contract, error: contractError } = await supabase
        .from('contracts')
        .select(`
          *,
          players (id, full_name),
          teams (id, team_name, profile_id)
        `)
        .eq('id', contractId)
        .single();

      if (contractError) throw contractError;

      // Calculate service charge (15%)
      const serviceChargeRate = 0.15;
      const contractValue = contract.contract_value || 0;
      const serviceCharge = contractValue * serviceChargeRate;

      // Update contract as finalized
      const { error: updateError } = await supabase
        .from('contracts')
        .update({
          status: 'finalized',
          last_activity: new Date().toISOString(),
          financial_summary: {
            contract_value: contractValue,
            service_charge_rate: serviceChargeRate,
            service_charge_amount: serviceCharge,
            net_amount: contractValue - serviceCharge
          }
        })
        .eq('id', contractId);

      if (updateError) throw updateError;

      // Update player status (mock update since transfer_status doesn't exist)
      const { error: playerError } = await supabase
        .from('players')
        .update({
          updated_at: new Date().toISOString()
        })
        .eq('id', contract.player_id);

      if (playerError) console.warn('Could not update player status:', playerError);

      // Create finalization workflow step
      await this.createWorkflowStep(
        contractId,
        'finalized',
        `Contract finalized. Service charge: ${serviceCharge.toFixed(2)} ${contract.currency || 'USD'}`
      );

      // Update pitch status if exists
      if (contract.pitch_id) {
        const { error: pitchError } = await supabase
          .from('transfer_pitches')
          .update({
            status: 'completed',
            updated_at: new Date().toISOString()
          })
          .eq('id', contract.pitch_id);

        if (pitchError) console.warn('Could not update pitch status:', pitchError);
      }

      return { success: true, serviceCharge };
    } catch (error) {
      console.error('Error finalizing contract:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Get contracts for a team or agent
  static async getContracts(profileType: 'team' | 'agent', profileId: string) {
    try {
      let query = supabase
        .from('contracts')
        .select(`
          *,
          players (id, full_name, position),
          teams (id, team_name),
          agents (id, agency_name)
        `);

      if (profileType === 'team') {
        query = query.eq('team_id', profileId);
      } else {
        query = query.eq('agent_id', profileId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching contracts:', error);
      return [];
    }
  }
}
