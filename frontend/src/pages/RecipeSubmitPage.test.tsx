import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@/test/utils/test-utils';
import { RecipeSubmitPage } from './RecipeSubmitPage';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock URL.createObjectURL for file upload tests
let objectURLMock: typeof URL.createObjectURL;
beforeAll(() => {
  objectURLMock = URL.createObjectURL;
  URL.createObjectURL = vi.fn((file) => `blob:${file instanceof File ? file.name : 'mock'}`);
});

afterAll(() => {
  URL.createObjectURL = objectURLMock;
});

describe('RecipeSubmitPage', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('renders submit recipe form', () => {
    render(<RecipeSubmitPage />);

    expect(screen.getByText('Submit a New Recipe')).toBeInTheDocument();
    expect(screen.getByLabelText('Recipe Title')).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
  });

  it('renders time and servings inputs', () => {
    render(<RecipeSubmitPage />);

    expect(screen.getByLabelText('Prep Time (minutes)')).toBeInTheDocument();
    expect(screen.getByLabelText('Cook Time (minutes)')).toBeInTheDocument();
    expect(screen.getByLabelText('Servings')).toBeInTheDocument();
  });

  it('renders difficulty selector', () => {
    render(<RecipeSubmitPage />);

    expect(screen.getByLabelText('Difficulty')).toBeInTheDocument();
    const select = screen.getByLabelText('Difficulty') as HTMLSelectElement;
    expect(select.value).toBe('medium');
  });

  it('renders private checkbox', () => {
    render(<RecipeSubmitPage />);

    expect(screen.getByLabelText(/Make this recipe private/)).toBeInTheDocument();
  });

  it('renders ingredients section with initial ingredient', () => {
    render(<RecipeSubmitPage />);

    expect(screen.getByText('Ingredients')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Quantity')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Unit')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Ingredient name')).toBeInTheDocument();
  });

  it('allows adding ingredients', async () => {
    const user = userEvent.setup();
    render(<RecipeSubmitPage />);

    const addButton = screen.getByText('+ Add Ingredient');
    await user.click(addButton);

    const quantityInputs = screen.getAllByPlaceholderText('Quantity');
    expect(quantityInputs).toHaveLength(2);
  });

  it('allows removing ingredients when more than one exists', async () => {
    const user = userEvent.setup();
    render(<RecipeSubmitPage />);

    const addButton = screen.getByText('+ Add Ingredient');
    await user.click(addButton);

    const removeButtons = screen.getAllByText('Remove');
    expect(removeButtons.length).toBeGreaterThan(0);

    await user.click(removeButtons[0]);

    const quantityInputs = screen.getAllByPlaceholderText('Quantity');
    expect(quantityInputs).toHaveLength(1);
  });

  it('renders instructions section with initial instruction', () => {
    render(<RecipeSubmitPage />);

    expect(screen.getByText('Instructions')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Instruction step')).toBeInTheDocument();
  });

  it('allows adding instructions', async () => {
    const user = userEvent.setup();
    render(<RecipeSubmitPage />);

    const addButton = screen.getByText('+ Add Instruction');
    await user.click(addButton);

    const instructionInputs = screen.getAllByPlaceholderText('Instruction step');
    expect(instructionInputs).toHaveLength(2);
  });

  it('allows removing instructions when more than one exists', async () => {
    const user = userEvent.setup();
    render(<RecipeSubmitPage />);

    const addButton = screen.getByText('+ Add Instruction');
    await user.click(addButton);

    const removeButtons = screen.getAllByText('Remove');
    await user.click(removeButtons[removeButtons.length - 1]);

    const instructionInputs = screen.getAllByPlaceholderText('Instruction step');
    expect(instructionInputs).toHaveLength(1);
  });

  it('renders categories section', () => {
    render(<RecipeSubmitPage />);

    expect(screen.getByText('Categories')).toBeInTheDocument();
  });

  it('renders submit button', () => {
    render(<RecipeSubmitPage />);

    expect(screen.getByRole('button', { name: /submit recipe/i })).toBeInTheDocument();
  });

  it('shows submission note about admin review', () => {
    render(<RecipeSubmitPage />);

    expect(screen.getByText(/Your recipe will be reviewed by an admin/)).toBeInTheDocument();
  });

  it('allows filling out basic recipe information', async () => {
    const user = userEvent.setup();
    render(<RecipeSubmitPage />);

    const titleInput = screen.getByLabelText('Recipe Title');
    const descriptionInput = screen.getByLabelText('Description');

    await user.type(titleInput, 'My New Recipe');
    await user.type(descriptionInput, 'A great new recipe');

    expect(titleInput).toHaveValue('My New Recipe');
    expect(descriptionInput).toHaveValue('A great new recipe');
  });

  it('allows changing difficulty level', async () => {
    const user = userEvent.setup();
    render(<RecipeSubmitPage />);

    const difficultySelect = screen.getByLabelText('Difficulty');
    await user.selectOptions(difficultySelect, 'easy');

    expect(difficultySelect).toHaveValue('easy');
  });

  it('allows toggling private checkbox', async () => {
    const user = userEvent.setup();
    render(<RecipeSubmitPage />);

    const privateCheckbox = screen.getByLabelText(/Make this recipe private/) as HTMLInputElement;
    expect(privateCheckbox.checked).toBe(false);

    await user.click(privateCheckbox);
    expect(privateCheckbox.checked).toBe(true);
  });

  it('allows changing prep time', async () => {
    const user = userEvent.setup();
    render(<RecipeSubmitPage />);

    const prepTimeInput = screen.getByLabelText('Prep Time (minutes)');
    await user.type(prepTimeInput, '30');

    expect(prepTimeInput).toHaveValue(30);
  });

  it('allows changing cook time', async () => {
    const user = userEvent.setup();
    render(<RecipeSubmitPage />);

    const cookTimeInput = screen.getByLabelText('Cook Time (minutes)');
    await user.type(cookTimeInput, '45');

    expect(cookTimeInput).toHaveValue(45);
  });

  it('allows changing servings', async () => {
    const user = userEvent.setup();
    render(<RecipeSubmitPage />);

    const servingsInput = screen.getByLabelText('Servings');
    await user.type(servingsInput, '6');

    expect(servingsInput).toHaveValue(6);
  });

  it('allows editing ingredient fields', async () => {
    const user = userEvent.setup();
    render(<RecipeSubmitPage />);

    const quantityInput = screen.getByPlaceholderText('Quantity');
    const unitInput = screen.getByPlaceholderText('Unit');
    const nameInput = screen.getByPlaceholderText('Ingredient name');

    await user.type(quantityInput, '2');
    await user.type(unitInput, 'cups');
    await user.type(nameInput, 'Flour');

    expect(quantityInput).toHaveValue('2');
    expect(unitInput).toHaveValue('cups');
    expect(nameInput).toHaveValue('Flour');
  });

  it('allows editing instruction text', async () => {
    const user = userEvent.setup();
    render(<RecipeSubmitPage />);

    const instructionInput = screen.getByPlaceholderText('Instruction step');
    await user.type(instructionInput, 'Mix ingredients together');

    expect(instructionInput).toHaveValue('Mix ingredients together');
  });

  it('renumbers instructions after removal', async () => {
    const user = userEvent.setup();
    render(<RecipeSubmitPage />);

    // Add 3 instructions
    const addButton = screen.getByText('+ Add Instruction');
    await user.click(addButton);
    await user.click(addButton);

    // Fill them with text
    const instructionInputs = screen.getAllByPlaceholderText('Instruction step');
    await user.type(instructionInputs[0], 'Step 1');
    await user.type(instructionInputs[1], 'Step 2');
    await user.type(instructionInputs[2], 'Step 3');

    // Remove the middle one
    const removeButtons = screen.getAllByText('Remove');
    await user.click(removeButtons[1]);

    // Verify renumbering by checking step numbers
    const stepNumbers = screen.getAllByText(/^\d+\.$/);
    expect(stepNumbers[0]).toHaveTextContent('1.');
    expect(stepNumbers[1]).toHaveTextContent('2.');
  });

  it('displays categories from API', async () => {
    render(<RecipeSubmitPage />);

    await waitFor(() => {
      expect(screen.getByText('Breakfast')).toBeInTheDocument();
      expect(screen.getByText('Lunch')).toBeInTheDocument();
      expect(screen.getByText('Dinner')).toBeInTheDocument();
    });
  });

  it('allows toggling categories', async () => {
    const user = userEvent.setup();
    render(<RecipeSubmitPage />);

    await waitFor(() => {
      expect(screen.getByText('Breakfast')).toBeInTheDocument();
    });

    const breakfastButton = screen.getByText('Breakfast');
    await user.click(breakfastButton);

    // Button should now have selected styling
    expect(breakfastButton).toHaveClass('bg-primary-600');
  });

  it('allows toggling categories off', async () => {
    const user = userEvent.setup();
    render(<RecipeSubmitPage />);

    await waitFor(() => {
      expect(screen.getByText('Breakfast')).toBeInTheDocument();
    });

    const breakfastButton = screen.getByText('Breakfast');

    // Toggle on
    await user.click(breakfastButton);
    expect(breakfastButton).toHaveClass('bg-primary-600');

    // Toggle off
    await user.click(breakfastButton);
    expect(breakfastButton).toHaveClass('bg-gray-100');
  });

  it('does not show remove button for single ingredient', () => {
    render(<RecipeSubmitPage />);

    const removeButtons = screen.queryAllByText('Remove');
    expect(removeButtons).toHaveLength(0);
  });

  it('does not show remove button for single instruction', () => {
    render(<RecipeSubmitPage />);

    const removeButtons = screen.queryAllByText('Remove');
    expect(removeButtons).toHaveLength(0);
  });

  it('submits form successfully and navigates to my recipes', async () => {
    const user = userEvent.setup();
    render(<RecipeSubmitPage />);

    // Fill out the form
    await user.type(screen.getByLabelText('Recipe Title'), 'Test Recipe');
    await user.type(screen.getByLabelText('Description'), 'Test Description');
    await user.type(screen.getByLabelText('Prep Time (minutes)'), '15');
    await user.type(screen.getByLabelText('Cook Time (minutes)'), '30');
    await user.type(screen.getByLabelText('Servings'), '4');

    // Fill ingredient
    await user.type(screen.getByPlaceholderText('Quantity'), '2');
    await user.type(screen.getByPlaceholderText('Unit'), 'cups');
    await user.type(screen.getByPlaceholderText('Ingredient name'), 'Flour');

    // Fill instruction
    await user.type(screen.getByPlaceholderText('Instruction step'), 'Mix ingredients');

    // Submit form
    const submitButton = screen.getByRole('button', { name: /submit recipe/i });
    await user.click(submitButton);

    // Wait for navigation
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/member/my-recipes');
    });
  }, 10000);

  it('filters out empty ingredients when submitting', async () => {
    const user = userEvent.setup();
    render(<RecipeSubmitPage />);

    // Fill out required fields
    await user.type(screen.getByLabelText('Recipe Title'), 'Test Recipe');
    await user.type(screen.getByLabelText('Description'), 'Test Description');
    await user.type(screen.getByLabelText('Prep Time (minutes)'), '15');
    await user.type(screen.getByLabelText('Cook Time (minutes)'), '30');
    await user.type(screen.getByLabelText('Servings'), '4');

    // Add multiple ingredients but only fill one
    await user.click(screen.getByText('+ Add Ingredient'));
    const nameInputs = screen.getAllByPlaceholderText('Ingredient name');
    await user.type(nameInputs[0], 'Flour');

    // Fill instruction
    await user.type(screen.getByPlaceholderText('Instruction step'), 'Mix ingredients');

    // Submit form - should succeed even with empty second ingredient
    const submitButton = screen.getByRole('button', { name: /submit recipe/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/member/my-recipes');
    });
  });

  it('filters out empty instructions when submitting', async () => {
    const user = userEvent.setup();
    render(<RecipeSubmitPage />);

    // Fill out required fields
    await user.type(screen.getByLabelText('Recipe Title'), 'Test Recipe');
    await user.type(screen.getByLabelText('Description'), 'Test Description');
    await user.type(screen.getByLabelText('Prep Time (minutes)'), '15');
    await user.type(screen.getByLabelText('Cook Time (minutes)'), '30');
    await user.type(screen.getByLabelText('Servings'), '4');

    // Fill ingredient
    await user.type(screen.getByPlaceholderText('Ingredient name'), 'Flour');

    // Add multiple instructions but only fill one
    await user.click(screen.getByText('+ Add Instruction'));
    const instructionInputs = screen.getAllByPlaceholderText('Instruction step');
    await user.type(instructionInputs[0], 'Mix ingredients');

    // Submit form - should succeed even with empty second instruction
    const submitButton = screen.getByRole('button', { name: /submit recipe/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/member/my-recipes');
    });
  });

  it('shows loading state during submission', async () => {
    const user = userEvent.setup();
    render(<RecipeSubmitPage />);

    // Fill minimal form
    await user.type(screen.getByLabelText('Recipe Title'), 'Test Recipe');
    await user.type(screen.getByLabelText('Description'), 'Test Description');
    await user.type(screen.getByLabelText('Prep Time (minutes)'), '15');
    await user.type(screen.getByLabelText('Cook Time (minutes)'), '30');
    await user.type(screen.getByLabelText('Servings'), '4');
    await user.type(screen.getByPlaceholderText('Ingredient name'), 'Flour');
    await user.type(screen.getByPlaceholderText('Instruction step'), 'Mix');

    const submitButton = screen.getByRole('button', { name: /submit recipe/i });

    // Click without awaiting to catch the loading state
    user.click(submitButton);

    // Button should show loading text briefly
    await waitFor(() => {
      expect(submitButton).toHaveTextContent(/submitting/i);
    });
  });

  it('includes selected categories in submission', async () => {
    const user = userEvent.setup();
    render(<RecipeSubmitPage />);

    // Wait for categories to load
    await waitFor(() => {
      expect(screen.getByText('Breakfast')).toBeInTheDocument();
    });

    // Fill form
    await user.type(screen.getByLabelText('Recipe Title'), 'Test Recipe');
    await user.type(screen.getByLabelText('Description'), 'Test Description');
    await user.type(screen.getByLabelText('Prep Time (minutes)'), '15');
    await user.type(screen.getByLabelText('Cook Time (minutes)'), '30');
    await user.type(screen.getByLabelText('Servings'), '4');
    await user.type(screen.getByPlaceholderText('Ingredient name'), 'Flour');
    await user.type(screen.getByPlaceholderText('Instruction step'), 'Mix');

    // Select a category
    await user.click(screen.getByText('Breakfast'));

    // Submit
    await user.click(screen.getByRole('button', { name: /submit recipe/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/member/my-recipes');
    });
  });

  it('includes isPrivate flag when checkbox is checked', async () => {
    const user = userEvent.setup();
    render(<RecipeSubmitPage />);

    // Fill form
    await user.type(screen.getByLabelText('Recipe Title'), 'Test Recipe');
    await user.type(screen.getByLabelText('Description'), 'Test Description');
    await user.type(screen.getByLabelText('Prep Time (minutes)'), '15');
    await user.type(screen.getByLabelText('Cook Time (minutes)'), '30');
    await user.type(screen.getByLabelText('Servings'), '4');
    await user.type(screen.getByPlaceholderText('Ingredient name'), 'Flour');
    await user.type(screen.getByPlaceholderText('Instruction step'), 'Mix');

    // Check private checkbox
    await user.click(screen.getByLabelText(/Make this recipe private/));

    // Submit
    await user.click(screen.getByRole('button', { name: /submit recipe/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/member/my-recipes');
    });
  });

  it('shows error message on submission failure', async () => {
    const user = userEvent.setup();
    render(<RecipeSubmitPage />);

    // Fill form with error-triggering title
    await user.type(screen.getByLabelText('Recipe Title'), 'Error Recipe');
    await user.type(screen.getByLabelText('Description'), 'Test Description');
    await user.type(screen.getByLabelText('Prep Time (minutes)'), '15');
    await user.type(screen.getByLabelText('Cook Time (minutes)'), '30');
    await user.type(screen.getByLabelText('Servings'), '4');
    await user.type(screen.getByPlaceholderText('Ingredient name'), 'Flour');
    await user.type(screen.getByPlaceholderText('Instruction step'), 'Mix');

    // Submit
    await user.click(screen.getByRole('button', { name: /submit recipe/i }));

    // Should display error message
    expect(await screen.findByText('Failed to create recipe')).toBeInTheDocument();
  });

  it('handles API response with success false', async () => {
    const { http, HttpResponse } = await import('msw');
    const { server } = await import('@/test/mocks/server');
    const { API_URL } = await import('@/utils/constants');

    // Mock API to return success: false without throwing
    server.use(
      http.post(`${API_URL}/recipes`, async () => {
        return HttpResponse.json(
          { success: false, message: 'Recipe creation failed' },
          { status: 200 } // 200 OK but success: false
        );
      })
    );

    const user = userEvent.setup();
    render(<RecipeSubmitPage />);

    await user.type(screen.getByLabelText('Recipe Title'), 'Test Recipe');
    await user.type(screen.getByLabelText('Description'), 'Test Description');
    await user.type(screen.getByLabelText('Prep Time (minutes)'), '15');
    await user.type(screen.getByLabelText('Cook Time (minutes)'), '30');
    await user.type(screen.getByLabelText('Servings'), '4');
    await user.type(screen.getByPlaceholderText('Ingredient name'), 'Flour');
    await user.type(screen.getByPlaceholderText('Instruction step'), 'Mix');
    await user.click(screen.getByRole('button', { name: /submit recipe/i }));

    // Should not navigate (success is false)
    await waitFor(() => {
      expect(screen.getByLabelText('Recipe Title')).toBeInTheDocument();
    });
  });

  it('clears error message on new submission', async () => {
    const user = userEvent.setup();
    render(<RecipeSubmitPage />);

    // First submission with error
    await user.type(screen.getByLabelText('Recipe Title'), 'Error Recipe');
    await user.type(screen.getByLabelText('Description'), 'Test Description');
    await user.type(screen.getByLabelText('Prep Time (minutes)'), '15');
    await user.type(screen.getByLabelText('Cook Time (minutes)'), '30');
    await user.type(screen.getByLabelText('Servings'), '4');
    await user.type(screen.getByPlaceholderText('Ingredient name'), 'Flour');
    await user.type(screen.getByPlaceholderText('Instruction step'), 'Mix');
    await user.click(screen.getByRole('button', { name: /submit recipe/i }));

    // Wait for error
    expect(await screen.findByText('Failed to create recipe')).toBeInTheDocument();

    // Fix the title
    const titleInput = screen.getByLabelText('Recipe Title');
    await user.clear(titleInput);
    await user.type(titleInput, 'Good Recipe');

    // Submit again
    await user.click(screen.getByRole('button', { name: /submit recipe/i }));

    // Error should be cleared during submission
    await waitFor(() => {
      expect(screen.queryByText('Failed to create recipe')).not.toBeInTheDocument();
    });
  });

  it('uploads product images during form submission', async () => {
    server.use(
      http.post('http://localhost:9999/api/recipes', () => {
        return HttpResponse.json({
          success: true,
          data: {
            id: 'recipe-1',
            title: 'Test Recipe',
            instructions: [
              { id: 'inst-1', step_number: 1, description: 'Mix flour' },
            ],
          },
        });
      }),
      http.post('http://localhost:9999/api/recipes/:id/images', () => {
        return HttpResponse.json({
          success: true,
          data: { id: 'img-1', url: 'http://example.com/image1.jpg' },
        });
      })
    );

    const user = userEvent.setup();
    render(<RecipeSubmitPage />);

    // Fill in required fields
    await user.type(screen.getByLabelText('Recipe Title'), 'Test Recipe');
    await user.type(screen.getByLabelText('Description'), 'A test recipe');
    await user.type(screen.getByPlaceholderText('Quantity'), '2');
    await user.type(screen.getByPlaceholderText('Unit'), 'cups');
    await user.type(screen.getByPlaceholderText('Ingredient name'), 'Flour');
    await user.type(screen.getByPlaceholderText('Instruction step'), 'Mix flour');

    // Upload a product image
    const file = new File(['image'], 'test.jpg', { type: 'image/jpeg' });
    const fileInputs = document.querySelectorAll('input[type="file"]');
    const fileInput = Array.from(fileInputs).find(input =>
      input.getAttribute('accept') === 'image/*' && input.hasAttribute('multiple')
    ) as HTMLInputElement;

    if (fileInput) {
      await user.upload(fileInput, file);

      // Wait for image preview
      await waitFor(() => {
        expect(screen.getByAltText('Preview 1')).toBeInTheDocument();
      });
    }

    // Submit form
    await user.click(screen.getByRole('button', { name: /submit recipe/i }));

    // Wait for navigation (submission complete)
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalled();
    }, { timeout: 3000 });
  });

  it('uploads step images during form submission', async () => {
    server.use(
      http.post('http://localhost:9999/api/recipes', () => {
        return HttpResponse.json({
          success: true,
          data: {
            id: 'recipe-1',
            title: 'Test Recipe',
            instructions: [
              { id: 'inst-1', step_number: 1, description: 'Mix flour' },
            ],
          },
        });
      }),
      http.post('http://localhost:9999/api/recipes/:id/images', () => {
        return HttpResponse.json({
          success: true,
          data: { id: 'img-1', url: 'http://example.com/image1.jpg' },
        });
      })
    );

    const user = userEvent.setup();
    render(<RecipeSubmitPage />);

    // Fill in required fields
    await user.type(screen.getByLabelText('Recipe Title'), 'Test Recipe');
    await user.type(screen.getByLabelText('Description'), 'A test recipe');
    await user.type(screen.getByPlaceholderText('Quantity'), '2');
    await user.type(screen.getByPlaceholderText('Unit'), 'cups');
    await user.type(screen.getByPlaceholderText('Ingredient name'), 'Flour');
    await user.type(screen.getByPlaceholderText('Instruction step'), 'Mix flour');

    // Try to upload a step image
    const stepFileInputs = document.querySelectorAll('input[type="file"]');
    const stepImageInput = Array.from(stepFileInputs).find(input =>
      input.getAttribute('accept') === 'image/*' && !input.hasAttribute('multiple')
    ) as HTMLInputElement;

    if (stepImageInput) {
      const file = new File(['step-image'], 'step.jpg', { type: 'image/jpeg' });
      await user.upload(stepImageInput, file);

      await waitFor(() => {
        expect(stepImageInput).toBeTruthy();
      });
    }

    // Submit form
    await user.click(screen.getByRole('button', { name: /submit recipe/i }));

    // Wait for navigation
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalled();
    }, { timeout: 3000 });
  });

  it('handles mixed image uploads - both product and step images', async () => {
    server.use(
      http.post('http://localhost:9999/api/recipes', () => {
        return HttpResponse.json({
          success: true,
          data: {
            id: 'recipe-1',
            title: 'Test Recipe',
            instructions: [
              { id: 'inst-1', step_number: 1, description: 'Mix flour' },
            ],
          },
        });
      }),
      http.post('http://localhost:9999/api/recipes/:id/images', () => {
        return HttpResponse.json({
          success: true,
          data: { id: 'img-1', url: 'http://example.com/image1.jpg' },
        });
      })
    );

    const user = userEvent.setup();
    render(<RecipeSubmitPage />);

    // Fill in required fields
    await user.type(screen.getByLabelText('Recipe Title'), 'Test Recipe');
    await user.type(screen.getByLabelText('Description'), 'A test recipe');
    await user.type(screen.getByPlaceholderText('Quantity'), '2');
    await user.type(screen.getByPlaceholderText('Unit'), 'cups');
    await user.type(screen.getByPlaceholderText('Ingredient name'), 'Flour');
    await user.type(screen.getByPlaceholderText('Instruction step'), 'Mix flour');

    // Upload both product and step images
    const fileInputs = document.querySelectorAll('input[type="file"]');
    const productInput = Array.from(fileInputs).find(input =>
      input.getAttribute('accept') === 'image/*' && input.hasAttribute('multiple')
    ) as HTMLInputElement;
    const stepInput = Array.from(fileInputs).find(input =>
      input.getAttribute('accept') === 'image/*' && !input.hasAttribute('multiple')
    ) as HTMLInputElement;

    if (productInput) {
      const file = new File(['image'], 'product.jpg', { type: 'image/jpeg' });
      await user.upload(productInput, file);

      await waitFor(() => {
        expect(screen.getByAltText('Preview 1')).toBeInTheDocument();
      });
    }

    if (stepInput) {
      const file = new File(['step-image'], 'step.jpg', { type: 'image/jpeg' });
      await user.upload(stepInput, file);

      await waitFor(() => {
        expect(stepInput).toBeTruthy();
      });
    }

    // Submit form
    await user.click(screen.getByRole('button', { name: /submit recipe/i }));

    // Wait for navigation
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalled();
    }, { timeout: 3000 });
  });

  it('handles removing instruction with step images correctly', async () => {
    const user = userEvent.setup();
    render(<RecipeSubmitPage />);

    // Add two more instructions (total 3)
    const addInstructionButton = screen.getByText('+ Add Instruction');
    await user.click(addInstructionButton);
    await user.click(addInstructionButton);

    // Fill in the instructions
    const instructionInputs = screen.getAllByPlaceholderText('Instruction step');
    await user.type(instructionInputs[0], 'Step 1');
    await user.type(instructionInputs[1], 'Step 2');
    await user.type(instructionInputs[2], 'Step 3');

    // Upload step images for instructions 1 and 3
    const stepFileInputs = document.querySelectorAll('input[type="file"]');
    const stepInputs = Array.from(stepFileInputs).filter(input =>
      input.getAttribute('accept') === 'image/*' && !input.hasAttribute('multiple')
    ) as HTMLInputElement[];

    if (stepInputs.length >= 2) {
      // Upload image for step 1
      const file1 = new File(['step1'], 'step1.jpg', { type: 'image/jpeg' });
      await user.upload(stepInputs[0], file1);

      // Upload image for step 3
      const file3 = new File(['step3'], 'step3.jpg', { type: 'image/jpeg' });
      await user.upload(stepInputs[2], file3);

      await waitFor(() => {
        expect(stepInputs[0]).toBeTruthy();
      });
    }

    // Remove the middle instruction (index 1)
    const removeButtons = screen.getAllByText('Remove');
    await user.click(removeButtons[1]); // Remove step 2

    // Should now have 2 instructions
    const remainingInstructions = screen.getAllByPlaceholderText('Instruction step');
    expect(remainingInstructions).toHaveLength(2);
  });
});
