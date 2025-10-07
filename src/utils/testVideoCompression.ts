// Test utility for video compression services
// This can be used to test compression performance

export const testVideoCompression = async (file: File) => {
  console.log('🧪 Testing video compression...');
  
  try {
    // Import the fast compression service
    const { fastVideoCompressionService } = await import('@/services/fastVideoCompressionServiceV2');
    
    const startTime = performance.now();
    
    const result = await fastVideoCompressionService.compressVideo(file, {
      targetSizeMB: 5,
      quality: 'medium',
      maxResolution: 1280,
      frameRate: 30,
      onProgress: (progress) => {
        console.log(`Compression progress: ${progress}%`);
      }
    });
    
    const endTime = performance.now();
    const totalTime = endTime - startTime;
    
    console.log('✅ Compression test completed!');
    console.log(`📊 Original size: ${result.originalSizeMB.toFixed(2)}MB`);
    console.log(`📊 Compressed size: ${result.compressedSizeMB.toFixed(2)}MB`);
    console.log(`📊 Compression ratio: ${result.compressionRatio.toFixed(2)}x`);
    console.log(`⏱️ Processing time: ${totalTime.toFixed(0)}ms`);
    console.log(`🔧 Method used: ${result.method}`);
    
    return result;
  } catch (error) {
    console.error('❌ Compression test failed:', error);
    throw error;
  }
};

// Export for use in components
export default testVideoCompression;
