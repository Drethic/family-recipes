import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@/test/utils/test-utils';
import { RecipeDetailPage } from './RecipeDetailPage';
import { mockUser, mockRecipe } from '@/test/mocks/mockData';
import { UserRole } from '@/types';
import { server } from '@/test/mocks/server';
import { http, HttpResponse } from 'msw';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ id: '1' }),
    useNavigate: () => mockNavigate,
  };
});

describe('RecipeDetailPage', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('shows loading state initially', () => {
    render(<RecipeDetailPage />);

    expect(screen.getByText('Loading recipe...')).toBeInTheDocument();
  });

  it('renders recipe details after loading', async () => {
    render(<RecipeDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Test Recipe')).toBeInTheDocument();
      expect(screen.getByText('A delicious test recipe')).toBeInTheDocument();
    });
  });

  it('displays prep time, cook time, and servings', async () => {
    render(<RecipeDetailPage />);

    await waitFor(() => {
      expect(screen.getByText(/Prep Time:/)).toBeInTheDocument();
      expect(screen.getByText(/Cook Time:/)).toBeInTheDocument();
      expect(screen.getByText(/Servings:/)).toBeInTheDocument();
    });
  });

  it('displays difficulty level', async () => {
    render(<RecipeDetailPage />);

    await waitFor(() => {
      expect(screen.getByText(/Difficulty:/)).toBeInTheDocument();
    });
  });

  it('renders ingredients section', async () => {
    render(<RecipeDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Ingredients')).toBeInTheDocument();
      expect(screen.getByText(/Flour/)).toBeInTheDocument();
      expect(screen.getByText(/Sugar/)).toBeInTheDocument();
    });
  });

  it('renders instructions section', async () => {
    render(<RecipeDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Instructions')).toBeInTheDocument();
      expect(screen.getByText(/Mix flour and sugar/)).toBeInTheDocument();
      expect(screen.getByText(/Bake at 350F/)).toBeInTheDocument();
    });
  });

  it('shows back button', async () => {
    render(<RecipeDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Back')).toBeInTheDocument();
    });
  });

  it('shows edit button for recipe owner', async () => {
    const preloadedState = {
      auth: {
        user: { ...mockUser, id: mockRecipe.author_id },
        token: 'mock-token',
        isAuthenticated: true,
      },
    };

    render(<RecipeDetailPage />, { preloadedState });

    await waitFor(() => {
      expect(screen.getByText('Edit Recipe')).toBeInTheDocument();
    });
  });

  it('shows edit button for admin users', async () => {
    const preloadedState = {
      auth: {
        user: { ...mockUser, role: UserRole.ADMIN },
        token: 'mock-token',
        isAuthenticated: true,
      },
    };

    render(<RecipeDetailPage />, { preloadedState });

    await waitFor(() => {
      expect(screen.getByText('Edit Recipe')).toBeInTheDocument();
    });
  });

  it('does not show edit button for non-owner members', async () => {
    const preloadedState = {
      auth: {
        user: { ...mockUser, id: 'different-user-id', role: UserRole.MEMBER },
        token: 'mock-token',
        isAuthenticated: true,
      },
    };

    render(<RecipeDetailPage />, { preloadedState });

    await waitFor(() => {
      expect(screen.queryByText('Edit Recipe')).not.toBeInTheDocument();
    });
  });

  it('displays recipe content', async () => {
    render(<RecipeDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Test Recipe')).toBeInTheDocument();
      expect(screen.getByText('Ingredients')).toBeInTheDocument();
      expect(screen.getByText('Instructions')).toBeInTheDocument();
    });
  });

  it('navigates back when back button is clicked', async () => {
    const user = userEvent.setup();
    render(<RecipeDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Test Recipe')).toBeInTheDocument();
    });

    const backButton = screen.getByText('Back');
    await user.click(backButton);

    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it('navigates to edit page when edit button is clicked', async () => {
    const user = userEvent.setup();
    const preloadedState = {
      auth: {
        user: { ...mockUser, id: mockRecipe.author_id },
        token: 'mock-token',
        isAuthenticated: true,
      },
    };

    render(<RecipeDetailPage />, { preloadedState });

    await waitFor(() => {
      expect(screen.getByText('Edit Recipe')).toBeInTheDocument();
    });

    const editButton = screen.getByText('Edit Recipe');
    await user.click(editButton);

    expect(mockNavigate).toHaveBeenCalledWith('/recipes/1/edit');
  });

  it('displays recipe author when available', async () => {
    render(<RecipeDetailPage />);

    await waitFor(() => {
      expect(screen.getByText(/Recipe by/)).toBeInTheDocument();
    });
  });

  it('displays categories when recipe has categories', async () => {
    render(<RecipeDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Categories:')).toBeInTheDocument();
      expect(screen.getByText('Breakfast')).toBeInTheDocument();
      expect(screen.getByText('Lunch')).toBeInTheDocument();
    });
  });

  it('displays total time', async () => {
    render(<RecipeDetailPage />);

    await waitFor(() => {
      expect(screen.getByText(/Total:/)).toBeInTheDocument();
    });
  });

  it('handles recipe with instruction images', async () => {
    render(<RecipeDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Test Recipe')).toBeInTheDocument();
    });

    // The component should handle filtering images for instructions
    // This test ensures the stepImageMap logic is executed
    expect(screen.getByText('Instructions')).toBeInTheDocument();
  });

  it('handles recipe with final product images', async () => {
    render(<RecipeDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Test Recipe')).toBeInTheDocument();
    });

    // The component should filter and sort final product images
    // This ensures finalProductImages logic is executed
    expect(screen.getByText(/Ingredients/)).toBeInTheDocument();
  });
});

