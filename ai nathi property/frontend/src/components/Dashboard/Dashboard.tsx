import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { DollarSign, Home, Calendar, TrendingUp, Users, BarChart3 } from 'lucide-react';
import KPICard from './KPICard';
import RevenueChart from './RevenueChart';
import OccupancyChart from './OccupancyChart';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

const Dashboard: React.FC = () => {
  const dashboardRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    // Staggered animation for KPI cards
    if (cardsRef.current.length > 0) {
      gsap.fromTo(cardsRef.current, 
        { opacity: 0, y: 30 },
        { 
          opacity: 1, 
          y: 0, 
          duration: 0.6, 
          stagger: 0.1, 
          ease: "power2.out",
          delay: 0.2
        }
      );
    }

    // Dashboard content animation
    if (dashboardRef.current) {
      gsap.fromTo(dashboardRef.current.children, 
        { opacity: 0, y: 20 },
        { 
          opacity: 1, 
          y: 0, 
          duration: 0.8, 
          stagger: 0.2, 
          ease: "power2.out",
          delay: 0.4
        }
      );
    }
  }, []);

  // Sample data - replace with real data from your API
  const kpiData = [
    {
      title: "Total Revenue",
      value: "R 45,230",
      change: "+12.5% from last month",
      changeType: "positive" as const,
      icon: DollarSign,
      iconColor: "text-green-600"
    },
    {
      title: "Active Properties",
      value: "8",
      change: "+2 this month",
      changeType: "positive" as const,
      icon: Home,
      iconColor: "text-blue-600"
    },
    {
      title: "Bookings",
      value: "24",
      change: "+8 this month",
      changeType: "positive" as const,
      icon: Calendar,
      iconColor: "text-purple-600"
    },
    {
      title: "Occupancy Rate",
      value: "78%",
      change: "+5% from last month",
      changeType: "positive" as const,
      icon: TrendingUp,
      iconColor: "text-emerald-600"
    }
  ];

  const revenueData = [
    { month: "Jan", revenue: 12000 },
    { month: "Feb", revenue: 15000 },
    { month: "Mar", revenue: 18000 },
    { month: "Apr", revenue: 22000 },
    { month: "May", revenue: 25000 },
    { month: "Jun", revenue: 28000 },
    { month: "Jul", revenue: 32000 },
    { month: "Aug", revenue: 35000 },
    { month: "Sep", revenue: 38000 },
    { month: "Oct", revenue: 42000 },
    { month: "Nov", revenue: 45000 },
    { month: "Dec", revenue: 48000 }
  ];

  const occupancyData = [
    { month: "Jan", occupancy: 65 },
    { month: "Feb", occupancy: 70 },
    { month: "Mar", occupancy: 75 },
    { month: "Apr", occupancy: 80 },
    { month: "May", occupancy: 72 },
    { month: "Jun", occupancy: 78 },
    { month: "Jul", occupancy: 85 },
    { month: "Aug", occupancy: 88 },
    { month: "Sep", occupancy: 82 },
    { month: "Oct", occupancy: 90 },
    { month: "Nov", occupancy: 85 },
    { month: "Dec", occupancy: 92 }
  ];

  return (
    <div ref={dashboardRef} className="p-6 space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here's your property overview</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiData.map((kpi, index) => (
          <div
            key={index}
            ref={el => {
              if (el) cardsRef.current[index] = el;
            }}
          >
            <KPICard {...kpi} />
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChart data={revenueData} />
        <OccupancyChart data={occupancyData} />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Recent Bookings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { guest: "John Smith", property: "Sea Point Apartment", checkIn: "2024-01-15", nights: 3, amount: "R 4,200" },
                { guest: "Sarah Johnson", property: "Camps Bay Villa", checkIn: "2024-01-18", nights: 5, amount: "R 8,500" },
                { guest: "Mike Wilson", property: "Waterfront Studio", checkIn: "2024-01-20", nights: 2, amount: "R 2,800" },
                { guest: "Emma Davis", property: "Century City Loft", checkIn: "2024-01-22", nights: 4, amount: "R 3,600" }
              ].map((booking, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{booking.guest}</p>
                    <p className="text-sm text-gray-600">{booking.property}</p>
                    <p className="text-xs text-gray-500">Check-in: {booking.checkIn} • {booking.nights} nights</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-emerald-600">{booking.amount}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Property Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: "Sea Point Apartment", revenue: "R 12,500", occupancy: "85%", rating: "4.8" },
                { name: "Camps Bay Villa", revenue: "R 18,200", occupancy: "78%", rating: "4.9" },
                { name: "Waterfront Studio", revenue: "R 8,900", occupancy: "72%", rating: "4.7" },
                { name: "Century City Loft", revenue: "R 6,400", occupancy: "68%", rating: "4.6" }
              ].map((property, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium text-gray-900 text-sm">{property.name}</p>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-gray-600">Revenue: {property.revenue}</span>
                    <span className="text-xs text-gray-600">{property.occupancy} occupancy</span>
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-xs text-yellow-500">★</span>
                    <span className="text-xs text-gray-600">{property.rating}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
