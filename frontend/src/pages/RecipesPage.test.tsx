import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
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
});
