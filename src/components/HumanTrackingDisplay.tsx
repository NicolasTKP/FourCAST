import React, { useEffect, useRef, useState } from 'react';

const HumanTrackingDisplay: React.FC = () => {
  const [frame, setFrame] = useState<string | null>(null);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    ws.current = new WebSocket('ws://localhost:8766');

    ws.current.onopen = () => {
      console.log('WebSocket connected');
    };

    ws.current.onmessage = (event) => {
      setFrame(`data:image/jpeg;base64,${event.data}`);
    };

    ws.current.onclose = () => {
      console.log('WebSocket disconnected');
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      ws.current?.close();
    };
  }, []);

  return (
    <div className="human-tracking-display flex items-center justify-center h-full">
      {frame ? (
        <img src={frame} alt="Human Tracking Feed" style={{ width: '100%', height: 'auto' }} />
      ) : (
        <p>Connecting to human tracking feed...</p>
      )}
    </div>
  );
};

export default HumanTrackingDisplay;
