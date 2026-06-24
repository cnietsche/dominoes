import type { GameDto } from '../types/game';

const API_BASE = '/api/games';

async function parseErrorMessage(response: Response): Promise<string> {
  const text = await response.text();
  if (!text) {
    return response.statusText;
  }

  try {
    const body = JSON.parse(text) as { message?: string };
    return body.message ?? text;
  } catch {
    return text;
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  return response.json() as Promise<T>;
}

export async function listGames(token: string): Promise<GameDto[]> {
  const response = await fetch(API_BASE, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return handleResponse<GameDto[]>(response);
}
