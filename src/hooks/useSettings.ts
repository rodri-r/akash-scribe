import React, { createContext, useCallback, useContext, useEffect, useRef } from "react";
import { useSettingsStore, initializeSettings } from "../stores/settingsStore";
import logger from "../utils/logger";
import { useLocalStorage } from "./useLocalStorage";
import type { LocalTranscriptionProvider } from "../types/electron";

// ─── AkashML defaults ────────────────────────────────────────────────────────
// Single source of truth for the AkashML endpoint URL.
// The provider is always "custom"; the base URL defaults to the AkashML API.
// Both OnboardingFlow and SettingsPage have their own guards too, but this
// hook-level correction fires earlier, before any component mounts. So
// returning users with an old stored provider value are fixed transparently.
//
// AKASHML_HIDDEN_PROVIDERS: to restore multi-provider support, remove the
// AKASHML_CORRECT_DEFAULTS useEffect below and revert the default values
// in settingsStore (cloudTranscriptionProvider, cloudTranscriptionBaseUrl,
// cloudTranscriptionMode, cloudReasoningMode).
const AKASH_ML_BASE_URL = "https://chatapi.akash.network/api/v1";
// ─────────────────────────────────────────────────────────────────────────────

export interface TranscriptionSettings {
  uiLanguage: string;
  useLocalWhisper: boolean;
  whisperModel: string;
  localTranscriptionProvider: LocalTranscriptionProvider;
  parakeetModel: string;
  allowOpenAIFallback: boolean;
  allowLocalFallback: boolean;
  fallbackWhisperModel: string;
  preferredLanguage: string;
  cloudTranscriptionProvider: string;
  cloudTranscriptionModel: string;
  cloudTranscriptionBaseUrl?: string;
  cloudTranscriptionMode: string;
  customDictionary: string[];
  assemblyAiStreaming: boolean;
}

export interface ReasoningSettings {
  useReasoningModel: boolean;
  reasoningModel: string;
  reasoningProvider: string;
  cloudReasoningBaseUrl?: string;
  cloudReasoningMode: string;
}

export interface HotkeySettings {
  dictationKey: string;
  activationMode: "tap" | "push";
}

export interface MicrophoneSettings {
  preferBuiltInMic: boolean;
  selectedMicDeviceId: string;
}

export interface ApiKeySettings {
  openaiApiKey: string;
  anthropicApiKey: string;
  geminiApiKey: string;
  groqApiKey: string;
  mistralApiKey: string;
  customTranscriptionApiKey: string;
  customReasoningApiKey: string;
}

export interface PrivacySettings {
  cloudBackupEnabled: boolean;
  telemetryEnabled: boolean;
  audioRetentionDays: number;
}

export interface ThemeSettings {
  theme: "light" | "dark" | "auto";
}

export interface AgentModeSettings {
  agentModel: string;
  agentProvider: string;
  agentKey: string;
  agentSystemPrompt: string;
  agentEnabled: boolean;
  cloudAgentMode: string;
}

