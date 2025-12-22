import React from "react";
import { SlideLayout } from "../SlideLayout";
import { TextReveal } from "../TextReveal";
import type { CPYearReviewData } from "@/lib/year-review/types";
import { motion } from "framer-motion";

interface RoutineSlideProps {
  data: CPYearReviewData;
}

const DAYS_SHORT = ["S", "M", "T", "W", "T", "F", "S"];
const DAYS_FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export const RoutineSlide: React.FC<RoutineSlideProps> = ({ data }) => {
  // Find max for scaling
  const maxVal = Math.max(...data.weekdayStats);
  const maxIndex = data.weekdayStats.indexOf(maxVal);

  return (
    <SlideLayout gradientStart="#ec4899" gradientEnd="#be185d">
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="mb-12 text-center">
          <TextReveal
            text="Your favorite day?"
            className="text-2xl font-mono text-pink-200 mb-4 uppercase tracking-widest"
          />
          <TextReveal
            text={`${DAYS_FULL[maxIndex]}s.`}
            className="text-6xl font-serif text-white italic"
            delay={0.5}
          />
        </div>

        {/* Custom Bar Chart */}
        <div className="flex items-end gap-3 md:gap-6 h-64 w-full max-w-lg px-4">
          {data.weekdayStats.map((count, index) => {
            const heightPercentage = maxVal > 0 ? (count / maxVal) * 100 : 0;
            const isMax = index === maxIndex;

            return (
              <div key={index} className="flex-1 flex flex-col items-center gap-3 group">
                <div className="text-white/50 text-xs font-mono mb-1 opacity-0 group-hover:opacity-100 transition-opacity absolute -mt-6">
                  {count}
                </div>
                <motion.div
                  initial={{ height: "0%" }}
                  animate={{ height: `${Math.max(heightPercentage, 2)}%` }}
                  transition={{ delay: 1 + index * 0.1, duration: 1, type: "spring" }}
                  className={`w-full rounded-t-lg relative ${
                    isMax
                      ? "bg-white shadow-[0_0_20px_rgba(255,255,255,0.5)]"
                      : "bg-white/30"
                  }`}
                >
                  {/* Inner Glow for max bar */}
                  {isMax && (
                    <div className="absolute inset-0 bg-pink-500 blur-lg opacity-50"></div>
                  )}
                </motion.div>
                <span
                  className={`text-sm font-bold font-sans ${
                    isMax ? "text-white" : "text-white/50"
                  }`}
                >
                  {DAYS_SHORT[index]}
                </span>
              </div>
            );
          })}
        </div>

        <TextReveal
          text="Consistency is key."
          className="mt-16 text-neutral-400 font-sans"
          delay={2.5}
        />
      </div>
    </SlideLayout>
  );
};
