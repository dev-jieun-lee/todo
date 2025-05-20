import api from "../utils/axiosInstance";

const API_BASE = "/api/todos";

export const getTodos = async () => {
  const res = await api.get(API_BASE);
  const data = res.data;
  console.log("getTodos 응답:", data);
  return Array.isArray(data) ? data : [];
};

export const createTodo = async (title: string) => {
  const res = await api.post(API_BASE, { title });
  return res.data;
};

export const updateTodo = async (id: number, is_done: boolean) => {
  await api.put(`${API_BASE}/${id}`, { is_done });
};

export const deleteTodo = async (id: number) => {
  await api.delete(`${API_BASE}/${id}`);
};
