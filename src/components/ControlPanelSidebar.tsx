import React from "react";
import {
  Home,
  NotebookPen,
  BookOpen,
  Upload,
  Blocks,
  Settings,
  HelpCircle,
  UserCircle,
  Search,
  ExternalLink,
} from "lucide-react";
import logoIcon from "../assets/icon.png";
import { useTranslation } from "react-i18next";
import { cn } from "./lib/utils";
import SupportDropdown from "./ui/SupportDropdown";
import { getCachedPlatform } from "../utils/platform";
import { createExternalLinkHandler } from "../utils/externalLinks";

const platform = getCachedPlatform();

// AKASHML: AkashML signup page - users need an account to get their API key
const AKASH_ML_URL = "https://akashml.com/";

export type ControlPanelView = "home" | "personal-notes" | "dictionary" | "upload" | "integrations";

interface ControlPanelSidebarProps {
  activeView: ControlPanelView;
  onViewChange: (view: ControlPanelView) => void;
  onOpenSettings: () => void;
  onOpenSearch?: () => void;
  // AKASHML_HIDDEN: these props are kept in the interface so ControlPanel.tsx
  // compiles without changes, but they are intentionally unused in this fork.
  // Restore by uncommenting the relevant JSX blocks below.
  onOpenReferrals?: () => void;
  onUpgrade?: () => void;
  onUpgradeCheckout?: () => void;
  isOverLimit?: boolean;
  isProUser?: boolean;
  usageLoaded?: boolean;
  updateAction?: React.ReactNode;
  userName?: string | null;
  userEmail?: string | null;
  userImage?: string | null;
  isSignedIn?: boolean;
  authLoaded?: boolean;
}

