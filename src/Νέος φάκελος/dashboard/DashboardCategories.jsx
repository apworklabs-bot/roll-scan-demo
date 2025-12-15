import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Package, Users, ChevronRight } from "lucide-react";

export default function DashboardCategories() {
  const categories = [
    {
      title: "Εξοπλισμός",
      description: "Αναφορές Εξοπλισμού - Διαχείριση και παρακολούθηση εξοπλισμού",
      icon: Package,
      color: "from-teal-500 to-cyan-500",
      textColor: "text-teal-600",
      link: "EquipmentReports"
    },
    {
      title: "Συμμετέχοντες",
      description: "Καρτέλα Συμμετέχοντα - Όλοι οι συμμετέχοντες",
      icon: Users,
      color: "from-purple-500 to-pink-500",
      textColor: "text-purple-600",
      link: "AllParticipants"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {categories.map((category, index) => (
        <Link key={index} to={createPageUrl(category.link)}>
          <Card className="border-none shadow-lg hover:shadow-xl transition-all cursor-pointer h-full">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 bg-gradient-to-br ${category.color} rounded-xl flex items-center justify-center shadow-md flex-shrink-0`}>
                    <category.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className={`text-lg font-bold ${category.textColor}`}>{category.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}