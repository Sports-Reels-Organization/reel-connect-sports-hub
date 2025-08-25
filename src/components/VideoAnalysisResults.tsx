import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  BarChart3, 
  Clock, 
  Eye, 
  Download, 
  AlertCircle, 
  CheckCircle,
  Play,
  Users
} from 'lucide-react';
import { format } from 'date-fns';
import { generatePDFReport } from '@/services/pdfReportService';
import VideoAnalysisDialog from './VideoAnalysisDialog';

interface VideoAnalysisResultsProps {
  videoId: string;
  teamId?: string;
}

export const VideoAnalysisResults: React.FC<VideoAnalysisResultsProps> = ({
  videoId,
  teamId
}) => {
  const { toast } = useToast();
  const [analysisResults, setAnalysisResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAnalysisDialog, setShowAnalysisDialog] = useState(false);
  const [selectedAnalysis, setSelectedAnalysis] = useState<any>(null);

  useEffect(() => {
    fetchAnalysisResults();
  }, [videoId, teamId]);

  const fetchAnalysisResults = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('video_analysis')
        .select('*')
        .eq('video_id', videoId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAnalysisResults(data || []);
    } catch (error) {
      console.error('Error fetching analysis results:', error);
      setError('Failed to load analysis results.');
      toast({
        title: "Error",
        description: "Failed to load analysis results",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async (analysis: any) => {
    try {
      setLoading(true);
      const reportData = {
        title: `Video Analysis Report - ${format(new Date(), 'MMMM dd, yyyy')}`,
        analysisDetails: analysis,
        videoId: videoId,
        teamId: teamId
      };
      await generatePDFReport(reportData);
      toast({
        title: "Success",
        description: "PDF report generated successfully",
      });
    } catch (error) {
      console.error('Error generating PDF report:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF report",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewAnalysis = (analysis: any) => {
    // Fetch video data for the analysis
    const videoData = {
      video_id: videoId,
      video_url: analysis.video_url || `https://example.com/video/${videoId}`, // Placeholder URL
      video_title: analysis.video_title || `Video Analysis ${analysis.id}`,
      analysis_data: analysis.analysis_data,
      tagged_players: analysis.tagged_players,
      performance_metrics: analysis.performance_metrics
    };
    
    setSelectedAnalysis(videoData);
    setShowAnalysisDialog(true);
  };

  return (
    <div className="space-y-6">
      {loading ? (
        <Card>
          <CardContent className="p-6 text-center">
            <div className="flex flex-col items-center justify-center">
              <svg className="animate-spin h-6 w-6 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="mt-3 text-gray-500">Loading analysis results...</p>
            </div>
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="p-6 text-center">
            <div className="flex flex-col items-center justify-center">
              <AlertCircle className="h-6 w-6 text-red-500" />
              <p className="mt-3 text-red-500">{error}</p>
            </div>
          </CardContent>
        </Card>
      ) : analysisResults.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <div className="flex flex-col items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-500" />
              <p className="mt-3 text-gray-500">No analysis results found for this video.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {analysisResults.map((analysis) => (
            <Card key={analysis.id}>
              <CardHeader>
                <CardTitle>Analysis #{analysis.id}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500">
                  Created at: {format(new Date(analysis.created_at), 'MMMM dd, yyyy HH:mm')}
                </p>
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      <Eye className="w-3 h-3 mr-1" />
                      {analysis.view_count || 0} Views
                    </Badge>
                    <Badge variant="outline">
                      <Users className="w-3 h-3 mr-1" />
                      {analysis.tagged_players?.length || 0} Players
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      onClick={() => handleViewAnalysis(analysis)}
                      className="flex items-center gap-2"
                    >
                      <Play className="w-4 h-4" />
                      View Analysis
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleGenerateReport(analysis)}
                      disabled={loading}
                    >
                      {loading ? (
                        <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        <Download className="w-4 h-4 mr-2" />
                      )}
                      Generate Report
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* Add the dialog at the end */}
      {showAnalysisDialog && selectedAnalysis && (
        <VideoAnalysisDialog
          isOpen={showAnalysisDialog}
          onClose={() => {
            setShowAnalysisDialog(false);
            setSelectedAnalysis(null);
          }}
          analysis={selectedAnalysis}
        />
      )}
    </div>
  );
};
