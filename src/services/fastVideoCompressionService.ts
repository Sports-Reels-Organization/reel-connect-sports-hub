
export interface VideoFile extends File {
  compressed?: boolean;
}

export interface CompressionOptions {
  maxSizeMB: number;
  quality: number;
  width?: number;
  height?: number;
  fastMode?: boolean;
}

export const compressVideoFast = async (
  file: File,
  options: CompressionOptions = { maxSizeMB: 10, quality: 0.7, fastMode: true }
): Promise<VideoFile> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    video.onloadedmetadata = () => {
      // Optimize canvas size for speed
      const maxDimension = options.fastMode ? 720 : 1280;
      const aspectRatio = video.videoWidth / video.videoHeight;
      
      if (video.videoWidth > video.videoHeight) {
        canvas.width = Math.min(maxDimension, video.videoWidth);
        canvas.height = canvas.width / aspectRatio;
      } else {
        canvas.height = Math.min(maxDimension, video.videoHeight);
        canvas.width = canvas.height * aspectRatio;
      }
      
      // Use faster codec settings
      const mimeType = 'video/webm;codecs=vp8'; // VP8 is faster than VP9
      const videoBitsPerSecond = options.fastMode ? 500000 : 1000000; // Lower bitrate for speed
      
      const stream = canvas.captureStream(options.fastMode ? 15 : 30); // Lower framerate for speed
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond
      });
      
      const chunks: Blob[] = [];
      let frameCount = 0;
      const maxFrames = options.fastMode ? 150 : 300; // Limit frames for speed
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const compressedBlob = new Blob(chunks, { type: 'video/webm' });
        
        const compressedFile = new File([compressedBlob], file.name.replace(/\.[^/.]+$/, '.webm'), {
          type: 'video/webm'
        }) as VideoFile;
        compressedFile.compressed = true;
        resolve(compressedFile);
      };
      
      mediaRecorder.onerror = () => {
        reject(new Error('Video compression failed'));
      };
      
      mediaRecorder.start();
      
      // Optimized frame drawing with skip frames for speed
      const drawFrame = () => {
        if (!video.ended && !video.paused && frameCount < maxFrames) {
          // Skip every other frame in fast mode
          if (!options.fastMode || frameCount % 2 === 0) {
            ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
          }
          frameCount++;
          requestAnimationFrame(drawFrame);
        } else {
          mediaRecorder.stop();
        }
      };
      
      // Set video playback rate for faster processing
      video.playbackRate = options.fastMode ? 2.0 : 1.0;
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

// Quick compression check - only compress if file is too large
export const smartCompress = async (file: File): Promise<VideoFile> => {
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  if (file.size <= maxSize) {
    // File is already small enough, return as is
    return file as VideoFile;
  }
  
  // File is too large, compress with fast mode
  return compressVideoFast(file, {
    maxSizeMB: 10,
    quality: 0.6,
    fastMode: true
  });
};
