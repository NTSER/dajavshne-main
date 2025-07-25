import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Calendar, Clock, Users } from 'lucide-react';

const Bookings: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Booking Management</h1>
          <p className="text-gray-400">Monitor and manage all bookings on your platform</p>
        </div>
      </div>

      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Calendar className="h-12 w-12 text-gray-500 mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Booking Management</h3>
          <p className="text-gray-400 text-center">
            Booking management features are coming soon. You'll be able to view, manage, and analyze all bookings here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Bookings;