describe('RecipeDetailPage - Error Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows error message when recipe is not found', async () => {
    // Override the MSW handler to return 404
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    server.use(
      http.get(`${API_URL}/recipes/:id`, () => {
        return HttpResponse.json(
          { success: false, error: 'Recipe not found' },
          { status: 404 }
        );
      })
    );

    render(<RecipeDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Recipe not found')).toBeInTheDocument();
    });
  });

  it('renders ImageCarousel when recipe has final product images', async () => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    const recipeWithImages = {
      ...mockRecipe,
      images: [
        {
          id: 'img-1',
          recipe_id: '1',
          url: 'http://example.com/image1.jpg',
          alt_text: 'Final product',
          order_index: 0,
          instruction_id: null,
        },
        {
          id: 'img-2',
          recipe_id: '1',
          url: 'http://example.com/image2.jpg',
          alt_text: 'Final product angle 2',
          order_index: 1,
          instruction_id: null,
        },
      ],
    };

    server.use(
      http.get(`${API_URL}/recipes/:id`, () => {
        return HttpResponse.json(
          { success: true, data: recipeWithImages },
          { status: 200 }
        );
      })
    );

    render(<RecipeDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Test Recipe')).toBeInTheDocument();
    });

    // Verify ImageCarousel is rendered with final product images
    const images = screen.getAllByAltText('Final product');
    expect(images.length).toBeGreaterThan(0);
  });

  it('renders step images inline with instructions', async () => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    const recipeWithStepImages = {
      ...mockRecipe,
      instructions: [
        { id: 'inst-1', step_number: 1, description: 'Mix flour and sugar' },
        { id: 'inst-2', step_number: 2, description: 'Bake at 350F' },
      ],
      images: [
        {
          id: 'img-step-1',
          recipe_id: '1',
          url: 'http://example.com/step1.jpg',
          alt_text: 'Step 1 image',
          order_index: 0,
          instruction_id: 'inst-1',
        },
      ],
    };

    server.use(
      http.get(`${API_URL}/recipes/:id`, () => {
        return HttpResponse.json(
          { success: true, data: recipeWithStepImages },
          { status: 200 }
        );
      })
    );

    render(<RecipeDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Test Recipe')).toBeInTheDocument();
    });

    // Verify step image is rendered
    expect(screen.getByAltText('Step 1 image')).toBeInTheDocument();
  });
});
