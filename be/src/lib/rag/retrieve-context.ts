// be/src/lib/rag/retrieve-context.ts
import { supabase } from '../../lib/supabase/server-client';
import { generateEmbedding } from '../embeddings/generate-embeddings';

/**
 * Retrieve context from file items based on semantic similarity
 */
export async function retrieveContext(
  query: string,
  fileIds: string[] = [],
  maxResults: number = 5,
  similarityThreshold: number = 0.75
): Promise<Array<{ content: string; fileId: string; fileName: string; similarity: number }>> {
  try {
    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query);
    
    // Set up the query to search for similar content
    let dbQuery = supabase
      .rpc('match_file_items', {
        query_embedding: queryEmbedding,
        match_threshold: similarityThreshold,
        match_count: maxResults
      })
      .select('content, file_id, similarity');
    
    // We'll filter file IDs after getting results, since RPC functions 
    // don't support filtering in the same way as regular tables
    
    // Execute the query
    const { data: allMatches, error } = await dbQuery;
    
    if (error) {
      console.error('Error retrieving context:', error);
      throw error;
    }
    
    // Manual filtering if multiple fileIds were provided
    let matches = allMatches;
    if (fileIds.length > 1) {
      matches = allMatches.filter((match: any) => fileIds.includes(match.file_id));
    }

    // Get file names for the matched file IDs
    const fileIdSet = new Set(matches.map((match: any) => match.file_id));
    const { data: files, error: filesError } = await supabase
      .from('files')
      .select('id, name')
      .in('id', Array.from(fileIdSet));
    
    if (filesError) {
      console.error('Error retrieving file names:', filesError);
      throw filesError;
    }
    
    // Create a map of file IDs to names
    const fileNameMap = new Map();
    files.forEach((file: any) => {
      fileNameMap.set(file.id, file.name);
    });
    
    // Add file name to each match
    return matches.map((match: any) => ({
      content: match.content,
      fileId: match.file_id,
      fileName: fileNameMap.get(match.file_id) || 'Unknown file',
      similarity: match.similarity
    }));
  } catch (error) {
    console.error('Error in retrieveContext:', error);
    throw error;
  }
}

/**
 * Format retrieved context into a string for the AI prompt
 */
export function formatContextForPrompt(
  contextItems: Array<{ content: string; fileName: string }>,
  maxLength: number = 5000
): string {
  // Group items by file name
  const fileGroups = new Map<string, string[]>();
  
  for (const item of contextItems) {
    if (!fileGroups.has(item.fileName)) {
      fileGroups.set(item.fileName, []);
    }
    fileGroups.get(item.fileName)?.push(item.content);
  }
  
  // Build formatted context string
  let formattedContext = '---CONTEXT START---\n\n';
  
  for (const [fileName, contents] of fileGroups.entries()) {
    formattedContext += `File: ${fileName}\n\n`;
    formattedContext += contents.join('\n\n');
    formattedContext += '\n\n---\n\n';
  }
  
  formattedContext += '---CONTEXT END---\n\n';
  
  // Trim if too long
  if (formattedContext.length > maxLength) {
    formattedContext = formattedContext.substring(0, maxLength) + '... (truncated)';
  }
  
  return formattedContext;
}