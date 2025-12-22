import React from "react";
import { motion } from "framer-motion";
import { Code2 } from "lucide-react";
import { SlideLayout } from "../SlideLayout";
import { TextReveal } from "../TextReveal";
import type { CPYearReviewData } from "@/lib/year-review/types";

interface TitleSlideProps {
  data: CPYearReviewData;
}

export const TitleSlide: React.FC<TitleSlideProps> = ({ data }) => {
  return (
    <SlideLayout gradientStart="#3B82F6" gradientEnd="#000000">
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <motion.div
          initial={{ scale: 0, opacity: 0, rotate: -180 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ duration: 1.2, type: "spring" }}
          className="mb-12 relative"
        >
          <div className="absolute inset-0 bg-blue-500 blur-3xl opacity-40 animate-pulse-slow"></div>
          <Code2 size={120} className="text-white relative z-10" />
        </motion.div>

        <TextReveal
          text={`${data.year}.`}
          className="text-8xl font-serif text-white mb-4 tracking-tighter"
          delay={0.5}
        />

        <TextReveal
          text="The year you solved problems."
          className="text-2xl font-sans text-neutral-400 max-w-xs mx-auto"
          delay={1.5}
        />
      </div>
    </SlideLayout>
  );
};
