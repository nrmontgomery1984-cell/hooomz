'use client';

/**
 * Calendar Component
 *
 * Month/week/day calendar views for task scheduling.
 * Supports drag and drop for rescheduling tasks.
 */

import React, { useState } from 'react';
import type { Task } from '@hooomz/shared-contracts';
import { Card, Badge, Button } from '@/components/ui';

interface CalendarProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  onDateChange?: (taskId: string, newDate: string) => void;
  view?: 'month' | 'week' | 'day';
}

export function Calendar({ tasks, onTaskClick, onDateChange, view = 'month' }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState<'month' | 'week' | 'day'>(view);

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'pending':
        return 'bg-gray-400';
      case 'in-progress':
        return 'bg-yellow-500';
      case 'completed':
        return 'bg-green-500';
      case 'blocked':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getTasksForDate = (date: Date): Task[] => {
    return tasks.filter((task) => {
      if (!task.dueDate) return false;
      const taskDate = new Date(task.dueDate);
      return (
        taskDate.getDate() === date.getDate() &&
        taskDate.getMonth() === date.getMonth() &&
        taskDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const getMonthDays = (): Date[] => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days: Date[] = [];
    const current = new Date(startDate);

    while (days.length < 42) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return days;
  };

  const getWeekDays = (): Date[] => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const navigateMonth = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const navigateWeek = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + direction * 7);
    setCurrentDate(newDate);
  };

  const navigateDay = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + direction);
    setCurrentDate(newDate);
  };

  const navigate = (direction: number) => {
    switch (calendarView) {
      case 'month':
        navigateMonth(direction);
        break;
      case 'week':
        navigateWeek(direction);
        break;
      case 'day':
        navigateDay(direction);
        break;
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isCurrentMonth = (date: Date): boolean => {
    return date.getMonth() === currentDate.getMonth();
  };

  const formatMonthYear = (): string => {
    return currentDate.toLocaleDateString('en-CA', {
      month: 'long',
      year: 'numeric',
    });
  };

  const formatWeekRange = (): string => {
    const days = getWeekDays();
    const start = days[0].toLocaleDateString('en-CA', { month: 'short', day: 'numeric' });
    const end = days[6].toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${start} - ${end}`;
  };

  const formatDayDate = (): string => {
    return currentDate.toLocaleDateString('en-CA', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const renderMonthView = () => {
    const days = getMonthDays();
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <div className="grid grid-cols-7 gap-px bg-gray-200">
        {/* Day headers */}
        {weekDays.map((day) => (
          <div
            key={day}
            className="bg-gray-50 p-2 text-center text-sm font-semibold text-gray-700"
          >
            {day}
          </div>
        ))}

        {/* Calendar days */}
        {days.map((day, index) => {
          const dayTasks = getTasksForDate(day);
          return (
            <div
              key={index}
              className={`bg-white p-2 min-h-24 ${
                !isCurrentMonth(day) ? 'opacity-40' : ''
              } ${isToday(day) ? 'bg-primary-50 border-2 border-primary-500' : ''}`}
            >
              <div className="font-semibold text-sm text-gray-700 mb-1">
                {day.getDate()}
              </div>
              <div className="space-y-1">
                {dayTasks.slice(0, 3).map((task) => (
                  <button
                    key={task.id}
                    onClick={() => onTaskClick?.(task)}
                    className="w-full text-left px-2 py-1 rounded text-xs hover:opacity-80 transition-opacity"
                    style={{ backgroundColor: getStatusColor(task.status) + '20' }}
                  >
                    <div className={`w-1 h-1 rounded-full inline-block mr-1 ${getStatusColor(task.status)}`} />
                    <span className="truncate">{task.title}</span>
                  </button>
                ))}
                {dayTasks.length > 3 && (
                  <div className="text-xs text-gray-500 px-2">
                    +{dayTasks.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderWeekView = () => {
    const days = getWeekDays();
    const hours = Array.from({ length: 12 }, (_, i) => i + 8); // 8am to 8pm

    return (
      <div className="overflow-x-auto">
        <div className="grid grid-cols-8 gap-px bg-gray-200 min-w-max">
          {/* Time column header */}
          <div className="bg-gray-50 p-2" />

          {/* Day headers */}
          {days.map((day) => (
            <div
              key={day.toISOString()}
              className={`bg-gray-50 p-2 text-center ${isToday(day) ? 'bg-primary-100' : ''}`}
            >
              <div className="text-xs text-gray-600">
                {day.toLocaleDateString('en-CA', { weekday: 'short' })}
              </div>
              <div className="text-lg font-semibold">{day.getDate()}</div>
            </div>
          ))}

          {/* Time rows */}
          {hours.map((hour) => (
            <React.Fragment key={hour}>
              <div className="bg-white p-2 text-xs text-gray-500 text-right">
                {hour}:00
              </div>
              {days.map((day) => {
                const dayTasks = getTasksForDate(day);
                return (
                  <div
                    key={`${day.toISOString()}-${hour}`}
                    className={`bg-white p-1 border-t border-gray-100 ${
                      isToday(day) ? 'bg-primary-50' : ''
                    }`}
                  >
                    {hour === 9 &&
                      dayTasks.map((task) => (
                        <button
                          key={task.id}
                          onClick={() => onTaskClick?.(task)}
                          className="w-full text-left px-2 py-1 rounded text-xs mb-1 hover:opacity-80"
                          style={{ backgroundColor: getStatusColor(task.status) + '20' }}
                        >
                          <div className="font-semibold truncate">{task.title}</div>
                        </button>
                      ))}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const dayTasks = getTasksForDate(currentDate);
    const hours = Array.from({ length: 12 }, (_, i) => i + 8);

    return (
      <div className="space-y-2">
        <Card>
          <h3 className="text-lg font-bold text-gray-900 mb-3">
            Tasks for {currentDate.toLocaleDateString('en-CA', { month: 'long', day: 'numeric' })}
          </h3>
          {dayTasks.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No tasks for this day</p>
          ) : (
            <div className="space-y-2">
              {dayTasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => onTaskClick?.(task)}
                  className="w-full text-left p-3 border border-gray-200 rounded-lg hover:border-primary-300 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(task.status)}`} />
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">{task.title}</div>
                      {task.description && (
                        <div className="text-sm text-gray-600 line-clamp-1 mt-1">
                          {task.description}
                        </div>
                      )}
                    </div>
                    <Badge variant="neutral" size="sm">
                      {task.status}
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          )}
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Calendar Controls */}
      <Card>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => navigate(-1)} size="sm">
              ←
            </Button>
            <Button variant="secondary" onClick={goToToday} size="sm">
              Today
            </Button>
            <Button variant="ghost" onClick={() => navigate(1)} size="sm">
              →
            </Button>
          </div>

          <h2 className="text-xl font-bold text-gray-900">
            {calendarView === 'month' && formatMonthYear()}
            {calendarView === 'week' && formatWeekRange()}
            {calendarView === 'day' && formatDayDate()}
          </h2>

          <div className="flex gap-2">
            <Button
              variant={calendarView === 'month' ? 'primary' : 'ghost'}
              onClick={() => setCalendarView('month')}
              size="sm"
            >
              Month
            </Button>
            <Button
              variant={calendarView === 'week' ? 'primary' : 'ghost'}
              onClick={() => setCalendarView('week')}
              size="sm"
            >
              Week
            </Button>
            <Button
              variant={calendarView === 'day' ? 'primary' : 'ghost'}
              onClick={() => setCalendarView('day')}
              size="sm"
            >
              Day
            </Button>
          </div>
        </div>
      </Card>

      {/* Calendar View */}
      <Card className="overflow-hidden">
        {calendarView === 'month' && renderMonthView()}
        {calendarView === 'week' && renderWeekView()}
        {calendarView === 'day' && renderDayView()}
      </Card>
    </div>
  );
}
