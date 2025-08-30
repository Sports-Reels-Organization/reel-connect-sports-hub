
export interface VideoFrame {
  timestamp: number;
  blob: Blob;
  url: string;
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
  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;
  private video: HTMLVideoElement;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.context = this.canvas.getContext('2d')!;
    this.video = document.createElement('video');
    this.video.crossOrigin = 'anonymous';
    this.video.muted = true;
  }

  async extractFrames(videoUrl: string, options: FrameExtractionOptions = {}): Promise<VideoFrame[]> {
    const {
      frameRate = 1, // Extract 1 frame per second
      maxFrames = 30,
      quality = 0.8,
      maxWidth = 640,
      maxHeight = 480
    } = options;

    return new Promise((resolve, reject) => {
      const frames: VideoFrame[] = [];
      let frameCount = 0;
      
      this.video.onloadedmetadata = () => {
        const duration = this.video.duration;
        const interval = Math.max(1 / frameRate, duration / maxFrames);
        const timestamps = [];
        
        for (let t = 0; t < duration && timestamps.length < maxFrames; t += interval) {
          timestamps.push(t);
        }

        this.extractFramesAtTimestamps(timestamps, quality, maxWidth, maxHeight)
          .then(resolve)
          .catch(reject);
      };

      this.video.onerror = () => {
        reject(new Error('Failed to load video'));
      };

      this.video.src = videoUrl;
      this.video.load();
    });
  }

  private async extractFramesAtTimestamps(
    timestamps: number[], 
    quality: number, 
    maxWidth: number, 
    maxHeight: number
  ): Promise<VideoFrame[]> {
    const frames: VideoFrame[] = [];

    for (const timestamp of timestamps) {
      try {
        const frame = await this.extractFrameAtTime(timestamp, quality, maxWidth, maxHeight);
        frames.push(frame);
      } catch (error) {
        console.warn(`Failed to extract frame at ${timestamp}s:`, error);
      }
    }

    return frames;
  }

  public async extractFrameAtTime(
    timestamp: number, 
    quality: number = 0.8, 
    maxWidth: number = 640, 
    maxHeight: number = 480
  ): Promise<VideoFrame> {
    return new Promise((resolve, reject) => {
      const handleSeeked = () => {
        try {
          // Calculate dimensions maintaining aspect ratio
          const { videoWidth, videoHeight } = this.video;
          const aspectRatio = videoWidth / videoHeight;
          
          let { width, height } = this.calculateDimensions(
            videoWidth, 
            videoHeight, 
            maxWidth, 
            maxHeight
          );

          // Set canvas size
          this.canvas.width = width;
          this.canvas.height = height;

          // Draw video frame to canvas
          this.context.drawImage(this.video, 0, 0, width, height);

          // Convert to blob
          this.canvas.toBlob((blob) => {
            if (blob) {
              const frame: VideoFrame = {
                timestamp,
                blob,
                url: URL.createObjectURL(blob),
                width,
                height
              };
              resolve(frame);
            } else {
              reject(new Error('Failed to create blob from canvas'));
            }
          }, 'image/jpeg', quality);

        } catch (error) {
          reject(error);
        } finally {
          this.video.removeEventListener('seeked', handleSeeked);
        }
      };

      this.video.addEventListener('seeked', handleSeeked);
      this.video.currentTime = timestamp;
    });
  }

  private calculateDimensions(
    originalWidth: number, 
    originalHeight: number, 
    maxWidth: number, 
    maxHeight: number
  ) {
    const aspectRatio = originalWidth / originalHeight;
    
    let width = originalWidth;
    let height = originalHeight;

    // Scale down if necessary
    if (width > maxWidth) {
      width = maxWidth;
      height = width / aspectRatio;
    }

    if (height > maxHeight) {
      height = maxHeight;
      width = height * aspectRatio;
    }

    return {
      width: Math.round(width),
      height: Math.round(height)
    };
  }

  destroy() {
    // Clean up resources
    if (this.video.src) {
      URL.revokeObjectURL(this.video.src);
    }
    this.video.src = '';
    this.canvas.width = 0;
    this.canvas.height = 0;
  }
}
