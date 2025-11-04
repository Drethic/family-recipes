import { useGetRecipesQuery } from '@/features/recipes/recipeApi';
import { Link } from 'react-router-dom';
import { formatTime, formatFullName } from '@/utils/formatters';
import { DIFFICULTY_LABELS } from '@/utils/constants';
import { Header } from '@/components/layout/Header';

export const RecipesPage = () => {
  const { data, isLoading, error } = useGetRecipesQuery({ page: 1, limit: 20 });

  if (isLoading) {
    return (
      <>
        <Header />
        <div className="text-center py-8">Loading recipes...</div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <div className="text-center py-8 text-red-600">Error loading recipes</div>
      </>
    );
  }

  const recipes = data?.data?.recipes || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">All Recipes</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipes.map((recipe) => (
            <Link
              key={recipe.id}
              to={`/recipes/${recipe.id}`}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden"
            >
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{recipe.title}</h3>
                <p className="text-gray-600 mb-4 line-clamp-2">{recipe.description}</p>

                <div className="flex justify-between text-sm text-gray-500">
                  <span>Prep: {formatTime(recipe.prep_time)}</span>
                  <span>Cook: {formatTime(recipe.cook_time)}</span>
                  <span className="capitalize">{DIFFICULTY_LABELS[recipe.difficulty]}</span>
                </div>

                {recipe.author && (
                  <p className="text-xs text-gray-400 mt-4">
                    By {formatFullName(recipe.author.first_name, recipe.author.last_name)}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};
