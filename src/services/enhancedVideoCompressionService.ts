
interface CompressionOptions {
  targetSizeKB?: number;
  maxSizeKB?: number;
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
}

export const compressVideoToTarget = async (
  file: File, 
  options: CompressionOptions = {}
): Promise<File> => {
  const {
    targetSizeKB = 10000, // 10MB target
    maxSizeKB = 50000, // 50MB max
    quality = 0.3,
    maxWidth = 1280,
    maxHeight = 720
  } = options;

  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    video.onloadedmetadata = () => {
      // Calculate dimensions maintaining aspect ratio
      let { videoWidth, videoHeight } = video;
      
      if (videoWidth > maxWidth || videoHeight > maxHeight) {
        const aspectRatio = videoWidth / videoHeight;
        
        if (videoWidth > videoHeight) {
          videoWidth = maxWidth;
          videoHeight = maxWidth / aspectRatio;
        } else {
          videoHeight = maxHeight;
          videoWidth = maxHeight * aspectRatio;
        }
      }

      canvas.width = videoWidth;
      canvas.height = videoHeight;

      const mediaRecorder = new MediaRecorder(canvas.captureStream(), {
        mimeType: 'video/webm;codecs=vp8,opus',
        videoBitsPerSecond: 500000, // 500kbps
        audioBitsPerSecond: 64000   // 64kbps
      });

      const chunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const compressedBlob = new Blob(chunks, { type: 'video/webm' });
        const compressedFile = new File([compressedBlob], file.name.replace(/\.[^/.]+$/, ".webm"), {
          type: 'video/webm',
          lastModified: Date.now()
        });
        
        console.log(`Original size: ${(file.size / 1024).toFixed(1)}KB`);
        console.log(`Compressed size: ${(compressedFile.size / 1024).toFixed(1)}KB`);
        console.log(`Compression ratio: ${((1 - compressedFile.size / file.size) * 100).toFixed(1)}%`);
        
        resolve(compressedFile);
      };

      mediaRecorder.onerror = (event) => {
        reject(new Error('MediaRecorder error: ' + event));
      };

      let currentTime = 0;
      const frameRate = 15; // Reduced frame rate for better compression
      const frameInterval = 1 / frameRate;

      const processFrame = () => {
        if (currentTime < video.duration) {
          video.currentTime = currentTime;
          
          video.onseeked = () => {
            ctx.drawImage(video, 0, 0, videoWidth, videoHeight);
            currentTime += frameInterval;
            
            if (currentTime < video.duration) {
              setTimeout(processFrame, 1000 / frameRate);
            } else {
              mediaRecorder.stop();
            }
          };
        }
      };

      mediaRecorder.start();
      processFrame();
    };

    video.onerror = () => {
      reject(new Error('Video loading failed'));
    };

    video.src = URL.createObjectURL(file);
    video.load();
  });
};
