import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Upload, X, Play, FileVideo, Loader2, User } from 'lucide-react';
import { PlayerTagging } from './PlayerTagging';
import { smartCompress } from '@/services/fastVideoCompressionService';

interface VideoUploadFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const VideoUploadForm: React.FC<VideoUploadFormProps> = ({ onSuccess, onCancel }) => {
  // Import the enhanced version
  const EnhancedVideoUploadForm = React.lazy(() => import('./EnhancedVideoUploadForm').then(module => ({ default: module.EnhancedVideoUploadForm })));

  return (
    <React.Suspense fallback={
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bright-pink"></div>
      </div>
    }>
      <EnhancedVideoUploadForm onSuccess={onSuccess} onCancel={onCancel} />
    </React.Suspense>
  );
};

export default VideoUploadForm;
