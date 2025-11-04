import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useGetRecipeByIdQuery, useUpdateRecipeMutation } from '@/features/recipes/recipeApi';
import { useGetCategoriesQuery } from '@/features/categories/categoryApi';
import { RecipeDifficulty } from '@/types';

export const RecipeEditPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: recipeData, isLoading: recipeLoading } = useGetRecipeByIdQuery(id!);
  const { data: categoriesData } = useGetCategoriesQuery();
  const [updateRecipe, { isLoading }] = useUpdateRecipeMutation();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    prepTime: 15,
    cookTime: 30,
    servings: 4,
    difficulty: RecipeDifficulty.MEDIUM,
    isPrivate: false,
  });

  const [ingredients, setIngredients] = useState([
    { quantity: '', unit: '', name: '', order_index: 1 },
  ]);

  const [instructions, setInstructions] = useState([
    { step_number: 1, description: '' },
  ]);

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [error, setError] = useState('');

  // Populate form when recipe data loads
  useEffect(() => {
    if (recipeData?.data) {
      const recipe = recipeData.data;
      setFormData({
        title: recipe.title,
        description: recipe.description,
        prepTime: recipe.prep_time,
        cookTime: recipe.cook_time,
        servings: recipe.servings,
        difficulty: recipe.difficulty,
        isPrivate: recipe.is_private,
      });

      if (recipe.ingredients && recipe.ingredients.length > 0) {
        setIngredients(recipe.ingredients.map((ing, idx) => ({
          quantity: ing.quantity,
          unit: ing.unit || '',
          name: ing.name,
          order_index: idx + 1,
        })));
      }

      if (recipe.instructions && recipe.instructions.length > 0) {
        setInstructions(recipe.instructions.map((inst) => ({
          step_number: inst.step_number,
          description: inst.description,
        })));
      }

      if (recipe.categories) {
        setSelectedCategories(recipe.categories.map((cat) => cat.id));
      }
    }
  }, [recipeData]);

  const handleAddIngredient = () => {
    setIngredients([...ingredients, { quantity: '', unit: '', name: '', order_index: ingredients.length + 1 }]);
  };

  const handleRemoveIngredient = (index: number) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter((_, i) => i !== index));
    }
  };

  const handleIngredientChange = (index: number, field: string, value: string) => {
    const updated = [...ingredients];
    updated[index] = { ...updated[index], [field]: value };
    setIngredients(updated);
  };

  const handleAddInstruction = () => {
    setInstructions([...instructions, { step_number: instructions.length + 1, description: '' }]);
  };

  const handleRemoveInstruction = (index: number) => {
    if (instructions.length > 1) {
      const updated = instructions.filter((_, i) => i !== index);
      // Renumber steps
      setInstructions(updated.map((inst, idx) => ({ ...inst, step_number: idx + 1 })));
    }
  };

  const handleInstructionChange = (index: number, value: string) => {
    const updated = [...instructions];
    updated[index].description = value;
    setInstructions(updated);
  };

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }

    const hasValidIngredients = ingredients.some(
      (ing) => ing.name.trim() && ing.quantity.trim()
    );
    if (!hasValidIngredients) {
      setError('At least one ingredient is required');
      return;
    }

    const hasValidInstructions = instructions.some((inst) => inst.description.trim());
    if (!hasValidInstructions) {
      setError('At least one instruction is required');
      return;
    }

    try {
      await updateRecipe({
        id: id!,
        data: {
          ...formData,
          ingredients: ingredients
            .filter((ing) => ing.name.trim() && ing.quantity.trim())
            .map((ing, idx) => ({
              quantity: ing.quantity,
              unit: ing.unit,
              name: ing.name,
              order_index: idx + 1,
            })),
          instructions: instructions
            .filter((inst) => inst.description.trim())
            .map((inst, idx) => ({
              step_number: idx + 1,
              description: inst.description,
            })),
          categoryIds: selectedCategories,
        },
      }).unwrap();

      navigate(`/recipes/${id}`);
    } catch (err) {
      const error = err as { data?: { message?: string } };
      setError(error?.data?.message || 'Failed to update recipe');
    }
  };

  if (recipeLoading) {
    return <div className="text-center py-8">Loading recipe...</div>;
  }

  if (!recipeData?.data) {
    return <div className="text-center py-8">Recipe not found</div>;
  }

  const categories = categoriesData?.data || [];

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Edit Recipe</h1>

      {error && (
        <div className="mb-6 rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 bg-white shadow rounded-lg p-6">
        {/* Basic Info */}
        <div className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Recipe Title *
            </label>
            <input
              type="text"
              id="title"
              className="mt-1 block w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description *
            </label>
            <textarea
              id="description"
              rows={3}
              className="mt-1 block w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="prepTime" className="block text-sm font-medium text-gray-700">
                Prep Time (minutes) *
              </label>
              <input
                type="number"
                id="prepTime"
                min="0"
                className="mt-1 block w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                value={formData.prepTime}
                onChange={(e) => setFormData({ ...formData, prepTime: parseInt(e.target.value) || 0 })}
              />
            </div>

            <div>
              <label htmlFor="cookTime" className="block text-sm font-medium text-gray-700">
                Cook Time (minutes) *
              </label>
              <input
                type="number"
                id="cookTime"
                min="0"
                className="mt-1 block w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                value={formData.cookTime}
                onChange={(e) => setFormData({ ...formData, cookTime: parseInt(e.target.value) || 0 })}
              />
            </div>

            <div>
              <label htmlFor="servings" className="block text-sm font-medium text-gray-700">
                Servings *
              </label>
              <input
                type="number"
                id="servings"
                min="1"
                className="mt-1 block w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                value={formData.servings}
                onChange={(e) => setFormData({ ...formData, servings: parseInt(e.target.value) || 1 })}
              />
            </div>
          </div>

          <div>
            <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700">
              Difficulty *
            </label>
            <select
              id="difficulty"
              className="mt-1 block w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              value={formData.difficulty}
              onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as RecipeDifficulty })}
            >
              <option value={RecipeDifficulty.EASY}>Easy</option>
              <option value={RecipeDifficulty.MEDIUM}>Medium</option>
              <option value={RecipeDifficulty.HARD}>Hard</option>
            </select>
          </div>
        </div>

        {/* Ingredients */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900">Ingredients</h2>
            <button
              type="button"
              onClick={handleAddIngredient}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              + Add Ingredient
            </button>
          </div>
          <div className="space-y-2">
            {ingredients.map((ingredient, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Quantity (e.g., 2)"
                  className="w-24 px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  value={ingredient.quantity}
                  onChange={(e) => handleIngredientChange(index, 'quantity', e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Unit (e.g., cups)"
                  className="w-32 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  value={ingredient.unit}
                  onChange={(e) => handleIngredientChange(index, 'unit', e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Ingredient name"
                  className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  value={ingredient.name}
                  onChange={(e) => handleIngredientChange(index, 'name', e.target.value)}
                />
                {ingredients.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveIngredient(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Instructions */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900">Instructions</h2>
            <button
              type="button"
              onClick={handleAddInstruction}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              + Add Step
            </button>
          </div>
          <div className="space-y-3">
            {instructions.map((instruction, index) => (
              <div key={index} className="flex gap-2">
                <div className="flex-shrink-0 w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center font-medium">
                  {index + 1}
                </div>
                <textarea
                  placeholder="Describe this step..."
                  rows={2}
                  className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  value={instruction.description}
                  onChange={(e) => handleInstructionChange(index, e.target.value)}
                />
                {instructions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveInstruction(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Categories */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Categories</label>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => toggleCategory(category.id)}
                className={`px-3 py-1 rounded-full text-sm ${
                  selectedCategories.includes(category.id)
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Privacy */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="isPrivate"
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            checked={formData.isPrivate}
            onChange={(e) => setFormData({ ...formData, isPrivate: e.target.checked })}
          />
          <label htmlFor="isPrivate" className="ml-2 block text-sm text-gray-900">
            Private Recipe (only visible to family members)
          </label>
        </div>

        {/* Submit */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isLoading ? 'Updating...' : 'Update Recipe'}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};
