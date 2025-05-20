import api from "../utils/axiosInstance";

const API_BASE = "/todos"; // 앞에 /api는 axiosInstance에 baseURL로 들어감

export const getTodos = async () => {
  const res = await api.get(API_BASE);
  return res.data;
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
