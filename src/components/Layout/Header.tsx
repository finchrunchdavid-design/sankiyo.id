import React from 'react';
import { Clock, LogOut, User } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useEmployee } from '../../hooks/useEmployee';

export const Header: React.FC = () => {
  const { user, signOut } = useAuth();
  const { employee } = useEmployee(user?.id);

  const handleSignOut = async () => {
    try {
      const { error } = await signOut();
      if (error) {
        console.error('Sign out error:', error);
        // Force reload if sign out fails
        window.location.reload();
      }
    } catch (error) {
      console.error('Sign out error:', error);
      // Force reload as fallback
      window.location.reload();
    }
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Clock className="w-8 h-8 text-pink-600 mr-3" />
            <h1 className="text-xl font-bold text-gray-900">Sistem Absensi Sankiyo.id</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center text-sm text-gray-600">
              <User className="w-4 h-4 mr-2" />
              <span>{employee?.name || user?.email}</span>
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
      </div>
    </header>
  );
};