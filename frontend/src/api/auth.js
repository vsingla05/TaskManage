import client from './client.js';

export async function register(payload) {
  const { data } = await client.post('/api/auth/register', payload);
  return data;
}

export async function login(payload) {
  const { data } = await client.post('/api/auth/login', payload);
  return data;
}

export async function getMe() {
  const { data } = await client.get('/api/auth/me');
  return data;
}
