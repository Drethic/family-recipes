import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useGetMyRecipesQuery } from '@/features/recipes/recipeApi';
import { STATUS_LABELS } from '@/utils/constants';
import { RecipeSubmitPage } from './RecipeSubmitPage';
import { RecipeEditPage } from './RecipeEditPage';
import { ProfilePage } from './ProfilePage';

const MyRecipes = () => {
  const navigate = useNavigate();
  const { data, isLoading } = useGetMyRecipesQuery();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const recipes = data?.data || [];

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">My Recipes</h2>
      <div className="bg-white shadow rounded-lg">
        {recipes.length === 0 ? (
          <p className="p-4 text-gray-500">You haven't created any recipes yet.</p>
        ) : (
          <ul className="divide-y">
            {recipes.map((recipe) => (
              <li key={recipe.id} className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold">{recipe.title}</h3>
                    <p className="text-sm text-gray-600">{recipe.description}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 text-xs rounded whitespace-nowrap ${
                      recipe.status === 'approved' ? 'bg-green-100 text-green-800' :
                      recipe.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {STATUS_LABELS[recipe.status]}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => navigate(`/recipes/${recipe.id}`)}
                        className="text-sm text-primary-600 hover:text-primary-700"
                      >
                        View
                      </button>
                      <button
                        onClick={() => navigate(`/member/edit/${recipe.id}`)}
                        className="text-sm text-primary-600 hover:text-primary-700"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export const MemberDashboard = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex gap-6">
          <aside className="w-64 bg-white rounded-lg shadow p-4">
            <nav className="space-y-2">
              <Link to="/member/dashboard" className="block px-4 py-2 rounded hover:bg-gray-100">
                Dashboard
              </Link>
              <Link to="/member/my-recipes" className="block px-4 py-2 rounded hover:bg-gray-100">
                My Recipes
              </Link>
              <Link to="/member/submit" className="block px-4 py-2 rounded hover:bg-gray-100">
                Submit Recipe
              </Link>
              <Link to="/member/profile" className="block px-4 py-2 rounded hover:bg-gray-100">
                Profile Settings
              </Link>
              <Link to="/" className="block px-4 py-2 rounded hover:bg-gray-100">
                Back to Home
              </Link>
            </nav>
          </aside>

          <main className="flex-1">
            <Routes>
              <Route path="/" element={<MyRecipes />} />
              <Route path="/dashboard" element={<MyRecipes />} />
              <Route path="/my-recipes" element={<MyRecipes />} />
              <Route path="/submit" element={<RecipeSubmitPage />} />
              <Route path="/edit/:id" element={<RecipeEditPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Routes>
          </main>
        </div>
      </div>
    </div>
  );
};
