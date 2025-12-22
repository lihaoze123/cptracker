import React from "react";
import { SlideLayout } from "../SlideLayout";
import { TextReveal } from "../TextReveal";
import type { CPYearReviewData } from "@/lib/year-review/types";
import { motion } from "framer-motion";

interface TopicsSlideProps {
  data: CPYearReviewData;
}

const TAG_COLORS = ["#3B82F6"];

export const TopicsSlide: React.FC<TopicsSlideProps> = ({ data }) => {
  const topTag = data.topTags[0];
  const displayTags = data.topTags.slice(0, 5);

  return (
    <SlideLayout gradientStart="#3B82F6" gradientEnd="#3B82F6">
      <div className="flex-1 flex flex-col justify-center relative">
        {/* Floating Orbs */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          {topTag && (
            <motion.div
              key={topTag.tag}
              initial={{ scale: 0, x: 0, y: 0 }}
              animate={{
                scale: [1, 1.2, 1],
                x: [0, Math.random() * 50 - 25, 0],
                y: [0, Math.random() * 50 - 25, 0],
              }}
              transition={{ duration: 4, repeat: Infinity, delay: 0.5 }}
              className="absolute rounded-full blur-[40px] opacity-70 mix-blend-screen drop-shadow-[0_0_120px_rgba(255,255,255,0.18)]"
              style={{
                backgroundColor: TAG_COLORS[0],
                width: `${Math.max(Math.min(topTag.percentage * 4, 180), 80)}px`,
                height: `${Math.max(Math.min(topTag.percentage * 4, 180), 80)}px`,
                top: "28%",
                left: "20%",
              }}
            />
          )}
        </div>

        <div className="relative z-10 text-center">
          <TextReveal
            text="The Palette."
            className="text-xl font-mono text-neutral-400 mb-8 uppercase tracking-widest"
          />

          <TextReveal
            text={`You mastered ${topTag?.tag || "many topics"}.`}
            className="text-6xl font-serif text-white leading-tight mb-12"
            highlight={topTag?.tag}
            delay={0.5}
          />

          <div className="flex flex-col gap-4 items-center">
            {displayTags.map((tag, i) => (
              <motion.div
                key={tag.tag}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.5 + i * 0.2 }}
                className="flex items-center gap-4 w-full max-w-xs"
              >
                <div
                  className="w-3 h-3 rounded-full shadow-[0_0_10px_currentColor]"
                  style={{
                    backgroundColor: TAG_COLORS[i % TAG_COLORS.length],
                    color: TAG_COLORS[i % TAG_COLORS.length],
                  }}
                />
                <span className="text-xl font-sans text-white">{tag.tag}</span>
                <div className="flex-1 h-px bg-neutral-800 mx-2" />
                <span className="font-mono text-neutral-400">{Math.round(tag.percentage)}%</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </SlideLayout>
  );
};
