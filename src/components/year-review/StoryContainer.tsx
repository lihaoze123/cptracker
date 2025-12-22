import React, { useState, useEffect, useRef, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import type { CPYearReviewData } from "@/lib/year-review/types";
import {
  TitleSlide,
  VelocitySlide,
  GridSlide,
  CompositionSlide,
  RoutineSlide,
  ProductivitySlide,
  ProgressSlide,
  SourcesSlide,
  TopicsSlide,
  ArchetypeSlide,
  PosterSlide,
} from "./slides";

const SLIDE_DURATION_MS = 6000; // 6 seconds per slide

interface StoryContainerProps {
  data: CPYearReviewData;
  onComplete: () => void;
}

export const StoryContainer: React.FC<StoryContainerProps> = ({
  data,
  onComplete,
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const totalSlides = 11;
  const progressIntervalRef = useRef<number | null>(null);
  const [progress, setProgress] = useState(0);

  const handleNext = useCallback(() => {
    if (currentSlide < totalSlides - 1) {
      setCurrentSlide((prev) => prev + 1);
      setProgress(0);
    } else {
      // Stay on last slide instead of auto-completing
      setIsPaused(true);
    }
  }, [currentSlide, totalSlides]);

  const handlePrev = useCallback(() => {
    if (currentSlide > 0) {
      setCurrentSlide((prev) => prev - 1);
      setProgress(0);
    }
  }, [currentSlide]);

  // Timer Logic
  useEffect(() => {
    if (isPaused) return;

    const startTime = Date.now();
    const startProgress = progress;

    const animateProgress = () => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min(
        100,
        startProgress + (elapsed / SLIDE_DURATION_MS) * 100
      );

      setProgress(newProgress);

      if (newProgress < 100) {
        progressIntervalRef.current = requestAnimationFrame(animateProgress);
      } else {
        handleNext();
      }
    };

    progressIntervalRef.current = requestAnimationFrame(animateProgress);

    return () => {
      if (progressIntervalRef.current)
        cancelAnimationFrame(progressIntervalRef.current);
    };
  }, [currentSlide, isPaused, handleNext, progress]);

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowRight":
        case "d":
          handleNext();
          break;
        case "ArrowLeft":
        case "a":
          handlePrev();
          break;
        case " ": // Space to pause/resume
          e.preventDefault();
          setIsPaused((prev) => !prev);
          break;
        case "Escape":
          onComplete();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleNext, handlePrev, onComplete]);

  // Gestures
  const touchStartX = useRef(0);
  const longPressTimer = useRef<number | null>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    // Ignore interaction if clicking a button/interactive element
    if ((e.target as HTMLElement).closest("button, a, input")) return;

    touchStartX.current = e.clientX;
    setIsPaused(true);

    longPressTimer.current = window.setTimeout(() => {
      // Long press logic handled by setting paused to true immediately
    }, 200);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    setIsPaused(false);

    // Ignore interaction if clicking a button/interactive element
    if ((e.target as HTMLElement).closest("button, a, input")) return;

    const diff = e.clientX - touchStartX.current;

    if (Math.abs(diff) < 10) {
      // It's a tap
      const screenWidth = window.innerWidth;
      if (e.clientX < screenWidth / 3) {
        handlePrev();
      } else {
        handleNext();
      }
    }
  };

  const renderSlide = () => {
    switch (currentSlide) {
      case 0:
        return <TitleSlide data={data} />;
      case 1:
        return <VelocitySlide data={data} />;
      case 2:
        return <GridSlide data={data} />;
      case 3:
        return <CompositionSlide data={data} />;
      case 4:
        return <RoutineSlide data={data} />;
      case 5:
        return <ProductivitySlide data={data} />;
      case 6:
        return <ProgressSlide data={data} />;
      case 7:
        return <SourcesSlide data={data} />;
      case 8:
        return <TopicsSlide data={data} />;
      case 9:
        return <ArchetypeSlide data={data} />;
      case 10:
        return <PosterSlide data={data} />;
      default:
        return null;
    }
  };

  return (
    <div
      className="fixed inset-0 w-full h-[100dvh] bg-black select-none cursor-pointer"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={() => setIsPaused(false)}
    >
      {/* Progress Bar */}
      <div className="absolute top-4 left-2 right-2 flex gap-1 z-50">
        {Array.from({ length: totalSlides }).map((_, idx) => (
          <div
            key={idx}
            className="h-1 flex-1 bg-neutral-800 rounded-full overflow-hidden"
          >
            <div
              className="h-full bg-white transition-all duration-100 ease-linear"
              style={{
                width:
                  idx < currentSlide
                    ? "100%"
                    : idx === currentSlide
                      ? `${progress}%`
                      : "0%",
              }}
            />
          </div>
        ))}
      </div>

      {/* Close Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onComplete();
        }}
        className="absolute top-8 right-4 z-50 text-white/50 hover:text-white p-2"
      >
        <X size={24} />
      </button>

      {/* Slide Content */}
      <AnimatePresence mode="popLayout" initial={false}>
        <div key={currentSlide} className="w-full h-full">
          {renderSlide()}
        </div>
      </AnimatePresence>
    </div>
  );
};
