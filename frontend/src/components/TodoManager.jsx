import React, { useState } from 'react';
import { useTodos } from '../hooks/useTodos';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './TodoManager.module.css';

export default function TodoManager() {
  const { todos, isLoading, isError, createTodo, toggleTodo, deleteTodo, reorderTodos } = useTodos();
  
  const [newTodo, setNewTodo] = useState('');
  const [newPriority, setNewPriority] = useState('None');
  const [newDueDate, setNewDueDate] = useState('');

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newTodo.trim()) return;
    
    // Default to putting it at the top 
    const minOrder = todos.length > 0 ? Math.min(...todos.map(t => typeof t.order === 'number' ? t.order : 0)) : 0;
    
    try {
      await createTodo({
        text: newTodo,
        priority: newPriority,
        dueDate: newDueDate ? new Date(newDueDate).toISOString() : null,
        order: minOrder - 1000 // place firmly at the top
      });
      setNewTodo('');
      setNewPriority('None');
      setNewDueDate('');
    } catch (err) {
      console.error(err);
    }
  };

  const onDragEnd = async (result) => {
    if (!result.destination) return;
    
    const sourceIndex = result.source.index;
    const destIndex = result.destination.index;
    
    if (sourceIndex === destIndex) return;
    
    const reordered = Array.from(todos);
    const [movedItem] = reordered.splice(sourceIndex, 1);
    reordered.splice(destIndex, 0, movedItem);
    
    // We update orders locally for optimistic UI and then send bulk update
    // Just map over the reordered array and set order
    const updates = reordered.map((item, index) => ({
      _id: item._id,
      order: index * 1000 // spread them out
    }));
    
    try {
      await reorderTodos(updates);
    } catch (err) {
      console.error(err);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return '#ef4444'; // red-500
      case 'Medium': return '#f59e0b'; // amber-500
      case 'Low': return '#3b82f6'; // blue-500
      default: return 'transparent';
    }
  };

  if (isError) return <div className={styles.loading}>Error loading todos</div>;

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>To-Do List</h2>
      
      <form onSubmit={handleAdd} className={styles.addForm}>
        <div className={styles.inputsRow}>
          <input
            type="text"
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            placeholder="What needs to be done?"
            className={styles.input}
            required
          />
          <select 
            value={newPriority} 
            onChange={(e) => setNewPriority(e.target.value)}
            className={styles.selectInput}
          >
            <option value="None">No Priority</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
          <input 
            type="date"
            value={newDueDate}
            onChange={(e) => setNewDueDate(e.target.value)}
            className={styles.dateInput}
          />
          <button type="submit" className={styles.addButton}>Add</button>
        </div>
      </form>

      {isLoading ? (
        <div className={styles.loading}>Loading todos...</div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="todo-list">
            {(provided) => (
              <ul 
                className={styles.todoList}
                {...provided.droppableProps}
                ref={provided.innerRef}
              >
                <AnimatePresence>
                  {todos.length === 0 && (
                    <motion.div 
                      className={styles.emptyState}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      No tasks yet. Enjoy your day!
                    </motion.div>
                  )}
                  {todos.map((todo, index) => (
                    <Draggable key={todo._id} draggableId={todo._id} index={index}>
                      {(provided, snapshot) => (
                        <motion.li 
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`${styles.todoItem} ${todo.completed ? styles.completed : ''} ${snapshot.isDragging ? styles.dragging : ''}`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ duration: 0.2 }}
                          style={{
                            ...provided.draggableProps.style,
                            borderLeft: todo.priority && todo.priority !== 'None' ? `4px solid ${getPriorityColor(todo.priority)}` : '1px solid var(--border)'
                          }}
                        >
                          <label className={styles.todoLabel}>
                            <input
                              type="checkbox"
                              checked={todo.completed}
                              onChange={() => toggleTodo({ id: todo._id, completed: !todo.completed })}
                              className={styles.checkbox}
                            />
                            <div className={styles.todoContent}>
                              <span className={styles.todoText}>{todo.text}</span>
                              <div className={styles.todoMeta}>
                                {todo.priority && todo.priority !== 'None' && (
                                  <span className={styles.priorityBadge} style={{ color: getPriorityColor(todo.priority) }}>
                                    {todo.priority}
                                  </span>
                                )}
                                {todo.dueDate && (
                                  <span className={styles.dueDateBadge}>
                                    📅 {new Date(todo.dueDate).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>
                          </label>
                          <button
                            onClick={() => deleteTodo(todo._id)}
                            className={styles.deleteBtn}
                            title="Delete task"
                          >
                            ✕
                          </button>
                        </motion.li>
                      )}
                    </Draggable>
                  ))}
                </AnimatePresence>
                {provided.placeholder}
              </ul>
            )}
          </Droppable>
        </DragDropContext>
      )}
    </div>
  );
}
