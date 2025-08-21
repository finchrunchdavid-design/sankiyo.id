import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Camera, X, RotateCcw, Check, AlertCircle } from 'lucide-react';

interface SelfieCaptureProps {
  onCapture: (imageData: string) => void;
  onCancel: () => void;
  isOpen: boolean;
}

export const SelfieCapture: React.FC<SelfieCaptureProps> = ({
  onCapture,
  onCancel,
  isOpen
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const initializingRef = useRef(false);
  
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoReady, setVideoReady] = useState(false);

  // Complete cleanup function
  const cleanup = useCallback(() => {
    console.log('🧹 Complete cleanup...');
    
    initializingRef.current = false;
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log(`🛑 Stopped ${track.kind} track`);
      });
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.removeAttribute('src');
      videoRef.current.load();
    }
    
    setVideoReady(false);
    setIsLoading(false);
    setError(null);
  }, []);

  // Initialize camera with proper async handling
  const initializeCamera = useCallback(async () => {
    if (initializingRef.current) {
      console.log('⏳ Already initializing, skipping...');
      return;
    }

    console.log('🎥 Initializing camera...');
    initializingRef.current = true;
    
    // Clean up any existing resources first
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    setIsLoading(true);
    setError(null);
    setVideoReady(false);

    try {
      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640, max: 1280 },
          height: { ideal: 480, max: 720 }
        },
        audio: false
      });

      console.log('✅ Got camera stream');
      
      // Check if component is still mounted and modal is open
      if (!isOpen || !initializingRef.current) {
        console.log('🚫 Component unmounted or modal closed, stopping stream');
        stream.getTracks().forEach(track => track.stop());
        return;
      }

      streamRef.current = stream;

      // Setup video element
      const video = videoRef.current;
      if (!video) {
        console.error('❌ Video element not found');
        stream.getTracks().forEach(track => track.stop());
        setError('Video element tidak ditemukan');
        setIsLoading(false);
        initializingRef.current = false;
        return;
      }

      // Setup video event handlers
      const handleLoadedData = () => {
        console.log('📺 Video loaded data');
        if (video.readyState >= 2) { // HAVE_CURRENT_DATA
          console.log('✅ Video ready to play');
          setVideoReady(true);
          setIsLoading(false);
          initializingRef.current = false;
        }
      };

      const handleCanPlay = () => {
        console.log('▶️ Video can play');
        setVideoReady(true);
        setIsLoading(false);
        initializingRef.current = false;
      };

      const handleError = (e: Event) => {
        console.error('❌ Video error:', e);
        setError('Gagal memuat video dari kamera');
        setIsLoading(false);
        initializingRef.current = false;
      };

      // Remove any existing event listeners
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('error', handleError);

      // Add new event listeners
      video.addEventListener('loadeddata', handleLoadedData);
      video.addEventListener('canplay', handleCanPlay);
      video.addEventListener('error', handleError);

      // Set video source and play
      video.srcObject = stream;
      video.muted = true;
      video.playsInline = true;
      video.autoplay = true;

      // Force play after a short delay
      setTimeout(() => {
        if (video.srcObject && initializingRef.current) {
          video.play().catch(error => {
            console.error('❌ Error playing video:', error);
            setError('Gagal memutar video kamera');
            setIsLoading(false);
            initializingRef.current = false;
          });
        }
      }, 100);

      // Fallback timeout
      setTimeout(() => {
        if (isLoading && initializingRef.current) {
          console.log('⏰ Video loading timeout');
          setError('Kamera terlalu lama loading. Coba lagi.');
          setIsLoading(false);
          initializingRef.current = false;
        }
      }, 8000);

    } catch (error: any) {
      console.error('❌ Camera initialization error:', error);
      
      let errorMessage = 'Tidak dapat mengakses kamera';
      
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Akses kamera ditolak. Silakan izinkan akses kamera dan coba lagi.';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'Kamera tidak ditemukan pada perangkat ini.';
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'Kamera sedang digunakan oleh aplikasi lain.';
      } else if (error.name === 'OverconstrainedError') {
        errorMessage = 'Kamera tidak mendukung pengaturan yang diminta.';
      }
      
      setError(errorMessage);
      setIsLoading(false);
      initializingRef.current = false;
    }
  }, [isOpen]);

  // Retry camera initialization
  const retryCamera = useCallback(() => {
    console.log('🔄 Retrying camera...');
    cleanup();
    setTimeout(() => {
      if (isOpen) {
        initializeCamera();
      }
    }, 500);
  }, [cleanup, initializeCamera, isOpen]);

  // Capture photo function
  const capturePhoto = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (!video || !canvas || !videoReady) {
      setError('Video belum siap untuk mengambil foto');
      return;
    }

    try {
      const context = canvas.getContext('2d');
      if (!context) {
        throw new Error('Tidak dapat mengakses canvas context');
      }

      // Set canvas dimensions
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      
      // Draw mirrored image
      context.save();
      context.scale(-1, 1);
      context.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
      context.restore();
      
      // Convert to image data
      const imageData = canvas.toDataURL('image/jpeg', 0.9);
      setCapturedImage(imageData);
      
      console.log('📸 Photo captured successfully');
      
    } catch (error) {
      console.error('❌ Capture error:', error);
      setError('Gagal mengambil foto. Coba lagi.');
    }
  }, [videoReady]);

  // Reset to camera view
  const resetToCamera = useCallback(() => {
    setCapturedImage(null);
    setError(null);
  }, []);

  // Initialize camera when modal opens
  useEffect(() => {
    if (isOpen && !capturedImage) {
      console.log('🚀 Modal opened, initializing camera...');
      initializeCamera();
    }
    
    return () => {
      if (!isOpen) {
        console.log('🚪 Modal closing, cleaning up...');
        cleanup();
      }
    };
  }, [isOpen, capturedImage, initializeCamera, cleanup]);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      console.log('🏗️ Component unmounting...');
      cleanup();
    };
  }, [cleanup]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Ambil Foto Selfie
          </h3>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="relative bg-gray-900 rounded-xl overflow-hidden mb-4">
          {error ? (
            <div className="aspect-[4/3] flex items-center justify-center p-4">
              <div className="text-center text-white">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-400" />
                <p className="text-sm mb-4 px-2">{error}</p>
                <div className="flex flex-col space-y-2">
                  <button
                    onClick={retryCamera}
                    disabled={isLoading}
                    className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50 transition-colors text-sm"
                  >
                    {isLoading ? 'Mencoba...' : 'Coba Lagi'}
                  </button>
                  <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    Refresh Halaman
                  </button>
                </div>
              </div>
            </div>
          ) : capturedImage ? (
            <img
              src={capturedImage}
              alt="Captured selfie"
              className="w-full aspect-[4/3] object-cover"
            />
          ) : (
            <div className="aspect-[4/3] relative">
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
                  <div className="text-center text-white">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                    <p className="text-sm">Mengakses kamera...</p>
                  </div>
                </div>
              )}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{ 
                  transform: 'scaleX(-1)',
                  opacity: videoReady ? 1 : 0
                }}
              />
            </div>
          )}
          
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Instructions */}
        <div className="text-center mb-4">
          <p className="text-xs text-gray-500 mb-2">
            Pastikan wajah Anda terlihat jelas dan pencahayaan cukup
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          {capturedImage ? (
            <>
              <button
                onClick={resetToCamera}
                className="flex-1 flex items-center justify-center space-x-2 py-3 px-4 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors"
              >
                <RotateCcw className="w-5 h-5" />
                <span>Ulangi</span>
              </button>
              <button
                onClick={() => onCapture(capturedImage)}
                className="flex-1 flex items-center justify-center space-x-2 py-3 px-4 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
              >
                <Check className="w-5 h-5" />
                <span>Gunakan</span>
              </button>
            </>
          ) : (
            <button
              onClick={capturePhoto}
              disabled={!videoReady || !!error || isLoading}
              className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-pink-600 text-white rounded-xl hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              <Camera className="w-5 h-5" />
              <span>
                {error ? 'Kamera Error' : 
                 isLoading ? 'Memuat Kamera...' : 
                 !videoReady ? 'Menyiapkan...' :
                 'Ambil Foto'}
              </span>
            </button>
          )}
        </div>

        {/* Debug Info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-2 bg-gray-100 rounded text-xs space-y-1">
            <div>Stream: {streamRef.current ? '✅' : '❌'}</div>
            <div>Video Ready: {videoReady ? '✅' : '❌'}</div>
            <div>Loading: {isLoading ? '✅' : '❌'}</div>
            <div>Initializing: {initializingRef.current ? '✅' : '❌'}</div>
            <div>Error: {error || 'None'}</div>
            <div>Captured: {capturedImage ? '✅' : '❌'}</div>
            {streamRef.current && (
              <div>Stream Active: {streamRef.current.active ? '✅' : '❌'}</div>
            )}
            {videoRef.current && (
              <>
                <div>Video Dimensions: {videoRef.current.videoWidth}x{videoRef.current.videoHeight}</div>
                <div>Ready State: {videoRef.current.readyState}</div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};