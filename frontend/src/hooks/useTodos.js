import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchTodos, createTodo, toggleTodo, updateTodo, deleteTodo, reorderTodosBulk } from '../api';

export function useTodos() {
  const queryClient = useQueryClient();

  const todosQuery = useQuery({
    queryKey: ['todos'],
    queryFn: fetchTodos,
  });

  const createMutation = useMutation({
    mutationFn: createTodo,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, completed }) => toggleTodo(id, completed),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }) => updateTodo(id, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTodo,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
  });

  const reorderMutation = useMutation({
    mutationFn: reorderTodosBulk,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
  });

  return {
    todos: todosQuery.data || [],
    isLoading: todosQuery.isLoading,
    isError: todosQuery.isError,
    createTodo: createMutation.mutateAsync,
    toggleTodo: toggleMutation.mutateAsync,
    updateTodo: updateMutation.mutateAsync,
    deleteTodo: deleteMutation.mutateAsync,
    reorderTodos: reorderMutation.mutateAsync,
  };
}
