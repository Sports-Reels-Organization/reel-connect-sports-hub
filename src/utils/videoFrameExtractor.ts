
export interface VideoFrame {
  timestamp: number;
  imageData: string;
  width: number;
  height: number;
}

export interface FrameExtractionOptions {
  frameRate?: number;
  maxFrames?: number;
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
}

export class VideoFrameExtractor {
  private video: HTMLVideoElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private context: CanvasRenderingContext2D | null = null;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.context = this.canvas.getContext('2d');
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
      this.video = document.createElement('video');
      this.video.crossOrigin = 'anonymous';
      this.video.preload = 'metadata';

      this.video.onloadedmetadata = async () => {
        if (!this.video || !this.canvas || !this.context) {
          reject(new Error('Video elements not initialized'));
          return;
        }

        const duration = this.video.duration;
        const interval = Math.max(1 / frameRate, duration / maxFrames);
        const frames: VideoFrame[] = [];

        // Calculate canvas dimensions while maintaining aspect ratio
        const aspectRatio = this.video.videoWidth / this.video.videoHeight;
        let canvasWidth = Math.min(maxWidth, this.video.videoWidth);
        let canvasHeight = canvasWidth / aspectRatio;

        if (canvasHeight > maxHeight) {
          canvasHeight = maxHeight;
          canvasWidth = canvasHeight * aspectRatio;
        }

        this.canvas.width = canvasWidth;
        this.canvas.height = canvasHeight;

        try {
          for (let time = 0; time < duration && frames.length < maxFrames; time += interval) {
            const frame = await this.extractFrameAtTime(time, quality);
            if (frame) {
              frames.push(frame);
            }
          }
          resolve(frames);
        } catch (error) {
          reject(error);
        }
      };

      this.video.onerror = () => {
        reject(new Error('Failed to load video'));
      };

      this.video.src = videoUrl;
    });
  }

  private extractFrameAtTime(timestamp: number, quality: number): Promise<VideoFrame | null> {
    return new Promise((resolve) => {
      if (!this.video || !this.canvas || !this.context) {
        resolve(null);
        return;
      }

      this.video.currentTime = timestamp;

      this.video.onseeked = () => {
        if (!this.video || !this.canvas || !this.context) {
          resolve(null);
          return;
        }

        try {
          this.context.drawImage(
            this.video,
            0, 0,
            this.video.videoWidth, this.video.videoHeight,
            0, 0,
            this.canvas.width, this.canvas.height
          );

          const imageData = this.canvas.toDataURL('image/jpeg', quality);
          
          resolve({
            timestamp,
            imageData,
            width: this.canvas.width,
            height: this.canvas.height
          });
        } catch (error) {
          console.error('Error extracting frame:', error);
          resolve(null);
        }
      };

      // Fallback timeout
      setTimeout(() => {
        resolve(null);
      }, 1000);
    });
  }

  destroy() {
    if (this.video) {
      this.video.src = '';
      this.video = null;
    }
    this.canvas = null;
    this.context = null;
  }
}
