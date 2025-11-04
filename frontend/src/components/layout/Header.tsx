import { Link, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/app/hooks';
import { useLogoutMutation } from '@/features/auth/authApi';
import { logout } from '@/features/auth/authSlice';

export const Header = () => {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [logoutMutation] = useLogoutMutation();

  const handleLogout = async () => {
    try {
      await logoutMutation().unwrap();
      dispatch(logout());
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
      dispatch(logout());
      navigate('/');
    }
  };

  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <div className="flex items-center gap-6">
            <Link to="/" className="text-2xl font-bold text-gray-900">
              Family Recipes
            </Link>
            <nav className="flex gap-4">
              <Link to="/recipes" className="text-gray-700 hover:text-primary-600">
                Browse Recipes
              </Link>
            </nav>
          </div>

          <nav className="flex items-center gap-4">
            {isAuthenticated && user ? (
              <>
                <span className="text-gray-700">Welcome, {user.first_name}!</span>

                {(user.role === 'member' || user.role === 'admin') && (
                  <>
                    <Link to="/member/my-recipes" className="text-primary-600 hover:text-primary-700">
                      My Recipes
                    </Link>
                    <Link to="/member/submit" className="text-primary-600 hover:text-primary-700">
                      Submit Recipe
                    </Link>
                    <Link to="/member/profile" className="text-primary-600 hover:text-primary-700">
                      Profile
                    </Link>
                  </>
                )}

                {user.role === 'admin' && (
                  <Link to="/admin/dashboard" className="text-primary-600 hover:text-primary-700">
                    Admin Dashboard
                  </Link>
                )}

                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-primary-600 hover:text-primary-700">
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                >
                  Register
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};
