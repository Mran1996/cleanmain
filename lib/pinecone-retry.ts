/**
 * Exponential backoff retry utility for Pinecone operations
 * Follows Pinecone best practices for error handling
 */

interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
}

/**
 * Get HTTP status code from error
 */
function getStatusCode(error: any): number | null {
  if (error?.status) return error.status;
  if (error?.response?.status) return error.response.status;
  if (error?.statusCode) return error.statusCode;
  return null;
}

/**
 * Check if error should be retried
 * Only retry 429 (rate limit) and 5xx (server errors)
 * Don't retry 4xx client errors (except 429)
 */
function shouldRetry(error: any): boolean {
  const statusCode = getStatusCode(error);
  if (!statusCode) return false;
  
  // Retry rate limits and server errors
  return statusCode === 429 || statusCode >= 500;
}

/**
 * Exponential backoff retry wrapper
 * Follows Pinecone best practices:
 * - Only retries 429 and 5xx errors
 * - Uses exponential backoff with cap
 * - Doesn't retry client errors (4xx except 429)
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 5,
    initialDelay = 1000, // 1 second
    maxDelay = 60000, // 60 seconds
  } = options;

  let lastError: any;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const statusCode = getStatusCode(error);

      // Don't retry client errors (except 429)
      if (statusCode && statusCode >= 400 && statusCode < 500 && statusCode !== 429) {
        throw error; // Client error - don't retry
      }

      // Check if we should retry
      if (!shouldRetry(error)) {
        throw error; // Not a retryable error
      }

      // Last attempt - throw the error
      if (attempt === maxRetries - 1) {
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(initialDelay * Math.pow(2, attempt), maxDelay);
      
      console.warn(
        `Pinecone operation failed (attempt ${attempt + 1}/${maxRetries}), retrying in ${delay}ms...`,
        { statusCode, error: error.message }
      );

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}


