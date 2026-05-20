import client from './client.js';

export async function listTasks(projectId, params = {}) {
  const { data } = await client.get(`/api/projects/${projectId}/tasks`, { params });
  return data;
}

export async function createTask(projectId, payload) {
  const { data } = await client.post(`/api/projects/${projectId}/tasks`, payload);
  return data;
}

export async function updateTask(projectId, taskId, payload) {
  const { data } = await client.patch(`/api/projects/${projectId}/tasks/${taskId}`, payload);
  return data;
}

export async function deleteTask(projectId, taskId) {
  const { data } = await client.delete(`/api/projects/${projectId}/tasks/${taskId}`);
  return data;
}
