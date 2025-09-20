import { S3Client } from '@aws-sdk/client-s3';
import { ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';
import JSZip from 'jszip';

// Helper function to convert response body to ArrayBuffer
const streamToArrayBuffer = async (stream: any): Promise<ArrayBuffer> => {
  if (stream.transformToByteArray) {
    // AWS SDK v3 method
    return stream.transformToByteArray();
  }
  
  if (stream instanceof ReadableStream) {
    // Handle ReadableStream
    const reader = stream.getReader();
    const chunks: Uint8Array[] = [];
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }
    
    // Combine all chunks
    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }
    
    return result.buffer;
  }
  
  if (stream.arrayBuffer) {
    // If it has arrayBuffer method
    return await stream.arrayBuffer();
  }
  
  // Fallback: try to convert to buffer
  if (typeof stream.pipe === 'function') {
    // Node.js stream
    const chunks: Buffer[] = [];
    return new Promise((resolve, reject) => {
      stream.on('data', (chunk: Buffer) => chunks.push(chunk));
      stream.on('error', reject);
      stream.on('end', () => {
        const buffer = Buffer.concat(chunks);
        resolve(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength));
      });
    });
  }
  
  throw new Error('Unable to convert stream to ArrayBuffer');
};

// Function to download all files from a bucket as a ZIP
export const downloadAllFilesAsZip = async (s3Client: S3Client, bucketName: string): Promise<void> => {
  try {
    // List all objects in the bucket
    const listCommand = new ListObjectsV2Command({
      Bucket: bucketName,
    });
    const listResponse = await s3Client.send(listCommand);
    
    if (!listResponse.Contents || listResponse.Contents.length === 0) {
      console.log('No files found in bucket');
      return;
    }
    
    const zip = new JSZip();
    
    // Download each file and add to ZIP
    for (const object of listResponse.Contents) {
      if (object.Key) {
        console.log(`Downloading: ${object.Key}`);
        
        try {
          const getCommand = new GetObjectCommand({
            Bucket: bucketName,
            Key: object.Key,
          });
          const response = await s3Client.send(getCommand);
          
          if (response.Body) {
            const arrayBuffer = await streamToArrayBuffer(response.Body);
            // Add file to ZIP
            zip.file(object.Key, arrayBuffer);
          }
        } catch (fileError) {
          console.error(`Error downloading ${object.Key}:`, fileError);
          // Continue with other files instead of failing completely
        }
      }
    }
    
    // Generate and download ZIP file
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const url = window.URL.createObjectURL(zipBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${bucketName}-backup.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    console.log('All files downloaded as ZIP');
  } catch (error) {
    console.error('Error downloading files:', error);
    throw error;
  }
};

// Function to download files individually (not as ZIP)
export const downloadAllFilesIndividually = async (s3Client: S3Client, bucketName: string): Promise<void> => {
  try {
    const listCommand = new ListObjectsV2Command({
      Bucket: bucketName,
    });
    const listResponse = await s3Client.send(listCommand);
    
    if (!listResponse.Contents || listResponse.Contents.length === 0) {
      console.log('No files found in bucket');
      return;
    }
    
    // Download each file individually
    for (const object of listResponse.Contents) {
      if (object.Key) {
        try {
          await downloadSingleFile(s3Client, bucketName, object.Key);
          // Add delay to avoid overwhelming the browser
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (fileError) {
          console.error(`Error downloading ${object.Key}:`, fileError);
          // Continue with other files
        }
      }
    }
    
    console.log('All files downloaded individually');
  } catch (error) {
    console.error('Error downloading files:', error);
    throw error;
  }
};

// Function to download a single file
export const downloadSingleFile = async (s3Client: S3Client, bucketName: string, objectKey: string): Promise<void> => {
  try {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
    });
    
    const response = await s3Client.send(command);
    
    if (response.Body) {
      const arrayBuffer = await streamToArrayBuffer(response.Body);
      const blob = new Blob([arrayBuffer]);
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = objectKey.split('/').pop() || objectKey;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }
  } catch (error) {
    console.error('Error downloading single file:', error);
    throw error;
  }
};

// Function to list all files in a bucket
export const listBucketFiles = async (s3Client: S3Client, bucketName: string) => {
  try {
    const command = new ListObjectsV2Command({
      Bucket: bucketName,
    });
    
    const response = await s3Client.send(command);
    return response.Contents || [];
  } catch (error) {
    console.error('Error listing bucket files:', error);
    throw error;
  }
};

// Alternative simpler approach using Response constructor
export const downloadSingleFileSimple = async (s3Client: S3Client, bucketName: string, objectKey: string): Promise<void> => {
  try {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
    });
    
    const response = await s3Client.send(command);
    
    if (response.Body) {
      // Create a new Response object and get arrayBuffer
      const webResponse = new Response(response.Body as any);
      const arrayBuffer = await webResponse.arrayBuffer();
      const blob = new Blob([arrayBuffer]);
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = objectKey.split('/').pop() || objectKey;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }
  } catch (error) {
    console.error('Error downloading single file:', error);
    throw error;
  }
};