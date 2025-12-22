import React from "react";
import { SlideLayout } from "../SlideLayout";
import { TextReveal } from "../TextReveal";
import type { CPYearReviewData } from "@/lib/year-review/types";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts";
import { motion } from "framer-motion";

interface SourcesSlideProps {
  data: CPYearReviewData;
}

const COLORS = ["#3B82F6", "#8B5CF6", "#10B981", "#F59E0B", "#EF4444"];

export const SourcesSlide: React.FC<SourcesSlideProps> = ({ data }) => {
  return (
    <SlideLayout gradientStart="#06B6D4" gradientEnd="#0891B2">
      <div className="flex-1 flex flex-col justify-center items-center">
        <div className="mb-8 text-center">
          <TextReveal
            text="Where you train."
            className="text-5xl font-serif italic text-white mb-2"
          />
          <TextReveal
            text="Your favorite platforms."
            className="text-xl text-neutral-400 font-sans"
            delay={0.5}
          />
        </div>

        <motion.div
          className="w-full max-w-md h-80 my-4"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1, duration: 0.8 }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data.sourceBreakdown.slice(0, 5)}
                dataKey="count"
                nameKey="source"
                cx="50%"
                cy="50%"
                outerRadius={100}
                animationDuration={2000}
                label
              >
                {data.sourceBreakdown.slice(0, 5).map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        <div className="mt-auto text-center">
          <TextReveal
            text="Most used:"
            className="text-lg text-neutral-400 font-mono mb-2"
            delay={2.0}
          />
          <TextReveal
            text={data.topSource}
            className="text-4xl text-white font-serif"
            delay={2.5}
          />
        </div>
      </div>
    </SlideLayout>
  );
};
