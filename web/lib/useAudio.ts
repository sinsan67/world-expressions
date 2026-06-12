"use client";

import { useState, useEffect, useCallback } from "react";

const SPEECH_LANG: Record<string, string> = {
  fr: "fr-FR", en: "en-GB", es: "es-ES", it: "it-IT", tr: "tr-TR", de: "de-DE", ja: "ja-JP",
};

function findVoice(language: string): SpeechSynthesisVoice | undefined {
  if (typeof window === "undefined" || !window.speechSynthesis) return undefined;
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return undefined;
  const targetCode = SPEECH_LANG[language] || language;
  const langPrefix = targetCode.split("-")[0]; // "it" from "it-IT"
  return (
    voices.find((v) => v.lang === targetCode) ??
    voices.find((v) => v.lang.startsWith(langPrefix + "-")) ??
    voices.find((v) => v.lang.startsWith(langPrefix)) ??
    voices[0] // fallback: wrong accent is better than no audio
  );
}

/**
 * Manages speech synthesis for a single expression.
 *
 * voiceAvailable:
 *   null  = still checking (voices not loaded yet)
 *   true  = at least one voice is available (may not match the expression's language)
 *   false = Web Speech API absent or no voices at all on this device
 */
export function useAudio(text: string, language: string) {
  const [speaking, setSpeaking] = useState(false);
  const [voiceAvailable, setVoiceAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      setVoiceAvailable(false);
      return;
    }
    function check() {
      setVoiceAvailable(findVoice(language) !== undefined);
    }
    check(); // synchronous on Safari/Firefox; may be empty on Chrome first call
    window.speechSynthesis.addEventListener("voiceschanged", check);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", check);
  }, [language]);

  // Cancel any pending speech when the component unmounts
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    };
  }, []);

  const handleListen = useCallback(
    (ev?: React.MouseEvent) => {
      ev?.stopPropagation();
      if (typeof window === "undefined" || !window.speechSynthesis) return;
      if (speaking) {
        window.speechSynthesis.cancel();
        setSpeaking(false);
        return;
      }
      const voice = findVoice(language);
      if (!voice) return;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.voice = voice;
      utterance.lang = voice.lang;
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);
      setSpeaking(true);
      window.speechSynthesis.speak(utterance);
    },
    [text, language, speaking]
  );

  return { speaking, voiceAvailable, handleListen };
}
