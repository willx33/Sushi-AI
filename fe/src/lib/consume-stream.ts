// fe/src/lib/consume-stream.ts

/**
 * Consumes a server-sent event stream and processes the incoming data.
 * 
 * @param {Response} response - The fetch API response containing the stream
 * @param {(token: string) => void} onToken - Callback for each token received
 * @param {() => void} onComplete - Callback when stream is complete
 * @param {(error: Error) => void} onError - Callback for stream errors
 * @returns {Promise<void>} A promise that resolves when the stream is consumed
 */
export async function consumeStream(
  response: Response,
  onToken: (token: string) => void,
  onComplete: () => void,
  onError: (error: Error) => void
): Promise<void> {
  if (!response.body) {
    onError(new Error('Response body is null or undefined'));
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        break;
      }

      // Decode the chunk and add to buffer
      buffer += decoder.decode(value, { stream: true });
      
      // Process all complete data events
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || ''; // Keep the last incomplete chunk
      
      for (const line of lines) {
        if (!line.trim()) continue; // Skip empty lines
        
        if (line.startsWith('data: ')) {
          const data = line.slice(6); // Remove 'data: ' prefix
          
          if (data === '[DONE]') {
            onComplete();
            return;
          }
          
          try {
            // Try to parse as JSON first
            const parsed = JSON.parse(data);
            
            // Check if it's an error message
            if (parsed.error) {
              onError(new Error(parsed.error));
              return;
            }
            
            // If it's a raw token (string)
            onToken(parsed);
          } catch (e) {
            // If it's not valid JSON, use it as a raw string
            onToken(data);
          }
        }
      }
    }
    
    onComplete();
  } catch (error) {
    onError(error instanceof Error ? error : new Error(String(error)));
  }
}