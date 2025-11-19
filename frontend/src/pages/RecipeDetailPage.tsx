import { useParams, useNavigate } from 'react-router-dom';
import { useGetRecipeByIdQuery } from '@/features/recipes/recipeApi';
import { formatTime, formatFullName, getTotalTime } from '@/utils/formatters';
import { DIFFICULTY_LABELS } from '@/utils/constants';
import { Header } from '@/components/layout/Header';
import { ImageCarousel } from '@/components/recipe/ImageCarousel';
import { useAppSelector } from '@/app/hooks';
import { UserRole } from '@/types';

export const RecipeDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading, error } = useGetRecipeByIdQuery(id!);
  const { user } = useAppSelector((state) => state.auth);

  if (isLoading) {
    return (
      <>
        <Header />
        <div className="text-center py-8">Loading recipe...</div>
      </>
    );
  }

  if (error || !data?.data) {
    return (
      <>
        <Header />
        <div className="text-center py-8 text-red-600">Recipe not found</div>
      </>
    );
  }

  const recipe = data.data;

  // Check if user can edit (owner or admin)
  const canEdit = user && (user.id === recipe.author_id || user.role === UserRole.ADMIN);

  // Filter images into final product images and step images
  const finalProductImages = recipe.images?.filter((img) => !img.instruction_id).sort((a, b) => a.order_index - b.order_index) || [];

  // Create a map of instruction_id to image for step images
  const stepImageMap = new Map(
    recipe.images?.filter((img) => img.instruction_id).map((img) => [img.instruction_id, img]) || []
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Back Button and Edit Button */}
        <div className="mb-4 flex justify-between items-center">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-primary-600 hover:text-primary-700"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          {canEdit && (
            <button
              onClick={() => navigate(`/recipes/${id}/edit`)}
              className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Recipe
            </button>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Image Carousel */}
          {finalProductImages.length > 0 && (
            <div className="p-8 pb-0">
              <ImageCarousel images={finalProductImages} recipeName={recipe.title} />
            </div>
          )}

          <div className="p-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{recipe.title}</h1>
            <p className="text-gray-600 mb-6">{recipe.description}</p>

            <div className="flex gap-6 mb-8 text-sm">
              <div>
                <span className="font-semibold">Prep Time:</span> {formatTime(recipe.prep_time)}
              </div>
              <div>
                <span className="font-semibold">Cook Time:</span> {formatTime(recipe.cook_time)}
              </div>
              <div>
                <span className="font-semibold">Total:</span> {formatTime(getTotalTime(recipe.prep_time, recipe.cook_time))}
              </div>
              <div>
                <span className="font-semibold">Servings:</span> {recipe.servings}
              </div>
              <div>
                <span className="font-semibold">Difficulty:</span> {DIFFICULTY_LABELS[recipe.difficulty]}
              </div>
            </div>

            {recipe.author && (
              <p className="text-sm text-gray-500 mb-8">
                Recipe by {formatFullName(recipe.author.first_name, recipe.author.last_name)}
              </p>
            )}

            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Ingredients</h2>
              <ul className="space-y-2">
                {recipe.ingredients?.map((ingredient, index) => (
                  <li key={ingredient.id || index} className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>
                      {ingredient.quantity} {ingredient.unit} {ingredient.name}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Instructions</h2>
              <ol className="space-y-6">
                {recipe.instructions?.map((instruction, index) => {
                  const stepImage = instruction.id ? stepImageMap.get(instruction.id) : undefined;

                  return (
                    <li key={instruction.id || index} className="flex flex-col">
                      <div className="flex">
                        <span className="font-bold mr-4">{instruction.step_number}.</span>
                        <span>{instruction.description}</span>
                      </div>
                      {stepImage && (
                        <div className="ml-8 mt-3">
                          <img
                            src={stepImage.url}
                            alt={stepImage.alt_text || `Step ${instruction.step_number} image`}
                            className="max-w-md w-full h-auto rounded-lg shadow-md"
                          />
                        </div>
                      )}
                    </li>
                  );
                })}
              </ol>
            </div>

            {recipe.categories && recipe.categories.length > 0 && (
              <div className="mt-8 pt-8 border-t">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Categories:</h3>
                <div className="flex gap-2">
                  {recipe.categories.map((category) => (
                    <span
                      key={category.id}
                      className="inline-block bg-gray-100 rounded-full px-3 py-1 text-sm text-gray-700"
                    >
                      {category.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
