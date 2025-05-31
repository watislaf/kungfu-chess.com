// Simple stateless WebSocket handler for AWS API Gateway
// No database dependencies - keeps it lightweight

interface GameMessage {
  type: string;
  data: any;
  gameId?: string;
  playerId?: string;
}

export const handler = async (event: any) => {
  const { requestContext } = event;
  const { connectionId, routeKey } = requestContext;
  
  console.log('WebSocket event:', { connectionId, routeKey, body: event.body });

  try {
    switch (routeKey) {
      case '$connect':
        return handleConnect();
      case '$disconnect':
        return handleDisconnect();
      case '$default':
      default:
        return handleMessage(event.body || '{}');
    }
  } catch (error) {
    console.error('Error handling WebSocket event:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};

function handleConnect() {
  console.log('WebSocket connected');
  return { statusCode: 200, body: 'Connected' };
}

function handleDisconnect() {
  console.log('WebSocket disconnected');
  return { statusCode: 200, body: 'Disconnected' };
}

function handleMessage(body: string) {
  try {
    const message: GameMessage = JSON.parse(body);
    console.log('Received message:', message);
    
    // For simplicity, just echo back the message
    // In a real implementation, you would:
    // 1. Validate the message
    // 2. Process game logic
    // 3. Broadcast to other players using connectionId
    
    return { 
      statusCode: 200, 
      body: JSON.stringify({ 
        type: 'message-received',
        data: message 
      })
    };
  } catch (error) {
    console.error('Error parsing message:', error);
    return { 
      statusCode: 400, 
      body: JSON.stringify({ error: 'Invalid message format' })
    };
  }
} 