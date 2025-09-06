import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { message, userId } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Call Rasa directly
    const rasaResponse = await fetch('http://localhost:5005/model/parse', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: message
      })
    });

    if (!rasaResponse.ok) {
      throw new Error(`Rasa API error: ${rasaResponse.status}`);
    }

    const rasaData = await rasaResponse.json();
    
    // Get the response from Rasa webhook
    const webhookResponse = await fetch('http://localhost:5005/webhooks/rest/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender: userId || 'web_user',
        message: message
      })
    });

    if (!webhookResponse.ok) {
      throw new Error(`Rasa webhook error: ${webhookResponse.status}`);
    }

    const webhookData = await webhookResponse.json();

    // Extract the text response
    const responseText = webhookData.length > 0 ? webhookData[0].text : 'Sorry, I did not understand that.';

    return NextResponse.json({
      success: true,
      response: responseText,
      intent: rasaData.intent?.name || 'unknown',
      confidence: rasaData.intent?.confidence || 0,
      entities: rasaData.entities || []
    });

  } catch (error) {
    console.error('Rasa chat error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Sorry, there was an error processing your message. Please try again.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
