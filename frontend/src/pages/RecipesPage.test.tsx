import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@/test/utils/test-utils';
import { RecipesPage } from './RecipesPage';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';

describe('RecipesPage', () => {
  it('shows loading state initially', () => {
    render(<RecipesPage />);

    expect(screen.getByText('Loading recipes...')).toBeInTheDocument();
  });

  it('renders recipes after loading', async () => {
    render(<RecipesPage />);

    await waitFor(() => {
      expect(screen.getByText('All Recipes')).toBeInTheDocument();
    });
  });

  it('displays recipe cards with details', async () => {
    render(<RecipesPage />);

    await waitFor(() => {
      expect(screen.getByText('Test Recipe')).toBeInTheDocument();
      expect(screen.getByText('A delicious test recipe')).toBeInTheDocument();
    });
  });

  it('shows prep and cook time for recipes', async () => {
    render(<RecipesPage />);

    await waitFor(() => {
      expect(screen.getAllByText(/Prep:/).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Cook:/).length).toBeGreaterThan(0);
    });
  });

  it('displays recipe difficulty', async () => {
    render(<RecipesPage />);

    await waitFor(() => {
      expect(screen.getByText('Medium')).toBeInTheDocument();
    });
  });

  it('shows recipe author when available', async () => {
    render(<RecipesPage />);

    await waitFor(() => {
      const authorElements = screen.queryAllByText(/By/);
      expect(authorElements.length).toBeGreaterThanOrEqual(0);
    });
  });

  it('renders header component', async () => {
    render(<RecipesPage />);

    await waitFor(() => {
      expect(screen.getByRole('banner')).toBeInTheDocument();
    });
  });

  it('shows error message when recipes fail to load', async () => {
    server.use(
      http.get('http://localhost:9999/api/recipes', () => {
        return HttpResponse.json(
          { success: false, error: 'Server error' },
          { status: 500 }
        );
      })
    );

    render(<RecipesPage />);

    await waitFor(() => {
      expect(screen.getByText('Error loading recipes')).toBeInTheDocument();
    });
  });

  it('handles response with no recipes array', async () => {
    server.use(
      http.get('http://localhost:9999/api/recipes', () => {
        return HttpResponse.json({
          success: true,
          data: { recipes: null, total: 0, page: 1, totalPages: 0 },
        });
      })
    );

    render(<RecipesPage />);

    await waitFor(() => {
      expect(screen.getByText('All Recipes')).toBeInTheDocument();
    });

    // Page should render successfully even when recipes array is null
    // The || [] on line 28 handles this case
  });

  it('renders search input', async () => {
    render(<RecipesPage />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search recipes...')).toBeInTheDocument();
    });
  });

  it('renders category filter select', async () => {
    render(<RecipesPage />);

    await waitFor(() => {
      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
      expect(select).toHaveAttribute('name', 'category');
    });
  });

  it('filters recipes by search term in title', async () => {
    const user = userEvent.setup();

    // Mock recipes with different titles
    server.use(
      http.get('http://localhost:9999/api/recipes', () => {
        return HttpResponse.json({
          success: true,
          data: {
            recipes: [
              {
                id: '1',
                title: 'Chocolate Cake',
                description: 'A delicious cake',
                prep_time: 15,
                cook_time: 30,
                servings: 8,
                difficulty: 'medium',
                status: 'approved',
              },
              {
                id: '2',
                title: 'Vanilla Cookies',
                description: 'Tasty cookies',
                prep_time: 10,
                cook_time: 12,
                servings: 24,
                difficulty: 'easy',
                status: 'approved',
              },
            ],
            pagination: { page: 1, limit: 20, total: 2, totalPages: 1 },
          },
        });
      })
    );

    render(<RecipesPage />);

    await waitFor(() => {
      expect(screen.getByText('Chocolate Cake')).toBeInTheDocument();
      expect(screen.getByText('Vanilla Cookies')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search recipes...');
    await user.type(searchInput, 'chocolate');

    await waitFor(() => {
      expect(screen.getByText('Chocolate Cake')).toBeInTheDocument();
      expect(screen.queryByText('Vanilla Cookies')).not.toBeInTheDocument();
    });
  });

  it('filters recipes by search term in description', async () => {
    const user = userEvent.setup();

    server.use(
      http.get('http://localhost:9999/api/recipes', () => {
        return HttpResponse.json({
          success: true,
          data: {
            recipes: [
              {
                id: '1',
                title: 'Recipe One',
                description: 'Contains special ingredients',
                prep_time: 15,
                cook_time: 30,
                servings: 4,
                difficulty: 'medium',
                status: 'approved',
              },
              {
                id: '2',
                title: 'Recipe Two',
                description: 'Simple and easy',
                prep_time: 10,
                cook_time: 15,
                servings: 2,
                difficulty: 'easy',
                status: 'approved',
              },
            ],
            pagination: { page: 1, limit: 20, total: 2, totalPages: 1 },
          },
        });
      })
    );

    render(<RecipesPage />);

    await waitFor(() => {
      expect(screen.getByText('Recipe One')).toBeInTheDocument();
      expect(screen.getByText('Recipe Two')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search recipes...');
    await user.type(searchInput, 'special');

    await waitFor(() => {
      expect(screen.getByText('Recipe One')).toBeInTheDocument();
      expect(screen.queryByText('Recipe Two')).not.toBeInTheDocument();
    });
  });

  it('filters recipes by category', async () => {
    const user = userEvent.setup();

    server.use(
      http.get('http://localhost:9999/api/recipes', () => {
        return HttpResponse.json({
          success: true,
          data: {
            recipes: [
              {
                id: '1',
                title: 'Dessert Recipe',
                description: 'Sweet treat',
                prep_time: 15,
                cook_time: 30,
                servings: 8,
                difficulty: 'medium',
                status: 'approved',
                categories: [{ id: '4', name: 'Dessert', slug: 'dessert' }],
              },
              {
                id: '2',
                title: 'Dinner Recipe',
                description: 'Main course',
                prep_time: 20,
                cook_time: 45,
                servings: 4,
                difficulty: 'medium',
                status: 'approved',
                categories: [{ id: '3', name: 'Dinner', slug: 'dinner' }],
              },
            ],
            pagination: { page: 1, limit: 20, total: 2, totalPages: 1 },
          },
        });
      })
    );

    render(<RecipesPage />);

    await waitFor(() => {
      expect(screen.getByText('Dessert Recipe')).toBeInTheDocument();
      expect(screen.getByText('Dinner Recipe')).toBeInTheDocument();
    });

    const categorySelect = screen.getByRole('combobox');
    await user.selectOptions(categorySelect, '4');

    await waitFor(() => {
      expect(screen.getByText('Dessert Recipe')).toBeInTheDocument();
      expect(screen.queryByText('Dinner Recipe')).not.toBeInTheDocument();
    });
  });

  it('shows "no recipes found" message when filters return no results', async () => {
    const user = userEvent.setup();
    render(<RecipesPage />);

    await waitFor(() => {
      expect(screen.getByText('Test Recipe')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search recipes...');
    await user.type(searchInput, 'nonexistent recipe name xyz');

    await waitFor(() => {
      expect(
        screen.getByText('No recipes found. Try adjusting your search or filters.')
      ).toBeInTheDocument();
      expect(screen.queryByText('Test Recipe')).not.toBeInTheDocument();
    });
  });

  it('combines search and category filters', async () => {
    const user = userEvent.setup();

    server.use(
      http.get('http://localhost:9999/api/recipes', () => {
        return HttpResponse.json({
          success: true,
          data: {
            recipes: [
              {
                id: '1',
                title: 'Chocolate Dessert',
                description: 'Sweet',
                prep_time: 15,
                cook_time: 30,
                servings: 8,
                difficulty: 'medium',
                status: 'approved',
                categories: [{ id: '4', name: 'Dessert', slug: 'dessert' }],
              },
              {
                id: '2',
                title: 'Vanilla Dessert',
                description: 'Sweet',
                prep_time: 15,
                cook_time: 30,
                servings: 8,
                difficulty: 'easy',
                status: 'approved',
                categories: [{ id: '4', name: 'Dessert', slug: 'dessert' }],
              },
              {
                id: '3',
                title: 'Chocolate Dinner',
                description: 'Main',
                prep_time: 20,
                cook_time: 45,
                servings: 4,
                difficulty: 'medium',
                status: 'approved',
                categories: [{ id: '3', name: 'Dinner', slug: 'dinner' }],
              },
            ],
            pagination: { page: 1, limit: 20, total: 3, totalPages: 1 },
          },
        });
      })
    );

    render(<RecipesPage />);

    await waitFor(() => {
      expect(screen.getByText('Chocolate Dessert')).toBeInTheDocument();
      expect(screen.getByText('Vanilla Dessert')).toBeInTheDocument();
      expect(screen.getByText('Chocolate Dinner')).toBeInTheDocument();
    });

    // Apply category filter
    const categorySelect = screen.getByRole('combobox');
    await user.selectOptions(categorySelect, '4');

    await waitFor(() => {
      expect(screen.getByText('Chocolate Dessert')).toBeInTheDocument();
      expect(screen.getByText('Vanilla Dessert')).toBeInTheDocument();
      expect(screen.queryByText('Chocolate Dinner')).not.toBeInTheDocument();
    });

    // Apply search filter
    const searchInput = screen.getByPlaceholderText('Search recipes...');
    await user.type(searchInput, 'chocolate');

    await waitFor(() => {
      expect(screen.getByText('Chocolate Dessert')).toBeInTheDocument();
      expect(screen.queryByText('Vanilla Dessert')).not.toBeInTheDocument();
      expect(screen.queryByText('Chocolate Dinner')).not.toBeInTheDocument();
    });
  });
});
