
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

export class VideoCompressionService {
  private ffmpeg: FFmpeg | null = null;
  private isLoaded = false;

  async initialize(): Promise<void> {
    if (this.isLoaded) return;

    this.ffmpeg = new FFmpeg();
    
    // Load FFmpeg with progress callback
    await this.ffmpeg.load({
      coreURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.js',
      wasmURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.wasm',
      workerURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.worker.js'
    });

    this.isLoaded = true;
  }

  async compressVideoTo10MB(
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<File> {
    if (!this.ffmpeg) {
      await this.initialize();
    }

    const targetSizeBytes = 10 * 1024 * 1024; // 10MB
    const inputFileName = 'input.mp4';
    const outputFileName = 'output.mp4';

    try {
      // Write input file to FFmpeg filesystem
      await this.ffmpeg!.writeFile(inputFileName, await fetchFile(file));

      // Get video duration and calculate bitrate
      const duration = await this.getVideoDuration(file);
      const targetBitrate = Math.floor((targetSizeBytes * 8) / duration / 1000); // kbps

      // Set progress callback
      if (onProgress) {
        this.ffmpeg!.on('progress', ({ progress }) => {
          onProgress(Math.round(progress * 100));
        });
      }

      // Compress video with calculated bitrate
      await this.ffmpeg!.exec([
        '-i', inputFileName,
        '-c:v', 'libx264',
        '-preset', 'medium',
        '-crf', '28',
        '-b:v', `${Math.min(targetBitrate, 2000)}k`, // Cap at 2Mbps
        '-maxrate', `${Math.min(targetBitrate * 1.5, 3000)}k`,
        '-bufsize', `${Math.min(targetBitrate * 2, 4000)}k`,
        '-c:a', 'aac',
        '-b:a', '128k',
        '-movflags', '+faststart',
        '-y',
        outputFileName
      ]);

      // Read compressed file
      const compressedData = await this.ffmpeg!.readFile(outputFileName);
      const compressedFile = new File(
        [compressedData],
        `compressed_${file.name}`,
        { type: 'video/mp4' }
      );

      // Clean up
      await this.ffmpeg!.deleteFile(inputFileName);
      await this.ffmpeg!.deleteFile(outputFileName);

      return compressedFile;
    } catch (error) {
      console.error('Video compression failed:', error);
      throw new Error('Failed to compress video');
    }
  }

  private async getVideoDuration(file: File): Promise<number> {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        resolve(video.duration);
      };

      video.src = URL.createObjectURL(file);
    });
  }

  async generateThumbnail(file: File, timeInSeconds: number = 1): Promise<string> {
    if (!this.ffmpeg) {
      await this.initialize();
    }

    const inputFileName = 'input.mp4';
    const outputFileName = 'thumbnail.jpg';

    try {
      await this.ffmpeg!.writeFile(inputFileName, await fetchFile(file));

      await this.ffmpeg!.exec([
        '-i', inputFileName,
        '-ss', timeInSeconds.toString(),
        '-vframes', '1',
        '-q:v', '2',
        '-y',
        outputFileName
      ]);

      const thumbnailData = await this.ffmpeg!.readFile(outputFileName);
      const blob = new Blob([thumbnailData], { type: 'image/jpeg' });
      
      await this.ffmpeg!.deleteFile(inputFileName);
      await this.ffmpeg!.deleteFile(outputFileName);

      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('Thumbnail generation failed:', error);
      throw new Error('Failed to generate thumbnail');
    }
  }
}