export default function ControlPanelSidebar({
  activeView,
  onViewChange,
  onOpenSettings,
  onOpenSearch,
  userName,
  userEmail,
  userImage,
  isSignedIn,
  authLoaded,
}: ControlPanelSidebarProps) {
  const { t } = useTranslation();

  // AKASHML_HIDDEN: showLimitBanner and showUpgradeBanner removed.
  // The original OpenWhispr Pro upgrade prompts depended on isProUser /
  // usageLoaded / isOverLimit. Restore by adding those props back to the
  // destructured list above and uncommenting the banner JSX below.

  const navItems: {
    id: ControlPanelView;
    label: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
  }[] = [
    { id: "home", label: t("sidebar.home"), icon: Home },
    { id: "personal-notes", label: t("sidebar.notes"), icon: NotebookPen },
    { id: "upload", label: t("sidebar.upload"), icon: Upload },
    { id: "dictionary", label: t("sidebar.dictionary"), icon: BookOpen },
    { id: "integrations", label: t("sidebar.integrations"), icon: Blocks },
  ];

  return (
    <div className="w-48 h-full shrink-0 border-r border-border/15 dark:border-white/6 flex flex-col bg-surface-1/60 dark:bg-surface-1">
      <div
        className="w-full h-10 shrink-0"
        style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
      />

      {onOpenSearch && (
        <div className="px-2 pt-2 pb-1">
          <button
            onClick={onOpenSearch}
            className="group flex items-center w-full h-7 px-2.5 rounded-md border border-border/25 dark:border-white/8 bg-foreground/3 dark:bg-white/3 hover:bg-foreground/5 dark:hover:bg-white/5 transition-colors gap-2 outline-none focus-visible:ring-1 focus-visible:ring-primary/30"
          >
            <Search size={11} className="text-muted-foreground/50 shrink-0" />
            <span className="flex-1 text-[11px] text-left text-muted-foreground/50">
              {t("commandSearch.shortPlaceholder")}
            </span>
            <div className="flex items-center gap-0.5 shrink-0">
              <kbd className="text-[10px] px-1 py-px rounded border border-border/30 dark:border-white/8 bg-muted/40 text-muted-foreground/40 font-mono leading-tight">
                {platform === "darwin" ? "⌘" : "Ctrl"}
              </kbd>
              <kbd className="text-[10px] px-1 py-px rounded border border-border/30 dark:border-white/8 bg-muted/40 text-muted-foreground/40 font-mono leading-tight">
                K
              </kbd>
            </div>
          </button>
        </div>
      )}

      <nav className="flex flex-col gap-0.5 px-2 pt-2 pb-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={cn(
                "group relative flex items-center gap-2.5 w-full h-8 px-2.5 rounded-md outline-none transition-colors duration-150 text-left",
                "focus-visible:ring-1 focus-visible:ring-primary/30",
                isActive
                  ? "bg-primary/8 dark:bg-primary/10"
                  : "hover:bg-foreground/4 dark:hover:bg-white/4 active:bg-foreground/6"
              )}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-3.5 rounded-r-full bg-primary" />
              )}
              <Icon
                size={15}
                className={cn(
                  "shrink-0 transition-colors duration-150",
                  isActive
                    ? "text-primary"
                    : "text-foreground/60 group-hover:text-foreground/75 dark:text-foreground/55 dark:group-hover:text-foreground/70"
                )}
              />
              <span
                className={cn(
                  "text-xs transition-colors duration-150",
                  isActive
                    ? "text-foreground font-medium"
                    : "text-foreground/80 group-hover:text-foreground dark:text-foreground/75 dark:group-hover:text-foreground/90"
                )}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      <div className="flex-1" />

      {/*
        AKASHML_HIDDEN: original showLimitBanner block (limit reached, upgrade to Pro).
        Restore by adding isProUser, usageLoaded, isOverLimit back to props and
        uncommenting this block:

        {showLimitBanner && (
          <div className="px-2 pb-2">
            <div className="rounded-lg border border-destructive/25 bg-destructive/5 dark:bg-destructive/10 p-3">
              <div className="flex flex-col items-center text-center">
                <img src={logoIcon} alt="" className="w-7 h-7 rounded-md mb-2" />
                <p className="text-xs font-medium text-foreground mb-0.5">
                  {t("sidebar.limitReached")}
                </p>
                <p className="text-[11px] leading-snug text-muted-foreground mb-2.5">
                  {t("sidebar.limitReachedDescription")}
                </p>
                <button
                  onClick={onUpgradeCheckout}
                  className="w-full h-7 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
                >
                  {t("sidebar.upgradeToPro")}
                </button>
              </div>
            </div>
          </div>
        )}
      */}

      {/* AKASHML: Akash ML signup card - replaces the original "Upgrade to Pro" banner.
          Directs users to akashml.com to create an account and get their API key. */}
      <div className="px-2 pb-2">
        <div className="rounded-lg border border-primary/20 bg-primary/5 dark:bg-primary/10 p-3">
          <div className="flex flex-col items-center text-center">
            <img src={logoIcon} alt="Akash ML" className="w-7 h-7 rounded-md mb-2" />
            <p className="text-xs font-semibold text-foreground mb-0.5">
              Akash ML
            </p>
            <p className="text-[11px] leading-snug text-muted-foreground mb-2.5">
              Get your API key to enable cloud transcription
            </p>
            <button
              onClick={createExternalLinkHandler(AKASH_ML_URL)}
              className="w-full h-7 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-1.5"
            >
              <ExternalLink size={11} />
              Get API Key
            </button>
          </div>
        </div>
      </div>

      {/*
        AKASHML_HIDDEN: original showUpgradeBanner block (Upgrade to Pro, Learn More).
        Restore by adding upgradeDismissed state, isProUser, usageLoaded props back
        and uncommenting this block:

        {showUpgradeBanner && (
          <div className="px-2 pb-2">
            <div className="relative rounded-lg border border-primary/20 bg-primary/5 dark:bg-primary/10 p-3">
              <button onClick={() => { setUpgradeDismissed(true); ... }} ...>
                <X size={12} />
              </button>
              ...
              <button onClick={onUpgrade} ...>{t("sidebar.learnMore")}</button>
            </div>
          </div>
        )}
      */}

      <div className="px-2 pb-2 space-y-0.5">
        {/*
          AKASHML_HIDDEN: updateAction button (Update Available) removed from sidebar.
          The update check is still available inside Settings > System.
          Restore by adding updateAction back to the destructured props and
          uncommenting this block:

          {updateAction && (
            <div className="px-1 pb-1" style={{ WebkitAppRegion: "no-drag" }}>
              {updateAction}
            </div>
          )}
        */}

        {/*
          AKASHML_HIDDEN: Referrals button removed - tied to OpenWhispr referral program.
          Restore by adding onOpenReferrals back to destructured props and
          uncommenting this block:

          {isSignedIn && onOpenReferrals && (
            <button onClick={onOpenReferrals} ...>
              <Gift size={15} ... />
              <span ...>{t("sidebar.referral")}</span>
            </button>
          )}
        */}

        <button
          onClick={onOpenSettings}
          aria-label={t("sidebar.settings")}
          className="group flex items-center gap-2.5 w-full h-8 px-2.5 rounded-md text-left outline-none hover:bg-foreground/4 dark:hover:bg-white/4 focus-visible:ring-1 focus-visible:ring-primary/30 transition-colors duration-150"
        >
          <Settings
            size={15}
            className="shrink-0 text-foreground/60 group-hover:text-foreground/75 dark:text-foreground/50 dark:group-hover:text-foreground/65 transition-colors duration-150"
          />
          <span className="text-xs text-foreground/80 group-hover:text-foreground dark:text-foreground/70 dark:group-hover:text-foreground/85 transition-colors duration-150">
            {t("sidebar.settings")}
          </span>
        </button>

        <SupportDropdown
          trigger={
            <button
              aria-label={t("sidebar.support")}
              className="group flex items-center gap-2.5 w-full h-8 px-2.5 rounded-md text-left outline-none hover:bg-foreground/4 dark:hover:bg-white/4 focus-visible:ring-1 focus-visible:ring-primary/30 transition-colors duration-150"
            >
              <HelpCircle
                size={15}
                className="shrink-0 text-foreground/60 group-hover:text-foreground/75 dark:text-foreground/50 dark:group-hover:text-foreground/65 transition-colors duration-150"
              />
              <span className="text-xs text-foreground/80 group-hover:text-foreground dark:text-foreground/70 dark:group-hover:text-foreground/85 transition-colors duration-150">
                {t("sidebar.support")}
              </span>
            </button>
          }
        />

        <div className="mx-1 h-px bg-border/10 dark:bg-white/6 my-1.5!" />

        <div className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-md">
          {userImage ? (
            <img src={userImage} alt="" className="w-6 h-6 rounded-full shrink-0 object-cover" />
          ) : (
            <UserCircle size={18} className="shrink-0 text-foreground/50 dark:text-foreground/45" />
          )}
          <div className="flex-1 min-w-0">
            {isSignedIn && (userName || userEmail) ? (
              <>
                <p className="text-xs text-foreground/80 dark:text-foreground/80 truncate leading-tight">
                  {userName || t("sidebar.defaultUser")}
                </p>
                {userEmail && (
                  <p className="text-xs text-foreground/55 dark:text-foreground/55 truncate leading-tight">
                    {userEmail}
                  </p>
                )}
              </>
            ) : authLoaded && !isSignedIn ? (
              <p className="text-xs text-foreground/45 dark:text-foreground/55">
                {t("sidebar.notSignedIn")}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
