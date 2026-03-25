import { useState, useRef, useCallback, useEffect } from "react";

export type VoiceStatus = "idle" | "listening" | "processing";

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

export function useVoiceSearch(onResult: (transcript: string) => void) {
  const [status, setStatus] = useState<VoiceStatus>("idle");
  const [interimText, setInterimText] = useState("");
  const recognitionRef = useRef<any>(null);
  const supported = typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
    };
  }, []);

  const startListening = useCallback(() => {
    if (!supported) return;

    // Stop any existing TTS
    window.speechSynthesis?.cancel();

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onstart = () => setStatus("listening");

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }
      setInterimText(interim);
      if (final) {
        setStatus("processing");
        setInterimText("");
        onResult(final.trim());
        setTimeout(() => setStatus("idle"), 500);
      }
    };

    recognition.onerror = () => {
      console.debug("[VoiceSearch] Recognition error");
      setStatus("idle");
      setInterimText("");
    };

    recognition.onend = () => {
      setStatus((s) => (s === "listening" ? "idle" : s));
      setInterimText("");
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [supported, onResult]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setStatus("idle");
    setInterimText("");
  }, []);

  const toggleListening = useCallback(() => {
    if (status === "listening") {
      stopListening();
    } else {
      startListening();
    }
  }, [status, startListening, stopListening]);

  return { status, interimText, supported, toggleListening };
}

/** Speak text using Web Speech API TTS. Returns a cancel function. */
export function speakText(text: string): () => void {
  if (!window.speechSynthesis) return () => {};
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  window.speechSynthesis.speak(utterance);
  return () => window.speechSynthesis.cancel();
}
