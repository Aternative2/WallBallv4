import React from 'react';
import { ProModeStats } from '../../types';

interface StatsPanelProps {
  stats: ProModeStats;
  phase: string;
  feedback?: string[];
  confidence?: number | null;
  ballDetected?: boolean | null;
  ballHeight?: number | null;
  kneeAngle?: number | null;
  hipAngle?: number | null;
  ankleAngle?: number | null;
  side?: 'left' | 'right' | null;
  repCount?: number | null;
  repValid?: boolean | null;
  repErrors?: string[];
  isDebugMode?: boolean;
}

const RawStatsDisplay = ({ stats }: { stats: any }) => (
  <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #444' }}>
    <h3 style={{ fontSize: '16px', marginBottom: '10px', color: '#888' }}>Wall Ball Counter</h3>
    {Object.entries(stats).map(([key, value]) => {
      if (typeof value === 'object' && value !== null) return null; // skip objects
      return (
        <div key={key} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '12px' }}>
          <span style={{ textTransform: 'capitalize' }}>{key.replace(/_/g, ' ')}:</span>
          <span style={{ fontWeight: 'bold' }}>{value}</span>
        </div>
      );
    })}
  </div>
);

export default function StatsPanel({ 
  stats, 
  phase, 
  feedback = [],
  confidence,
  ballDetected,
  ballHeight,
  kneeAngle,
  hipAngle,
  ankleAngle,
  side,
  repCount,
  repValid,
  repErrors = [],
  isDebugMode = false
}: StatsPanelProps) {

  // Simple stats view for Normal Mode
  if (!isDebugMode) {
    return (
      <div style={{
        position: 'fixed',
        top: '20px',
        left: '20px',
        background: 'rgba(0, 0, 0, 0.9)',
        padding: '16px',
        borderRadius: '12px',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        color: '#fff',
        zIndex: 5,
        minWidth: '220px'
      }}>
        <RawStatsDisplay stats={stats} />
      </div>
    );
  }

  // Full debug panel
  return (
    <div style={{
      position: 'fixed',
      left: '20px',
      top: '20px',
      width: '300px',
      background: 'rgba(0, 0, 0, 0.9)',
      color: '#fff',
      padding: '20px',
      borderRadius: '12px',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      overflowY: 'auto',
      zIndex: 5,
      fontSize: '14px',
      fontFamily: 'sans-serif'
    }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px', color: '#4ade80' }}>Debug Mode</h2>
      
      {/* Angles */}
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '16px', marginBottom: '10px', color: '#fbbf24' }}>Joint Angles</h3>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span>Knee Angle:</span>
          <span style={{ fontWeight: 'bold' }}>
            {kneeAngle !== null && kneeAngle !== undefined ? `${Math.round(kneeAngle)}°` : '--'}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span>Hip Angle:</span>
          <span style={{ fontWeight: 'bold' }}>
            {hipAngle !== null && hipAngle !== undefined ? `${Math.round(hipAngle)}°` : '--'}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span>Ankle Angle:</span>
          <span style={{ fontWeight: 'bold' }}>
            {ankleAngle !== null && ankleAngle !== undefined ? `${Math.round(ankleAngle)}°` : '--'}
          </span>
        </div>
      </div>

      {/* Ball Detection */}
      {ballDetected !== null && (
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '16px', marginBottom: '10px', color: '#fbbf24' }}>Ball Detection</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span>Ball Detected:</span>
            <span style={{ fontWeight: 'bold', color: ballDetected ? '#4ade80' : '#f87171' }}>
              {ballDetected ? 'YES' : 'NO'}
            </span>
          </div>
          {ballHeight !== null && ballHeight !== undefined && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span>Ball Height:</span>
              <span style={{ fontWeight: 'bold' }}>
                {ballHeight !== null && ballHeight !== undefined ? `${Math.round(ballHeight)}px` : '--'}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Confidence */}
      {confidence !== null && confidence !== undefined && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span>Confidence:</span>
            <span style={{ fontWeight: 'bold', color: confidence >= 0.7 ? '#4ade80' : confidence >= 0.5 ? '#fbbf24' : '#f87171' }}>
              {`${Math.round(confidence * 100)}%`}
            </span>
          </div>
        </div>
      )}

      {/* Feedback */}
      {feedback.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '16px', marginBottom: '10px', color: '#fbbf24' }}>Feedback</h3>
          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', color: '#fbbf24' }}>
            {feedback.map((item, index) => <li key={index}>{item}</li>)}
          </ul>
        </div>
      )}
      
      <RawStatsDisplay stats={stats} />
    </div>
  );
}