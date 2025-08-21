import React from 'react';
import { Shield, Users, Calendar, Settings, BarChart3, LogOut } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface AdminLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  activeTab,
  onTabChange
}) => {
  const { signOut } = useAuth();

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'employees', label: 'Karyawan', icon: Users },
    { id: 'attendance', label: 'Absensi', icon: Calendar },
    { id: 'shifts', label: 'Shift', icon: Settings },
    { id: 'reports', label: 'Laporan', icon: BarChart3 },
  ];

  const handleSignOut = async () => {
    try {
      const { error } = await signOut();
      if (error) {
        console.error('Admin sign out error:', error);
        // Force reload if sign out fails
        window.location.reload();
      }
    } catch (error) {
      console.error('Admin sign out error:', error);
      // Force reload as fallback
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Shield className="w-8 h-8 text-pink-600 mr-3" />
              <h1 className="text-xl font-bold text-gray-900">Admin Panel - Sankiyo.id</h1>
            </div>
            
            <button
              onClick={handleSignOut}
              className="flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <LogOut className="w-4 h-4 mr-1" />
              Keluar
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <nav className="w-64 bg-white shadow-sm min-h-screen">
          <div className="p-4">
            <div className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-pink-50 text-pink-700 border border-pink-200'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
};