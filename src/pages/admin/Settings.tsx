import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Settings as SettingsIcon, Cog } from 'lucide-react';

const Settings: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-gray-400">Configure your admin panel and platform settings</p>
        </div>
      </div>

      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Cog className="h-12 w-12 text-gray-500 mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Admin Settings</h3>
          <p className="text-gray-400 text-center">
            Settings panel is coming soon. You'll be able to configure platform settings, notifications, and more.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;