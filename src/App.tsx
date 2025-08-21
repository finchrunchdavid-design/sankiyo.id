import { useAuth } from './hooks/useAuth';
import { useEmployee } from './hooks/useEmployee';
import { AuthPage } from './components/Auth/AuthPage';
import { Dashboard } from './components/Dashboard/Dashboard';
import { AdminPanel } from './components/Admin/AdminPanel';

function App() {
  const { user, loading } = useAuth();
  const { employee } = useEmployee(user?.id);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Debug info for deployment
  if (import.meta.env.DEV) {
    console.log('🔍 App Debug Info:', {
      user: user?.email,
      employee: employee?.name,
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
      hasAnonKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY
    });
  }

  if (!user) {
    return <AuthPage />;
  }

  // Check if user is admin (you can modify this logic based on your needs)
  const isAdmin = user.email === 'admin@admin.com';

  return isAdmin ? <AdminPanel /> : <Dashboard />;
}

export default App;