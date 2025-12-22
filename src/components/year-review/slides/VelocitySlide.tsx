import React from "react";
import { SlideLayout } from "../SlideLayout";
import { TextReveal } from "../TextReveal";
import type { CPYearReviewData } from "@/lib/year-review/types";
import { ResponsiveContainer, LineChart, Line, YAxis } from "recharts";
import { motion } from "framer-motion";

interface VelocitySlideProps {
  data: CPYearReviewData;
}

export const VelocitySlide: React.FC<VelocitySlideProps> = ({ data }) => {
  const activeDays = data.velocityData.filter((d) => d.count > 0).length;

  return (
    <SlideLayout gradientStart="#8B5CF6" gradientEnd="#EAB308">
      <div className="flex-1 flex flex-col justify-center h-full">
        <div className="mb-8">
          <TextReveal
            text="Your rhythm."
            className="text-5xl font-serif italic text-white mb-2"
          />
          <TextReveal
            text={`You solved problems on ${activeDays} days.`}
            className="text-xl text-neutral-400 font-sans"
            delay={0.5}
            highlight={`${activeDays}`}
          />
        </div>

        <motion.div
          className="h-64 w-full my-8 relative"
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ delay: 1, duration: 1 }}
        >
          <div className="absolute inset-0 bg-purple-500/10 blur-xl"></div>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.velocityData}>
              <YAxis hide domain={["dataMin", "dataMax"]} />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#8B5CF6"
                strokeWidth={2}
                dot={false}
                animationDuration={3000}
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        <div className="mt-auto">
          <TextReveal
            text="Your longest streak?"
            className="text-lg text-neutral-400 font-mono mb-2"
            delay={2.0}
          />
          <TextReveal
            text={`${data.longestStreak} days. Unstoppable.`}
            className="text-4xl text-white font-serif"
            highlight="Unstoppable."
            delay={2.5}
          />
        </div>
      </div>
    </SlideLayout>
  );
};
