import client from './client.js';

export async function searchUsers(q) {
  const { data } = await client.get('/api/users/search', { params: { q } });
  return data;
}
