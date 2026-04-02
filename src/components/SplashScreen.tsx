import { useEffect, useState } from "react";
import logoLight from "@/assets/logo-light.png";
import { Progress } from "@/components/ui/progress";

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [progress, setProgress] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setFadeOut(true);
          setTimeout(onComplete, 500);
          return 100;
        }
        return prev + 4;
      });
    }, 60);
    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white transition-opacity duration-500 ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
    >
      <img
        src={logoLight}
        alt="Trademark"
        className="h-16 w-16 object-contain animate-pulse mb-8"
      />
      <div className="w-48">
        <Progress value={progress} className="h-1 bg-gray-200 [&>div]:bg-gray-800" />
      </div>
      <p className="mt-4 text-xs text-gray-400 tracking-widest uppercase">Loading</p>
    </div>
  );
}
