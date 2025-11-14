import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateRecipeMutation, useUploadRecipeImageMutation } from '@/features/recipes/recipeApi';
import { useGetCategoriesQuery } from '@/features/categories/categoryApi';
import { RecipeDifficulty } from '@/types';
import { ImageUpload } from '@/components/recipe/ImageUpload';
import { StepImageUpload } from '@/components/recipe/StepImageUpload';

interface ImageFile {
  file: File;
  preview: string;
  altText: string;
  isPrimary: boolean;
}

interface StepImageFile {
  file: File;
  preview: string;
  altText: string;
}

export const RecipeSubmitPage = () => {
  const navigate = useNavigate();
  const [createRecipe, { isLoading }] = useCreateRecipeMutation();
  const [uploadImage] = useUploadRecipeImageMutation();
  const { data: categoriesData } = useGetCategoriesQuery();
  const categories = categoriesData?.data || [];

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    prepTime: '',
    cookTime: '',
    servings: '',
    difficulty: 'medium' as RecipeDifficulty,
    isPrivate: false,
  });

  const [ingredients, setIngredients] = useState([
    { quantity: '', unit: '', name: '', order_index: 0 },
  ]);

  const [instructions, setInstructions] = useState([
    { step_number: 1, description: '' },
  ]);

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [productImages, setProductImages] = useState<ImageFile[]>([]);
  const [stepImages, setStepImages] = useState<Map<number, StepImageFile | null>>(new Map());
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleAddIngredient = () => {
    setIngredients([
      ...ingredients,
      { quantity: '', unit: '', name: '', order_index: ingredients.length },
    ]);
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handleIngredientChange = (index: number, field: string, value: string) => {
    const updated = [...ingredients];
    updated[index] = { ...updated[index], [field]: value, order_index: index };
    setIngredients(updated);
  };

  const handleAddInstruction = () => {
    setInstructions([
      ...instructions,
      { step_number: instructions.length + 1, description: '' },
    ]);
  };

  const handleRemoveInstruction = (index: number) => {
    const updated = instructions.filter((_, i) => i !== index);
    // Renumber steps
    updated.forEach((inst, i) => {
      inst.step_number = i + 1;
    });
    setInstructions(updated);

    // Remove associated step image
    const newStepImages = new Map(stepImages);
    newStepImages.delete(index);
    // Renumber step images
    const renumbered = new Map<number, StepImageFile | null>();
    Array.from(newStepImages.entries()).forEach(([key, value]) => {
      if (key > index) {
        renumbered.set(key - 1, value);
      } else {
        renumbered.set(key, value);
      }
    });
    setStepImages(renumbered);
  };

  const handleInstructionChange = (index: number, value: string) => {
    const updated = [...instructions];
    updated[index] = { ...updated[index], description: value };
    setInstructions(updated);
  };

  const handleCategoryToggle = (categoryId: string) => {
    if (selectedCategories.includes(categoryId)) {
      setSelectedCategories(selectedCategories.filter((id) => id !== categoryId));
    } else {
      setSelectedCategories([...selectedCategories, categoryId]);
    }
  };

  const handleStepImageChange = (stepIndex: number, image: StepImageFile | null) => {
    const newStepImages = new Map(stepImages);
    newStepImages.set(stepIndex, image);
    setStepImages(newStepImages);
  };

  const uploadAllImages = async (recipeId: string, instructionIds: string[]) => {
    const uploadPromises: Promise<unknown>[] = [];

    // Upload final product images
    for (let i = 0; i < productImages.length; i++) {
      const img = productImages[i];
      uploadPromises.push(
        uploadImage({
          recipeId,
          file: img.file,
          altText: img.altText,
          isPrimary: img.isPrimary,
          orderIndex: i,
        }).unwrap()
      );
    }

    // Upload step images
    stepImages.forEach((img, stepIndex) => {
      if (img && instructionIds[stepIndex]) {
        uploadPromises.push(
          uploadImage({
            recipeId,
            file: img.file,
            altText: img.altText,
            instructionId: instructionIds[stepIndex],
          }).unwrap()
        );
      }
    });

    await Promise.all(uploadPromises);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const result = await createRecipe({
        title: formData.title,
        description: formData.description,
        prepTime: parseInt(formData.prepTime),
        cookTime: parseInt(formData.cookTime),
        servings: parseInt(formData.servings),
        difficulty: formData.difficulty,
        isPrivate: formData.isPrivate,
        ingredients: ingredients.filter((ing) => ing.name.trim() !== ''),
        instructions: instructions.filter((inst) => inst.description.trim() !== ''),
        categoryIds: selectedCategories,
      }).unwrap();

      if (result.success && result.data) {
        // Upload images if any
        if (productImages.length > 0 || stepImages.size > 0) {
          setUploading(true);
          const instructionIds = result.data.instructions?.map((inst) => inst.id || '') || [];
          await uploadAllImages(result.data.id, instructionIds);
        }

        navigate('/member/my-recipes');
      }
    } catch (err) {
      const error = err as { data?: { message?: string } };
      setError(error?.data?.message || 'Failed to create recipe');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Submit a New Recipe</h1>

        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-6">
          {/* Basic Info */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Recipe Title
            </label>
            <input
              type="text"
              id="title"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-primary-500 focus:ring-primary-500"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="description"
              rows={3}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-primary-500 focus:ring-primary-500"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          {/* Time and Servings */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="prepTime" className="block text-sm font-medium text-gray-700">
                Prep Time (minutes)
              </label>
              <input
                type="number"
                id="prepTime"
                min="0"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-primary-500 focus:ring-primary-500"
                value={formData.prepTime}
                onChange={(e) => setFormData({ ...formData, prepTime: e.target.value })}
              />
            </div>

            <div>
              <label htmlFor="cookTime" className="block text-sm font-medium text-gray-700">
                Cook Time (minutes)
              </label>
              <input
                type="number"
                id="cookTime"
                min="0"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-primary-500 focus:ring-primary-500"
                value={formData.cookTime}
                onChange={(e) => setFormData({ ...formData, cookTime: e.target.value })}
              />
            </div>

            <div>
              <label htmlFor="servings" className="block text-sm font-medium text-gray-700">
                Servings
              </label>
              <input
                type="number"
                id="servings"
                min="1"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-primary-500 focus:ring-primary-500"
                value={formData.servings}
                onChange={(e) => setFormData({ ...formData, servings: e.target.value })}
              />
            </div>
          </div>

          {/* Difficulty */}
          <div>
            <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700">
              Difficulty
            </label>
            <select
              id="difficulty"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-primary-500 focus:ring-primary-500"
              value={formData.difficulty}
              onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as RecipeDifficulty })}
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          {/* Private checkbox */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isPrivate"
              className="h-4 w-4 text-primary-600 border-gray-300 rounded"
              checked={formData.isPrivate}
              onChange={(e) => setFormData({ ...formData, isPrivate: e.target.checked })}
            />
            <label htmlFor="isPrivate" className="ml-2 block text-sm text-gray-900">
              Make this recipe private (only visible to family members)
            </label>
          </div>

          {/* Categories */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Categories</label>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => {
                    handleCategoryToggle(category.id);
                  }}
                  className={`px-3 py-1 rounded-full text-sm ${
                    selectedCategories.includes(category.id)
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          {/* Final Product Images */}
          <div>
            <ImageUpload
              maxImages={3}
              onImagesChange={setProductImages}
              existingImages={productImages}
            />
          </div>

          {/* Ingredients */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Ingredients</label>
            {ingredients.map((ingredient, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Quantity"
                  className="w-24 rounded-md border border-gray-300 px-3 py-2 text-gray-900"
                  value={ingredient.quantity}
                  onChange={(e) => handleIngredientChange(index, 'quantity', e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Unit"
                  className="w-24 rounded-md border border-gray-300 px-3 py-2 text-gray-900"
                  value={ingredient.unit}
                  onChange={(e) => handleIngredientChange(index, 'unit', e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Ingredient name"
                  className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-gray-900"
                  value={ingredient.name}
                  onChange={(e) => handleIngredientChange(index, 'name', e.target.value)}
                />
                {ingredients.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveIngredient(index)}
                    className="px-3 py-2 text-red-600 hover:text-red-700"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={handleAddIngredient}
              className="mt-2 text-sm text-primary-600 hover:text-primary-700"
            >
              + Add Ingredient
            </button>
          </div>

          {/* Instructions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Instructions</label>
            {instructions.map((instruction, index) => (
              <div key={index} className="mb-4">
                <div className="flex gap-2 mb-2">
                  <span className="px-3 py-2 text-gray-700 font-semibold">{index + 1}.</span>
                  <textarea
                    placeholder="Instruction step"
                    rows={2}
                    className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-gray-900"
                    value={instruction.description}
                    onChange={(e) => {
                      handleInstructionChange(index, e.target.value);
                    }}
                  />
                  {instructions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        handleRemoveInstruction(index);
                      }}
                      className="px-3 py-2 text-red-600 hover:text-red-700"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <StepImageUpload
                  stepNumber={index + 1}
                  onImageChange={(image) => {
                    handleStepImageChange(index, image);
                  }}
                  existingImage={stepImages.get(index) || null}
                />
              </div>
            ))}
            <button
              type="button"
              onClick={handleAddInstruction}
              className="mt-2 text-sm text-primary-600 hover:text-primary-700"
            >
              + Add Instruction
            </button>
          </div>

          {/* Submit */}
          <div className="pt-4 border-t">
            <button
              type="submit"
              disabled={isLoading || uploading}
              className="w-full py-3 px-4 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
            >
              {uploading ? 'Uploading images...' : isLoading ? 'Submitting...' : 'Submit Recipe'}
            </button>
            <p className="mt-2 text-sm text-gray-500 text-center">
              Your recipe will be reviewed by an admin before being published.
            </p>
          </div>
        </form>
    </div>
  );
};
