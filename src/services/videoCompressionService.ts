
export interface VideoFile extends File {
  compressed?: boolean;
}

export interface CompressionOptions {
  maxSizeMB: number;
  quality: number;
  width?: number;
  height?: number;
}

export const compressVideo = async (
  file: File,
  options: CompressionOptions = { maxSizeMB: 10, quality: 0.8 }
): Promise<VideoFile> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    video.onloadedmetadata = () => {
      // Set canvas dimensions
      const aspectRatio = video.videoWidth / video.videoHeight;
      canvas.width = options.width || Math.min(1280, video.videoWidth);
      canvas.height = canvas.width / aspectRatio;
      
      // Create MediaRecorder for compression
      const stream = canvas.captureStream(30);
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: 1000000 // 1Mbps for better compression
      });
      
      const chunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const compressedBlob = new Blob(chunks, { type: 'video/webm' });
        
        // Check if compression achieved target size
        if (compressedBlob.size <= options.maxSizeMB * 1024 * 1024) {
          const compressedFile = new File([compressedBlob], file.name.replace(/\.[^/.]+$/, '.webm'), {
            type: 'video/webm'
          }) as VideoFile;
          compressedFile.compressed = true;
          resolve(compressedFile);
        } else {
          // If still too large, try with lower quality
          if (options.quality > 0.3) {
            compressVideo(file, { ...options, quality: options.quality - 0.2 })
              .then(resolve)
              .catch(reject);
          } else {
            reject(new Error('Unable to compress video to target size'));
          }
        }
      };
      
      mediaRecorder.onerror = (event) => {
        reject(new Error('Video compression failed'));
      };
      
      // Start recording
      mediaRecorder.start();
      
      // Draw video frames to canvas
      const drawFrame = () => {
        if (!video.ended && !video.paused) {
          ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
          requestAnimationFrame(drawFrame);
        } else {
          mediaRecorder.stop();
        }
      };
      
      video.play();
      drawFrame();
    };
    
    video.onerror = () => {
      reject(new Error('Failed to load video'));
    };
    
    video.src = URL.createObjectURL(file);
  });
};

export const getVideoDuration = (file: File): Promise<number> => {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.onloadedmetadata = () => {
      resolve(video.duration);
    };
    video.src = URL.createObjectURL(file);
  });
};
