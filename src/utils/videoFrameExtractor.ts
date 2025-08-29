export interface VideoFrame {
  timestamp: number;
  canvas: HTMLCanvasElement;
  frameData?: string; // Add missing property
  frameNumber?: number; // Add missing property
}

export class VideoFrameExtractor {
  private videoUrl: string;
  private interval: number;
  private frames: VideoFrame[] = [];
  private videoElement: HTMLVideoElement | null = null;

  constructor(videoUrl: string, interval: number) {
    this.videoUrl = videoUrl;
    this.interval = interval;
  }

  public async extractFrames(): Promise<VideoFrame[]> {
    return new Promise((resolve, reject) => {
      this.videoElement = document.createElement('video');
      this.videoElement.src = this.videoUrl;
      this.videoElement.crossOrigin = "anonymous"; // Important for CORS if video is from another domain
      this.videoElement.muted = true; // Some browsers require muted to allow programmatic access
      this.videoElement.style.display = 'none'; // Hide the video element

      document.body.appendChild(this.videoElement);

      this.videoElement.addEventListener('loadedmetadata', () => {
        this.videoElement!.currentTime = 0;
      });

      this.videoElement.addEventListener('seeked', async () => {
        if (!this.videoElement) return;

        const canvas = document.createElement('canvas');
        canvas.width = this.videoElement.videoWidth;
        canvas.height = this.videoElement.videoHeight;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          ctx.drawImage(this.videoElement, 0, 0, canvas.width, canvas.height);
          this.frames.push({
            timestamp: this.videoElement.currentTime,
            canvas: canvas
          });
        }

        if (this.videoElement.currentTime >= this.videoElement.duration) {
          document.body.removeChild(this.videoElement);
          this.videoElement = null;
          resolve(this.frames);
          return;
        }

        this.videoElement.currentTime += this.interval;
      });

      this.videoElement.addEventListener('error', (error) => {
        console.error("Video loading error:", error);
        document.body.removeChild(this.videoElement!);
        this.videoElement = null;
        reject(error);
      });

      this.videoElement.play().catch(error => {
        console.error("Autoplay was prevented:", error);
        reject(error);
      });
    });
  }
}
