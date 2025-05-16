import type { TodoItem as TodoType } from "../../types/todo";

interface Props {
  todo: TodoType;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

const TodoItem = ({ todo, onToggle, onDelete }: Props) => {
  return (
    <div className="flex items-center justify-between p-2 border-b">
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={todo.done}
          onChange={() => onToggle(todo.id)}
          className="w-4 h-4"
        />
        <span className={todo.done ? "line-through text-gray-400" : ""}>
          {todo.text}
        </span>
      </label>
      <button
        onClick={() => onDelete(todo.id)}
        className="text-red-500 hover:text-red-700"
      >
        🗑
      </button>
    </div>
  );
};

export default TodoItem;