function useSettingsInternal() {
  const store = useSettingsStore();

  // One-time initialization: sync API keys, dictation key, activation mode,
  // UI language, and dictionary from the main process / SQLite.
  const hasInitialized = useRef(false);
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;
    initializeSettings().catch((err) => {
      logger.warn(
        "Failed to initialize settings store",
        { error: (err as Error).message },
        "settings"
      );
    });
  }, []);

  // AKASHML_CORRECT_DEFAULTS runs once after the store has been initialized.
  // Silently migrates any stored value that points to another provider back to
  // "custom" and AkashML URL so returning users never see a broken state.
  // This is the earliest possible correction point (before any component tree
  // renders) and complements the per-component guards in OnboardingFlow,
  // TranscriptionModelPicker, and SettingsPage.
  const hasAppliedAkashDefaults = useRef(false);
  useEffect(() => {
    if (hasAppliedAkashDefaults.current) return;
    hasAppliedAkashDefaults.current = true;

    const {
      cloudTranscriptionProvider,
      cloudTranscriptionBaseUrl,
      cloudTranscriptionMode,
      cloudReasoningMode,
      setCloudTranscriptionProvider,
      setCloudTranscriptionBaseUrl,
      setCloudTranscriptionMode,
      setCloudReasoningMode,
    } = useSettingsStore.getState();

    if (cloudTranscriptionProvider !== "custom") {
      setCloudTranscriptionProvider("custom");
    }
    if (!cloudTranscriptionBaseUrl || cloudTranscriptionBaseUrl.trim() === "") {
      setCloudTranscriptionBaseUrl(AKASH_ML_BASE_URL);
    }
    if (cloudTranscriptionMode !== "byok") {
      setCloudTranscriptionMode("byok");
    }
    if (cloudReasoningMode !== "byok") {
      setCloudReasoningMode("byok");
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Listen for dictionary updates from main process (auto-learn corrections)
  useEffect(() => {
    if (typeof window === "undefined" || !window.electronAPI?.onDictionaryUpdated) return;
    const unsubscribe = window.electronAPI.onDictionaryUpdated((words: string[]) => {
      if (Array.isArray(words)) {
        store.setCustomDictionary(words);
      }
    });
    return unsubscribe;
  }, [store.setCustomDictionary]);

  // Auto-learn corrections from user edits in external apps
  const [autoLearnCorrections, setAutoLearnCorrectionsRaw] = useLocalStorage(
    "autoLearnCorrections",
    true,
    {
      serialize: String,
      deserialize: (value: string) => value !== "false",
    }
  );

  const setAutoLearnCorrections = useCallback(
    (enabled: boolean) => {
      setAutoLearnCorrectionsRaw(enabled);
      window.electronAPI?.setAutoLearnEnabled?.(enabled);
    },
    [setAutoLearnCorrectionsRaw]
  );

  // Sync auto-learn state to main process on mount
  useEffect(() => {
    window.electronAPI?.setAutoLearnEnabled?.(autoLearnCorrections);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync startup pre-warming preferences to main process
  const {
    useLocalWhisper,
    localTranscriptionProvider,
    whisperModel,
    parakeetModel,
    reasoningProvider,
    reasoningModel,
  } = store;

  useEffect(() => {
    if (typeof window === "undefined" || !window.electronAPI?.syncStartupPreferences) return;

    const model = localTranscriptionProvider === "nvidia" ? parakeetModel : whisperModel;
    window.electronAPI
      .syncStartupPreferences({
        useLocalWhisper,
        localTranscriptionProvider,
        model: model || undefined,
        reasoningProvider,
        reasoningModel: reasoningProvider === "local" ? reasoningModel : undefined,
      })
      .catch((err) =>
        logger.warn(
          "Failed to sync startup preferences",
          { error: (err as Error).message },
          "settings"
        )
      );
  }, [
    useLocalWhisper,
    localTranscriptionProvider,
    whisperModel,
    parakeetModel,
    reasoningProvider,
    reasoningModel,
  ]);

  return {
    useLocalWhisper: store.useLocalWhisper,
    whisperModel: store.whisperModel,
    uiLanguage: store.uiLanguage,
    localTranscriptionProvider: store.localTranscriptionProvider,
    parakeetModel: store.parakeetModel,
    allowOpenAIFallback: store.allowOpenAIFallback,
    allowLocalFallback: store.allowLocalFallback,
    fallbackWhisperModel: store.fallbackWhisperModel,
    preferredLanguage: store.preferredLanguage,
    cloudTranscriptionProvider: store.cloudTranscriptionProvider,
    cloudTranscriptionModel: store.cloudTranscriptionModel,
    cloudTranscriptionBaseUrl: store.cloudTranscriptionBaseUrl,
    cloudReasoningBaseUrl: store.cloudReasoningBaseUrl,
    cloudTranscriptionMode: store.cloudTranscriptionMode,
    cloudReasoningMode: store.cloudReasoningMode,
    customDictionary: store.customDictionary,
    assemblyAiStreaming: store.assemblyAiStreaming,
    setAssemblyAiStreaming: store.setAssemblyAiStreaming,
    useReasoningModel: store.useReasoningModel,
    reasoningModel: store.reasoningModel,
    reasoningProvider: store.reasoningProvider,
    openaiApiKey: store.openaiApiKey,
    anthropicApiKey: store.anthropicApiKey,
    geminiApiKey: store.geminiApiKey,
    groqApiKey: store.groqApiKey,
    mistralApiKey: store.mistralApiKey,
    dictationKey: store.dictationKey,
    theme: store.theme,
    setUseLocalWhisper: store.setUseLocalWhisper,
    setWhisperModel: store.setWhisperModel,
    setUiLanguage: store.setUiLanguage,
    setLocalTranscriptionProvider: store.setLocalTranscriptionProvider,
    setParakeetModel: store.setParakeetModel,
    setAllowOpenAIFallback: store.setAllowOpenAIFallback,
    setAllowLocalFallback: store.setAllowLocalFallback,
    setFallbackWhisperModel: store.setFallbackWhisperModel,
    setPreferredLanguage: store.setPreferredLanguage,
    setCloudTranscriptionProvider: store.setCloudTranscriptionProvider,
    setCloudTranscriptionModel: store.setCloudTranscriptionModel,
    setCloudTranscriptionBaseUrl: store.setCloudTranscriptionBaseUrl,
    setCloudReasoningBaseUrl: store.setCloudReasoningBaseUrl,
    setCloudTranscriptionMode: store.setCloudTranscriptionMode,
    setCloudReasoningMode: store.setCloudReasoningMode,
    setCustomDictionary: store.setCustomDictionary,
    setUseReasoningModel: store.setUseReasoningModel,
    setReasoningModel: store.setReasoningModel,
    setReasoningProvider: store.setReasoningProvider,
    setOpenaiApiKey: store.setOpenaiApiKey,
    setAnthropicApiKey: store.setAnthropicApiKey,
    setGeminiApiKey: store.setGeminiApiKey,
    setGroqApiKey: store.setGroqApiKey,
    setMistralApiKey: store.setMistralApiKey,
    customTranscriptionApiKey: store.customTranscriptionApiKey,
    setCustomTranscriptionApiKey: store.setCustomTranscriptionApiKey,
    customReasoningApiKey: store.customReasoningApiKey,
    setCustomReasoningApiKey: store.setCustomReasoningApiKey,
    setDictationKey: store.setDictationKey,
    setTheme: store.setTheme,
    activationMode: store.activationMode,
    setActivationMode: store.setActivationMode,
    audioCuesEnabled: store.audioCuesEnabled,
    setAudioCuesEnabled: store.setAudioCuesEnabled,
    pauseMediaOnDictation: store.pauseMediaOnDictation,
    setPauseMediaOnDictation: store.setPauseMediaOnDictation,
    floatingIconAutoHide: store.floatingIconAutoHide,
    setFloatingIconAutoHide: store.setFloatingIconAutoHide,
    startMinimized: store.startMinimized,
    setStartMinimized: store.setStartMinimized,
    panelStartPosition: store.panelStartPosition,
    setPanelStartPosition: store.setPanelStartPosition,
    preferBuiltInMic: store.preferBuiltInMic,
    selectedMicDeviceId: store.selectedMicDeviceId,
    setPreferBuiltInMic: store.setPreferBuiltInMic,
    setSelectedMicDeviceId: store.setSelectedMicDeviceId,
    autoLearnCorrections,
    setAutoLearnCorrections,
    keepTranscriptionInClipboard: store.keepTranscriptionInClipboard,
    setKeepTranscriptionInClipboard: store.setKeepTranscriptionInClipboard,
    cloudBackupEnabled: store.cloudBackupEnabled,
    setCloudBackupEnabled: store.setCloudBackupEnabled,
    telemetryEnabled: store.telemetryEnabled,
    setTelemetryEnabled: store.setTelemetryEnabled,
    audioRetentionDays: store.audioRetentionDays,
    setAudioRetentionDays: store.setAudioRetentionDays,
    updateTranscriptionSettings: store.updateTranscriptionSettings,
    updateReasoningSettings: store.updateReasoningSettings,
    updateApiKeys: store.updateApiKeys,
  };
}

export type SettingsValue = ReturnType<typeof useSettingsInternal>;

const SettingsContext = createContext<SettingsValue | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const value = useSettingsInternal();
  return React.createElement(SettingsContext.Provider, { value }, children);
}

export function useSettings(): SettingsValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return ctx;
}
