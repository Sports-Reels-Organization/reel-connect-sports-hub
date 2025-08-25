import { supabase } from '@/integrations/supabase/client';

export interface CompressionResult {
  originalFile: File;
  compressedFile: File;
  originalSizeMB: number;
  compressedSizeMB: number;
  compressionRatio: number;
  quality: 'high' | 'medium' | 'low';
  processingTime: number;
  thumbnailBlob?: Blob;
}

export interface CompressionOptions {
  targetSizeMB: number;
  maxQuality: 'high' | 'medium' | 'low';
  maintainAspectRatio: boolean;
  generateThumbnail: boolean;
}

export class EnhancedVideoCompressionService {
  private defaultOptions: CompressionOptions = {
    targetSizeMB: 10,
    maxQuality: 'high',
    maintainAspectRatio: true,
    generateThumbnail: true
  };

  /**
   * Compress video to target size with quality optimization
   */
  async compressVideo(
    file: File,
    options: Partial<CompressionOptions> = {}
  ): Promise<CompressionResult> {
    const startTime = Date.now();
    const finalOptions = { ...this.defaultOptions, ...options };
    
    console.log(`Starting video compression for ${file.name}`);
    console.log(`Target size: ${finalOptions.targetSizeMB}MB`);
    console.log(`Original size: ${(file.size / (1024 * 1024)).toFixed(2)}MB`);

    try {
      // Log compression start
      await this.logCompressionStart(file);

      // Generate thumbnail if requested
      let thumbnailBlob: Blob | undefined;
      if (finalOptions.generateThumbnail) {
        thumbnailBlob = await this.generateThumbnail(file);
      }

      // Compress video with progressive quality reduction
      const compressedFile = await this.compressWithQualityProgression(
        file,
        finalOptions.targetSizeMB,
        finalOptions.maxQuality
      );

      const processingTime = Date.now() - startTime;
      const originalSizeMB = file.size / (1024 * 1024);
      const compressedSizeMB = compressedFile.size / (1024 * 1024);
      const compressionRatio = 1 - (compressedSizeMB / originalSizeMB);

      const result: CompressionResult = {
        originalFile: file,
        compressedFile,
        originalSizeMB,
        compressedSizeMB,
        compressionRatio,
        quality: this.determineQuality(compressionRatio),
        processingTime,
        thumbnailBlob
      };

      // Log compression completion
      await this.logCompressionComplete(result);

      console.log(`Compression completed successfully:`);
      console.log(`- Original: ${originalSizeMB.toFixed(2)}MB`);
      console.log(`- Compressed: ${compressedSizeMB.toFixed(2)}MB`);
      console.log(`- Ratio: ${(compressionRatio * 100).toFixed(1)}%`);
      console.log(`- Quality: ${result.quality}`);
      console.log(`- Time: ${processingTime}ms`);

      return result;

    } catch (error) {
      console.error('Video compression failed:', error);
      await this.logCompressionError(file, error);
      throw new Error(`Video compression failed: ${error.message}`);
    }
  }

  /**
   * Progressive quality compression to achieve target size
   */
  private async compressWithQualityProgression(
    file: File,
    targetSizeMB: number,
    maxQuality: 'high' | 'medium' | 'low'
  ): Promise<File> {
    const targetSizeBytes = targetSizeMB * 1024 * 1024;
    
    try {
      // Try advanced compression first
      const qualityLevels = this.getQualityLevels(maxQuality);
      
      for (const quality of qualityLevels) {
        try {
          console.log(`Attempting compression with quality: ${quality.name}`);
          
          const compressed = await this.compressWithSettings(file, quality);
          
          if (compressed.size <= targetSizeBytes) {
            console.log(`Target size achieved with quality: ${quality.name}`);
            return compressed;
          }
          
          console.log(`Quality ${quality.name} resulted in ${(compressed.size / (1024 * 1024)).toFixed(2)}MB`);
          
        } catch (error) {
          console.warn(`Compression with quality ${quality.name} failed:`, error);
          continue;
        }
      }

      // If all quality levels fail, use the lowest quality as fallback
      console.log('Using fallback compression with lowest quality');
      return await this.compressWithSettings(file, qualityLevels[qualityLevels.length - 1]);
      
    } catch (error) {
      console.warn('Advanced compression failed, using simple fallback:', error);
      return await this.simpleCompressionFallback(file, targetSizeMB);
    }
  }

  /**
   * Compress video with specific quality settings
   */
  private async compressWithSettings(file: File, quality: any): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      const video = document.createElement('video');
      
