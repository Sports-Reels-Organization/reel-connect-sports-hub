
import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import VideoAnalysisPageTabs from './VideoAnalysisPageTabs';

interface VideoAnalysisResultsProps {
  videoId: string;
  teamId?: string;
}

export const VideoAnalysisResults: React.FC<VideoAnalysisResultsProps> = ({
  videoId,
  teamId
}) => {
  const { toast } = useToast();
  const [videoData, setVideoData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVideoData();
  }, [videoId]);

  const fetchVideoData = async () => {
    try {
      setLoading(true);

      // Fetch video details
      const { data: video, error: videoError } = await supabase
        .from('videos')
        .select('*')
        .eq('id', videoId)
        .single();

      if (videoError) throw videoError;

      setVideoData(video);
    } catch (error) {
      console.error('Error fetching video data:', error);
      toast({
        title: "Error",
        description: "Failed to load video data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bright-pink"></div>
        <p className="text-gray-400 ml-4">Loading video...</p>
      </div>
    );
  }

  if (!videoData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Video not found</p>
      </div>
    );
  }

  return (
    <VideoAnalysisPageTabs
      videoId={videoId}
      videoUrl={videoData.video_url}
      videoTitle={videoData.title}
      teamId={teamId}
    />
  );
};

export default VideoAnalysisResults;
