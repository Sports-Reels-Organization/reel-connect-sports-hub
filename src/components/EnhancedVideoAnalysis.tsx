import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Brain, 
  Upload, 
  Play, 
  BarChart3, 
  Users, 
  Clock,
  CheckCircle,
  AlertCircle,
  FileVideo,
  Target,
  TrendingUp
} from 'lucide-react';
import VideoPlayer from './VideoPlayer';
import VideoAnalysisResults from './VideoAnalysisResults';

interface EnhancedVideoAnalysisProps {
  videoId?: string;
  teamId?: string;
  onAnalysisComplete?: (results: any) => void;
}

const EnhancedVideoAnalysis: React.FC<EnhancedVideoAnalysisProps> = ({
  videoId,
  teamId,
  onAnalysisComplete
}) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(videoId || null);
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('upload');

  useEffect(() => {
    if (teamId) {
      loadTeamVideos();
    }
  }, [teamId]);

  const loadTeamVideos = async () => {
    if (!teamId) return;

    try {
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('team_id', teamId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVideos(data || []);
    } catch (error) {
      console.error('Error loading team videos:', error);
    }
  };

  const handleAnalysisRequest = async (videoId: string) => {
    try {
      setLoading(true);
      // Simulate analysis process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Analysis Started",
        description: "Video analysis has been queued for processing",
      });
      
      if (onAnalysisComplete) {
        onAnalysisComplete({ videoId, status: 'completed' });
      }
    } catch (error) {
      console.error('Error starting analysis:', error);
      toast({
        title: "Analysis Failed",
        description: "Failed to start video analysis",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Enhanced Video Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 bg-gray-700">
              <TabsTrigger value="upload" className="text-white data-[state=active]:bg-bright-pink">
                Upload & Analyze
              </TabsTrigger>
              <TabsTrigger value="library" className="text-white data-[state=active]:bg-bright-pink">
                Video Library
              </TabsTrigger>
              <TabsTrigger value="results" className="text-white data-[state=active]:bg-bright-pink">
                Analysis Results
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="mt-6">
              <div className="text-center p-8">
                <FileVideo className="w-16 h-16 text-bright-pink mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Upload Video for Analysis</h3>
                <p className="text-gray-400 mb-6">
                  Upload a video file to get AI-powered analysis and insights
                </p>
                <Button className="bg-bright-pink hover:bg-bright-pink/90 text-white">
                  <Upload className="w-4 h-4 mr-2" />
                  Select Video File
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="library" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {videos.map((video) => (
                  <Card key={video.id} className="bg-gray-700 border-gray-600">
                    <CardContent className="p-4">
                      <h4 className="text-white font-medium mb-2">{video.title}</h4>
                      <div className="flex items-center justify-between">
                        <Badge 
                          variant={video.ai_analysis_status === 'completed' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {video.ai_analysis_status || 'pending'}
                        </Badge>
                        <Button 
                          size="sm" 
                          onClick={() => handleAnalysisRequest(video.id)}
                          disabled={loading}
                          className="bg-bright-pink hover:bg-bright-pink/90 text-white text-xs"
                        >
                          Analyze
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="results" className="mt-6">
              {selectedVideoId ? (
                <VideoAnalysisResults
                  videoId={selectedVideoId}
                  teamId={teamId}
                />
              ) : (
                <div className="text-center p-8">
                  <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No Video Selected</h3>
                  <p className="text-gray-400">
                    Select a video from the library to view analysis results
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedVideoAnalysis;
