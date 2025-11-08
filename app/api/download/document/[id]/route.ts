import { NextResponse } from 'next/server';
import { getDocumentPdfBuffer, getCaseAnalysisPdfBuffer } from '@/lib/pdf-storage';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const url = new URL(req.url);
  const type = url.searchParams.get('type');

  try {
    const pdfBuffer:any =
      type === 'analysis'
        ? await getCaseAnalysisPdfBuffer(id)
        : await getDocumentPdfBuffer(id);

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${type === 'analysis' ? 'case-analysis' : 'legal-document'}-${id}.pdf"`
      },
    });
  } catch (error) {
    console.error('Download error:', error);
    return new NextResponse('Failed to download file', { status: 500 });
  }
}