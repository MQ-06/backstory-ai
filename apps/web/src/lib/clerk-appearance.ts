/** Shared Clerk appearance — keeps org switcher / auth readable in light and dark. */
export function clerkAppearance(isDark: boolean) {
  const primary = isDark ? "#d4954a" : "#1A1410";
  const text = isDark ? "#f0ebe3" : "#1A1410";
  const background = isDark ? "#1e1a15" : "#FDFAF4";
  const inputBg = isDark ? "#2a2520" : "#F7F3EC";
  const border = isDark ? "#3d3630" : "#ddd5c8";
  const muted = isDark ? "#9a8f82" : "#8a7e72";

  const popoverCard = isDark
    ? "rounded-xl border border-[#3d3630] bg-[#1e1a15] shadow-lg"
    : "rounded-xl border border-[#ddd5c8] bg-[#fdfaf4] shadow-lg";

  const previewMain = isDark ? "text-[#f0ebe3] font-medium" : "text-[#1a1410] font-medium";
  const previewSecondary = isDark ? "text-[#9a8f82]" : "text-[#8a7e72]";
  const actionButton = isDark
    ? "text-[#f0ebe3] hover:bg-white/10"
    : "text-[#1a1410] hover:bg-black/5";

  return {
    variables: {
      colorPrimary: primary,
      colorText: text,
      colorTextSecondary: muted,
      colorBackground: background,
      colorInputBackground: inputBg,
      colorInputText: text,
      colorNeutral: muted,
      borderRadius: "0.625rem",
      fontFamily: "var(--font-sans), system-ui, sans-serif",
    },
    elements: {
      organizationSwitcherTrigger: isDark
        ? "rounded-lg border border-[#3d3630] bg-[#2a2520] px-2.5 py-1.5 text-xs font-medium text-[#f0ebe3] shadow-sm"
        : "rounded-lg border border-[#ddd5c8] bg-[#fdfaf4] px-2.5 py-1.5 text-xs font-medium text-[#1a1410] shadow-sm",
      organizationSwitcherPopoverCard: popoverCard,
      organizationSwitcherPopoverMain: isDark ? "bg-[#1e1a15]" : "bg-[#fdfaf4]",
      organizationSwitcherPopoverActions: isDark ? "border-t border-[#3d3630]" : "border-t border-[#ddd5c8]",
      organizationPreviewMainIdentifier: previewMain,
      organizationPreviewSecondaryIdentifier: previewSecondary,
      organizationSwitcherPopoverActionButton: actionButton,
      organizationSwitcherPopoverActionButtonIcon: previewSecondary,
      organizationSwitcherPopoverFooter: isDark ? "bg-[#1e1a15]" : "bg-[#fdfaf4]",
      userButtonPopoverCard: popoverCard,
      userButtonPopoverActionButton: actionButton,
      userButtonPopoverActionButtonText: previewMain,
      userButtonPopoverFooter: isDark ? "bg-[#1e1a15]" : "bg-[#fdfaf4]",
      card: isDark ? "bg-[#1e1a15] border-[#3d3630]" : "bg-[#fdfaf4] border-[#ddd5c8]",
      navbar: isDark ? "bg-[#1e1a15]" : "bg-[#fdfaf4]",
      headerTitle: previewMain,
      headerSubtitle: previewSecondary,
      socialButtonsBlockButton: isDark
        ? "border-[#3d3630] bg-[#2a2520] text-[#f0ebe3]"
        : "border-[#ddd5c8] bg-[#f7f3ec] text-[#1a1410]",
      formFieldLabel: previewMain,
      formFieldInput: isDark
        ? "bg-[#2a2520] text-[#f0ebe3] border-[#3d3630]"
        : "bg-[#f7f3ec] text-[#1a1410] border-[#ddd5c8]",
      footerActionLink: isDark ? "text-[#d4954a]" : "text-[#1a1410]",
      identityPreviewText: previewMain,
      identityPreviewEditButton: isDark ? "text-[#d4954a]" : "text-[#1a1410]",
    },
  } as const;
}
