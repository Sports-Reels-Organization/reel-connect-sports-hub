
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { VideoAnalysisResults } from './VideoAnalysisResults';
import {
  Play,
  Pause,
  RotateCcw,
  Download,
  Eye,
  TrendingUp,
  Users,
  Target,
  Activity,
  BarChart3
} from 'lucide-react';

interface EnhancedVideoAnalysisProps {
  videoId: string;
  teamId: string;
}

const EnhancedVideoAnalysis: React.FC<EnhancedVideoAnalysisProps> = ({ videoId, teamId }) => {
  const { toast } = useToast();
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [analysisStatus, setAnalysisStatus] = useState<'pending' | 'processing' | 'completed' | 'failed'>('pending');

  useEffect(() => {
    fetchAnalysisData();
  }, [videoId]);

  const fetchAnalysisData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('videos')
        .select(`
          *,
          ai_analysis,
          ai_analysis_status,
          performance_metrics (
            *
          ),
          player_actions (
            *
          )
        `)
        .eq('id', videoId)
        .single();

      if (error) throw error;

      setAnalysisData(data);
      setAnalysisStatus(data.ai_analysis_status || 'pending');
    } catch (error) {
      console.error('Error fetching analysis data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch analysis data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const triggerAnalysis = async () => {
    try {
      setAnalysisStatus('processing');
      
      const { error } = await supabase
        .from('videos')
        .update({ ai_analysis_status: 'processing' })
        .eq('id', videoId);

      if (error) throw error;

      toast({
        title: "Analysis Started",
        description: "AI analysis has been initiated for this video"
      });

      // Simulate analysis progress
      setTimeout(() => {
        setAnalysisStatus('completed');
        fetchAnalysisData();
      }, 3000);

    } catch (error) {
      console.error('Error triggering analysis:', error);
      setAnalysisStatus('failed');
      toast({
        title: "Analysis Failed",
        description: "Failed to start AI analysis",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rosegold"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Analysis Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            AI Analysis Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge 
                variant={analysisStatus === 'completed' ? 'default' : 'secondary'}
                className={analysisStatus === 'completed' ? 'bg-green-500' : ''}
              >
                {analysisStatus.charAt(0).toUpperCase() + analysisStatus.slice(1)}
              </Badge>
              {analysisStatus === 'processing' && (
                <Progress value={66} className="w-32" />
              )}
            </div>
            {analysisStatus !== 'completed' && (
              <Button onClick={triggerAnalysis} disabled={analysisStatus === 'processing'}>
                {analysisStatus === 'processing' ? 'Analyzing...' : 'Start Analysis'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {analysisStatus === 'completed' && analysisData && (
        <VideoAnalysisResults 
          videoId={videoId} 
          teamId={teamId} 
          videoType="match"
        />
      )}

      {/* Quick Stats */}
      {analysisData?.ai_analysis && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-400">Players Detected</p>
                  <p className="text-xl font-bold">
                    {analysisData.ai_analysis?.players_detected || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-green-500" />
                <div>
                  <p className="text-sm text-gray-400">Key Actions</p>
                  <p className="text-xl font-bold">
                    {analysisData.player_actions?.length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-rosegold" />
                <div>
                  <p className="text-sm text-gray-400">Performance Score</p>
                  <p className="text-xl font-bold">
                    {analysisData.ai_analysis?.overall_score || 'N/A'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-purple-500" />
                <div>
                  <p className="text-sm text-gray-400">Highlights</p>
                  <p className="text-xl font-bold">
                    {analysisData.ai_analysis?.highlights?.length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default EnhancedVideoAnalysis;
