import axios from "axios";

const API_BASE = "http://localhost:4000/api/todos";

export const getTodos = async () => {
  const res = await axios.get(API_BASE);
  return res.data;
};

export const createTodo = async (title: string) => {
  const res = await axios.post(API_BASE, { title });
  return res.data;
};

export const updateTodo = async (id: number, is_done: boolean) => {
  await axios.put(`${API_BASE}/${id}`, { is_done });
};

export const deleteTodo = async (id: number) => {
  await axios.delete(`${API_BASE}/${id}`);
};
