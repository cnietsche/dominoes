import WebSocket from 'ws';

const WS_URL = process.env.WS_URL ?? 'ws://frontend:8080/ws/lobby';
const LOBBY_SIZE = Number(process.env.LOBBY_SIZE ?? 4);

function connectAndJoin(nickname) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(WS_URL);
    const messages = [];
    const timeout = setTimeout(() => {
      ws.close();
      reject(new Error(`Timeout joining as ${nickname}`));
    }, 10000);

    ws.on('open', () => {
      ws.send(JSON.stringify({ type: 'JOIN', nickname }));
    });

    ws.on('message', (raw) => {
      const message = JSON.parse(raw.toString());
      messages.push(message);

      if (message.type === 'JOIN_ACK') {
        clearTimeout(timeout);
        resolve({ ws, messages, userId: message.payload.userId });
      }

      if (message.type === 'ERROR') {
        clearTimeout(timeout);
        resolve({ ws, messages, error: message.payload.message });
      }
    });

    ws.on('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });
}

function waitForLobbyState(ws, minUsers) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Timeout waiting for LOBBY_STATE')), 10000);

    const handler = (raw) => {
      const message = JSON.parse(raw.toString());
      if (message.type === 'LOBBY_STATE' && message.payload.users.length >= minUsers) {
        clearTimeout(timeout);
        ws.off('message', handler);
        resolve(message.payload);
      }
    };

    ws.on('message', handler);
  });
}

async function main() {
  const sessions = [];

  console.log('Test 1: basic join');
  const first = await connectAndJoin('Player1');
  if (first.error) throw new Error(`Unexpected error: ${first.error}`);
  sessions.push(first);
  console.log('  OK - joined as Player1');

  console.log('Test 2: fill lobby');
  for (let i = 2; i <= LOBBY_SIZE; i++) {
    const session = await connectAndJoin(`Player${i}`);
    if (session.error) throw new Error(`Failed to join Player${i}: ${session.error}`);
    sessions.push(session);
  }
  console.log(`  OK - ${LOBBY_SIZE} players connected`);

  const state = await waitForLobbyState(sessions[0].ws, LOBBY_SIZE);
  if (state.users.length !== LOBBY_SIZE) {
    throw new Error(`Expected ${LOBBY_SIZE} users, got ${state.users.length}`);
  }
  console.log('  OK - LOBBY_STATE synchronized');

  console.log('Test 3: lobby full');
  const rejected = await connectAndJoin('PlayerFull');
  if (!rejected.error || !String(rejected.error).includes('cheio')) {
    throw new Error(`Expected lobby full error, got: ${JSON.stringify(rejected)}`);
  }
  rejected.ws.close();
  console.log('  OK - lobby full error returned');

  console.log('Test 4: leave frees slot');
  sessions[0].ws.close();
  await new Promise((r) => setTimeout(r, 1000));
  const afterLeave = await connectAndJoin('PlayerNew');
  if (afterLeave.error) throw new Error(`Slot not freed: ${afterLeave.error}`);
  afterLeave.ws.close();
  console.log('  OK - slot freed after disconnect');

  sessions.slice(1).forEach((s) => s.ws.close());
  console.log('All WebSocket tests passed.');
}

main().catch((error) => {
  console.error('WebSocket validation failed:', error.message);
  process.exit(1);
});
