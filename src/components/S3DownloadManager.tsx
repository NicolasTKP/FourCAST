import React, { useState } from 'react';
import { S3Client } from '@aws-sdk/client-s3';
import { 
  downloadAllFilesAsZip, 
  downloadAllFilesIndividually, 
  downloadSingleFile 
} from '../utils/S3Utils';

interface S3DownloadManagerProps {
  s3Client: S3Client;
  bucketName: string;
}

const S3DownloadManager: React.FC<S3DownloadManagerProps> = ({ s3Client, bucketName }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleDownloadAllAsZip = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      await downloadAllFilesAsZip(s3Client, bucketName);
      setSuccess('All files downloaded as ZIP successfully!');
    } catch (err) {
      setError(`Failed to download files as ZIP: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadAllIndividually = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      await downloadAllFilesIndividually(s3Client, bucketName);
      setSuccess('All files downloaded individually!');
    } catch (err) {
      setError(`Failed to download files individually: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadSingleFile = async () => {
    const fileName = prompt('Enter the file name/key to download:');
    if (!fileName) return;

    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      await downloadSingleFile(s3Client, bucketName, fileName);
      setSuccess(`File "${fileName}" downloaded successfully!`);
    } catch (err) {
      setError(`Failed to download file "${fileName}": ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px', margin: '20px 0' }}>
      <h3>S3 Download Manager - Bucket: {bucketName}</h3>
      
      <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', flexWrap: 'wrap' }}>
        <button 
          onClick={handleDownloadAllAsZip}
          disabled={loading}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Processing...' : 'Download All as ZIP'}
        </button>
        
        <button 
          onClick={handleDownloadAllIndividually}
          disabled={loading}
          style={{
            padding: '10px 20px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Processing...' : 'Download All Individually'}
        </button>
        
        <button 
          onClick={handleDownloadSingleFile}
          disabled={loading}
          style={{
            padding: '10px 20px',
            backgroundColor: '#ffc107',
            color: 'black',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Processing...' : 'Download Single File'}
        </button>
      </div>

      {/* Status Messages */}
      {error && (
        <div style={{
          padding: '10px',
          backgroundColor: '#f8d7da',
          color: '#721c24',
          border: '1px solid #f5c6cb',
          borderRadius: '4px',
          marginBottom: '10px'
        }}>
          <strong>Error:</strong> {error}
          <button 
            onClick={clearMessages}
            style={{ float: 'right', background: 'none', border: 'none', fontSize: '16px', cursor: 'pointer' }}
          >
            ×
          </button>
        </div>
      )}

      {success && (
        <div style={{
          padding: '10px',
          backgroundColor: '#d4edda',
          color: '#155724',
          border: '1px solid #c3e6cb',
          borderRadius: '4px',
          marginBottom: '10px'
        }}>
          <strong>Success:</strong> {success}
          <button 
            onClick={clearMessages}
            style={{ float: 'right', background: 'none', border: 'none', fontSize: '16px', cursor: 'pointer' }}
          >
            ×
          </button>
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', color: '#6c757d' }}>
          <p>Processing your request... Please wait.</p>
        </div>
      )}
    </div>
  );
};

export default S3DownloadManager;