
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Brain, Users, BarChart3, TrendingUp, Clock, Loader2 } from 'lucide-react';

interface GeminiAnalysisResult {
  playerAnalysis: any[];
  tacticalInsights: any;
  skillAssessment: any;
  matchEvents: any[];
  recommendations: string[];
  confidence: number;
}

interface VideoAnalysisResultsProps {
  analysisResult: GeminiAnalysisResult | null;
  videoMetadata: {
    title: string;
    videoType: string;
    sport: string;
    videoId?: string;
    teamId?: string;
  };
  isLoading?: boolean;
}

const VideoAnalysisResults: React.FC<VideoAnalysisResultsProps> = ({
  analysisResult,
  videoMetadata,
  isLoading = false
}) => {
  if (isLoading) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-8 text-center">
          <Loader2 className="w-16 h-16 text-bright-pink mx-auto mb-4 animate-spin" />
          <h3 className="text-white text-xl font-semibold mb-2">Analyzing Video...</h3>
          <p className="text-gray-400">Please wait while Gemini AI processes your video</p>
        </CardContent>
      </Card>
    );
  }

  if (!analysisResult) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-8 text-center">
          <Brain className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-white text-xl font-semibold mb-2">No Analysis Results</h3>
          <p className="text-gray-400">Analysis results will appear here once processing is complete.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-gray-800 to-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white text-2xl flex items-center gap-3">
            <Brain className="w-8 h-8 text-bright-pink" />
            Gemini AI Analysis Results
            <Badge variant="outline" className="text-green-400 border-green-400">
              Confidence: {Math.round(analysisResult.confidence * 100)}%
            </Badge>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Player Analysis */}
      {analysisResult.playerAnalysis.length > 0 && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-400" />
              Player Performance Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analysisResult.playerAnalysis.map((player, index) => (
                <div key={index} className="p-4 bg-gray-700 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="text-white font-medium">{player.playerName}</div>
                      <div className="text-gray-400 text-sm">#{player.jerseyNumber} - {player.position}</div>
                    </div>
                    <Badge variant="outline" className="text-green-400 border-green-400">
                      {player.performance.overall}/100
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Technical</span>
                      <span className="text-white">{player.performance.technical}/100</span>
                    </div>
                    <Progress value={player.performance.technical} className="h-2" />
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Physical</span>
                      <span className="text-white">{player.performance.physical}/100</span>
                    </div>
                    <Progress value={player.performance.physical} className="h-2" />
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Tactical</span>
                      <span className="text-white">{player.performance.tactical}/100</span>
                    </div>
                    <Progress value={player.performance.tactical} className="h-2" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {analysisResult.recommendations.length > 0 && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              AI Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analysisResult.recommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-gray-700 rounded-lg">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-white text-sm">{recommendation}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default VideoAnalysisResults;
