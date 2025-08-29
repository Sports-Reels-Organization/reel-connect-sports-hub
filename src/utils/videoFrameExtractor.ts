
export interface VideoFrame {
  timestamp: number;
  canvas: HTMLCanvasElement;
  frameData?: string;
  frameNumber?: number;
}

export interface VideoExtractionOptions {
  frameRate?: number;
  maxFrames?: number;
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
}

export class VideoFrameExtractor {
  private videoElement: HTMLVideoElement | null = null;
  private frames: VideoFrame[] = [];

  constructor() {
    // No parameters needed for constructor
  }

  public async extractFrames(videoUrl: string, options: VideoExtractionOptions = {}): Promise<VideoFrame[]> {
    const {
      frameRate = 1,
      maxFrames = 30,
      quality = 0.8,
      maxWidth = 800,
      maxHeight = 600
    } = options;

    return new Promise((resolve, reject) => {
      this.videoElement = document.createElement('video');
      this.videoElement.src = videoUrl;
      this.videoElement.crossOrigin = "anonymous";
      this.videoElement.muted = true;
      this.videoElement.style.display = 'none';

      document.body.appendChild(this.videoElement);

      const interval = 1 / frameRate;
      this.frames = [];

      this.videoElement.addEventListener('loadedmetadata', () => {
        if (this.videoElement) {
          this.videoElement.currentTime = 0;
        }
      });

      this.videoElement.addEventListener('seeked', async () => {
        if (!this.videoElement) return;

        const canvas = document.createElement('canvas');
        const aspectRatio = this.videoElement.videoWidth / this.videoElement.videoHeight;
        
        if (this.videoElement.videoWidth > maxWidth) {
          canvas.width = maxWidth;
          canvas.height = maxWidth / aspectRatio;
        } else if (this.videoElement.videoHeight > maxHeight) {
          canvas.height = maxHeight;
          canvas.width = maxHeight * aspectRatio;
        } else {
          canvas.width = this.videoElement.videoWidth;
          canvas.height = this.videoElement.videoHeight;
        }

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(this.videoElement, 0, 0, canvas.width, canvas.height);
          
          const frame: VideoFrame = {
            timestamp: this.videoElement.currentTime,
            canvas: canvas,
            frameData: canvas.toDataURL('image/jpeg', quality),
            frameNumber: this.frames.length + 1
          };
          
          this.frames.push(frame);
        }

        if (this.frames.length >= maxFrames || this.videoElement.currentTime >= this.videoElement.duration) {
          this.cleanup();
          resolve(this.frames);
          return;
        }

        this.videoElement.currentTime += interval;
      });

      this.videoElement.addEventListener('error', (error) => {
        console.error("Video loading error:", error);
        this.cleanup();
        reject(error);
      });

      this.videoElement.play().catch(error => {
        console.error("Autoplay was prevented:", error);
        this.cleanup();
        reject(error);
      });
    });
  }

  public cleanup(): void {
    if (this.videoElement && document.body.contains(this.videoElement)) {
      document.body.removeChild(this.videoElement);
    }
    this.videoElement = null;
    this.frames = [];
  }

  // Legacy method for backward compatibility
  public destroy(): void {
    this.cleanup();
  }
}
