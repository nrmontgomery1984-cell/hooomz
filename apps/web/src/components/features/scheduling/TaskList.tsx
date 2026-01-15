'use client';

/**
 * TaskList Component
 *
 * List view of tasks with filtering and sorting.
 */

import React, { useState, useEffect } from 'react';
import type { Task } from '@hooomz/shared-contracts';
import { TaskCard } from './TaskCard';
import { Select, Input, Badge, LoadingSpinner } from '@/components/ui';

interface TaskListProps {
  tasks: Task[];
  onStatusChange?: (taskId: string, newStatus: string) => void;
  isLoading?: boolean;
  showProject?: boolean;
}

export function TaskList({ tasks, onStatusChange, isLoading, showProject }: TaskListProps) {
  const [filteredTasks, setFilteredTasks] = useState<Task[]>(tasks);
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'title'>('dueDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    applyFiltersAndSort();
  }, [tasks, statusFilter, priorityFilter, assigneeFilter, searchQuery, sortBy, sortOrder]);

  const applyFiltersAndSort = () => {
    let filtered = [...tasks];

    // Apply filters
    if (statusFilter !== 'all') {
      filtered = filtered.filter((t) => t.status === statusFilter);
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter((t) => t.priority === priorityFilter);
    }

    if (assigneeFilter !== 'all') {
      filtered = filtered.filter((t) => t.assignedTo === assigneeFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.title.toLowerCase().includes(query) ||
          t.description?.toLowerCase().includes(query) ||
          t.tags?.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    // Highlight overdue tasks by moving them to top
    const overdue = filtered.filter(
      (t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed'
    );
    const notOverdue = filtered.filter(
      (t) => !t.dueDate || new Date(t.dueDate) >= new Date() || t.status === 'completed'
    );

    // Apply sorting to non-overdue tasks
    notOverdue.sort((a, b) => {
      let compareValue = 0;

      switch (sortBy) {
        case 'dueDate':
          if (!a.dueDate && !b.dueDate) compareValue = 0;
          else if (!a.dueDate) compareValue = 1;
          else if (!b.dueDate) compareValue = -1;
          else compareValue = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
          break;
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          compareValue =
            (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) -
            (priorityOrder[a.priority as keyof typeof priorityOrder] || 0);
          break;
        case 'title':
          compareValue = a.title.localeCompare(b.title);
          break;
      }

      return sortOrder === 'asc' ? compareValue : -compareValue;
    });

    // Overdue tasks always at top (sorted by due date)
    overdue.sort((a, b) => {
      if (!a.dueDate || !b.dueDate) return 0;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });

    setFilteredTasks([...overdue, ...notOverdue]);
  };

  const getUniqueAssignees = (): string[] => {
    const assignees = tasks
      .map((t) => t.assignedTo)
      .filter((a): a is string => Boolean(a));
    return Array.from(new Set(assignees));
  };

  const getOverdueCount = (): number => {
    return filteredTasks.filter(
      (t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed'
    ).length;
  };

  if (isLoading) {
    return (
      <div className="py-12">
        <LoadingSpinner size="lg" text="Loading tasks..." />
      </div>
    );
  }

  const uniqueAssignees = getUniqueAssignees();
  const overdueCount = getOverdueCount();

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="space-y-4">
        {/* Search */}
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search tasks..."
          fullWidth
        />

        {/* Filter Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Select
            label="Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            fullWidth
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="blocked">Blocked</option>
          </Select>

          <Select
            label="Priority"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            fullWidth
          >
            <option value="all">All Priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </Select>

          <Select
            label="Assignee"
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
            fullWidth
          >
            <option value="all">All Assignees</option>
            {uniqueAssignees.map((assignee) => (
              <option key={assignee} value={assignee}>
                {assignee}
              </option>
            ))}
          </Select>

          <Select
            label="Sort By"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'dueDate' | 'priority' | 'title')}
            fullWidth
          >
            <option value="dueDate">Due Date</option>
            <option value="priority">Priority</option>
            <option value="title">Title</option>
          </Select>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center gap-4 text-sm">
        <span className="text-gray-600">
          {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'}
        </span>
        {overdueCount > 0 && (
          <Badge variant="error">
            {overdueCount} overdue
          </Badge>
        )}
      </div>

      {/* Task List */}
      {filteredTasks.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg mb-2">No tasks found</div>
          <p className="text-gray-500">
            {searchQuery || statusFilter !== 'all' || priorityFilter !== 'all' || assigneeFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'No tasks yet'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onStatusChange={onStatusChange}
              showProject={showProject}
            />
          ))}
        </div>
      )}
    </div>
  );
}
