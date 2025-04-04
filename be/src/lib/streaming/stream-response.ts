// be/src/lib/streaming/stream-response.ts
import { Response } from 'express';

/**
 * Extended Express Response to include flush method
 * Node.js http.ServerResponse sometimes has flush() available
 */
interface ResponseWithFlush extends Response {
  flush?: () => void;
}

/**
 * Stream interface for sending data to the client
 */
export interface Stream {
  write: (data: string) => void;
  end: () => void;
}

/**
 * Sets up a streaming response
 * @param res Express response object
 * @param callback Function that takes a stream and returns a promise
 */
export async function streamResponse(
  res: ResponseWithFlush, 
  callback: (stream: Stream) => Promise<void>
): Promise<void> {
  // Set headers for SSE
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });
  
  // Create stream object
  const stream: Stream = {
    write: (data: string) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
      // Flush the data immediately
      if (res.flush) {
        res.flush();
      }
    },
    end: () => {
      res.write('data: [DONE]\n\n');
      res.end();
    }
  };
  
  try {
    // Run the callback with our stream
    await callback(stream);
    // End the stream if not already ended
    stream.end();
  } catch (error) {
    console.error('Streaming error:', error);
    // Send error response and end the stream
    if (!res.headersSent) {
      res.status(500).json({ error: 'An error occurred during streaming' });
    } else {
      res.write(`data: ${JSON.stringify({ error: 'An error occurred during streaming' })}\n\n`);
      res.end();
    }
  }
}