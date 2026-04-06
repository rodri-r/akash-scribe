import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Zap } from "lucide-react";
import ApiKeyInput from "./ui/ApiKeyInput";
import ModelCardList from "./ui/ModelCardList";
import { ProviderTabs } from "./ui/ProviderTabs";
import { API_ENDPOINTS, buildApiUrl, normalizeBaseUrl } from "../config/constants";
import logger from "../utils/logger";
import { REASONING_PROVIDERS } from "../models/ModelRegistry";
import { isSecureEndpoint } from "../utils/urlUtils";

// AKASHML: AkashML endpoint default for reasoning/intelligence
const AKASH_ML_BASE_URL = "https://chatapi.akash.network/api/v1";

// AKASHML_HIDDEN_PROVIDERS: original cloud provider list kept for reference.
// Restore by replacing AKASHML_CLOUD_PROVIDERS with the full list:
// const cloudProviderIds = ["openai", "anthropic", "gemini", "groq", "custom"];
const AKASHML_CLOUD_PROVIDERS = [
  { id: "custom", name: "Akash ML" },
];

// AKASHML_HIDDEN_LOCAL: GpuStatusBadge and LocalModelPicker removed.
// The local reasoning mode (llama.cpp / local LLMs) is hidden in this fork.
// To restore: re-add the GpuStatusBadge component, import LocalModelPicker,
// and uncomment the MODE_TABS / local panel JSX below.

type CloudModelOption = {
  value: string;
  label: string;
  description?: string;
  descriptionKey?: string;
  icon?: string;
  ownedBy?: string;
  invertInDark?: boolean;
};

interface ReasoningModelSelectorProps {
  reasoningModel: string;
  setReasoningModel: (model: string) => void;
  localReasoningProvider: string;
  setLocalReasoningProvider: (provider: string) => void;
  cloudReasoningBaseUrl: string;
  setCloudReasoningBaseUrl: (value: string) => void;
  openaiApiKey: string;
  setOpenaiApiKey: (key: string) => void;
  anthropicApiKey: string;
  setAnthropicApiKey: (key: string) => void;
  geminiApiKey: string;
  setGeminiApiKey: (key: string) => void;
  groqApiKey: string;
  setGroqApiKey: (key: string) => void;
  customReasoningApiKey?: string;
  setCustomReasoningApiKey?: (key: string) => void;
}