      video.onloadedmetadata = () => {
        // Calculate dimensions based on quality
        const { width, height } = this.calculateDimensions(
          video.videoWidth,
          video.videoHeight,
          quality.scale
        );
        
        canvas.width = width;
        canvas.height = height;
        
        // Set up video processing
        video.currentTime = 0;
        video.play();
        
        const frames: ImageData[] = [];
        const frameRate = quality.frameRate || 30;
        const duration = video.duration;
        const totalFrames = Math.floor(duration * frameRate);
        let currentFrame = 0;
        
        video.onseeked = () => {
          if (ctx) {
            ctx.drawImage(video, 0, 0, width, height);
            const imageData = ctx.getImageData(0, 0, width, height);
            frames.push(imageData);
            currentFrame++;
            
            if (currentFrame < totalFrames) {
              video.currentTime = (currentFrame / frameRate);
            } else {
              // All frames captured, create compressed video
              this.createCompressedVideo(frames, frameRate, quality, resolve, reject);
            }
          }
        };
      };
      
      video.onerror = () => reject(new Error('Video loading failed'));
      video.src = URL.createObjectURL(file);
    });
  }

  /**
   * Create compressed video from captured frames
   */
  private async createCompressedVideo(
    frames: ImageData[],
    frameRate: number,
    quality: any,
    resolve: (file: File) => void,
    reject: (error: Error) => void
  ) {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }
      
      canvas.width = frames[0].width;
      canvas.height = frames[0].height;
      
      // Create MediaRecorder for video creation
      const stream = canvas.captureStream(frameRate);
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: quality.bitrate * 1000
      });
      
      const chunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const file = new File([blob], 'compressed_video.webm', { type: 'video/webm' });
        resolve(file);
      };
      
      mediaRecorder.start();
      
      // Render frames
      let frameIndex = 0;
      const renderFrame = () => {
        if (frameIndex < frames.length) {
          ctx.putImageData(frames[frameIndex], 0, 0);
          frameIndex++;
          setTimeout(renderFrame, 1000 / frameRate);
        } else {
          mediaRecorder.stop();
        }
      };
      
      renderFrame();
      
    } catch (error) {
      reject(new Error(`Video creation failed: ${error.message}`));
    }
  }

  /**
   * Calculate optimal dimensions for compression
   */
  private calculateDimensions(originalWidth: number, originalHeight: number, scale: number) {
    const aspectRatio = originalWidth / originalHeight;
    const newWidth = Math.floor(originalWidth * scale);
    const newHeight = Math.floor(newWidth / aspectRatio);
    
    return { width: newWidth, height: newHeight };
  }

  /**
   * Get quality levels for progressive compression
   */
  private getQualityLevels(maxQuality: 'high' | 'medium' | 'low') {
    const allLevels = [
      { name: 'ultra', scale: 1.0, frameRate: 30, bitrate: 8000 },
      { name: 'high', scale: 0.8, frameRate: 30, bitrate: 6000 },
      { name: 'medium', scale: 0.6, frameRate: 25, bitrate: 4000 },
      { name: 'low', scale: 0.4, frameRate: 20, bitrate: 2000 },
      { name: 'minimum', scale: 0.3, frameRate: 15, bitrate: 1000 }
    ];
    
    const maxQualityIndex = allLevels.findIndex(level => level.name === maxQuality);
    return allLevels.slice(maxQualityIndex);
  }

  /**
   * Determine quality level based on compression ratio
   */
  private determineQuality(compressionRatio: number): 'high' | 'medium' | 'low' {
    if (compressionRatio < 0.3) return 'high';
    if (compressionRatio < 0.6) return 'medium';
    return 'low';
  }

  /**
   * Generate thumbnail from video
   */
  async generateThumbnail(file: File, timeOffset: number = 5): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }
      
      video.onloadedmetadata = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        video.currentTime = Math.min(timeOffset, video.duration);
        video.onseeked = () => {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Thumbnail generation failed'));
            }
          }, 'image/jpeg', 0.8);
        };
      };
      
      video.onerror = () => reject(new Error('Video loading failed'));
      video.src = URL.createObjectURL(file);
    });
  }

  /**
   * Log compression start to database
   */
  private async logCompressionStart(file: File): Promise<void> {
    // Temporarily disable database logging until migration is run
    console.log('Database logging temporarily disabled - compression starting');
    return;
    
    // TODO: Re-enable when migration is run
    /*
    try {
      // Check if the table exists before trying to log
      const { data: tableExists } = await supabase
        .from('video_compression_logs')
        .select('id')
        .limit(1);

      if (tableExists !== null) {
        const { error } = await supabase
          .from('video_compression_logs')
          .insert({
            original_size_mb: file.size / (1024 * 1024),
            compression_status: 'processing',
            target_size_mb: this.defaultOptions.targetSizeMB,
            compression_algorithm: 'h264'
          });

        if (error) {
          console.warn('Failed to log compression start:', error);
        }
      }
    } catch (error) {
      // Table doesn't exist yet, skip logging
      console.log('Compression logging table not available yet');
    }
    */
  }

  /**
   * Log compression completion to database
   */
  private async logCompressionComplete(result: CompressionResult): Promise<void> {
    // Temporarily disable database logging until migration is run
    console.log('Database logging temporarily disabled - compression completed');
    return;
    
    // TODO: Re-enable when migration is run
    /*
    try {
      // Check if the table exists before trying to log
      const { data: tableExists } = await supabase
        .from('video_compression_logs')
        .select('id')
        .limit(1);

      if (tableExists !== null) {
        const { error } = await supabase
          .from('video_compression_logs')
          .update({
            compressed_size_mb: result.compressedSizeMB,
            compression_ratio: result.compressionRatio,
            compression_status: 'completed',
            processing_time: result.processingTime
          })
          .eq('original_size_mb', result.originalSizeMB)
          .eq('compression_status', 'processing');

        if (error) {
          console.warn('Failed to log compression completion:', error);
        }
      }
    } catch (error) {
      // Table doesn't exist yet, skip logging
      console.log('Compression logging table not available yet');
    }
    */
  }

  /**
   * Log compression error to database
   */
  private async logCompressionError(file: File, error: any): Promise<void> {
    // Temporarily disable database logging until migration is run
    console.log('Database logging temporarily disabled - compression error:', error.message);
    return;
    
    // TODO: Re-enable when migration is run
    /*
    try {
      // Check if the table exists before trying to log
      const { data: tableExists } = await supabase
        .from('video_compression_logs')
        .select('id')
        .limit(1);

      if (tableExists !== null) {
        const { error: dbError } = await supabase
          .from('video_compression_logs')
          .update({
            compression_status: 'failed',
            error_message: error.message
          })
          .eq('original_size_mb', file.size / (1024 * 1024))
          .eq('compression_status', 'processing');

        if (dbError) {
          console.warn('Failed to log compression error:', dbError);
        }
      }
    } catch (dbError) {
      // Table doesn't exist yet, skip logging
      console.log('Compression logging table not available yet');
    }
    */
  }

  /**
   * Get compression statistics for a video
   */
  async getCompressionStats(videoId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('video_compression_logs')
        .select('*')
        .eq('video_id', videoId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;
      return data?.[0] || null;
    } catch (error) {
      console.error('Failed to get compression stats:', error);
      return null;
    }
  }

  /**
   * Validate video file before compression
   */
  validateVideoFile(file: File): { isValid: boolean; error?: string } {
    // Check file type
    if (!file.type.startsWith('video/')) {
      return { isValid: false, error: 'File must be a video' };
    }

    // Check file size (max 2GB)
    const maxSize = 2 * 1024 * 1024 * 1024;
    if (file.size > maxSize) {
      return { isValid: false, error: 'File size must be less than 2GB' };
    }

    // Check if already compressed
    if (file.size <= this.defaultOptions.targetSizeMB * 1024 * 1024) {
      return { isValid: false, error: 'File is already within target size' };
    }

    return { isValid: true };
  }

  /**
   * Simple compression fallback when advanced compression fails
   */
  private async simpleCompressionFallback(file: File, targetSizeMB: number): Promise<File> {
    console.log('Using simple compression fallback');
    
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      video.onloadedmetadata = () => {
        // Reduce dimensions for compression
        const maxWidth = 640;
        const maxHeight = 480;
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
          mimeType: 'video/webm;codecs=vp8',
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
          
          console.log(`Simple compression completed: ${(compressedFile.size / (1024 * 1024)).toFixed(2)}MB`);
          resolve(compressedFile);
        };

        mediaRecorder.onerror = (event) => {
          reject(new Error('MediaRecorder error: ' + event));
        };

        let currentTime = 0;
        const frameRate = 15; // Reduced frame rate
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

      video.onerror = () => reject(new Error('Video loading failed'));
      video.src = URL.createObjectURL(file);
    });
  }

  /**
   * Estimate compression time based on file size
   */
  estimateCompressionTime(fileSizeMB: number): number {
    // Rough estimation: 1 second per MB for processing
    const baseTime = fileSizeMB;
    const qualityFactor = 1.5; // Higher quality takes longer
    return Math.ceil(baseTime * qualityFactor);
  }
}

export default EnhancedVideoCompressionService;
