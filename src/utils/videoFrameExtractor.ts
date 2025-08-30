
export interface VideoFrame {
  timestamp: number;
  frameData: string; // Base64 encoded frame
  frameNumber: number;
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
  private ctx: CanvasRenderingContext2D;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
  }

  async extractFrames(
    videoUrl: string,
    options: FrameExtractionOptions = {}
  ): Promise<VideoFrame[]> {
    const {
      frameRate = 1,
      maxFrames = 30,
      quality = 0.8,
      maxWidth = 800,
      maxHeight = 600
    } = options;

    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.muted = true;
      video.playsInline = true;

      video.onloadedmetadata = () => {
        try {
          const frames: VideoFrame[] = [];
          const duration = video.duration;
          const frameInterval = duration / maxFrames;
          let frameCount = 0;

          const extractFrame = (currentTime: number) => {
            if (frameCount >= maxFrames) {
              resolve(frames);
              return;
            }

            video.currentTime = currentTime;
          };

          video.onseeked = () => {
            try {
              // Set canvas dimensions
              const aspectRatio = video.videoWidth / video.videoHeight;
              let width = maxWidth;
              let height = maxHeight;

              if (aspectRatio > 1) {
                height = width / aspectRatio;
              } else {
                width = height * aspectRatio;
              }

              this.canvas.width = width;
              this.canvas.height = height;

              // Draw video frame to canvas
              this.ctx.drawImage(video, 0, 0, width, height);

              // Convert to base64 with quality setting
              const frameData = this.canvas.toDataURL('image/jpeg', quality);

              frames.push({
                timestamp: currentTime,
                frameData: frameData,
                frameNumber: frameCount
              });

              frameCount++;
              currentTime += frameInterval;

              if (currentTime < duration && frameCount < maxFrames) {
                extractFrame(currentTime);
              } else {
                resolve(frames);
              }
            } catch (error) {
              reject(error);
            }
          };

          // Start frame extraction
          extractFrame(0);
        } catch (error) {
          reject(error);
        }
      };

      video.onerror = () => {
        reject(new Error('Failed to load video'));
      };

      video.src = videoUrl;
    });
  }

  async extractFrameAtTime(
    videoUrl: string,
    timestamp: number,
    options: Omit<FrameExtractionOptions, 'frameRate' | 'maxFrames'> = {}
  ): Promise<VideoFrame | null> {
    const { quality = 0.8, maxWidth = 800, maxHeight = 600 } = options;

    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.muted = true;
      video.playsInline = true;

      video.onloadedmetadata = () => {
        try {
          video.currentTime = timestamp;
        } catch (error) {
          reject(error);
        }
      };

      video.onseeked = () => {
        try {
          // Set canvas dimensions
          const aspectRatio = video.videoWidth / video.videoHeight;
          let width = maxWidth;
          let height = maxHeight;

          if (aspectRatio > 1) {
            height = width / aspectRatio;
          } else {
            width = height * aspectRatio;
          }

          this.canvas.width = width;
          this.canvas.height = height;

          // Draw video frame to canvas
          this.ctx.drawImage(video, 0, 0, width, height);

          // Convert to base64 with quality setting
          const frameData = this.canvas.toDataURL('image/jpeg', quality);

          resolve({
            timestamp: timestamp,
            frameData: frameData,
            frameNumber: 0
          });
        } catch (error) {
          reject(error);
        }
      };

      video.onerror = () => {
        reject(new Error('Failed to load video'));
      };

      video.src = videoUrl;
    });
  }
}