export default function ReasoningModelSelector({
  reasoningModel,
  setReasoningModel,
  localReasoningProvider,
  setLocalReasoningProvider,
  cloudReasoningBaseUrl,
  setCloudReasoningBaseUrl,
  openaiApiKey,
  setOpenaiApiKey,
  anthropicApiKey,
  setAnthropicApiKey,
  geminiApiKey,
  setGeminiApiKey,
  groqApiKey,
  setGroqApiKey,
  customReasoningApiKey = "",
  setCustomReasoningApiKey,
}: ReasoningModelSelectorProps) {
  const { t } = useTranslation();

  // AKASHML: Always "custom" provider, always cloud mode.
  // AKASHML_HIDDEN_LOCAL: selectedMode state removed - was "cloud" | "local".
  // AKASHML_HIDDEN_PROVIDERS: selectedCloudProvider state simplified to always "custom".
  const [selectedCloudProvider] = useState("custom");

  const [customModelOptions, setCustomModelOptions] = useState<CloudModelOption[]>([]);
  const [customModelsLoading, setCustomModelsLoading] = useState(false);
  const [customModelsError, setCustomModelsError] = useState<string | null>(null);
  const [customBaseInput, setCustomBaseInput] = useState(
    cloudReasoningBaseUrl || AKASH_ML_BASE_URL
  );
  const lastLoadedBaseRef = useRef<string | null>(null);
  const pendingBaseRef = useRef<string | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // AKASHML: Pre-fill AkashML URL if blank and force provider to "custom"
  useEffect(() => {
    if (!cloudReasoningBaseUrl || cloudReasoningBaseUrl.trim() === "") {
      setCloudReasoningBaseUrl(AKASH_ML_BASE_URL);
      setCustomBaseInput(AKASH_ML_BASE_URL);
    } else {
      setCustomBaseInput(cloudReasoningBaseUrl);
    }
    if (localReasoningProvider !== "custom") {
      setLocalReasoningProvider("custom");
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const normalizedCustomReasoningBase = useMemo(
    () => normalizeBaseUrl(cloudReasoningBaseUrl || AKASH_ML_BASE_URL),
    [cloudReasoningBaseUrl]
  );
  const latestReasoningBaseRef = useRef(normalizedCustomReasoningBase);

  useEffect(() => {
    latestReasoningBaseRef.current = normalizedCustomReasoningBase;
  }, [normalizedCustomReasoningBase]);

  const defaultOpenAIBase = useMemo(() => normalizeBaseUrl(API_ENDPOINTS.OPENAI_BASE), []);
  const hasCustomBase = normalizedCustomReasoningBase !== "";
  const effectiveReasoningBase = hasCustomBase ? normalizedCustomReasoningBase : defaultOpenAIBase;

  const loadRemoteModels = useCallback(
    async (baseOverride?: string, force = false) => {
      const rawBase = (baseOverride ?? cloudReasoningBaseUrl) || AKASH_ML_BASE_URL;
      const normalizedBase = normalizeBaseUrl(rawBase);

      if (!normalizedBase) {
        if (isMountedRef.current) {
          setCustomModelsLoading(false);
          setCustomModelsError(null);
          setCustomModelOptions([]);
        }
        return;
      }

      if (!force && lastLoadedBaseRef.current === normalizedBase) return;
      if (!force && pendingBaseRef.current === normalizedBase) return;

      if (baseOverride !== undefined) {
        latestReasoningBaseRef.current = normalizedBase;
      }

      pendingBaseRef.current = normalizedBase;

      if (isMountedRef.current) {
        setCustomModelsLoading(true);
        setCustomModelsError(null);
        setCustomModelOptions([]);
      }

      let apiKey: string | undefined;

      try {
        const keyFromState = customReasoningApiKey?.trim();
        apiKey = keyFromState && keyFromState.length > 0 ? keyFromState : undefined;

        if (!normalizedBase.includes("://")) {
          if (isMountedRef.current && latestReasoningBaseRef.current === normalizedBase) {
            setCustomModelsError(t("reasoning.custom.endpointWithProtocol"));
            setCustomModelsLoading(false);
          }
          return;
        }

        if (!isSecureEndpoint(normalizedBase)) {
          if (isMountedRef.current && latestReasoningBaseRef.current === normalizedBase) {
            setCustomModelsError(t("reasoning.custom.httpsRequired"));
            setCustomModelsLoading(false);
          }
          return;
        }

        const headers: Record<string, string> = {};
        if (apiKey) {
          headers.Authorization = `Bearer ${apiKey}`;
        }

        const modelsUrl = buildApiUrl(normalizedBase, "/models");
        const response = await fetch(modelsUrl, { method: "GET", headers });

        if (!response.ok) {
          const errorText = await response.text().catch(() => "");
          const summary = errorText
            ? `${response.status} ${errorText.slice(0, 200)}`
            : `${response.status} ${response.statusText}`;
          throw new Error(summary.trim());
        }

        const payload = await response.json().catch(() => ({}));
        const rawModels = Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload?.models)
            ? payload.models
            : [];

        const mappedModels = (rawModels as Array<Record<string, unknown>>)
          .map((item) => {
            const value = (item?.id || item?.name) as string | undefined;
            if (!value) return null;
            const ownedBy = typeof item?.owned_by === "string" ? item.owned_by : undefined;
            return {
              value,
              label: (item?.id || item?.name || value) as string,
              description:
                (item?.description as string) ||
                (ownedBy ? t("reasoning.custom.ownerLabel", { owner: ownedBy }) : undefined),
              ownedBy,
            } as CloudModelOption;
          })
          .filter(Boolean) as CloudModelOption[];

        if (isMountedRef.current && latestReasoningBaseRef.current === normalizedBase) {
          setCustomModelOptions(mappedModels);
          if (
            reasoningModel &&
            mappedModels.length > 0 &&
            !mappedModels.some((model) => model.value === reasoningModel)
          ) {
            setReasoningModel("");
          }
          setCustomModelsError(null);
          lastLoadedBaseRef.current = normalizedBase;
        }
      } catch (error) {
        if (isMountedRef.current && latestReasoningBaseRef.current === normalizedBase) {
          const message = (error as Error).message || t("reasoning.custom.unableToLoadModels");
          const unauthorized = /\b(401|403)\b/.test(message);
          if (unauthorized && !apiKey) {
            setCustomModelsError(t("reasoning.custom.endpointUnauthorized"));
          } else {
            setCustomModelsError(message);
          }
          setCustomModelOptions([]);
        }
      } finally {
        if (pendingBaseRef.current === normalizedBase) {
          pendingBaseRef.current = null;
        }
        if (isMountedRef.current && latestReasoningBaseRef.current === normalizedBase) {
          setCustomModelsLoading(false);
        }
      }
    },
    [cloudReasoningBaseUrl, customReasoningApiKey, reasoningModel, setReasoningModel, t]
  );

  const trimmedCustomBase = customBaseInput.trim();
  const hasSavedCustomBase = Boolean((cloudReasoningBaseUrl || "").trim());
  const isCustomBaseDirty = trimmedCustomBase !== (cloudReasoningBaseUrl || "").trim();

  const displayedCustomModels = useMemo<CloudModelOption[]>(() => {
    if (isCustomBaseDirty) return [];
    return customModelOptions;
  }, [isCustomBaseDirty, customModelOptions]);

  const handleApplyCustomBase = useCallback(() => {
    const trimmedBase = customBaseInput.trim();
    const normalized = trimmedBase ? normalizeBaseUrl(trimmedBase) : trimmedBase;
    setCustomBaseInput(normalized);
    setCloudReasoningBaseUrl(normalized);
    lastLoadedBaseRef.current = null;
    loadRemoteModels(normalized, true);
  }, [customBaseInput, setCloudReasoningBaseUrl, loadRemoteModels]);

  const handleBaseUrlBlur = useCallback(() => {
    const trimmedBase = customBaseInput.trim();
    if (!trimmedBase) return;
    if (trimmedBase !== (cloudReasoningBaseUrl || "").trim()) {
      handleApplyCustomBase();
    }
  }, [customBaseInput, cloudReasoningBaseUrl, handleApplyCustomBase]);

  const handleResetCustomBase = useCallback(() => {
    setCustomBaseInput(AKASH_ML_BASE_URL);
    setCloudReasoningBaseUrl(AKASH_ML_BASE_URL);
    lastLoadedBaseRef.current = null;
    loadRemoteModels(AKASH_ML_BASE_URL, true);
  }, [setCloudReasoningBaseUrl, loadRemoteModels]);

  const handleRefreshCustomModels = useCallback(() => {
    if (isCustomBaseDirty) {
      handleApplyCustomBase();
      return;
    }
    if (!trimmedCustomBase) return;
    loadRemoteModels(undefined, true);
  }, [handleApplyCustomBase, isCustomBaseDirty, trimmedCustomBase, loadRemoteModels]);

  // Load models on mount
  useEffect(() => {
    if (!hasCustomBase) {
      setCustomModelsError(null);
      setCustomModelOptions([]);
      setCustomModelsLoading(false);
      lastLoadedBaseRef.current = null;
      return;
    }

    const normalizedBase = normalizedCustomReasoningBase;
    if (!normalizedBase) return;
    if (pendingBaseRef.current === normalizedBase || lastLoadedBaseRef.current === normalizedBase)
      return;

    loadRemoteModels();
  }, [hasCustomBase, normalizedCustomReasoningBase, loadRemoteModels]);

  return (
    <div className="space-y-4">
      {/*
        AKASHML_HIDDEN_LOCAL: Cloud/Local mode tabs removed.
        AKASHML_HIDDEN_PROVIDERS: All provider tabs except "Akash ML" removed.
        Restore by replacing AKASHML_CLOUD_PROVIDERS with the full provider list
        and adding back the MODE_TABS ProviderTabs + local panel JSX.
      */}

      <div className="space-y-2">
        {/* AKASHML: Info card - always shown since we only support Akash ML */}
        <div className="rounded-md border border-primary/20 bg-primary/5 dark:border-primary/15 dark:bg-primary/8 px-3 py-2.5 flex items-start gap-2.5">
          <Zap size={13} className="text-primary shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-foreground leading-tight">
              Powered by Akash Network
            </p>
            <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
              Decentralized, censorship-resistant AI inference. Your API key stays on your device.
            </p>
          </div>
        </div>

        <div className="border border-border rounded-lg overflow-hidden">
          {/* AKASHML: Single tab showing only "Akash ML" */}
          <ProviderTabs
            providers={AKASHML_CLOUD_PROVIDERS}
            selectedId={selectedCloudProvider}
            onSelect={() => {}}
            colorScheme="purple"
          />

          <div className="p-3">
            <div className="space-y-2">
              {/* Endpoint URL */}
              <div>
                <h4 className="font-medium text-foreground text-xs mb-1.5">
                  Akash ML Endpoint URL
                </h4>
                <Input
                  value={customBaseInput}
                  onChange={(event) => setCustomBaseInput(event.target.value)}
                  onBlur={handleBaseUrlBlur}
                  placeholder={AKASH_ML_BASE_URL}
                  className="text-sm"
                />
              </div>

              {/* API Key */}
              <div>
                <h4 className="font-medium text-foreground text-xs mb-1.5">
                  Akash ML API Key
                </h4>
                <ApiKeyInput
                  apiKey={customReasoningApiKey}
                  setApiKey={setCustomReasoningApiKey || (() => {})}
                  label=""
                  helpText=""
                />
              </div>

              {/* Available Models */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-medium text-foreground">
                    {t("reasoning.availableModels")}
                  </h4>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handleResetCustomBase}
                      className="text-xs"
                    >
                      {t("common.reset")}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handleRefreshCustomModels}
                      disabled={
                        customModelsLoading || (!trimmedCustomBase && !hasSavedCustomBase)
                      }
                      className="text-xs"
                    >
                      {customModelsLoading
                        ? t("common.loading")
                        : isCustomBaseDirty
                          ? t("reasoning.custom.applyAndRefresh")
                          : t("common.refresh")}
                    </Button>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  {t("reasoning.custom.queryPrefix")}{" "}
                  <code>
                    {hasCustomBase
                      ? `${effectiveReasoningBase}/models`
                      : `${AKASH_ML_BASE_URL}/models`}
                  </code>{" "}
                  {t("reasoning.custom.querySuffix")}
                </p>

                {isCustomBaseDirty && (
                  <p className="text-xs text-primary">
                    {t("reasoning.custom.modelsReloadHint")}
                  </p>
                )}
                {!hasCustomBase && (
                  <p className="text-xs text-warning">{t("reasoning.custom.enterEndpoint")}</p>
                )}
                {hasCustomBase && (
                  <>
                    {customModelsLoading && (
                      <p className="text-xs text-primary">
                        {t("reasoning.custom.fetchingModels")}
                      </p>
                    )}
                    {customModelsError && (
                      <p className="text-xs text-destructive">{customModelsError}</p>
                    )}
                    {!customModelsLoading &&
                      !customModelsError &&
                      customModelOptions.length === 0 && (
                        <p className="text-xs text-warning">{t("reasoning.custom.noModels")}</p>
                      )}
                  </>
                )}
                <ModelCardList
                  models={displayedCustomModels}
                  selectedModel={reasoningModel}
                  onModelSelect={setReasoningModel}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
