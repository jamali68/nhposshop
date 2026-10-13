// Netlify Serverless Cloud Function (Node.js / JavaScript)
// You can call this at: /.netlify/functions/api or /api/* if routed

export async function handler(event, context) {
  try {
    const { httpMethod, queryStringParameters, headers } = event;

    // Example secure serverless backend endpoint
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      },
      body: JSON.stringify({
        status: 'ok',
        appName: 'Taj POS Pro',
        serverlessTime: new Date().toISOString(),
        message: 'Netlify Cloud Function is running securely with standard JavaScript!'
      })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message || 'Serverless function error' })
    };
  }
}
