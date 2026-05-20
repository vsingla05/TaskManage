import client from './client.js';

export async function getDashboard() {
  const { data } = await client.get('/api/dashboard');
  return data;
}
