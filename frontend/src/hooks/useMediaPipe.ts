import { useEffect, useRef, useState } from 'react';

type Mode = 'camera' | 'video';

export const useMediaStream = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>('camera');
  const [videoFile, setVideoFile] = useState<File | null>(null);

  // Effect for CAMERA mode
  useEffect(() => {
    if (mode !== 'camera') return;
    let stream: MediaStream;
    let isCancelled = false;

    const startCamera = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(d => d.kind === 'videoinput');
        if (videoDevices.length === 0) throw new Error('No camera found');
        
        stream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: { exact: videoDevices[0].deviceId }, width: 1280, height: 720 },
        });

        if (isCancelled) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setIsLoading(false);
      } catch (err: any) {
        setError(err.message);
        setIsLoading(false);
      }
    };
    startCamera();

    return () => {
      isCancelled = true;
      if (stream) stream.getTracks().forEach(t => t.stop());
      if (videoRef.current) videoRef.current.srcObject = null;
    };
  }, [mode]);

  // Effect for VIDEO mode
  useEffect(() => {
    if (mode !== 'video' || !videoFile) return;
    let isCancelled = false;

    const startVideo = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const url = URL.createObjectURL(videoFile);
        
        if (videoRef.current) {
          videoRef.current.src = url;
          await videoRef.current.play();
        }
        setIsLoading(false);
      } catch(err: any) {
        setError(err.message);
        setIsLoading(false);
      }
    };
    startVideo();

    return () => {
      isCancelled = true;
      if (videoRef.current) {
        videoRef.current.src = '';
        videoRef.current.srcObject = null;
      }
    };
  }, [mode, videoFile]);

  const processVideoFile = (file: File) => {
    setVideoFile(file);
    setMode('video');
  };

  const returnToCamera = () => {
    setVideoFile(null);
    setMode('camera');
  };

  return { 
    videoRef, 
    isLoading, 
    error, 
    processVideoFile,
    mode,
    returnToCamera
  };
};