import client from './client.js';

export async function listProjects() {
  const { data } = await client.get('/api/projects');
  return data;
}

export async function createProject(payload) {
  const { data } = await client.post('/api/projects', payload);
  return data;
}

export async function getProject(id) {
  const { data } = await client.get(`/api/projects/${id}`);
  return data;
}

export async function addMembers(projectId, memberIds) {
  const { data } = await client.patch(`/api/projects/${projectId}/members`, { memberIds });
  return data;
}

export async function removeMember(projectId, userId) {
  const { data } = await client.delete(`/api/projects/${projectId}/members/${userId}`);
  return data;
}

export async function deleteProject(projectId) {
  const { data } = await client.delete(`/api/projects/${projectId}`);
  return data;
}
