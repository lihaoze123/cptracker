import React from "react";
import { SlideLayout } from "../SlideLayout";
import { TextReveal } from "../TextReveal";
import type { CPYearReviewData } from "@/lib/year-review/types";
import { motion } from "framer-motion";

interface ArchetypeSlideProps {
  data: CPYearReviewData;
}

export const ArchetypeSlide: React.FC<ArchetypeSlideProps> = ({ data }) => {
  return (
    <SlideLayout gradientStart="#EC4899" gradientEnd="#DB2777">
      <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
        <TextReveal
          text="Your archetype."
          className="text-3xl md:text-4xl font-sans text-neutral-400 mb-16"
        />

        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 1, type: "spring", stiffness: 200, damping: 15 }}
          className="mb-12 relative"
        >
          <div className="absolute inset-0 bg-pink-500 blur-3xl opacity-40"></div>
          <div className="text-7xl md:text-9xl font-serif font-bold text-white relative z-10 tracking-tight">
            {data.archetype}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.5 }}
          className="max-w-2xl"
        >
          <TextReveal
            text={data.archetypeDescription}
            className="text-xl md:text-2xl text-neutral-300 font-sans leading-relaxed"
            delay={3}
          />
        </motion.div>
      </div>
    </SlideLayout>
  );
};
