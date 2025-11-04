import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useGetRecipesQuery, useApproveRecipeMutation, useRejectRecipeMutation } from '@/features/recipes/recipeApi';
import { RecipeStatus } from '@/types';
import { UserManagement } from '@/components/admin/UserManagement';
import { RecipeEditPage } from './RecipeEditPage';

const PendingRecipes = () => {
  const navigate = useNavigate();
  const { data, isLoading } = useGetRecipesQuery({ status: RecipeStatus.PENDING });
  const [approve] = useApproveRecipeMutation();
  const [reject] = useRejectRecipeMutation();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const recipes = data?.data?.recipes || [];

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Pending Recipes</h2>
      <div className="bg-white shadow rounded-lg">
        {recipes.length === 0 ? (
          <p className="p-4 text-gray-500">No pending recipes to review.</p>
        ) : (
          <ul className="divide-y">
            {recipes.map((recipe) => (
              <li key={recipe.id} className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold">{recipe.title}</h3>
                    <p className="text-sm text-gray-600">{recipe.description}</p>
                    {recipe.author && (
                      <p className="text-xs text-gray-400 mt-1">
                        Submitted by {recipe.author.first_name} {recipe.author.last_name}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/recipes/${recipe.id}`)}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                    >
                      View
                    </button>
                    <button
                      onClick={() => navigate(`/admin/edit/${recipe.id}`)}
                      className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => approve(recipe.id)}
                      className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => reject(recipe.id)}
                      className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                    >
                      Reject
                    </button>
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

export const AdminDashboard = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex gap-6">
          <aside className="w-64 bg-white rounded-lg shadow p-4">
            <nav className="space-y-2">
              <Link to="/admin/dashboard" className="block px-4 py-2 rounded hover:bg-gray-100">
                Dashboard
              </Link>
              <Link to="/admin/recipes/pending" className="block px-4 py-2 rounded hover:bg-gray-100">
                Pending Recipes
              </Link>
              <Link to="/admin/users" className="block px-4 py-2 rounded hover:bg-gray-100">
                User Management
              </Link>
              <Link to="/" className="block px-4 py-2 rounded hover:bg-gray-100">
                Back to Home
              </Link>
            </nav>
          </aside>

          <main className="flex-1">
            <Routes>
              <Route path="/" element={<PendingRecipes />} />
              <Route path="/dashboard" element={<PendingRecipes />} />
              <Route path="/recipes/pending" element={<PendingRecipes />} />
              <Route path="/users" element={<UserManagement />} />
              <Route path="/edit/:id" element={<RecipeEditPage />} />
            </Routes>
          </main>
        </div>
      </div>
    </div>
  );
};
