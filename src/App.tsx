import React, { useEffect, useState } from 'react';
import { S3Client } from '@aws-sdk/client-s3';
import HumanTrackingDisplay from './components/HumanTrackingDisplay';
import { downloadAllFilesAsZip, downloadAllFilesIndividually, listBucketFiles } from './utils/S3Utils';
import './App.css';

function App() {
  const [downloadStatus, setDownloadStatus] = useState<'idle' | 'downloading' | 'success' | 'error'>('idle');
  const [downloadMessage, setDownloadMessage] = useState<string>('');
  const [fileCount, setFileCount] = useState<number>(0);

  // Temporary for testing only
  const region = process.env.REACT_APP_AWS_REGION || "ap-southeast-1";
  const accessKeyId = process.env.REACT_APP_AWS_ACCESS_KEY_ID || """";
  const secretAccessKey = process.env.REACT_APP_AWS_SECRET_ACCESS_KEY || "";
  const bucketName = "onlstores";
  
  console.log("Region:", region);
  console.log("Access Key ID:", accessKeyId);
  console.log("Bucket Name:", bucketName);

  // Check if all required environment variables are present
  if (!region || !accessKeyId || !secretAccessKey) {
    console.error('Missing required AWS environment variables');
    return (
      <div className="App">
        <header className="App-header">
          <h1>FourCAST Human Tracking</h1>
        </header>
        <main>
          <p>Error: Missing AWS configuration. Please check your environment variables.</p>
        </main>
      </div>
    );
  }

  // Create S3 client
  const s3Client = new S3Client({
    region: region,
    credentials: {
      accessKeyId: accessKeyId,
      secretAccessKey: secretAccessKey
    }
  });

  // Auto-download function
  const autoDownloadBucket = async () => {
    setDownloadStatus('downloading');
    setDownloadMessage('Checking bucket contents...');

    try {
      // First, list files to show progress
      const files = await listBucketFiles(s3Client, bucketName);
      setFileCount(files.length);
      
      if (files.length === 0) {
        setDownloadStatus('success');
        setDownloadMessage('Bucket is empty - nothing to download');
        return;
      }

      setDownloadMessage(`Found ${files.length} files. Starting download...`);
      
      // Download all files as ZIP
      await downloadAllFilesIndividually(s3Client, bucketName);
      
      setDownloadStatus('success');
      setDownloadMessage(`Successfully downloaded ${files.length} files as ZIP`);
    } catch (error) {
      console.error('Auto-download failed:', error);
      setDownloadStatus('error');
      setDownloadMessage(`Download failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Auto-download on component mount
  useEffect(() => {
    // Only auto-download if not already done
    if (downloadStatus === 'idle') {
      autoDownloadBucket();
    }
  }, [downloadStatus]); // Only run when status changes

  return (
    <div className="App">
      <header className="App-header">
        <h1>FourCAST Human Tracking</h1>
      </header>
      <main>
        {/* Download Status Display */}
        <div style={{
          padding: '20px',
          margin: '20px 0',
          border: '2px solid #ddd',
          borderRadius: '8px',
          backgroundColor: downloadStatus === 'downloading' ? '#fff3cd' : 
                          downloadStatus === 'success' ? '#d4edda' : 
                          downloadStatus === 'error' ? '#f8d7da' : '#f8f9fa'
        }}>
          <h3>S3 Auto-Download Status</h3>
          <p><strong>Bucket:</strong> {bucketName}</p>
          <p><strong>Status:</strong> {downloadStatus.toUpperCase()}</p>
          {fileCount > 0 && <p><strong>Files Found:</strong> {fileCount}</p>}
          <p><strong>Message:</strong> {downloadMessage}</p>
          
          {downloadStatus === 'downloading' && (
            <div style={{ marginTop: '10px' }}>
              <div style={{
                width: '100%',
                height: '20px',
                backgroundColor: '#e9ecef',
                borderRadius: '10px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(90deg, #007bff, #0056b3, #007bff)',
                  backgroundSize: '200% 100%',
                  animation: 'loading 2s linear infinite'
                }}></div>
              </div>
            </div>
          )}
          
          {downloadStatus === 'error' && (
            <button 
              onClick={autoDownloadBucket}
              style={{
                marginTop: '10px',
                padding: '8px 16px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Retry Download
            </button>
          )}
        </div>

        <HumanTrackingDisplay />
      </main>


    </div>
  );
}

export default App;