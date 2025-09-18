import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { FileSignature, Check, Clock, User, Calendar } from 'lucide-react';

interface DigitalSignatureProps {
  contract: any;
  userRole: 'team' | 'agent';
  onSign: () => void;
  onConfirm: () => void;
}

const DigitalSignature: React.FC<DigitalSignatureProps> = ({
  contract,
  userRole,
  onSign,
  onConfirm
}) => {
  const [isSigningInProgress, setIsSigningInProgress] = useState(false);

  const handleSign = async () => {
    setIsSigningInProgress(true);
    try {
      await onSign();
    } finally {
      setIsSigningInProgress(false);
    }
  };

  const agentSigned = contract?.signatures?.agent_signed_at;
  const teamConfirmed = contract?.signatures?.team_confirmed_at;

  return (
    <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <FileSignature className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <CardTitle className="text-lg text-gray-900">Digital Contract Signing</CardTitle>
              <p className="text-sm text-gray-600">Secure electronic signature process</p>
            </div>
          </div>
          <Badge variant={agentSigned && teamConfirmed ? 'default' : 'secondary'} className="px-3 py-1">
            {agentSigned && teamConfirmed ? 'Fully Signed' : 'Signing in Progress'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Signing Progress */}
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-900 mb-3">Signing Progress</h4>
          
          {/* Agent Signature Status */}
          <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                agentSigned ? 'bg-green-100' : 'bg-gray-100'
              }`}>
                {agentSigned ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <User className="w-4 h-4 text-gray-400" />
                )}
              </div>
              <div>
                <p className="font-medium text-gray-900">Agent Signature</p>
                <p className="text-sm text-gray-600">
                  {agentSigned 
                    ? `Signed on ${new Date(agentSigned).toLocaleDateString()}`
                    : 'Pending signature'
                  }
                </p>
              </div>
            </div>
            {userRole === 'agent' && !agentSigned && (
              <Button
                onClick={handleSign}
                disabled={isSigningInProgress}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isSigningInProgress ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    Signing...
                  </>
                ) : (
                  <>
                    <FileSignature className="w-4 h-4 mr-2" />
                    Sign Contract
                  </>
                )}
              </Button>
            )}
            {agentSigned && (
              <Badge variant="default" className="bg-green-100 text-green-700 border-green-200">
                Signed
              </Badge>
            )}
          </div>

          {/* Team Confirmation Status */}
          <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                teamConfirmed ? 'bg-green-100' : agentSigned ? 'bg-yellow-100' : 'bg-gray-100'
              }`}>
                {teamConfirmed ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : agentSigned ? (
                  <Clock className="w-4 h-4 text-yellow-600" />
                ) : (
                  <User className="w-4 h-4 text-gray-400" />
                )}
              </div>
              <div>
                <p className="font-medium text-gray-900">Team Confirmation</p>
                <p className="text-sm text-gray-600">
                  {teamConfirmed 
                    ? `Confirmed on ${new Date(teamConfirmed).toLocaleDateString()}`
                    : agentSigned 
                      ? 'Awaiting team confirmation'
                      : 'Waiting for agent signature'
                  }
                </p>
              </div>
            </div>
            {userRole === 'team' && agentSigned && !teamConfirmed && (
              <Button
                onClick={onConfirm}
                className="bg-green-600 hover:bg-green-700"
              >
                <Check className="w-4 h-4 mr-2" />
                Confirm Signature
              </Button>
            )}
            {teamConfirmed && (
              <Badge variant="default" className="bg-green-100 text-green-700 border-green-200">
                Confirmed
              </Badge>
            )}
          </div>
        </div>

        <Separator />

        {/* Contract Summary */}
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-900">Contract Summary</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Player:</p>
              <p className="font-medium">{contract?.player?.full_name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-gray-600">Team:</p>
              <p className="font-medium">{contract?.team?.name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-gray-600">Contract Value:</p>
              <p className="font-medium">
                {contract?.currency} {contract?.contract_value?.toLocaleString() || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Duration:</p>
              <p className="font-medium">{contract?.terms?.duration || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Legal Notice */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <FileSignature className="w-3 h-3 text-blue-600" />
            </div>
            <div className="text-sm">
              <p className="font-medium text-blue-900 mb-1">Legal Notice</p>
              <p className="text-blue-700">
                By signing this contract digitally, you agree to all terms and conditions outlined. 
                This electronic signature has the same legal validity as a handwritten signature.
              </p>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        {agentSigned && teamConfirmed && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-3">
              <Check className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-medium text-green-900">Contract Fully Signed!</p>
                <p className="text-sm text-green-700">
                  Proceeding to payment phase. The agent can now make the transfer payment.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DigitalSignature;
