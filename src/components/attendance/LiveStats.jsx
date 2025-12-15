import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Users, UserCheck, UserX, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

export default function LiveStats({ totalCount, presentCount, absentCount, isLoading }) {
  const attendanceRate = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

  const stats = [
    {
      title: "Σύνολο",
      value: totalCount,
      icon: Users,
      color: "from-blue-500 to-cyan-500",
      textColor: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      title: "Παρόντες",
      value: presentCount,
      icon: UserCheck,
      color: "from-green-500 to-emerald-500",
      textColor: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      title: "Απόντες",
      value: absentCount,
      icon: UserX,
      color: "from-red-500 to-rose-500",
      textColor: "text-red-600",
      bgColor: "bg-red-50"
    },
    {
      title: "Ποσοστό",
      value: `${attendanceRate}%`,
      icon: TrendingUp,
      color: "from-orange-500 to-amber-500",
      textColor: "text-orange-600",
      bgColor: "bg-orange-50"
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="border-none shadow-lg overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center shadow-md`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                {!isLoading && stat.title === "Παρόντες" && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.5 }}
                    className={`w-3 h-3 rounded-full ${stat.bgColor} ${stat.textColor}`}
                  />
                )}
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                <motion.p 
                  key={stat.value}
                  initial={{ scale: 1.2 }}
                  animate={{ scale: 1 }}
                  className={`text-3xl font-bold ${stat.textColor}`}
                >
                  {stat.value}
                </motion.p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}