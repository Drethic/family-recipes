import { useState, useMemo } from 'react';
import { useGetRecipesQuery } from '@/features/recipes/recipeApi';
import { useGetCategoriesQuery } from '@/features/categories/categoryApi';
import { Link } from 'react-router-dom';
import { formatTime, formatFullName } from '@/utils/formatters';
import { DIFFICULTY_LABELS } from '@/utils/constants';
import { Header } from '@/components/layout/Header';

export const RecipesPage = () => {
  const { data, isLoading, error } = useGetRecipesQuery({ page: 1, limit: 20 });
  const { data: categoriesData } = useGetCategoriesQuery();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const categories = categoriesData?.data || [];

  // Client-side filtering
  const filteredRecipes = useMemo(() => {
    const recipes = data?.data?.recipes || [];

    return recipes.filter((recipe) => {
      // Search filter (title and description)
      const matchesSearch = searchTerm
        ? recipe.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          recipe.description.toLowerCase().includes(searchTerm.toLowerCase())
        : true;

      // Category filter
      const matchesCategory = selectedCategory
        ? recipe.categories?.some((cat) => cat.id === selectedCategory)
        : true;

      return matchesSearch && matchesCategory;
    });
  }, [data?.data?.recipes, searchTerm, selectedCategory]);

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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">All Recipes</h1>

        {/* Search and Filter Controls */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1">
            <input
              type="search"
              placeholder="Search recipes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* Category Filter */}
          <div className="sm:w-64">
            <select
              name="category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Recipe Grid */}
        {filteredRecipes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No recipes found. Try adjusting your search or filters.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRecipes.map((recipe) => (
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
        )}
      </div>
    </div>
  );
};
