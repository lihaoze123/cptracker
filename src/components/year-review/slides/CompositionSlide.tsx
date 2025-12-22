import React from "react";
import { SlideLayout } from "../SlideLayout";
import { TextReveal } from "../TextReveal";
import type { CPYearReviewData } from "@/lib/year-review/types";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";

interface CompositionSlideProps {
  data: CPYearReviewData;
}

export const CompositionSlide: React.FC<CompositionSlideProps> = ({ data }) => {
  return (
    <SlideLayout gradientStart="#8B5CF6" gradientEnd="#A855F7">
      <div className="flex-1 flex flex-col justify-center items-center">
        <div className="mb-8 text-center">
          <TextReveal
            text="Your difficulty spread."
            className="text-5xl font-serif italic text-white mb-2"
          />
          <TextReveal
            text="How hard did you push yourself?"
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
                data={data.difficultyBreakdown}
                dataKey="count"
                nameKey="level"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                animationDuration={2000}
                paddingAngle={2}
              >
                {data.difficultyBreakdown.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        <div className="mt-auto text-center">
          <TextReveal
            text="Average difficulty:"
            className="text-lg text-neutral-400 font-mono mb-2"
            delay={2.0}
          />
          <TextReveal
            text={`${data.avgDifficulty}`}
            className="text-4xl text-white font-serif"
            delay={2.5}
          />
        </div>
      </div>
    </SlideLayout>
  );
};
