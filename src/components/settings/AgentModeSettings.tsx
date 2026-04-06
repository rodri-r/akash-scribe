import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useSettingsStore } from "../../stores/settingsStore";
import { HotkeyInput } from "../ui/HotkeyInput";
import { Toggle } from "../ui/toggle";
import { SettingsRow, SettingsPanel, SettingsPanelRow, SectionHeader } from "../ui/SettingsSection";
import ReasoningModelSelector from "../ReasoningModelSelector";

// AKASHML_HIDDEN: Cloud and Key icons removed - were used by the
// OpenWhispr Cloud / Custom Setup mode toggle which is hidden in this fork.
// Restore by importing: import { Cloud, Key } from "lucide-react";

// AKASHML: AkashML default endpoint
const AKASH_ML_BASE_URL = "https://chatapi.akash.network/api/v1";

export default function AgentModeSettings() {
  const { t } = useTranslation();
  const {
    agentEnabled,
    setAgentEnabled,
    agentKey,
    setAgentKey,
    agentModel,
    setAgentModel,
    agentProvider,
    setAgentProvider,
    agentSystemPrompt,
    setAgentSystemPrompt,
    setCloudAgentMode,
    openaiApiKey,
    setOpenaiApiKey,
    anthropicApiKey,
    setAnthropicApiKey,
    geminiApiKey,
    setGeminiApiKey,
    groqApiKey,
    setGroqApiKey,
    customReasoningApiKey,
    setCustomReasoningApiKey,
    cloudReasoningBaseUrl,
    setCloudReasoningBaseUrl,
  } = useSettingsStore();

  // AKASHML: Force byok mode and custom provider on mount so agent always
  // uses AkashML. The OpenWhispr Cloud mode toggle is hidden in this fork.
  // AKASHML_HIDDEN_CLOUD_MODE: to restore the toggle, remove this useEffect
  // and uncomment the isCloudMode / isCustomMode JSX block below.
  useEffect(() => {
    setCloudAgentMode("byok");
    if (!cloudReasoningBaseUrl || cloudReasoningBaseUrl.trim() === "") {
      setCloudReasoningBaseUrl(AKASH_ML_BASE_URL);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-6">
      <SectionHeader
        title={t("agentMode.settings.title")}
        description={t("agentMode.settings.description")}
      />

      {/* Enable/Disable */}
      <SettingsPanel>
        <SettingsPanelRow>
          <SettingsRow
            label={t("agentMode.settings.enabled")}
            description={t("agentMode.settings.enabledDescription")}
          >
            <Toggle checked={agentEnabled} onChange={setAgentEnabled} />
          </SettingsRow>
        </SettingsPanelRow>
      </SettingsPanel>

      {agentEnabled && (
        <>
          {/* Agent Hotkey */}
          <div>
            <SectionHeader
              title={t("agentMode.settings.hotkey")}
              description={t("agentMode.settings.hotkeyDescription")}
            />
            <HotkeyInput value={agentKey} onChange={setAgentKey} />
          </div>

          {/*
            AKASHML_HIDDEN_CLOUD_MODE: OpenWhispr Cloud vs Custom Setup toggle removed.
            Restore by adding back isSignedIn from useSettingsStore and
            uncommenting this block:

            {isSignedIn && (
              <SettingsPanel>
                <SettingsPanelRow>
                  <button onClick={() => { if (!isCloudMode) setCloudAgentMode("openwhispr"); }} ...>
                    <Cloud ... /> OpenWhispr Cloud button
                  </button>
                </SettingsPanelRow>
                <SettingsPanelRow>
                  <button onClick={() => { if (!isCustomMode) setCloudAgentMode("byok"); }} ...>
                    <Key ... /> Custom Setup button
                  </button>
                </SettingsPanelRow>
              </SettingsPanel>
            )}
          */}

          {/* AKASHML: Model selector - always shown, always AkashML */}
          <div>
            <SectionHeader
              title={t("agentMode.settings.model")}
              description={t("agentMode.settings.modelDescription")}
            />
            <ReasoningModelSelector
              reasoningModel={agentModel}
              setReasoningModel={setAgentModel}
              localReasoningProvider={agentProvider}
              setLocalReasoningProvider={setAgentProvider}
              cloudReasoningBaseUrl={cloudReasoningBaseUrl}
              setCloudReasoningBaseUrl={setCloudReasoningBaseUrl}
              openaiApiKey={openaiApiKey}
              setOpenaiApiKey={setOpenaiApiKey}
              anthropicApiKey={anthropicApiKey}
              setAnthropicApiKey={setAnthropicApiKey}
              geminiApiKey={geminiApiKey}
              setGeminiApiKey={setGeminiApiKey}
              groqApiKey={groqApiKey}
              setGroqApiKey={setGroqApiKey}
              customReasoningApiKey={customReasoningApiKey}
              setCustomReasoningApiKey={setCustomReasoningApiKey}
            />
          </div>

          {/* Custom System Prompt */}
          <div>
            <SectionHeader
              title={t("agentMode.settings.systemPrompt")}
              description={t("agentMode.settings.systemPromptDescription")}
            />
            <SettingsPanel>
              <SettingsPanelRow>
                <textarea
                  value={agentSystemPrompt}
                  onChange={(e) => setAgentSystemPrompt(e.target.value)}
                  placeholder={t("agentMode.settings.systemPromptPlaceholder")}
                  rows={4}
                  className="w-full text-xs bg-transparent border border-border/50 rounded-md px-3 py-2 resize-y focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-primary/30 placeholder:text-muted-foreground/50"
                />
              </SettingsPanelRow>
            </SettingsPanel>
          </div>
        </>
      )}
    </div>
  );
}
