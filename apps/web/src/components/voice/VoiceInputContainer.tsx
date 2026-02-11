'use client';

/**
 * VoiceInputContainer
 *
 * Container component that orchestrates voice input flow:
 * 1. FAB for starting recording
 * 2. Recording overlay with live transcript
 * 3. Confirmation card for editing and confirming
 * 4. Error toast for failures
 *
 * Creates activity events with input_method: 'voice'
 */

import { useCallback, useState } from 'react';
import { useVoiceInput, type ParsedVoiceEvent } from '@/lib/voice';
import { useActivityService } from '@/lib/services/ServicesContext';
import { VoiceInputFAB } from './VoiceInputFAB';
import { VoiceRecordingOverlay } from './VoiceRecordingOverlay';
import { VoiceConfirmationCard } from './VoiceConfirmationCard';
import { VoiceErrorToast } from './VoiceErrorToast';

interface VoiceInputContainerProps {
  /** Current project ID (required for creating events) */
  projectId?: string;
  /** Available tasks for task selector */
  tasks?: Array<{ id: string; title: string }>;
  /** Callback when an event is created */
  onEventCreated?: (event: ParsedVoiceEvent) => void;
  /** Callback to open camera (for photo events) */
  onOpenCamera?: () => void;
}

export function VoiceInputContainer({
  projectId,
  tasks = [],
  onEventCreated,
  onOpenCamera,
}: VoiceInputContainerProps) {
  const activityService = useActivityService();
  const {
    state,
    transcript,
    interimTranscript,
    parsedEvent,
    error,
    isSupported,
    startRecording,
    stopRecording,
    cancelRecording,
    reset,
    updateParsedEvent,
  } = useVoiceInput();

  const [selectedTaskId, setSelectedTaskId] = useState<string>('');

  /**
   * Handle FAB press
   */
  const handleFABPress = useCallback(() => {
    if (state === 'recording') {
      stopRecording();
    } else if (state === 'idle' || state === 'error') {
      startRecording();
    }
  }, [state, startRecording, stopRecording]);

  /**
   * Handle event confirmation
   */
  const handleConfirm = useCallback(async () => {
    if (!parsedEvent || !projectId) return;

    try {
      // Determine entity_id based on event type
      const entityId = parsedEvent.event_type.startsWith('task.')
        ? selectedTaskId || 'unknown_task'
        : parsedEvent.event_type.startsWith('photo.')
          ? 'pending_photo'
          : `${parsedEvent.event_type.split('.')[0]}_${Date.now()}`;

      // Create activity event based on type
      const eventType = parsedEvent.event_type;

      // Add input_method to event_data
      const eventData = {
        ...parsedEvent.event_data,
        input_method: 'voice',
        original_transcript: parsedEvent.transcript,
      };

      // Use the appropriate ActivityService method
      if (eventType.startsWith('task.')) {
        await activityService.logTaskEvent(
          eventType as any,
          projectId,
          entityId,
          eventData as any
        );
      } else if (eventType.startsWith('photo.')) {
        await activityService.logPhotoEvent(
          eventType as any,
          projectId,
          entityId,
          eventData as any
        );
        // Open camera if needed
        if (parsedEvent.openCamera && onOpenCamera) {
          onOpenCamera();
        }
      } else if (eventType.startsWith('inspection.')) {
        await activityService.logInspectionEvent(
          eventType as any,
          projectId,
          entityId,
          eventData as any
        );
      } else if (eventType.startsWith('time.')) {
        await activityService.logTimeEvent(
          eventType as any,
          projectId,
          entityId,
          eventData as any
        );
      } else if (eventType === 'field_note.created') {
        await activityService.logFieldNoteEvent(projectId, entityId, eventData as any);
      }

      // Notify parent
      onEventCreated?.(parsedEvent);

      // Reset state
      reset();
      setSelectedTaskId('');
    } catch (err) {
      console.error('Failed to create activity event:', err);
      // TODO: Show error toast
    }
  }, [
    parsedEvent,
    projectId,
    selectedTaskId,
    activityService,
    onEventCreated,
    onOpenCamera,
    reset,
  ]);

  /**
   * Handle discard
   */
  const handleDiscard = useCallback(() => {
    reset();
    setSelectedTaskId('');
  }, [reset]);

  /**
   * Handle error dismiss
   */
  const handleErrorDismiss = useCallback(() => {
    reset();
  }, [reset]);

  return (
    <>
      {/* Voice Input FAB */}
      <VoiceInputFAB
        state={state}
        isSupported={isSupported}
        onPress={handleFABPress}
      />

      {/* Recording Overlay */}
      <VoiceRecordingOverlay
        isVisible={state === 'recording'}
        transcript={transcript}
        interimTranscript={interimTranscript}
        onStop={stopRecording}
        onCancel={cancelRecording}
      />

      {/* Confirmation Card */}
      {state === 'confirming' && parsedEvent && (
        <VoiceConfirmationCard
          parsedEvent={parsedEvent}
          onUpdate={updateParsedEvent}
          onConfirm={handleConfirm}
          onDiscard={handleDiscard}
          tasks={tasks}
          selectedTaskId={selectedTaskId}
          onTaskSelect={setSelectedTaskId}
        />
      )}

      {/* Error Toast */}
      <VoiceErrorToast error={error} onDismiss={handleErrorDismiss} />
    </>
  );
}

export default VoiceInputContainer;
