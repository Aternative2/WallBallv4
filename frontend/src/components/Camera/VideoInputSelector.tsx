import React, { useRef } from 'react';

interface VideoInputSelectorProps {
  mode: 'camera' | 'video';
  onSelectCamera: () => void;
  onSelectVideo: (file: File) => void;
}

const VideoInputSelector: React.FC<VideoInputSelectorProps> = ({ mode, onSelectCamera, onSelectVideo }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (e.target.value === 'camera') {
      onSelectCamera();
    } else if (e.target.value === 'video') {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onSelectVideo(file);
      // Reset value so the same file can be selected again
      e.target.value = '';
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 60, // just below Debug toggle
      right: 20,
      zIndex: 11,
      background: 'rgba(0,0,0,0.9)',
      padding: '10px 18px',
      borderRadius: '8px',
      border: '1px solid #333',
      color: '#fff',
      fontSize: '14px',
      fontWeight: 'bold',
    }}>
      <select
        value={mode}
        onChange={handleChange}
        style={{
          background: 'rgba(0,0,0,0.9)',
          color: '#fff',
          border: 'none',
          fontSize: '14px',
          fontWeight: 'bold',
          outline: 'none',
          cursor: 'pointer',
        }}
      >
        <option value="camera">Camera</option>
        <option value="video">Select Video</option>
      </select>
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
    </div>
  );
};

export default VideoInputSelector; 