import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';

export function Header() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link to="/" className="text-xl font-bold text-blue-600">
              DataTextConverter
            </Link>
            <nav className="hidden md:flex space-x-4">
              <Link
                to="/convert"
                className="text-gray-700 hover:text-blue-600 transition-colors"
              >
                Convert
              </Link>
              <Link
                to="/templates"
                className="text-gray-700 hover:text-blue-600 transition-colors"
              >
                Templates
              </Link>
              <Link
                to="/history"
                className="text-gray-700 hover:text-blue-600 transition-colors"
              >
                History
              </Link>
              <Link
                to="/gallery"
                className="text-gray-700 hover:text-blue-600 transition-colors"
              >
                Gallery
              </Link>
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            {user && (
              <>
                <Link
                  to="/profile"
                  className="text-gray-700 hover:text-blue-600 transition-colors"
                >
                  {user.email}
                </Link>
                <Button variant="secondary" size="sm" onClick={handleSignOut}>
                  Sign Out
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
