import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

const s3Region = process.env.S3_REGION || process.env.AWS_REGION || 'us-east-1';
const s3Bucket = process.env.S3_BUCKET_NAME || process.env.AWS_S3_BUCKET_NAME || process.env.AWS_S3_BUCKET || '';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const key = url.searchParams.get('key');

  if (!key) {
    return new Response(JSON.stringify({ error: 'Missing required query parameter: key' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  if (!s3Bucket) {
    return new Response(JSON.stringify({ error: 'S3 bucket not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Assume all objects are public-read and redirect to the public S3 URL
  const publicUrl = `https://${s3Bucket}.s3.${s3Region}.amazonaws.com/${encodeURI(key)}`;

  return new Response(null, {
    status: 302,
    headers: {
      Location: publicUrl,
      'Cache-Control': 'public, max-age=31536000',
    },
  });
}