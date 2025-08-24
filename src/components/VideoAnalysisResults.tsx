
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Brain, 
  MessageSquare, 
  Target, 
  Activity, 
  Users, 
  BarChart3,
  TrendingUp,
  MapPin,
  Zap,
  Award,
  Eye,
  Clock,
  Star
} from 'lucide-react';
import type {
  InterviewAnalysisResult,
  HighlightAnalysisResult,
  TrainingAnalysisResult,
  MatchAnalysisResult
} from '@/services/aiVideoAnalysisService';

interface VideoAnalysisResultsProps {
  videoType: 'match' | 'interview' | 'training' | 'highlight';
  analysisData: any;
  videoTitle: string;
}

const VideoAnalysisResults: React.FC<VideoAnalysisResultsProps> = ({
  videoType,
  analysisData,
  videoTitle
}) => {
  const [activeTab, setActiveTab] = useState('overview');

  const renderInterviewAnalysis = (data: InterviewAnalysisResult) => (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transcription">Transcription</TabsTrigger>
          <TabsTrigger value="sentiment">Sentiment</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-bright-pink" />
                Interview Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 mb-4">{data.bioExtract}</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-bright-pink">
                    {data.sentimentAnalysis.confidence}/10
                  </div>
                  <div className="text-sm text-gray-400">Confidence</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-bright-pink">
                    {data.sentimentAnalysis.professionalism}/10
                  </div>
                  <div className="text-sm text-gray-400">Professionalism</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-bright-pink">
                    {data.sentimentAnalysis.communicationSkills}/10
                  </div>
                  <div className="text-sm text-gray-400">Communication</div>
                </div>
                <div className="text-center">
                  <Badge variant={data.sentimentAnalysis.overallSentiment === 'positive' ? 'default' : 'secondary'}>
                    {data.sentimentAnalysis.overallSentiment}
                  </Badge>
                  <div className="text-sm text-gray-400 mt-1">Sentiment</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transcription" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Full Transcription</CardTitle>
              <Badge variant="outline">
                Confidence: {Math.round(data.transcription.confidence * 100)}%
              </Badge>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 leading-relaxed">{data.transcription.text}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Available Translations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(data.translations).map(([lang, translation]) => (
                <div key={lang} className="border-l-2 border-bright-pink pl-4">
                  <Badge variant="secondary" className="mb-2">
                    {lang.toUpperCase()}
                  </Badge>
                  <p className="text-gray-300 text-sm">{translation}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sentiment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sentiment Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span>Confidence Level</span>
                  <span>{data.sentimentAnalysis.confidence}/10</span>
                </div>
                <Progress value={data.sentimentAnalysis.confidence * 10} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span>Professionalism</span>
                  <span>{data.sentimentAnalysis.professionalism}/10</span>
                </div>
                <Progress value={data.sentimentAnalysis.professionalism * 10} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span>Communication Skills</span>
                  <span>{data.sentimentAnalysis.communicationSkills}/10</span>
                </div>
                <Progress value={data.sentimentAnalysis.communicationSkills * 10} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Key Topics & Tags</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {data.keywordTags.map((tag: string, index: number) => (
                  <Badge key={index} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Generated Subtitles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.subtitles.map((subtitle, index) => (
                <div key={index} className="flex items-center gap-3 text-sm">
                  <Badge variant="secondary">
                    {Math.floor(subtitle.start)}s - {Math.floor(subtitle.end)}s
                  </Badge>
                  <span className="text-gray-300">{subtitle.text}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );

  const renderHighlightAnalysis = (data: HighlightAnalysisResult) => (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="highlights">Auto Highlights</TabsTrigger>
          <TabsTrigger value="skills">Skills</TabsTrigger>
          <TabsTrigger value="comparison">Comparison</TabsTrigger>
          <TabsTrigger value="quality">Quality</TabsTrigger>
        </TabsList>

        <TabsContent value="highlights" className="space-y-4">
          {data.autoHighlights.map((highlight, index) => (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="default" className="bg-bright-pink">
                    {highlight.action}
                  </Badge>
                  <Badge variant="outline">
                    {Math.round(highlight.confidence * 100)}% confidence
                  </Badge>
                </div>
                <p className="text-gray-300 mb-3">{highlight.description}</p>
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {Math.floor(highlight.timestamp / 60)}:{(highlight.timestamp % 60).toString().padStart(2, '0')}
                  </span>
                  <span className="flex items-center gap-1">
                    <Target className="w-4 h-4" />
                    {highlight.duration}s duration
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="skills" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Skill Classification</CardTitle>
            </CardHeader>
            <CardContent>
              {data.skillClassification.map((skill, index) => (
                <div key={index} className="flex items-center justify-between py-3 border-b border-gray-700 last:border-0">
                  <div>
                    <div className="font-medium text-white">{skill.skill}</div>
                    <Badge variant="secondary" className="mt-1">
                      {skill.category}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-400">
                      {Math.floor(skill.timestamp / 60)}:{(skill.timestamp % 60).toString().padStart(2, '0')}
                    </div>
                    <Progress value={skill.confidence * 100} className="w-20 h-2 mt-1" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Similar Players</CardTitle>
            </CardHeader>
            <CardContent>
              {data.playerComparison.similarPlayers.map((player, index) => (
                <div key={index} className="flex items-center justify-between py-3 border-b border-gray-700 last:border-0">
                  <div>
                    <div className="font-medium text-white">{player.playerName}</div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {player.comparisonMetrics.map((metric, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {metric}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-bright-pink font-medium">
                      {Math.round(player.similarityScore * 100)}%
                    </div>
                    <div className="text-sm text-gray-400">similarity</div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quality" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quality Enhancements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-bright-pink" />
                  <span className="text-sm">Resolution Upscaled</span>
                  <Badge variant={data.qualityEnhancements.resolutionUpscaled ? 'default' : 'secondary'}>
                    {data.qualityEnhancements.resolutionUpscaled ? 'Yes' : 'No'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-bright-pink" />
                  <span className="text-sm">Lighting Adjusted</span>
                  <Badge variant={data.qualityEnhancements.lightingAdjusted ? 'default' : 'secondary'}>
                    {data.qualityEnhancements.lightingAdjusted ? 'Yes' : 'No'}
                  </Badge>
                </div>
              </div>
              
              {data.qualityEnhancements.slowMotionSegments.length > 0 && (
                <div>
                  <h4 className="font-medium text-white mb-2">Slow Motion Segments</h4>
                  {data.qualityEnhancements.slowMotionSegments.map((segment, index) => (
                    <div key={index} className="text-sm text-gray-300">
                      {Math.floor(segment.start)}s - {Math.floor(segment.end)}s 
                      (Speed: {segment.playbackSpeed}x)
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );

  const renderTrainingAnalysis = (data: TrainingAnalysisResult) => (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="biomechanics">Biomechanics</TabsTrigger>
          <TabsTrigger value="workrate">Work Rate</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
        </TabsList>

        <TabsContent value="biomechanics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Running Form Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span>Overall Score</span>
                  <span className="text-bright-pink font-bold">
                    {data.biomechanicalAnalysis.runningForm.score}/10
                  </span>
                </div>
                <Progress value={data.biomechanicalAnalysis.runningForm.score * 10} className="h-2" />
              </div>
              
              <div>
                <h4 className="font-medium text-white mb-2">Issues Identified</h4>
                <ul className="space-y-1">
                  {data.biomechanicalAnalysis.runningForm.issues.map((issue, index) => (
                    <li key={index} className="text-sm text-gray-300 flex items-center gap-2">
                      <div className="w-1 h-1 bg-red-500 rounded-full"></div>
                      {issue}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-white mb-2">Suggestions</h4>
                <ul className="space-y-1">
                  {data.biomechanicalAnalysis.runningForm.suggestions.map((suggestion, index) => (
                    <li key={index} className="text-sm text-gray-300 flex items-center gap-2">
                      <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Jump Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Score:</span>
                    <span className="text-bright-pink">{data.biomechanicalAnalysis.jumpTechnique.score}/10</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Height:</span>
                    <span>{data.biomechanicalAnalysis.jumpTechnique.height}cm</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Balance Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Score:</span>
                    <span className="text-bright-pink">{data.biomechanicalAnalysis.balance.score}/10</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Steadiness:</span>
                    <span>{data.biomechanicalAnalysis.balance.steadiness}/10</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="workrate" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Work Rate Detection</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-bright-pink">
                    {data.workRateDetection.sprintCount}
                  </div>
                  <div className="text-sm text-gray-400">Sprints</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-bright-pink">
                    {data.workRateDetection.repetitions}
                  </div>
                  <div className="text-sm text-gray-400">Repetitions</div>
                </div>
                <div className="text-center">
                  <Badge variant="default" className="bg-bright-pink">
                    {data.workRateDetection.intensityLevel}
                  </Badge>
                  <div className="text-sm text-gray-400 mt-1">Intensity</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-bright-pink">
                    {data.workRateDetection.drillsCompleted.length}
                  </div>
                  <div className="text-sm text-gray-400">Drills</div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-white mb-2">Drills Completed</h4>
                <div className="flex flex-wrap gap-2">
                  {data.workRateDetection.drillsCompleted.map((drill, index) => (
                    <Badge key={index} variant="outline">
                      {drill}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Coaching Insights</CardTitle>
            </CardHeader>
            <CardContent>
              {data.coachingInsights.map((insight, index) => (
                <div key={index} className="border-l-2 border-bright-pink pl-4 mb-4 last:mb-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline">{insight.area}</Badge>
                    <Badge variant={insight.priority === 'high' ? 'destructive' : insight.priority === 'medium' ? 'default' : 'secondary'}>
                      {insight.priority}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-300 mb-1">
                    <strong>Issue:</strong> {insight.issue}
                  </div>
                  <div className="text-sm text-gray-300">
                    <strong>Suggestion:</strong> {insight.suggestion}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Progress Tracking</CardTitle>
              <Badge variant="outline">{data.progressTracking.comparisonPeriod}</Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span>Overall Progress</span>
                  <span className="text-bright-pink font-bold">
                    {data.progressTracking.overallProgress}/10
                  </span>
                </div>
                <Progress value={data.progressTracking.overallProgress * 10} className="h-3" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-green-400 mb-2 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Improvements
                  </h4>
                  <ul className="space-y-1">
                    {data.progressTracking.improvements.map((improvement, index) => (
                      <li key={index} className="text-sm text-gray-300 flex items-center gap-2">
                        <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                        {improvement}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium text-yellow-400 mb-2 flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    Areas to Focus
                  </h4>
                  <ul className="space-y-1">
                    {data.progressTracking.regressions.map((regression, index) => (
                      <li key={index} className="text-sm text-gray-300 flex items-center gap-2">
                        <div className="w-1 h-1 bg-yellow-500 rounded-full"></div>
                        {regression}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );

  const renderMatchAnalysis = (data: MatchAnalysisResult) => (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="heatmaps">Heatmaps</TabsTrigger>
          <TabsTrigger value="tactics">Tactics</TabsTrigger>
          <TabsTrigger value="opponent">Opponent</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-2xl font-bold text-bright-pink">
                  {data.playerTracking.length}
                </div>
                <div className="text-sm text-gray-400">Players Tracked</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-2xl font-bold text-bright-pink">
                  {data.eventRecognition.length}
                </div>
                <div className="text-sm text-gray-400">Events Detected</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-2xl font-bold text-bright-pink">
                  {data.xgAnalysis.totalXG.toFixed(1)}
                </div>
                <div className="text-sm text-gray-400">Total xG</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Player Tracking Summary</CardTitle>
            </CardHeader>
            <CardContent>
              {data.playerTracking.map((player, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-gray-700 last:border-0">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">#{player.jerseyNumber}</Badge>
                    <span className="text-white">{player.playerName}</span>
                  </div>
                  <div className="text-right">
                    <Progress value={player.confidence * 100} className="w-20 h-2 mb-1" />
                    <div className="text-xs text-gray-400">
                      {Math.round(player.confidence * 100)}% tracking accuracy
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Event Recognition</CardTitle>
            </CardHeader>
            <CardContent>
              {data.eventRecognition.map((event, index) => {
                const player = data.playerTracking.find(p => p.playerId === event.playerId);
                return (
                  <div key={index} className="border-l-2 border-bright-pink pl-4 mb-4 last:mb-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="default" className="bg-bright-pink">
                        {event.eventType}
                      </Badge>
                      <Badge variant="outline">
                        {Math.round(event.confidence * 100)}% confidence
                      </Badge>
                      <span className="text-sm text-gray-400">
                        {Math.floor(event.timestamp / 60)}:{(event.timestamp % 60).toString().padStart(2, '0')}
                      </span>
                    </div>
                    <div className="text-white font-medium">
                      {player?.playerName || 'Unknown Player'} (#{player?.jerseyNumber || 'N/A'})
                    </div>
                    {event.details && (
                      <div className="text-sm text-gray-300 mt-1">
                        {JSON.stringify(event.details, null, 2).replace(/[{},"]/g, ' ').trim()}
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>xG Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              {data.xgAnalysis.shotsAnalysis.map((shot, index) => {
                const player = data.playerTracking.find(p => p.playerId === shot.playerId);
                return (
                  <div key={index} className="flex items-center justify-between py-2 border-b border-gray-700 last:border-0">
                    <div>
                      <div className="font-medium text-white">
                        {player?.playerName || 'Unknown Player'}
                      </div>
                      <div className="text-sm text-gray-400">
                        {Math.floor(shot.timestamp / 60)}:{(shot.timestamp % 60).toString().padStart(2, '0')} - {shot.outcome}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-bright-pink font-bold">
                        xG: {shot.xgValue.toFixed(2)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="heatmaps" className="space-y-4">
          {Object.entries(data.heatmaps).map(([playerId, heatmapData]) => {
            const player = data.playerTracking.find(p => p.playerId === playerId);
            return (
              <Card key={playerId}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-bright-pink" />
                    {player?.playerName || 'Unknown Player'} - Positioning
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {(heatmapData as any).zones.map((zone: any, index: number) => (
                      <div key={index} className="text-center p-3 bg-gray-800 rounded-lg">
                        <div className="font-medium text-white">{zone.zone}</div>
                        <div className="text-2xl font-bold text-bright-pink mt-1">
                          {zone.timeSpent}%
                        </div>
                        <div className="text-sm text-gray-400">
                          Effectiveness: {zone.effectiveness}/10
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="tactics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tactical Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-white mb-2">Formation</h4>
                  <Badge variant="default" className="bg-bright-pink text-lg px-4 py-2">
                    {data.tacticalAnalysis.formation}
                  </Badge>
                </div>
                
                <div>
                  <h4 className="font-medium text-white mb-2">Team Shape</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Compactness:</span>
                      <span className="text-bright-pink">{data.tacticalAnalysis.teamShape.compactness}/10</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Width:</span>
                      <span className="text-bright-pink">{data.tacticalAnalysis.teamShape.width}/10</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Depth:</span>
                      <span className="text-bright-pink">{data.tacticalAnalysis.teamShape.depth}/10</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h4 className="font-medium text-white mb-3">Pressing Patterns</h4>
                {data.tacticalAnalysis.pressingPatterns.map((pattern, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b border-gray-700 last:border-0">
                    <div>
                      <span className="text-white">{pattern.pattern}</span>
                      <div className="text-sm text-gray-400">
                        {Math.floor(pattern.timestamp / 60)}:{(pattern.timestamp % 60).toString().padStart(2, '0')}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-bright-pink font-medium">
                        {pattern.effectiveness}/10
                      </div>
                      <div className="text-xs text-gray-400">effectiveness</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="opponent" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-green-400">Opponent Strengths</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {data.opponentAnalysis.strengths.map((strength, index) => (
                    <li key={index} className="flex items-center gap-2 text-gray-300">
                      <Star className="w-4 h-4 text-green-400" />
                      {strength}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-red-400">Opponent Weaknesses</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {data.opponentAnalysis.weaknesses.map((weakness, index) => (
                    <li key={index} className="flex items-center gap-2 text-gray-300">
                      <Target className="w-4 h-4 text-red-400" />
                      {weakness}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Key Opposition Players</CardTitle>
            </CardHeader>
            <CardContent>
              {data.opponentAnalysis.keyPlayers.map((player, index) => (
                <div key={index} className="flex items-center justify-between py-3 border-b border-gray-700 last:border-0">
                  <div>
                    <div className="font-medium text-white">{player.role}</div>
                    <Badge variant="outline" className="mt-1">
                      Player ID: {player.playerId}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div className="text-bright-pink font-bold">
                      {player.impact}/10
                    </div>
                    <div className="text-sm text-gray-400">impact</div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );

  const renderAnalysisContent = () => {
    switch (videoType) {
      case 'interview':
        return renderInterviewAnalysis(analysisData as InterviewAnalysisResult);
      case 'highlight':
        return renderHighlightAnalysis(analysisData as HighlightAnalysisResult);
      case 'training':
        return renderTrainingAnalysis(analysisData as TrainingAnalysisResult);
      case 'match':
        return renderMatchAnalysis(analysisData as MatchAnalysisResult);
      default:
        return (
          <Card>
            <CardContent className="pt-6 text-center">
              <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400">Analysis results not available for this video type.</p>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Brain className="w-6 h-6 text-bright-pink" />
            AI Analysis Results
          </h2>
          <p className="text-gray-400 mt-1">
            {videoTitle} - {videoType.charAt(0).toUpperCase() + videoType.slice(1)} Video Analysis
          </p>
        </div>
        
        <Badge variant="default" className="bg-bright-pink">
          {videoType.charAt(0).toUpperCase() + videoType.slice(1)} Analysis
        </Badge>
      </div>

      {renderAnalysisContent()}
    </div>
  );
};

export default VideoAnalysisResults;
