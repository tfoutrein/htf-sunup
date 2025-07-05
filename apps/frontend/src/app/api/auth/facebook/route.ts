import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { facebookId, accessToken, email, name, profilePicture } = body;

    // Forward to backend API
    const backendUrl =
      process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const response = await fetch(`${backendUrl}/auth/facebook/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        facebookId,
        accessToken,
        email,
        name,
        profilePicture,
      }),
    });

    if (!response.ok) {
      throw new Error('Backend authentication failed');
    }

    const result = await response.json();

    return NextResponse.json(result);
  } catch (error) {
    console.error('Facebook authentication error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 },
    );
  }
}
