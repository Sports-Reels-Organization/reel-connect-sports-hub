
import React from 'react';
import { EnhancedVideoUploadForm } from './EnhancedVideoUploadForm';

interface VideoUploadFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const VideoUploadForm: React.FC<VideoUploadFormProps> = ({ onSuccess, onCancel }) => {
  return (
    <React.Suspense fallback={
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bright-pink"></div>
      </div>
    }>
      <EnhancedVideoUploadForm onSuccess={onSuccess} onCancel={onCancel} teamId={null} />
    </React.Suspense>
  );
};

export default VideoUploadForm;
