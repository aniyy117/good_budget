"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

type EmojiPickerPanelProps = {
  theme?: string;
  onEmojiSelect: (emoji: { native: string }) => void;
};

type EmojiMartModules = {
  Picker: React.ComponentType<{
    data: unknown;
    theme?: string;
    onEmojiSelect: (emoji: { native: string }) => void;
    navPosition?: string;
    previewPosition?: string;
  }>;
  data: unknown;
};

export default function EmojiPickerPanel({
  theme,
  onEmojiSelect,
}: EmojiPickerPanelProps) {
  const [mods, setMods] = useState<EmojiMartModules | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([import("@emoji-mart/react"), import("@emoji-mart/data")]).then(
      ([reactMod, dataMod]) => {
        if (cancelled) return;
        setMods({
          Picker: reactMod.default,
          data: dataMod.default,
        });
      }
    );
    return () => {
      cancelled = true;
    };
  }, []);

  if (!mods) {
    return (
      <div className="flex h-40 w-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const { Picker, data } = mods;

  return (
    <Picker
      data={data}
      theme={theme}
      onEmojiSelect={onEmojiSelect}
      navPosition="bottom"
      previewPosition="bottom"
    />
  );
}
