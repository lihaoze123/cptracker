import React from "react";
import { SlideLayout } from "../SlideLayout";
import { TextReveal } from "../TextReveal";
import type { CPYearReviewData } from "@/lib/year-review/types";
import { motion } from "framer-motion";

interface ProgressSlideProps {
  data: CPYearReviewData;
}

export const ProgressSlide: React.FC<ProgressSlideProps> = ({ data }) => {
  const bestMonth = data.monthlyProgress.reduce((max, month) =>
    month.count > max.count ? month : max,
    data.monthlyProgress[0]
  );

  return (
    <SlideLayout gradientStart="#10B981" gradientEnd="#059669">
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <TextReveal
          text="Monthly momentum."
          className="text-5xl font-serif italic text-white mb-12"
        />

        <motion.div
          className="space-y-8"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1 }}
        >
          <div>
            <div className="text-neutral-400 font-mono text-sm mb-2">
              Your strongest month was
            </div>
            <div className="text-5xl font-serif text-white mb-4">
              {bestMonth.month}
            </div>
          </div>

          <div>
            <div className="text-neutral-400 font-mono text-sm mb-2">
              With
            </div>
            <div className="text-4xl font-serif text-white">
              {bestMonth.count} problems
            </div>
          </div>
        </motion.div>
      </div>
    </SlideLayout>
  );
};
