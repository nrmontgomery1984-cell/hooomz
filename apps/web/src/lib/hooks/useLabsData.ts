'use client';

/**
 * Labs Data Hooks — React Query hooks for all Labs data
 * Offline-first: reads from IndexedDB via Labs services
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useServicesContext } from '../services/ServicesContext';
import type {
  FieldObservation,
  LabsProduct,
  LabsTechnique,
  LabsToolMethod,
  LabsCombination,
  CrewRating,
  FieldSubmission,
  Experiment,
  KnowledgeItem,
  KnowledgeChallenge,
  ConfidenceEventType,
  Sop,
  SopChecklistItemTemplate,
  SopStatus,
  ObservationDraft,
  ConditionAssessment,
  ToolPlatform,
  ToolResearchItem,
  ToolInventoryItem,
  ToolResearchCategory,
  MaintenanceEntry,
} from '@hooomz/shared-contracts';

// ============================================================================
// Query Keys
// ============================================================================

export const LABS_QUERY_KEYS = {
  // Phase 1
  observations: {
    all: ['labs', 'observations'] as const,
    byProject: (projectId: string) => ['labs', 'observations', 'project', projectId] as const,
    byTask: (taskId: string) => ['labs', 'observations', 'task', taskId] as const,
    detail: (id: string) => ['labs', 'observations', 'detail', id] as const,
  },
  products: {
    all: ['labs', 'products'] as const,
    active: ['labs', 'products', 'active'] as const,
    byCategory: (category: string) => ['labs', 'products', 'category', category] as const,
    search: (query: string) => ['labs', 'products', 'search', query] as const,
  },
  techniques: {
    all: ['labs', 'techniques'] as const,
    active: ['labs', 'techniques', 'active'] as const,
    byCategory: (category: string) => ['labs', 'techniques', 'category', category] as const,
    search: (query: string) => ['labs', 'techniques', 'search', query] as const,
  },
  toolMethods: {
    all: ['labs', 'toolMethods'] as const,
    active: ['labs', 'toolMethods', 'active'] as const,
    byType: (type: string) => ['labs', 'toolMethods', 'type', type] as const,
  },
  combinations: {
    all: ['labs', 'combinations'] as const,
  },
  crewRatings: {
    all: ['labs', 'crewRatings'] as const,
    byProject: (projectId: string) => ['labs', 'crewRatings', 'project', projectId] as const,
  },
  // Phase 2
  submissions: {
    all: ['labs', 'submissions'] as const,
    pending: ['labs', 'submissions', 'pending'] as const,
    byStatus: (status: string) => ['labs', 'submissions', 'status', status] as const,
  },
  notifications: {
    all: ['labs', 'notifications'] as const,
    unread: (userId: string) => ['labs', 'notifications', 'unread', userId] as const,
    unreadCount: (userId: string) => ['labs', 'notifications', 'unreadCount', userId] as const,
  },
  // Phase 3
  experiments: {
    all: ['labs', 'experiments'] as const,
    active: ['labs', 'experiments', 'active'] as const,
    detail: (id: string) => ['labs', 'experiments', 'detail', id] as const,
  },
  participations: {
    byExperiment: (experimentId: string) => ['labs', 'participations', 'experiment', experimentId] as const,
    byProject: (projectId: string) => ['labs', 'participations', 'project', projectId] as const,
  },
  // Phase 4
  knowledge: {
    all: ['labs', 'knowledge'] as const,
    published: ['labs', 'knowledge', 'published'] as const,
    detail: (id: string) => ['labs', 'knowledge', 'detail', id] as const,
    search: (query: string) => ['labs', 'knowledge', 'search', query] as const,
    lowConfidence: (threshold: number) => ['labs', 'knowledge', 'lowConfidence', threshold] as const,
  },
  confidence: {
    history: (itemId: string) => ['labs', 'confidence', 'history', itemId] as const,
  },
  challenges: {
    byItem: (itemId: string) => ['labs', 'challenges', 'item', itemId] as const,
    pending: ['labs', 'challenges', 'pending'] as const,
  },
  // Build 1.5: SOPs
  sops: {
    all: ['labs', 'sops'] as const,
    current: ['labs', 'sops', 'current'] as const,
    detail: (id: string) => ['labs', 'sops', 'detail', id] as const,
    byCode: (sopCode: string) => ['labs', 'sops', 'code', sopCode] as const,
    byTradeFamily: (tradeFamily: string) => ['labs', 'sops', 'tradeFamily', tradeFamily] as const,
    byStatus: (status: string) => ['labs', 'sops', 'status', status] as const,
    versionHistory: (sopCode: string) => ['labs', 'sops', 'versions', sopCode] as const,
    checklist: (sopId: string) => ['labs', 'sops', 'checklist', sopId] as const,
    observationConfig: (sopId: string) => ['labs', 'sops', 'observationConfig', sopId] as const,
  },
  // Build 2: Pending Batch Observations
  pendingBatch: {
    all: ['labs', 'pendingBatch'] as const,
    byTask: (taskId: string) => ['labs', 'pendingBatch', 'task', taskId] as const,
    byCrewMember: (crewMemberId: string) => ['labs', 'pendingBatch', 'crew', crewMemberId] as const,
    count: ['labs', 'pendingBatch', 'count'] as const,
    countByTask: (taskId: string) => ['labs', 'pendingBatch', 'count', taskId] as const,
  },
  // Tool Research
  toolResearch: {
    platforms: ['labs', 'toolResearch', 'platforms'] as const,
    researchItems: (category?: string) => ['labs', 'toolResearch', 'items', category] as const,
    inventory: (filters?: Record<string, string>) => ['labs', 'toolResearch', 'inventory', filters] as const,
  },
};

// ============================================================================
// Phase 1: Observations
// ============================================================================

export function useLabsObservations() {
  const { services, isLoading } = useServicesContext();
  return useQuery({
    queryKey: LABS_QUERY_KEYS.observations.all,
    queryFn: () => services!.labs.observations.findAll(),
    enabled: !isLoading && !!services,
  });
}

export function useLabsObservationsByProject(projectId: string) {
  const { services, isLoading } = useServicesContext();
  return useQuery({
    queryKey: LABS_QUERY_KEYS.observations.byProject(projectId),
    queryFn: () => services!.labs.observations.findByProject(projectId),
    enabled: !isLoading && !!services && !!projectId,
  });
}

export function useLabsObservationsByTask(taskId: string) {
  const { services, isLoading } = useServicesContext();
  return useQuery({
    queryKey: LABS_QUERY_KEYS.observations.byTask(taskId),
    queryFn: () => services!.labs.observations.findByTask(taskId),
    enabled: !isLoading && !!services && !!taskId,
  });
}

export function useCreateObservation() {
  const { services } = useServicesContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<FieldObservation, 'id' | 'metadata'>) =>
      services!.labs.observations.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LABS_QUERY_KEYS.observations.all });
    },
  });
}

// ============================================================================
// Phase 1: Products
// ============================================================================

export function useLabsProducts() {
  const { services, isLoading } = useServicesContext();
  return useQuery({
    queryKey: LABS_QUERY_KEYS.products.all,
    queryFn: () => services!.labs.catalog.findAllProducts(),
    enabled: !isLoading && !!services,
  });
}

export function useLabsActiveProducts() {
  const { services, isLoading } = useServicesContext();
  return useQuery({
    queryKey: LABS_QUERY_KEYS.products.active,
    queryFn: () => services!.labs.catalog.findActiveProducts(),
    enabled: !isLoading && !!services,
  });
}

export function useLabsProductsByCategory(category: string) {
  const { services, isLoading } = useServicesContext();
  return useQuery({
    queryKey: LABS_QUERY_KEYS.products.byCategory(category),
    queryFn: () => services!.labs.catalog.findProductsByCategory(category),
    enabled: !isLoading && !!services && !!category,
  });
}

export function useSearchLabsProducts(query: string) {
  const { services, isLoading } = useServicesContext();
  return useQuery({
    queryKey: LABS_QUERY_KEYS.products.search(query),
    queryFn: () => services!.labs.catalog.searchProducts(query),
    enabled: !isLoading && !!services && query.length >= 2,
  });
}

export function useCreateLabsProduct() {
  const { services } = useServicesContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<LabsProduct, 'id' | 'metadata'>) =>
      services!.labs.catalog.createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LABS_QUERY_KEYS.products.all });
    },
  });
}

// ============================================================================
// Phase 1: Techniques
// ============================================================================

export function useLabsTechniques() {
  const { services, isLoading } = useServicesContext();
  return useQuery({
    queryKey: LABS_QUERY_KEYS.techniques.all,
    queryFn: () => services!.labs.catalog.findAllTechniques(),
    enabled: !isLoading && !!services,
  });
}

export function useLabsActiveTechniques() {
  const { services, isLoading } = useServicesContext();
  return useQuery({
    queryKey: LABS_QUERY_KEYS.techniques.active,
    queryFn: () => services!.labs.catalog.findActiveTechniques(),
    enabled: !isLoading && !!services,
  });
}

export function useCreateLabsTechnique() {
  const { services } = useServicesContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<LabsTechnique, 'id' | 'metadata'>) =>
      services!.labs.catalog.createTechnique(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LABS_QUERY_KEYS.techniques.all });
    },
  });
}

// ============================================================================
// Phase 1: Tool Methods
// ============================================================================

export function useLabsToolMethods() {
  const { services, isLoading } = useServicesContext();
  return useQuery({
    queryKey: LABS_QUERY_KEYS.toolMethods.all,
    queryFn: () => services!.labs.catalog.findAllToolMethods(),
    enabled: !isLoading && !!services,
  });
}

export function useCreateLabsToolMethod() {
  const { services } = useServicesContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<LabsToolMethod, 'id' | 'metadata'>) =>
      services!.labs.catalog.createToolMethod(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LABS_QUERY_KEYS.toolMethods.all });
    },
  });
}

// ============================================================================
// Phase 1: Combinations
// ============================================================================

export function useLabsCombinations() {
  const { services, isLoading } = useServicesContext();
  return useQuery({
    queryKey: LABS_QUERY_KEYS.combinations.all,
    queryFn: () => services!.labs.catalog.findAllCombinations(),
    enabled: !isLoading && !!services,
  });
}

export function useCreateLabsCombination() {
  const { services } = useServicesContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<LabsCombination, 'id' | 'metadata'>) =>
      services!.labs.catalog.createCombination(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LABS_QUERY_KEYS.combinations.all });
    },
  });
}

// ============================================================================
// Phase 1: Crew Ratings
// ============================================================================

export function useLabsCrewRatings() {
  const { services, isLoading } = useServicesContext();
  return useQuery({
    queryKey: LABS_QUERY_KEYS.crewRatings.all,
    queryFn: () => services!.labs.crewRatings.findAll(),
    enabled: !isLoading && !!services,
  });
}

export function useLabsCrewRatingsByProject(projectId: string) {
  const { services, isLoading } = useServicesContext();
  return useQuery({
    queryKey: LABS_QUERY_KEYS.crewRatings.byProject(projectId),
    queryFn: () => services!.labs.crewRatings.findByProject(projectId),
    enabled: !isLoading && !!services && !!projectId,
  });
}

export function useCreateCrewRating() {
  const { services } = useServicesContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<CrewRating, 'id' | 'metadata'>) =>
      services!.labs.crewRatings.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LABS_QUERY_KEYS.crewRatings.all });
    },
  });
}

// ============================================================================
// Phase 2: Submissions
// ============================================================================

export function useLabsSubmissions() {
  const { services, isLoading } = useServicesContext();
  return useQuery({
    queryKey: LABS_QUERY_KEYS.submissions.all,
    queryFn: () => services!.labs.submissions.findAll(),
    enabled: !isLoading && !!services,
  });
}

export function useLabsPendingSubmissions() {
  const { services, isLoading } = useServicesContext();
  return useQuery({
    queryKey: LABS_QUERY_KEYS.submissions.pending,
    queryFn: () => services!.labs.submissions.findPending(),
    enabled: !isLoading && !!services,
  });
}

export function useCreateSubmission() {
  const { services } = useServicesContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<FieldSubmission, 'id' | 'metadata'>) =>
      services!.labs.submissions.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LABS_QUERY_KEYS.submissions.all });
    },
  });
}

// ============================================================================
// Phase 2: Notifications
// ============================================================================

export function useLabsUnreadNotifications(userId: string) {
  const { services, isLoading } = useServicesContext();
  return useQuery({
    queryKey: LABS_QUERY_KEYS.notifications.unread(userId),
    queryFn: () => services!.labs.notifications.findUnread(userId),
    enabled: !isLoading && !!services && !!userId,
  });
}

export function useLabsUnreadCount(userId: string) {
  const { services, isLoading } = useServicesContext();
  return useQuery({
    queryKey: LABS_QUERY_KEYS.notifications.unreadCount(userId),
    queryFn: () => services!.labs.notifications.getUnreadCount(userId),
    enabled: !isLoading && !!services && !!userId,
    refetchInterval: 30_000, // Poll every 30s
  });
}

export function useMarkNotificationRead() {
  const { services } = useServicesContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => services!.labs.notifications.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['labs', 'notifications'] });
    },
  });
}

// ============================================================================
// Phase 3: Experiments
// ============================================================================

export function useLabsExperiments() {
  const { services, isLoading } = useServicesContext();
  return useQuery({
    queryKey: LABS_QUERY_KEYS.experiments.all,
    queryFn: () => services!.labs.experiments.findAllExperiments(),
    enabled: !isLoading && !!services,
  });
}

export function useLabsActiveExperiments() {
  const { services, isLoading } = useServicesContext();
  return useQuery({
    queryKey: LABS_QUERY_KEYS.experiments.active,
    queryFn: () => services!.labs.experiments.findActiveExperiments(),
    enabled: !isLoading && !!services,
  });
}

export function useLabsExperiment(id: string) {
  const { services, isLoading } = useServicesContext();
  return useQuery({
    queryKey: LABS_QUERY_KEYS.experiments.detail(id),
    queryFn: () => services!.labs.experiments.findExperimentById(id),
    enabled: !isLoading && !!services && !!id,
  });
}

export function useCreateExperiment() {
  const { services } = useServicesContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<Experiment, 'id' | 'metadata'>) =>
      services!.labs.experiments.createExperiment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LABS_QUERY_KEYS.experiments.all });
    },
  });
}

export function useLabsParticipationsByProject(projectId: string) {
  const { services, isLoading } = useServicesContext();
  return useQuery({
    queryKey: LABS_QUERY_KEYS.participations.byProject(projectId),
    queryFn: () => services!.labs.experiments.findParticipationsByProject(projectId),
    enabled: !isLoading && !!services && !!projectId,
  });
}

export function useAcceptParticipation() {
  const { services } = useServicesContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => services!.labs.experiments.acceptParticipation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['labs', 'participations'] });
      queryClient.invalidateQueries({ queryKey: ['labs', 'experiments'] });
    },
  });
}

// ============================================================================
// Phase 4: Knowledge Items
// ============================================================================

export function useLabsKnowledgeItems() {
  const { services, isLoading } = useServicesContext();
  return useQuery({
    queryKey: LABS_QUERY_KEYS.knowledge.all,
    queryFn: () => services!.labs.knowledge.findAll(),
    enabled: !isLoading && !!services,
  });
}

export function useLabsPublishedKnowledge() {
  const { services, isLoading } = useServicesContext();
  return useQuery({
    queryKey: LABS_QUERY_KEYS.knowledge.published,
    queryFn: () => services!.labs.knowledge.findPublished(),
    enabled: !isLoading && !!services,
  });
}

export function useLabsKnowledgeItem(id: string) {
  const { services, isLoading } = useServicesContext();
  return useQuery({
    queryKey: LABS_QUERY_KEYS.knowledge.detail(id),
    queryFn: () => services!.labs.knowledge.findById(id),
    enabled: !isLoading && !!services && !!id,
  });
}

export function useSearchLabsKnowledge(query: string) {
  const { services, isLoading } = useServicesContext();
  return useQuery({
    queryKey: LABS_QUERY_KEYS.knowledge.search(query),
    queryFn: () => services!.labs.knowledge.search(query),
    enabled: !isLoading && !!services && query.length >= 2,
  });
}

export function useLabsLowConfidence(threshold: number = 50) {
  const { services, isLoading } = useServicesContext();
  return useQuery({
    queryKey: LABS_QUERY_KEYS.knowledge.lowConfidence(threshold),
    queryFn: () => services!.labs.knowledge.findLowConfidence(threshold),
    enabled: !isLoading && !!services,
  });
}

export function useCreateKnowledgeItem() {
  const { services } = useServicesContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<KnowledgeItem, 'id' | 'metadata'>) =>
      services!.labs.knowledge.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LABS_QUERY_KEYS.knowledge.all });
    },
  });
}

// ============================================================================
// Phase 4: Confidence
// ============================================================================

export function useConfidenceHistory(knowledgeItemId: string) {
  const { services, isLoading } = useServicesContext();
  return useQuery({
    queryKey: LABS_QUERY_KEYS.confidence.history(knowledgeItemId),
    queryFn: () => services!.labs.confidence.getHistory(knowledgeItemId),
    enabled: !isLoading && !!services && !!knowledgeItemId,
  });
}

export function useRecordConfidenceEvent() {
  const { services } = useServicesContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      knowledgeItemId: string;
      eventType: ConfidenceEventType;
      change: number;
      sourceId?: string;
      notes?: string;
    }) => services!.labs.confidence.recordEvent(
      data.knowledgeItemId,
      data.eventType,
      data.change,
      data.sourceId,
      data.notes
    ),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: LABS_QUERY_KEYS.confidence.history(variables.knowledgeItemId),
      });
      queryClient.invalidateQueries({
        queryKey: LABS_QUERY_KEYS.knowledge.detail(variables.knowledgeItemId),
      });
      queryClient.invalidateQueries({ queryKey: LABS_QUERY_KEYS.knowledge.all });
    },
  });
}

// ============================================================================
// Phase 4: Challenges
// ============================================================================

export function useLabsChallengesForItem(knowledgeItemId: string) {
  const { services, isLoading } = useServicesContext();
  return useQuery({
    queryKey: LABS_QUERY_KEYS.challenges.byItem(knowledgeItemId),
    queryFn: () => services!.labs.knowledge.findChallengesForItem(knowledgeItemId),
    enabled: !isLoading && !!services && !!knowledgeItemId,
  });
}

export function useLabsPendingChallenges() {
  const { services, isLoading } = useServicesContext();
  return useQuery({
    queryKey: LABS_QUERY_KEYS.challenges.pending,
    queryFn: () => services!.labs.knowledge.findPendingChallenges(),
    enabled: !isLoading && !!services,
  });
}

export function useFileChallenge() {
  const { services } = useServicesContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<KnowledgeChallenge, 'id' | 'metadata'>) =>
      services!.labs.knowledge.fileChallenge(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: LABS_QUERY_KEYS.challenges.byItem(variables.knowledgeItemId),
      });
      queryClient.invalidateQueries({ queryKey: LABS_QUERY_KEYS.challenges.pending });
      queryClient.invalidateQueries({ queryKey: LABS_QUERY_KEYS.knowledge.all });
    },
  });
}

// ============================================================================
// Build 1.5: SOPs
// ============================================================================

export function useSops() {
  const { services, isLoading } = useServicesContext();
  return useQuery({
    queryKey: LABS_QUERY_KEYS.sops.all,
    queryFn: () => services!.labs.sops.findAll(),
    enabled: !isLoading && !!services,
  });
}

export function useSop(id: string) {
  const { services, isLoading } = useServicesContext();
  return useQuery({
    queryKey: LABS_QUERY_KEYS.sops.detail(id),
    queryFn: () => services!.labs.sops.findById(id),
    enabled: !isLoading && !!services && !!id,
  });
}

export function useCurrentSops() {
  const { services, isLoading } = useServicesContext();
  return useQuery({
    queryKey: LABS_QUERY_KEYS.sops.current,
    queryFn: () => services!.labs.sops.getAllCurrent(),
    enabled: !isLoading && !!services,
  });
}

export function useSopByCode(sopCode: string) {
  const { services, isLoading } = useServicesContext();
  return useQuery({
    queryKey: LABS_QUERY_KEYS.sops.byCode(sopCode),
    queryFn: () => services!.labs.sops.getCurrentBySopCode(sopCode),
    enabled: !isLoading && !!services && !!sopCode,
  });
}

export function useSopsByTradeFamily(tradeFamily: string) {
  const { services, isLoading } = useServicesContext();
  return useQuery({
    queryKey: LABS_QUERY_KEYS.sops.byTradeFamily(tradeFamily),
    queryFn: () => services!.labs.sops.getAllCurrentByTradeFamily(tradeFamily),
    enabled: !isLoading && !!services && !!tradeFamily,
  });
}

export function useSopsByStatus(status: SopStatus) {
  const { services, isLoading } = useServicesContext();
  return useQuery({
    queryKey: LABS_QUERY_KEYS.sops.byStatus(status),
    queryFn: () => services!.labs.sops.getByStatus(status),
    enabled: !isLoading && !!services && !!status,
  });
}

export function useSopVersionHistory(sopCode: string) {
  const { services, isLoading } = useServicesContext();
  return useQuery({
    queryKey: LABS_QUERY_KEYS.sops.versionHistory(sopCode),
    queryFn: () => services!.labs.sops.getVersionHistory(sopCode),
    enabled: !isLoading && !!services && !!sopCode,
  });
}

export function useSopChecklistItems(sopId: string) {
  const { services, isLoading } = useServicesContext();
  return useQuery({
    queryKey: LABS_QUERY_KEYS.sops.checklist(sopId),
    queryFn: () => services!.labs.sops.getChecklistForTask(sopId),
    enabled: !isLoading && !!services && !!sopId,
  });
}

export function useSopObservationConfig(sopId: string) {
  const { services, isLoading } = useServicesContext();
  return useQuery({
    queryKey: LABS_QUERY_KEYS.sops.observationConfig(sopId),
    queryFn: () => services!.labs.sops.getObservationConfig(sopId),
    enabled: !isLoading && !!services && !!sopId,
  });
}

export function useCreateSop() {
  const { services } = useServicesContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<Sop, 'id' | 'metadata' | 'version' | 'isCurrent' | 'previousVersionId' | 'supersededDate'>) =>
      services!.labs.sops.createSop(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LABS_QUERY_KEYS.sops.all });
      queryClient.invalidateQueries({ queryKey: LABS_QUERY_KEYS.sops.current });
    },
  });
}

export function useCreateSopVersion() {
  const { services } = useServicesContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      sopCode: string;
      changes: Partial<Omit<Sop, 'id' | 'metadata' | 'sopCode' | 'version' | 'isCurrent' | 'previousVersionId' | 'supersededDate'>>;
      versionNotes: string;
    }) => services!.labs.sops.createNewVersion(data.sopCode, data.changes, data.versionNotes),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: LABS_QUERY_KEYS.sops.all });
      queryClient.invalidateQueries({ queryKey: LABS_QUERY_KEYS.sops.current });
      queryClient.invalidateQueries({ queryKey: LABS_QUERY_KEYS.sops.byCode(variables.sopCode) });
      queryClient.invalidateQueries({ queryKey: LABS_QUERY_KEYS.sops.versionHistory(variables.sopCode) });
    },
  });
}

export function useArchiveSop() {
  const { services } = useServicesContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sopId: string) => services!.labs.sops.archiveSop(sopId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LABS_QUERY_KEYS.sops.all });
      queryClient.invalidateQueries({ queryKey: LABS_QUERY_KEYS.sops.current });
    },
  });
}

export function useAddChecklistItem() {
  const { services } = useServicesContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      sopId: string;
      item: Omit<SopChecklistItemTemplate, 'id' | 'metadata' | 'sopId' | 'stepNumber'>;
    }) => services!.labs.sops.addChecklistItem(data.sopId, data.item),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: LABS_QUERY_KEYS.sops.checklist(result.sopId) });
      queryClient.invalidateQueries({ queryKey: LABS_QUERY_KEYS.sops.observationConfig(result.sopId) });
    },
  });
}

export function useUpdateChecklistItem() {
  const { services } = useServicesContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      itemId: string;
      changes: Partial<Omit<SopChecklistItemTemplate, 'id' | 'metadata' | 'sopId'>>;
      sopId: string;
    }) => services!.labs.sops.updateChecklistItem(data.itemId, data.changes),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: LABS_QUERY_KEYS.sops.checklist(variables.sopId) });
      queryClient.invalidateQueries({ queryKey: LABS_QUERY_KEYS.sops.observationConfig(variables.sopId) });
    },
  });
}

export function useRemoveChecklistItem() {
  const { services } = useServicesContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { itemId: string; sopId: string }) =>
      services!.labs.sops.removeChecklistItem(data.itemId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: LABS_QUERY_KEYS.sops.checklist(variables.sopId) });
      queryClient.invalidateQueries({ queryKey: LABS_QUERY_KEYS.sops.observationConfig(variables.sopId) });
    },
  });
}

// ============================================================================
// Build 2: Observation Trigger System
// ============================================================================

export function useHandleChecklistItemComplete() {
  const { services } = useServicesContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      checklistItemId: string;
      taskId: string;
      sopId: string;
      projectId: string;
      crewMemberId: string;
    }) => services!.labs.observationTrigger.handleChecklistItemComplete(
      data.checklistItemId,
      data.taskId,
      data.sopId,
      data.projectId,
      data.crewMemberId
    ),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: LABS_QUERY_KEYS.pendingBatch.byTask(variables.taskId) });
      queryClient.invalidateQueries({ queryKey: LABS_QUERY_KEYS.pendingBatch.count });
      queryClient.invalidateQueries({ queryKey: LABS_QUERY_KEYS.pendingBatch.countByTask(variables.taskId) });
    },
  });
}

export function usePendingBatchItems(taskId: string) {
  const { services, isLoading } = useServicesContext();
  return useQuery({
    queryKey: LABS_QUERY_KEYS.pendingBatch.byTask(taskId),
    queryFn: () => services!.labs.observationTrigger.getBatchQueue(taskId),
    enabled: !isLoading && !!services && !!taskId,
  });
}

export function usePendingBatchCount(taskId?: string) {
  const { services, isLoading } = useServicesContext();
  return useQuery({
    queryKey: taskId ? LABS_QUERY_KEYS.pendingBatch.countByTask(taskId) : LABS_QUERY_KEYS.pendingBatch.count,
    queryFn: () => services!.labs.observationTrigger.getPendingBatchCount(taskId),
    enabled: !isLoading && !!services,
  });
}

export function useConfirmObservation() {
  const { services } = useServicesContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      draft: ObservationDraft;
      taskId: string;
      projectId: string;
      crewMemberId: string;
      sopVersionId?: string;
      deviated?: boolean;
      deviationFields?: string[];
      deviationReason?: string;
      notes?: string;
      photoIds?: string[];
      conditionAssessment?: ConditionAssessment;
    }) => services!.labs.observationTrigger.confirmObservation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LABS_QUERY_KEYS.observations.all });
      queryClient.invalidateQueries({ queryKey: LABS_QUERY_KEYS.pendingBatch.all });
      queryClient.invalidateQueries({ queryKey: LABS_QUERY_KEYS.pendingBatch.count });
    },
  });
}

export function useConfirmBatchItem() {
  const { services } = useServicesContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      pendingBatchId: string;
      overrides?: {
        deviated?: boolean;
        deviationFields?: string[];
        deviationReason?: string;
        notes?: string;
        photoIds?: string[];
        conditionAssessment?: ConditionAssessment;
      };
    }) => services!.labs.observationTrigger.confirmBatchItem(data.pendingBatchId, data.overrides),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LABS_QUERY_KEYS.observations.all });
      queryClient.invalidateQueries({ queryKey: LABS_QUERY_KEYS.pendingBatch.all });
      queryClient.invalidateQueries({ queryKey: LABS_QUERY_KEYS.pendingBatch.count });
    },
  });
}

export function useSkipBatchItem() {
  const { services } = useServicesContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (pendingBatchId: string) =>
      services!.labs.observationTrigger.skipBatchItem(pendingBatchId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LABS_QUERY_KEYS.pendingBatch.all });
      queryClient.invalidateQueries({ queryKey: LABS_QUERY_KEYS.pendingBatch.count });
    },
  });
}

export function useConfirmAllBatch() {
  const { services } = useServicesContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: string) =>
      services!.labs.observationTrigger.confirmAllBatch(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LABS_QUERY_KEYS.observations.all });
      queryClient.invalidateQueries({ queryKey: LABS_QUERY_KEYS.pendingBatch.all });
      queryClient.invalidateQueries({ queryKey: LABS_QUERY_KEYS.pendingBatch.count });
    },
  });
}

// ============================================================================
// Labs Dashboard Aggregation
// ============================================================================

export interface LabsDashboardStats {
  activeExperiments: number;
  fieldObservations: number;
  knowledgeItems: number;
  contentReady: number;
  productsRated: number;
}

export interface LabsDashboardData {
  stats: LabsDashboardStats;
  recentObservations: FieldObservation[];
  contentReadyItems: KnowledgeItem[];
  activeExperimentsList: Experiment[];
  isLoading: boolean;
}

export function useLabsDashboardData(): LabsDashboardData {
  const { data: observations = [], isLoading: obsLoading } = useLabsObservations();
  const { data: knowledgeItems = [], isLoading: knLoading } = useLabsKnowledgeItems();
  const { data: experiments = [], isLoading: expLoading } = useLabsActiveExperiments();

  const isLoading = obsLoading || knLoading || expLoading;

  // Recent observations: sorted by date descending, top 10
  const recentObservations = [...observations]
    .sort((a, b) => new Date(b.metadata.createdAt).getTime() - new Date(a.metadata.createdAt).getTime())
    .slice(0, 10);

  // Knowledge items with 3+ observations — ready for content
  const contentReadyItems = knowledgeItems.filter(
    (item) => item.observationCount >= 3,
  );

  // Count distinct products that have been rated in observations
  const ratedProductIds = new Set<string>();
  for (const obs of observations) {
    if (obs.productId && obs.quality) {
      ratedProductIds.add(obs.productId);
    }
  }

  const stats: LabsDashboardStats = {
    activeExperiments: experiments.length,
    fieldObservations: observations.length,
    knowledgeItems: knowledgeItems.length,
    contentReady: contentReadyItems.length,
    productsRated: ratedProductIds.size,
  };

  return {
    stats,
    recentObservations,
    contentReadyItems,
    activeExperimentsList: experiments,
    isLoading,
  };
}

// ============================================================================
// Tool Research
// ============================================================================

export function useToolPlatforms() {
  const { services, isLoading } = useServicesContext();
  return useQuery<ToolPlatform[]>({
    queryKey: LABS_QUERY_KEYS.toolResearch.platforms,
    queryFn: () => services!.labs.toolResearch.getPlatforms(),
    enabled: !isLoading && !!services,
  });
}

export function useToolResearchItems(category?: ToolResearchCategory) {
  const { services, isLoading } = useServicesContext();
  return useQuery<ToolResearchItem[]>({
    queryKey: LABS_QUERY_KEYS.toolResearch.researchItems(category),
    queryFn: () => services!.labs.toolResearch.getResearchItems(category),
    enabled: !isLoading && !!services,
  });
}

export function useToolInventory(filters?: { status?: string; platform?: string; category?: string }) {
  const { services, isLoading } = useServicesContext();
  return useQuery<ToolInventoryItem[]>({
    queryKey: LABS_QUERY_KEYS.toolResearch.inventory(filters as Record<string, string>),
    queryFn: () => services!.labs.toolResearch.getInventory(filters),
    enabled: !isLoading && !!services,
  });
}

export function useUpdateInventoryItem() {
  const { services } = useServicesContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { id: string; changes: Partial<Omit<ToolInventoryItem, 'id' | 'metadata'>> }) =>
      services!.labs.toolResearch.updateInventoryItem(data.id, data.changes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['labs', 'toolResearch'] });
    },
  });
}

export function useUpdateResearchItem() {
  const { services } = useServicesContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { id: string; changes: Partial<Omit<ToolResearchItem, 'id' | 'metadata'>> }) =>
      services!.labs.toolResearch.updateResearchItem(data.id, data.changes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['labs', 'toolResearch'] });
    },
  });
}

export function useMarkAsPurchased() {
  const { services } = useServicesContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { researchItemId: string; date: string; price: number; retailer: string }) =>
      services!.labs.toolResearch.markAsPurchased(data.researchItemId, data.date, data.price, data.retailer),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['labs', 'toolResearch'] });
    },
  });
}

export function useMarkAsReceived() {
  const { services } = useServicesContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { id: string; date: string; price?: number }) =>
      services!.labs.toolResearch.markAsReceived(data.id, data.date, data.price),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['labs', 'toolResearch'] });
    },
  });
}

export function useRetireInventoryItem() {
  const { services } = useServicesContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { id: string; reason?: string; replacedById?: string }) =>
      services!.labs.toolResearch.retireInventoryItem(data.id, data.reason, data.replacedById),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['labs', 'toolResearch'] });
    },
  });
}

export function useArchiveInventoryItem() {
  const { services } = useServicesContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { id: string; reason?: string }) =>
      services!.labs.toolResearch.archiveInventoryItem(data.id, data.reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['labs', 'toolResearch'] });
    },
  });
}

export function useDeleteInventoryItem() {
  const { services } = useServicesContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { id: string }) =>
      services!.labs.toolResearch.deleteInventoryItem(data.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['labs', 'toolResearch'] });
    },
  });
}

export function useRegisterRidgid() {
  const { services } = useServicesContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { id: string; registrationDate: string }) =>
      services!.labs.toolResearch.registerRidgid(data.id, data.registrationDate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['labs', 'toolResearch'] });
    },
  });
}

export function useLogToolUse() {
  const { services } = useServicesContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => services!.labs.toolResearch.logUse(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['labs', 'toolResearch'] });
    },
  });
}

export function useAdvanceContentStatus() {
  const { services } = useServicesContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { entityType: 'research' | 'inventory'; id: string }) =>
      services!.labs.toolResearch.advanceContentStatus(data.entityType, data.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['labs', 'toolResearch'] });
    },
  });
}

export function useAddMaintenanceEntry() {
  const { services } = useServicesContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { id: string; entry: MaintenanceEntry }) =>
      services!.labs.toolResearch.addMaintenanceEntry(data.id, data.entry),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['labs', 'toolResearch'] });
    },
  });
}
