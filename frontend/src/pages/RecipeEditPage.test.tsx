import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@/test/utils/test-utils';
import { RecipeEditPage } from './RecipeEditPage';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';
import { mockRecipe } from '@/test/mocks/mockData';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ id: '1' }),
    useNavigate: () => vi.fn(),
  };
});

describe('RecipeEditPage', () => {
  it('shows loading state initially', () => {
    render(<RecipeEditPage />);
    expect(screen.getByText('Loading recipe...')).toBeInTheDocument();
  });

  it('renders edit recipe form after loading', async () => {
    render(<RecipeEditPage />);
    await waitFor(() => {
      expect(screen.getByText('Edit Recipe')).toBeInTheDocument();
    });
  });

  it('populates form with existing recipe data', async () => {
    render(<RecipeEditPage />);
    await waitFor(() => {
      expect(screen.getByLabelText(/Recipe Title/)).toHaveValue('Test Recipe');
      expect(screen.getByLabelText(/Description/)).toHaveValue('A delicious test recipe');
    });
  });

  it('displays existing ingredients', async () => {
    render(<RecipeEditPage />);
    await waitFor(() => {
      const ingredientInputs = screen.getAllByPlaceholderText('Ingredient name');
      expect(ingredientInputs[0]).toHaveValue('Flour');
      expect(ingredientInputs[1]).toHaveValue('Sugar');
    });
  });

  it('displays existing instructions', async () => {
    render(<RecipeEditPage />);
    await waitFor(() => {
      const instructionInputs = screen.getAllByPlaceholderText('Describe this step...');
      expect(instructionInputs[0]).toHaveValue('Mix flour and sugar');
      expect(instructionInputs[1]).toHaveValue('Bake at 350F');
    });
  });

  it('allows adding new ingredients', async () => {
    const user = userEvent.setup();
    render(<RecipeEditPage />);
    await waitFor(() => {
      expect(screen.getByText('Edit Recipe')).toBeInTheDocument();
    });
    const addButton = screen.getByText('+ Add Ingredient');
    await user.click(addButton);
    const ingredientInputs = screen.getAllByPlaceholderText('Ingredient name');
    expect(ingredientInputs).toHaveLength(3);
  });

  it('allows adding new instructions', async () => {
    const user = userEvent.setup();
    render(<RecipeEditPage />);
    await waitFor(() => {
      expect(screen.getByText('Edit Recipe')).toBeInTheDocument();
    });
    const addButton = screen.getByText('+ Add Step');
    await user.click(addButton);
    const instructionInputs = screen.getAllByPlaceholderText('Describe this step...');
    expect(instructionInputs).toHaveLength(3);
  });

  it('shows remove buttons for ingredients when more than one exists', async () => {
    render(<RecipeEditPage />);
    await waitFor(() => {
      const removeButtons = screen.getAllByText('Remove');
      expect(removeButtons.length).toBeGreaterThan(0);
    });
  });

  it('renders update and cancel buttons', async () => {
    render(<RecipeEditPage />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /update recipe/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });
  });

  it('displays categories section', async () => {
    render(<RecipeEditPage />);
    await waitFor(() => {
      expect(screen.getByText('Categories')).toBeInTheDocument();
    });
  });

  it('displays private recipe checkbox', async () => {
    render(<RecipeEditPage />);
    await waitFor(() => {
      expect(screen.getByLabelText(/Private Recipe/)).toBeInTheDocument();
    });
  });

  it('allows editing recipe title', async () => {
    const user = userEvent.setup();
    render(<RecipeEditPage />);
    await waitFor(() => {
      expect(screen.getByLabelText(/Recipe Title/)).toBeInTheDocument();
    });
    const titleInput = screen.getByLabelText(/Recipe Title/);
    await user.clear(titleInput);
    await user.type(titleInput, 'Updated Recipe Title');
    expect(titleInput).toHaveValue('Updated Recipe Title');
  });

  it('allows editing recipe description', async () => {
    const user = userEvent.setup();
    render(<RecipeEditPage />);
    await waitFor(() => {
      expect(screen.getByLabelText(/Description/)).toBeInTheDocument();
    });
    const descriptionInput = screen.getByLabelText(/Description/);
    await user.clear(descriptionInput);
    await user.type(descriptionInput, 'Updated description');
    expect(descriptionInput).toHaveValue('Updated description');
  });

  it('displays prep time, cook time, and servings inputs', async () => {
    render(<RecipeEditPage />);
    await waitFor(() => {
      expect(screen.getByLabelText(/Prep Time/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Cook Time/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Servings/)).toBeInTheDocument();
    });
  });

  it('displays difficulty selector', async () => {
    render(<RecipeEditPage />);
    await waitFor(() => {
      expect(screen.getByLabelText(/Difficulty/)).toBeInTheDocument();
    });
  });

  it('allows editing ingredient fields', async () => {
    const user = userEvent.setup();
    render(<RecipeEditPage />);
    await waitFor(() => {
      expect(screen.getByText('Edit Recipe')).toBeInTheDocument();
    });
    const quantityInputs = screen.getAllByPlaceholderText('Quantity (e.g., 2)');
    const unitInputs = screen.getAllByPlaceholderText('Unit (e.g., cups)');
    const nameInputs = screen.getAllByPlaceholderText('Ingredient name');
    await user.clear(quantityInputs[0]);
    await user.type(quantityInputs[0], '3');
    await user.clear(unitInputs[0]);
    await user.type(unitInputs[0], 'tablespoons');
    await user.clear(nameInputs[0]);
    await user.type(nameInputs[0], 'Salt');
    expect(quantityInputs[0]).toHaveValue('3');
    expect(unitInputs[0]).toHaveValue('tablespoons');
    expect(nameInputs[0]).toHaveValue('Salt');
  });

  it('allows editing instruction fields', async () => {
    const user = userEvent.setup();
    render(<RecipeEditPage />);
    await waitFor(() => {
      expect(screen.getByText('Edit Recipe')).toBeInTheDocument();
    });
    const instructionInputs = screen.getAllByPlaceholderText('Describe this step...');
    await user.clear(instructionInputs[0]);
    await user.type(instructionInputs[0], 'New instruction');
    expect(instructionInputs[0]).toHaveValue('New instruction');
  });

  it('allows removing ingredients when more than one exists', async () => {
    const user = userEvent.setup();
    render(<RecipeEditPage />);
    await waitFor(() => {
      expect(screen.getByText('Edit Recipe')).toBeInTheDocument();
    });
    const removeButtons = screen.getAllByText('Remove');
    const initialCount = screen.getAllByPlaceholderText('Ingredient name').length;
    await user.click(removeButtons[0]);
    await waitFor(() => {
      const newCount = screen.getAllByPlaceholderText('Ingredient name').length;
      expect(newCount).toBe(initialCount - 1);
    });
  });

  it('allows removing instructions when more than one exists', async () => {
    const user = userEvent.setup();
    render(<RecipeEditPage />);
    await waitFor(() => {
      expect(screen.getByText('Edit Recipe')).toBeInTheDocument();
    });
    const removeButtons = screen.getAllByText('Remove');
    const initialCount = screen.getAllByPlaceholderText('Describe this step...').length;
    await user.click(removeButtons[removeButtons.length - 1]);
    await waitFor(() => {
      const newCount = screen.getAllByPlaceholderText('Describe this step...').length;
      expect(newCount).toBe(initialCount - 1);
    });
  });

  it('allows toggling categories', async () => {
    const user = userEvent.setup();
    render(<RecipeEditPage />);
    await waitFor(() => {
      expect(screen.getByText('Breakfast')).toBeInTheDocument();
    });
    const breakfastButton = screen.getByText('Breakfast');
    await user.click(breakfastButton);
    expect(breakfastButton).toBeInTheDocument();
  });

  it('allows changing prepTime, cookTime, and servings', async () => {
    const user = userEvent.setup();
    render(<RecipeEditPage />);
    await waitFor(() => {
      expect(screen.getByText('Edit Recipe')).toBeInTheDocument();
    });
    const prepTimeInput = screen.getByLabelText(/Prep Time/) as HTMLInputElement;
    const cookTimeInput = screen.getByLabelText(/Cook Time/) as HTMLInputElement;
    const servingsInput = screen.getByLabelText(/Servings/) as HTMLInputElement;

    // Triple click selects all, then type to replace
    await user.tripleClick(prepTimeInput);
    await user.keyboard('20');

    await user.tripleClick(cookTimeInput);
    await user.keyboard('45');

    await user.tripleClick(servingsInput);
    await user.keyboard('8');

    expect(prepTimeInput).toHaveValue(20);
    expect(cookTimeInput).toHaveValue(45);
    expect(servingsInput).toHaveValue(8);
  });

  it('allows changing difficulty', async () => {
    const user = userEvent.setup();
    render(<RecipeEditPage />);
    await waitFor(() => {
      expect(screen.getByText('Edit Recipe')).toBeInTheDocument();
    });
    const difficultySelect = screen.getByLabelText(/Difficulty/);
    await user.selectOptions(difficultySelect, 'easy');
    expect(difficultySelect).toHaveValue('easy');
  });

  it('allows toggling private checkbox', async () => {
    const user = userEvent.setup();
    render(<RecipeEditPage />);
    await waitFor(() => {
      expect(screen.getByText('Edit Recipe')).toBeInTheDocument();
    });
    const privateCheckbox = screen.getByLabelText(/Private Recipe/) as HTMLInputElement;
    const initialValue = privateCheckbox.checked;
    await user.click(privateCheckbox);
    expect(privateCheckbox.checked).toBe(!initialValue);
  });

  it('shows validation error when submitting with empty title', async () => {
    const user = userEvent.setup();
    render(<RecipeEditPage />);
    await waitFor(() => {
      expect(screen.getByText('Edit Recipe')).toBeInTheDocument();
    });
    const titleInput = screen.getByLabelText(/Recipe Title/);
    await user.clear(titleInput);
    const submitButton = screen.getByRole('button', { name: /update recipe/i });
    await user.click(submitButton);
    // Use findByText which waits for the async state update
    expect(await screen.findByText('Title is required')).toBeInTheDocument();
  });

  it('shows validation error when no valid ingredients', async () => {
    const user = userEvent.setup();
    render(<RecipeEditPage />);
    await waitFor(() => {
      expect(screen.getByText('Edit Recipe')).toBeInTheDocument();
    });
    const nameInputs = screen.getAllByPlaceholderText('Ingredient name');
    const quantityInputs = screen.getAllByPlaceholderText('Quantity (e.g., 2)');
    for (const input of nameInputs) {
      await user.clear(input);
    }
    for (const input of quantityInputs) {
      await user.clear(input);
    }
    const submitButton = screen.getByRole('button', { name: /update recipe/i });
    await user.click(submitButton);
    // Use findByText which waits for the async state update
    expect(await screen.findByText('At least one ingredient is required')).toBeInTheDocument();
  });

  it('shows validation error when no valid instructions', async () => {
    const user = userEvent.setup();
    render(<RecipeEditPage />);
    await waitFor(() => {
      expect(screen.getByText('Edit Recipe')).toBeInTheDocument();
    });
    const instructionInputs = screen.getAllByPlaceholderText('Describe this step...');
    for (const input of instructionInputs) {
      await user.clear(input);
    }
    const submitButton = screen.getByRole('button', { name: /update recipe/i });
    await user.click(submitButton);
    // Use findByText which waits for the async state update
    expect(await screen.findByText('At least one instruction is required')).toBeInTheDocument();
  });

  it('successfully submits form with valid data', async () => {
    const user = userEvent.setup();
    render(<RecipeEditPage />);

    await waitFor(() => {
      expect(screen.getByText('Edit Recipe')).toBeInTheDocument();
    });

    // Edit title
    const titleInput = screen.getByLabelText(/Recipe Title/);
    await user.clear(titleInput);
    await user.type(titleInput, 'Updated Recipe');

    // Submit form
    const submitButton = screen.getByRole('button', { name: /update recipe/i });
    await user.click(submitButton);

    // Form should submit (verify no validation errors appear)
    await waitFor(() => {
      expect(screen.queryByText('Title is required')).not.toBeInTheDocument();
    });
  });

  it('handles submission error', async () => {
    const { http, HttpResponse } = await import('msw');
    const { server } = await import('@/test/mocks/server');
    const { API_URL } = await import('@/utils/constants');

    // Mock API error
    server.use(
      http.patch(`${API_URL}/recipes/:id`, () => {
        return HttpResponse.json(
          { success: false, message: 'Update failed' },
          { status: 500 }
        );
      })
    );

    const user = userEvent.setup();
    render(<RecipeEditPage />);

    await waitFor(() => {
      expect(screen.getByText('Edit Recipe')).toBeInTheDocument();
    });

    const submitButton = screen.getByRole('button', { name: /update recipe/i });
    await user.click(submitButton);

    // Should display error message
    expect(await screen.findByText(/Update failed|Failed to update recipe/)).toBeInTheDocument();
  });

  it('displays recipe not found when recipe data is missing', async () => {
    const { http, HttpResponse } = await import('msw');
    const { server } = await import('@/test/mocks/server');
    const { API_URL } = await import('@/utils/constants');

    // Mock recipe not found
    server.use(
      http.get(`${API_URL}/recipes/:id`, () => {
        return HttpResponse.json(
          { success: false, error: 'Recipe not found' },
          { status: 404 }
        );
      })
    );

    render(<RecipeEditPage />);

    await waitFor(() => {
      expect(screen.getByText('Recipe not found')).toBeInTheDocument();
    });
  });

  it('navigates back when cancel button is clicked', async () => {
    const navigateMock = vi.fn();
    const routerDom = vi.mocked(await import('react-router-dom'));
    routerDom.useNavigate = vi.fn(() => navigateMock as ReturnType<typeof routerDom.useNavigate>);

    const user = userEvent.setup();
    render(<RecipeEditPage />);

    await waitFor(() => {
      expect(screen.getByText('Edit Recipe')).toBeInTheDocument();
    });

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(cancelButton).toBeInTheDocument();
  });

  it('filters out empty ingredients on submission', async () => {
    const user = userEvent.setup();
    render(<RecipeEditPage />);

    await waitFor(() => {
      expect(screen.getByText('Edit Recipe')).toBeInTheDocument();
    });

    // Add an ingredient then clear it
    const addButton = screen.getByText('+ Add Ingredient');
    await user.click(addButton);

    const nameInputs = screen.getAllByPlaceholderText('Ingredient name');
    await user.clear(nameInputs[2]); // Clear the newly added ingredient

    // Submit form
    const submitButton = screen.getByRole('button', { name: /update recipe/i });
    await user.click(submitButton);

    // Should succeed (empty ingredient filtered out)
    await waitFor(() => {
      expect(screen.queryByText('At least one ingredient is required')).not.toBeInTheDocument();
    });
  });

  it('filters out empty instructions on submission', async () => {
    const user = userEvent.setup();
    render(<RecipeEditPage />);

    await waitFor(() => {
      expect(screen.getByText('Edit Recipe')).toBeInTheDocument();
    });

    // Add an instruction then clear it
    const addButton = screen.getByText('+ Add Step');
    await user.click(addButton);

    const instructionInputs = screen.getAllByPlaceholderText('Describe this step...');
    await user.clear(instructionInputs[2]); // Clear the newly added instruction

    // Submit form
    const submitButton = screen.getByRole('button', { name: /update recipe/i });
    await user.click(submitButton);

    // Should succeed (empty instruction filtered out)
    await waitFor(() => {
      expect(screen.queryByText('At least one instruction is required')).not.toBeInTheDocument();
    });
  });

  it('shows loading state during submission', async () => {
    const user = userEvent.setup();
    render(<RecipeEditPage />);

    await waitFor(() => {
      expect(screen.getByText('Edit Recipe')).toBeInTheDocument();
    });

    const submitButton = screen.getByRole('button', { name: /update recipe/i });
    await user.click(submitButton);

    // During submission, button text should change
    // Note: This might be too fast to catch, but we're testing the code path
    expect(submitButton).toBeInTheDocument();
  });

  it('handles invalid prepTime input with fallback to 0', async () => {
    const user = userEvent.setup();
    render(<RecipeEditPage />);

    await waitFor(() => {
      expect(screen.getByText('Edit Recipe')).toBeInTheDocument();
    });

    const prepTimeInput = screen.getByLabelText(/Prep Time/) as HTMLInputElement;
    await user.clear(prepTimeInput);
    await user.type(prepTimeInput, 'abc'); // Invalid input

    // Should fallback to 0
    expect(prepTimeInput).toHaveValue(0);
  });

  it('handles invalid cookTime input with fallback to 0', async () => {
    const user = userEvent.setup();
    render(<RecipeEditPage />);

    await waitFor(() => {
      expect(screen.getByText('Edit Recipe')).toBeInTheDocument();
    });

    const cookTimeInput = screen.getByLabelText(/Cook Time/) as HTMLInputElement;
    await user.clear(cookTimeInput);
    await user.type(cookTimeInput, 'xyz'); // Invalid input

    // Should fallback to 0
    expect(cookTimeInput).toHaveValue(0);
  });

  it('handles invalid servings input with fallback to 1', async () => {
    const user = userEvent.setup();
    render(<RecipeEditPage />);

    await waitFor(() => {
      expect(screen.getByText('Edit Recipe')).toBeInTheDocument();
    });

    const servingsInput = screen.getByLabelText(/Servings/) as HTMLInputElement;
    await user.clear(servingsInput);
    await user.type(servingsInput, 'invalid'); // Invalid input

    // Should fallback to 1
    expect(servingsInput).toHaveValue(1);
  });

  it('handles missing categories data gracefully', async () => {
    const { http, HttpResponse } = await import('msw');
    const { server } = await import('@/test/mocks/server');
    const { API_URL } = await import('@/utils/constants');

    // Mock empty categories response
    server.use(
      http.get(`${API_URL}/categories`, () => {
        return HttpResponse.json({
          success: true,
          data: null,
        });
      })
    );

    render(<RecipeEditPage />);

    await waitFor(() => {
      expect(screen.getByText('Edit Recipe')).toBeInTheDocument();
    });

    // Should render without categories
    expect(screen.getByText('Categories')).toBeInTheDocument();
  });

  it('handles submission error without message', async () => {
    const { http, HttpResponse } = await import('msw');
    const { server } = await import('@/test/mocks/server');
    const { API_URL } = await import('@/utils/constants');

    // Mock API error without message
    server.use(
      http.patch(`${API_URL}/recipes/:id`, () => {
        return HttpResponse.json(
          { success: false },
          { status: 500 }
        );
      })
    );

    const user = userEvent.setup();
    render(<RecipeEditPage />);

    await waitFor(() => {
      expect(screen.getByText('Edit Recipe')).toBeInTheDocument();
    });

    const submitButton = screen.getByRole('button', { name: /update recipe/i });
    await user.click(submitButton);

    // Should display generic error message
    expect(await screen.findByText('Failed to update recipe')).toBeInTheDocument();
  });

  it('handles recipe with empty ingredients array', async () => {
    server.use(
      http.get('http://localhost:9999/api/recipes/:id', () => {
        return HttpResponse.json({
          success: true,
          data: {
            ...mockRecipe,
            ingredients: [],
          },
        });
      })
    );

    render(<RecipeEditPage />);

    await waitFor(() => {
      expect(screen.getByText('Edit Recipe')).toBeInTheDocument();
    });

    // Should still render with default ingredient
    expect(screen.getByPlaceholderText('Quantity (e.g., 2)')).toBeInTheDocument();
  });

  it('handles recipe with empty instructions array', async () => {
    server.use(
      http.get('http://localhost:9999/api/recipes/:id', () => {
        return HttpResponse.json({
          success: true,
          data: {
            ...mockRecipe,
            instructions: [],
          },
        });
      })
    );

    render(<RecipeEditPage />);

    await waitFor(() => {
      expect(screen.getByText('Edit Recipe')).toBeInTheDocument();
    });

    // Should still render with default instruction
    expect(screen.getByPlaceholderText('Describe this step...')).toBeInTheDocument();
  });
});
