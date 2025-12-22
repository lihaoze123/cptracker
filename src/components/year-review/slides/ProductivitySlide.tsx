import React from "react";
import { SlideLayout } from "../SlideLayout";
import { TextReveal } from "../TextReveal";
import type { CPYearReviewData } from "@/lib/year-review/types";
import { motion } from "framer-motion";
import { Clock } from "lucide-react";

interface ProductivitySlideProps {
  data: CPYearReviewData;
}

export const ProductivitySlide: React.FC<ProductivitySlideProps> = ({ data }) => {
  return (
    <SlideLayout gradientStart="#3B82F6" gradientEnd="#1D4ED8">
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <motion.div
          initial={{ scale: 0, rotate: 0 }}
          animate={{ scale: 1, rotate: 360 }}
          transition={{ duration: 1, type: "spring" }}
          className="mb-12"
        >
          <Clock size={80} className="text-white" />
        </motion.div>

        <TextReveal
          text="Your peak hours."
          className="text-5xl font-serif italic text-white mb-8"
          delay={0.5}
        />

        <motion.div
          className="space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5 }}
        >
          <div>
            <div className="text-neutral-400 font-mono text-sm mb-2">
              You solve problems in the
            </div>
            <div className="text-4xl font-serif text-white">
              {data.timeOfDay}
            </div>
          </div>

          <div className="pt-4">
            <div className="text-neutral-400 font-mono text-sm mb-2">
              Peak hour:
            </div>
            <div className="text-3xl font-serif text-white">
              {data.peakHour}:00
            </div>
          </div>
        </motion.div>
      </div>
    </SlideLayout>
  );
};
