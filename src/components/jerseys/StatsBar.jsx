import React from "react";
import { Shirt, Users, Heart, Trophy } from "lucide-react";
import { motion } from "framer-motion";

export default function StatsBar({ totalJerseys, totalCollectors, totalLikes, topLeague }) {
  const stats = [
    { icon: Shirt, label: "Trikots", value: totalJerseys, color: "from-cyan-400 to-blue-500" },
    { icon: Users, label: "Sammler", value: totalCollectors, color: "from-violet-400 to-purple-500" },
    { icon: Heart, label: "Likes", value: totalLikes, color: "from-rose-400 to-pink-500" },
    { icon: Trophy, label: "Top Liga", value: topLeague || "–", color: "from-amber-400 to-orange-500" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="relative overflow-hidden rounded-xl bg-slate-900/60 backdrop-blur-sm border border-white/5 p-4"
        >
          <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${stat.color} opacity-5 rounded-full -translate-y-6 translate-x-6`} />
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-gradient-to-br ${stat.color} bg-opacity-20`}>
              <stat.icon className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-lg leading-none">{stat.value}</p>
              <p className="text-white/40 text-xs mt-0.5">{stat.label}</p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}