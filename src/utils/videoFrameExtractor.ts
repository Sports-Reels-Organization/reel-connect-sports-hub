
export interface VideoFrame {
  dataUrl: string;
  timestamp: number;
  width: number;
  height: number;
  size: number;
}

export interface FrameExtractionOptions {
  frameRate?: number;
  maxFrames?: number;
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
}

export class VideoFrameExtractor {
  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;
  private video: HTMLVideoElement | null = null;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.context = this.canvas.getContext('2d')!;
  }

  async extractFrames(
    videoUrl: string,
    options: FrameExtractionOptions = {}
  ): Promise<VideoFrame[]> {
    const {
      frameRate = 1,
      maxFrames = 10,
      quality = 0.8,
      maxWidth = 1280,
      maxHeight = 720
    } = options;

    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.preload = 'metadata';

      const frames: VideoFrame[] = [];
      let currentFrame = 0;
      const interval = 1 / frameRate;

      video.onloadedmetadata = () => {
        const duration = video.duration;
        const totalFramesToExtract = Math.min(maxFrames, Math.floor(duration * frameRate));
        
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

        this.canvas.width = videoWidth;
        this.canvas.height = videoHeight;

        const extractFrame = () => {
          if (currentFrame >= totalFramesToExtract) {
            resolve(frames);
            return;
          }

          const timestamp = currentFrame * interval;
          video.currentTime = Math.min(timestamp, duration - 0.1);
        };

        video.onseeked = () => {
          try {
            this.context.drawImage(video, 0, 0, this.canvas.width, this.canvas.height);
            const dataUrl = this.canvas.toDataURL('image/jpeg', quality);
            
            frames.push({
              dataUrl,
              timestamp: video.currentTime,
              width: this.canvas.width,
              height: this.canvas.height,
              size: dataUrl.length
            });

            currentFrame++;
            setTimeout(extractFrame, 100); // Small delay to ensure frame is processed
          } catch (error) {
            console.error('Error extracting frame:', error);
            currentFrame++;
            if (currentFrame < totalFramesToExtract) {
              setTimeout(extractFrame, 100);
            } else {
              resolve(frames);
            }
          }
        };

        video.onerror = () => {
          reject(new Error('Video load error'));
        };

        extractFrame();
      };

      video.src = videoUrl;
      this.video = video;
    });
  }

  cleanup() {
    if (this.video) {
      this.video.src = '';
      this.video = null;
    }
  }
}
