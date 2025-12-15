import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { 
  MapPin, 
  Users, 
  CheckCircle2,
  Bus
} from "lucide-react";

export default function StatsGrid({ activeTrips, totalParticipants, todayCheckins, busPayments }) {
  const stats = [
    {
      title: "Ενεργές Εκδρομές",
      value: activeTrips,
      icon: MapPin,
      color: "from-orange-500 to-amber-500",
      textColor: "text-orange-600"
    },

    {
      title: "Συνολικοί Συμμετέχοντες",
      value: totalParticipants,
      icon: Users,
      color: "from-purple-500 to-pink-500",
      textColor: "text-purple-600"
    },
    {
      title: "Check-ins Σήμερα",
      value: todayCheckins,
      icon: CheckCircle2,
      color: "from-green-500 to-emerald-500",
      textColor: "text-green-600"
    },
    {
      title: "Πληρωμές Λεωφορείου",
      value: busPayments,
      icon: Bus,
      color: "from-lime-500 to-green-500",
      textColor: "text-lime-600"
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => {
        const isBusPayments = stat.title === "Πληρωμές Λεωφορείου";
        const CardWrapper = isBusPayments ? Link : 'div';
        const wrapperProps = isBusPayments ? { to: createPageUrl("BusPayments") } : {};
        
        return (
          <CardWrapper key={index} {...wrapperProps}>
            <Card className={`border-none shadow-lg overflow-hidden ${isBusPayments ? 'cursor-pointer hover:shadow-xl transition-all' : ''}`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center shadow-md`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                  <p className={`text-3xl font-bold ${stat.textColor}`}>
                    {stat.value}
                  </p>
                </div>
              </CardContent>
            </Card>
          </CardWrapper>
        );
      })}
    </div>
  );
}