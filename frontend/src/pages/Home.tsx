import { Link } from 'react-router-dom';
import { useAppSelector } from '@/app/hooks';

export const Home = () => {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Family Recipes</h1>
          <nav className="flex gap-4">
            {isAuthenticated ? (
              <>
                <span className="text-gray-700">Welcome, {user?.first_name}!</span>
                {user?.role === 'admin' && (
                  <Link to="/admin/dashboard" className="text-primary-600 hover:text-primary-700">
                    Admin Dashboard
                  </Link>
                )}
                {(user?.role === 'member' || user?.role === 'admin') && (
                  <Link to="/member/dashboard" className="text-primary-600 hover:text-primary-700">
                    My Recipes
                  </Link>
                )}
              </>
            ) : (
              <>
                <Link to="/login" className="text-primary-600 hover:text-primary-700">
                  Login
                </Link>
                <Link to="/register" className="text-primary-600 hover:text-primary-700">
                  Register
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="text-center">
            <h2 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
              Welcome to Our Family Recipe Collection
            </h2>
            <p className="mt-4 text-xl text-gray-600">
              Discover, share, and preserve family recipes for generations to come
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Link
                to="/recipes"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
              >
                Browse Recipes
              </Link>
              {!isAuthenticated && (
                <Link
                  to="/register"
                  className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Join Now
                </Link>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
