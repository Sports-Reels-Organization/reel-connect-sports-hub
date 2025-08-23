
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, Image, Video, X, Play } from 'lucide-react';

interface PlayerMediaManagerProps {
  playerId: string;
  onMediaUpdate?: () => void;
}

const PlayerMediaManager: React.FC<PlayerMediaManagerProps> = ({ playerId, onMediaUpdate }) => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [videos, setVideos] = useState<string[]>([]);

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (const file of files) {
        if (!file.type.startsWith('image/')) continue;

        const fileName = `${playerId}/${Date.now()}-${file.name}`;
        const { data, error } = await supabase.storage
          .from('player-media')
          .upload(fileName, file);

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
          .from('player-media')
          .getPublicUrl(fileName);

        setPhotos(prev => [...prev, publicUrl]);
      }

      toast({
        title: "Success",
        description: "Photos uploaded successfully",
      });
      onMediaUpdate?.();
    } catch (error) {
      console.error('Error uploading photos:', error);
      toast({
        title: "Error",
        description: "Failed to upload photos",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleVideoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (const file of files) {
        if (!file.type.startsWith('video/')) continue;

        // Validate file size (max 100MB for player videos)
        if (file.size > 100 * 1024 * 1024) {
          toast({
            title: "File Too Large",
            description: "Video files must be smaller than 100MB",
            variant: "destructive"
          });
          continue;
        }

        const fileName = `${playerId}/${Date.now()}-${file.name}`;
        const { data, error } = await supabase.storage
          .from('player-videos')
          .upload(fileName, file);

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
          .from('player-videos')
          .getPublicUrl(fileName);

        setVideos(prev => [...prev, publicUrl]);
      }

      toast({
        title: "Success",
        description: "Videos uploaded successfully",
      });
      onMediaUpdate?.();
    } catch (error) {
      console.error('Error uploading videos:', error);
      toast({
        title: "Error",
        description: "Failed to upload videos",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const removeVideo = (index: number) => {
    setVideos(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white">Player Media</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="photos" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-700">
            <TabsTrigger value="photos" className="flex items-center gap-2">
              <Image className="w-4 h-4" />
              Photos
            </TabsTrigger>
            <TabsTrigger value="videos" className="flex items-center gap-2">
              <Video className="w-4 h-4" />
              Videos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="photos" className="space-y-4">
            <div className="border-2 border-dashed border-gray-600 rounded-lg p-6">
              <div className="text-center">
                <Image className="w-12 h-12 mx-auto mb-4 text-gray-500" />
                <p className="text-gray-400 mb-4">Upload player photos</p>
                <Button
                  onClick={() => document.getElementById('photo-upload')?.click()}
                  disabled={uploading}
                  className="bg-bright-pink hover:bg-bright-pink/90"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Choose Photos
                </Button>
                <input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </div>
            </div>

            {photos.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {photos.map((photo, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={photo}
                      alt={`Player photo ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <Button
                      size="sm"
                      variant="destructive"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removePhoto(index)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="videos" className="space-y-4">
            <div className="border-2 border-dashed border-gray-600 rounded-lg p-6">
              <div className="text-center">
                <Video className="w-12 h-12 mx-auto mb-4 text-gray-500" />
                <p className="text-gray-400 mb-4">Upload player highlight videos</p>
                <Button
                  onClick={() => document.getElementById('video-upload')?.click()}
                  disabled={uploading}
                  className="bg-bright-pink hover:bg-bright-pink/90"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Choose Videos
                </Button>
                <input
                  id="video-upload"
                  type="file"
                  accept="video/*"
                  multiple
                  onChange={handleVideoUpload}
                  className="hidden"
                />
              </div>
            </div>

            {videos.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {videos.map((video, index) => (
                  <div key={index} className="relative group">
                    <div className="bg-black rounded-lg h-32 flex items-center justify-center">
                      <Play className="w-8 h-8 text-white" />
                    </div>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeVideo(index)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default PlayerMediaManager;
