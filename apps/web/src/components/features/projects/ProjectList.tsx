'use client';

/**
 * ProjectList Component
 *
 * Displays list of projects with search, filtering, and sorting.
 * Mobile-optimized with touch-friendly controls.
 */

import React, { useState, useEffect } from 'react';
import type { Project } from '@hooomz/shared-contracts';
import { useProjectService } from '@/lib/services/ServicesContext';
import { Input, Select, Button, LoadingSpinner } from '@/components/ui';
import { ProjectCard } from './ProjectCard';

interface ProjectListProps {
  initialProjects?: Project[];
}

export function ProjectList({ initialProjects = [] }: ProjectListProps) {
  const projectService = useProjectService();
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>(initialProjects);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'startDate' | 'estimatedCost'>('startDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Load projects
  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setIsLoading(true);
    try {
      const response = await projectService.list();
      if (response.success && response.data) {
        setProjects(response.data.projects);
        setFilteredProjects(response.data.projects);
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Apply filters and sorting
  useEffect(() => {
    let result = [...projects];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.address.street.toLowerCase().includes(query) ||
          p.address.city.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter((p) => p.status === statusFilter);
    }

    // Apply sorting
    result.sort((a, b) => {
      let aVal: any;
      let bVal: any;

      switch (sortBy) {
        case 'name':
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case 'startDate':
          aVal = a.dates.startDate ? new Date(a.dates.startDate).getTime() : 0;
          bVal = b.dates.startDate ? new Date(b.dates.startDate).getTime() : 0;
          break;
        case 'estimatedCost':
          aVal = a.budget.estimatedCost;
          bVal = b.budget.estimatedCost;
          break;
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredProjects(result);
  }, [projects, searchQuery, statusFilter, sortBy, sortOrder]);

  const handleStatusChange = async (projectId: string, newStatus: string) => {
    try {
      const response = await projectService.update(projectId, { status: newStatus });
      if (response.success && response.data) {
        // Update local state
        setProjects((prev) =>
          prev.map((p) => (p.id === projectId ? response.data! : p))
        );
      }
    } catch (error) {
      console.error('Failed to update project status:', error);
      throw error;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" text="Loading projects..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <Input
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            fullWidth
          />

          {/* Status filter */}
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            fullWidth
          >
            <option value="all">All Statuses</option>
            <option value="planning">Planning</option>
            <option value="in-progress">In Progress</option>
            <option value="on-hold">On Hold</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </Select>

          {/* Sort */}
          <div className="flex gap-2">
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              fullWidth
            >
              <option value="startDate">Start Date</option>
              <option value="name">Name</option>
              <option value="estimatedCost">Budget</option>
            </Select>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="min-w-[44px]"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </Button>
          </div>
        </div>

        {/* Results count */}
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            Showing {filteredProjects.length} of {projects.length} projects
          </span>
          <Button variant="ghost" size="sm" onClick={loadProjects}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Project cards */}
      {filteredProjects.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No projects found</p>
          <p className="text-gray-400 text-sm mt-2">
            {searchQuery || statusFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Create your first project to get started'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}
