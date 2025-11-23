import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  console.log('🧪 [TEST API] Simple test endpoint called');
  
  try {
    const body = await req.json();
    console.log('🧪 [TEST API] Request body:', { 
      hasUserId: !!body.userId,
      chatLength: body.chatHistory?.length || 0 
    });
    
    // Simulate some processing time
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const testDocument = `TEST LEGAL DOCUMENT

IN THE SUPERIOR COURT OF THE STATE OF WASHINGTON
IN AND FOR KING COUNTY

PEOPLE OF THE STATE OF WASHINGTON,
Plaintiff,

vs.

JOHN DOE,
Defendant.

Case No. 24-12345

MOTION FOR SENTENCE REDUCTION

COMES NOW the Defendant, John Doe, by and through his attorney, and respectfully moves this Court for a reduction of sentence pursuant to RCW 9.94A.540.

STATEMENT OF FACTS

1. Defendant was convicted of [CRIME] on [DATE] and sentenced to [SENTENCE] years in prison.

2. Since his incarceration, Defendant has demonstrated exemplary behavior and rehabilitation efforts.

3. Defendant has completed multiple educational and vocational programs while incarcerated.

4. Defendant has maintained a clean disciplinary record throughout his incarceration.

5. Defendant has shown genuine remorse for his actions and has taken steps to address the underlying issues that led to his criminal behavior.

LEGAL ARGUMENT

The Court has the authority to reduce a sentence when the defendant has demonstrated rehabilitation and good behavior. RCW 9.94A.540 provides the statutory framework for sentence modifications based on post-conviction conduct.

Defendant's exemplary behavior, completion of rehabilitation programs, and clean disciplinary record demonstrate his rehabilitation and suitability for a sentence reduction. The interests of justice would be served by reducing Defendant's sentence to reflect his rehabilitation efforts.

CONCLUSION

For the foregoing reasons, Defendant respectfully requests that this Court grant his motion for sentence reduction.

Respectfully submitted,

[ATTORNEY NAME]
[ATTORNEY BAR NUMBER]
[ATTORNEY ADDRESS]
[ATTORNEY PHONE]

DATED: ${new Date().toLocaleDateString()}`;

    return NextResponse.json({
      success: true,
      data: {
        docId: 'test-doc-123',
        document: testDocument,
        title: 'Test Legal Document'
      }
    });
    
  } catch (error) {
    console.error('🧪 [TEST API] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Test API failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'test-api-healthy',
    timestamp: new Date().toISOString()
  });
}























