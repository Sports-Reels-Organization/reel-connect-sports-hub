export interface VideoFrame {
  timestamp: number;
  frameData: string; // Base64 encoded frame
  frameNumber: number;
  width: number;
  height: number;
}

export interface FrameExtractionOptions {
  frameRate: number; // Frames per second to extract
  maxFrames: number; // Maximum number of frames to extract
  quality: number; // JPEG quality (0-1)
  maxWidth?: number; // Maximum frame width
  maxHeight?: number; // Maximum frame height
}

export class VideoFrameExtractor {
  private video: HTMLVideoElement;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor() {
    this.video = document.createElement('video');
    this.video.crossOrigin = 'anonymous';
    this.video.muted = true;
    this.video.playsInline = true;
    
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
  }

  async extractFrames(
    videoUrl: string, 
    options: FrameExtractionOptions = { frameRate: 1, maxFrames: 30, quality: 0.8 }
  ): Promise<VideoFrame[]> {
    try {
      // Load video
      await this.loadVideo(videoUrl);
      
      const frames: VideoFrame[] = [];
      const duration = this.video.duration;
      const frameInterval = 1 / options.frameRate;
      const totalFrames = Math.min(
        Math.floor(duration * options.frameRate),
        options.maxFrames
      );

      // Extract frames at specified intervals
      for (let i = 0; i < totalFrames; i++) {
        const timestamp = i * frameInterval;
        
        if (timestamp > duration) break;

        const frame = await this.extractFrameAtTime(timestamp, options);
        if (frame) {
          frames.push({
            ...frame,
            frameNumber: i,
            timestamp
          });
        }
      }

      return frames;

    } catch (error) {
      console.error('Error extracting video frames:', error);
      throw error;
    }
  }

  private async loadVideo(videoUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.video.onloadedmetadata = () => resolve();
      this.video.onerror = () => reject(new Error('Failed to load video'));
      this.video.src = videoUrl;
    });
  }

  private async extractFrameAtTime(
    timestamp: number, 
    options: FrameExtractionOptions
  ): Promise<Omit<VideoFrame, 'timestamp' | 'frameNumber'> | null> {
    return new Promise((resolve) => {
      this.video.onseeked = () => {
        try {
          // Set canvas dimensions
          const { width, height } = this.video;
          let targetWidth = width;
          let targetHeight = height;

          // Resize if max dimensions specified
          if (options.maxWidth && width > options.maxWidth) {
            targetWidth = options.maxWidth;
            targetHeight = (height * options.maxWidth) / width;
          }
          if (options.maxHeight && targetHeight > options.maxHeight) {
            targetHeight = options.maxHeight;
            targetWidth = (targetWidth * options.maxHeight) / targetHeight;
          }

          this.canvas.width = targetWidth;
          this.canvas.height = targetHeight;

          // Draw video frame to canvas
          this.ctx.drawImage(this.video, 0, 0, targetWidth, targetHeight);

          // Convert to base64
          const frameData = this.canvas.toDataURL('image/jpeg', options.quality);

          resolve({
            frameData,
            width: targetWidth,
            height: targetHeight
          });

        } catch (error) {
          console.error('Error extracting frame:', error);
          resolve(null);
        }
      };

      this.video.currentTime = timestamp;
    });
  }

  // Extract frames from specific time ranges
  async extractFramesFromRange(
    videoUrl: string,
    startTime: number,
    endTime: number,
    options: FrameExtractionOptions = { frameRate: 2, maxFrames: 60, quality: 0.8 }
  ): Promise<VideoFrame[]> {
    try {
      await this.loadVideo(videoUrl);
      
      const frames: VideoFrame[] = [];
      const frameInterval = 1 / options.frameRate;
      const totalFrames = Math.min(
        Math.floor((endTime - startTime) * options.frameRate),
        options.maxFrames
      );

      for (let i = 0; i < totalFrames; i++) {
        const timestamp = startTime + (i * frameInterval);
        
        if (timestamp > endTime) break;

        const frame = await this.extractFrameAtTime(timestamp, options);
        if (frame) {
          frames.push({
            ...frame,
            frameNumber: i,
            timestamp
          });
        }
      }

      return frames;

    } catch (error) {
      console.error('Error extracting frames from range:', error);
      throw error;
    }
  }

  // Extract key frames based on scene changes
  async extractKeyFrames(
    videoUrl: string,
    options: FrameExtractionOptions = { frameRate: 0.5, maxFrames: 20, quality: 0.9 }
  ): Promise<VideoFrame[]> {
    try {
      await this.loadVideo(videoUrl);
      
      const frames: VideoFrame[] = [];
      const duration = this.video.duration;
      const frameInterval = 1 / options.frameRate;
      const totalFrames = Math.min(
        Math.floor(duration * options.frameRate),
        options.maxFrames
      );

      // Extract frames at longer intervals for key moments
      for (let i = 0; i < totalFrames; i++) {
        const timestamp = i * frameInterval;
        
        if (timestamp > duration) break;

        const frame = await this.extractFrameAtTime(timestamp, options);
        if (frame) {
          frames.push({
            ...frame,
            frameNumber: i,
            timestamp
          });
        }
      }

      return frames;

    } catch (error) {
      console.error('Error extracting key frames:', error);
      throw error;
    }
  }

  // Clean up resources
  destroy(): void {
    this.video.remove();
    this.canvas.remove();
  }

  // Get video metadata
  async getVideoMetadata(videoUrl: string): Promise<{
    duration: number;
    width: number;
    height: number;
    fps?: number;
  }> {
    try {
      await this.loadVideo(videoUrl);
      
      return {
        duration: this.video.duration,
        width: this.video.videoWidth,
        height: this.video.videoHeight
      };
    } catch (error) {
      console.error('Error getting video metadata:', error);
      throw error;
    }
  }
}

// Utility function to create a video thumbnail
export async function createVideoThumbnail(
  videoUrl: string, 
  timestamp: number = 0,
  options: { width?: number; height?: number; quality?: number } = {}
): Promise<string> {
  const extractor = new VideoFrameExtractor();
  
  try {
    const frame = await extractor.extractFrameAtTime(timestamp, {
      frameRate: 1,
      maxFrames: 1,
      quality: options.quality || 0.8,
      maxWidth: options.width,
      maxHeight: options.height
    });

    return frame?.frameData || '';
  } finally {
    extractor.destroy();
  }
}

// Utility function to extract frames from a video file
export async function extractFramesFromFile(
  file: File,
  options: FrameExtractionOptions = { frameRate: 1, maxFrames: 30, quality: 0.8 }
): Promise<VideoFrame[]> {
  const extractor = new VideoFrameExtractor();
  
  try {
    const videoUrl = URL.createObjectURL(file);
    const frames = await extractor.extractFrames(videoUrl, options);
    URL.revokeObjectURL(videoUrl);
    return frames;
  } finally {
    extractor.destroy();
  }
}
