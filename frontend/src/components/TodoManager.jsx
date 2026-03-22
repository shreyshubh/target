import React, { useState, useEffect } from 'react';
import { fetchTodos, createTodo, toggleTodo, deleteTodo } from '../api';
import styles from './TodoManager.module.css';

export default function TodoManager() {
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTodos();
  }, []);

  const loadTodos = async () => {
    try {
      const data = await fetchTodos();
      setTodos(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newTodo.trim()) return;
    try {
      const created = await createTodo(newTodo);
      // Insert at the top
      setTodos((prev) => [created, ...prev]);
      setNewTodo('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggle = async (id, currentStatus) => {
    try {
      // Optimistic update
      setTodos((prev) =>
        prev.map((t) => (t._id === id ? { ...t, completed: !currentStatus } : t))
      );
      await toggleTodo(id, !currentStatus);
    } catch (err) {
      console.error(err);
      loadTodos(); // Revert on err
    }
  };

  const handleDelete = async (id) => {
    try {
      setTodos((prev) => prev.filter((t) => t._id !== id));
      await deleteTodo(id);
    } catch (err) {
      console.error(err);
      loadTodos(); // Revert on err
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>To-Do List</h2>
      
      <form onSubmit={handleAdd} className={styles.addForm}>
        <input
          type="text"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          placeholder="What needs to be done?"
          className={styles.input}
        />
        <button type="submit" className={styles.addButton}>Add</button>
      </form>

      {loading ? (
        <div className={styles.loading}>Loading todos...</div>
      ) : (
        <ul className={styles.todoList}>
          {todos.length === 0 && (
            <div className={styles.emptyState}>No tasks yet. Enjoy your day!</div>
          )}
          {todos.map((todo) => (
            <li key={todo._id} className={`${styles.todoItem} ${todo.completed ? styles.completed : ''}`}>
              <label className={styles.todoLabel}>
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => handleToggle(todo._id, todo.completed)}
                  className={styles.checkbox}
                />
                <span className={styles.todoText}>{todo.text}</span>
              </label>
              <button
                onClick={() => handleDelete(todo._id)}
                className={styles.deleteBtn}
                title="Delete task"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
