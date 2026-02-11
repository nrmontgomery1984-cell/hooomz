/**
 * Voice Input Module
 *
 * Provides voice-to-activity capabilities for the field.
 * Tap, speak, confirm — works one-handed with work gloves.
 */

export { useVoiceInput } from './useVoiceInput';
export type {
  VoiceInputState,
  VoiceErrorType,
  VoiceInputError,
  UseVoiceInputReturn,
} from './useVoiceInput';

export {
  parseVoiceInput,
  getEventTypeLabel,
  getEventTypeOptions,
} from './voiceParser';
export type { ParsedVoiceEvent } from './voiceParser';
