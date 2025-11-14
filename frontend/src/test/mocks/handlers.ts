import { http, HttpResponse } from 'msw';
import {
  mockUser,
  mockAdmin,
  mockUnapprovedUser,
  mockAuthResponse,
  mockRecipe,
  mockUsers,
  mockRecipes,
  mockCategories,
} from './mockData';

const API_URL = 'http://localhost:9999/api';

export const handlers = [
  http.post(`${API_URL}/auth/login`, async ({ request }) => {
    const body = await request.json() as { email: string; password: string };

    await new Promise(resolve => setTimeout(resolve, 100));

    if (body.email === 'test@example.com' && body.password === 'password') {
      return HttpResponse.json({
        success: true,
        data: mockAuthResponse,
      });
    }

    if (body.email === 'admin@example.com' && body.password === 'password') {
      return HttpResponse.json({
        success: true,
        data: { ...mockAuthResponse, user: mockAdmin },
      });
    }

    if (body.email === 'pending@example.com') {
      return HttpResponse.json(
        { success: false, error: 'Your account is pending approval. Please contact an administrator.' },
        { status: 403 }
      );
    }

    return HttpResponse.json(
      { success: false, error: 'Invalid credentials' },
      { status: 401 }
    );
  }),

  http.post(`${API_URL}/auth/register`, async ({ request }) => {
    const body = await request.json() as unknown;

    await new Promise(resolve => setTimeout(resolve, 100));

    if (body.email === 'existing@example.com') {
      return HttpResponse.json(
        { success: false, error: 'Email already exists' },
        { status: 409 }
      );
    }

    return HttpResponse.json({
      success: true,
      data: {
        user: { ...mockUnapprovedUser, email: body.email },
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      },
    });
  }),

  http.post(`${API_URL}/auth/logout`, ({ request }) => {
    // Simulate logout error for testing error handling
    const authHeader = request.headers.get('authorization');
    if (authHeader === 'Bearer error-token') {
      return HttpResponse.json(
        { success: false, error: 'Logout failed' },
        { status: 500 }
      );
    }

    return HttpResponse.json({ success: true, data: null });
  }),

  http.get(`${API_URL}/auth/me`, ({ request }) => {
    const authHeader = request.headers.get('authorization');

    if (!authHeader) {
      return HttpResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return HttpResponse.json({ success: true, data: mockUser });
  }),

  http.post(`${API_URL}/auth/refresh`, () => {
    return HttpResponse.json({
      success: true,
      data: { accessToken: 'new-mock-access-token' },
    });
  }),


  http.get(`${API_URL}/recipes`, ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get('status');

    let filteredRecipes = mockRecipes;
    if (status) {
      filteredRecipes = mockRecipes.filter((r) => r.status === status);
    }

    // Add author information to recipes
    const recipesWithAuthor = filteredRecipes.map((recipe) => ({
      ...recipe,
      author: mockUser,
    }));

    return HttpResponse.json({
      success: true,
      data: {
        recipes: recipesWithAuthor,
        pagination: {
          page: 1,
          limit: 20,
          total: filteredRecipes.length,
          pages: 1,
        },
      },
    });
  }),

  http.get(`${API_URL}/recipes/:id`, ({ params }) => {
    // Return error for specific ID to test error state
    if (params.id === 'not-found') {
      return HttpResponse.json(
        { success: false, error: 'Recipe not found' },
        { status: 404 }
      );
    }

    const recipe = mockRecipes.find((r) => r.id === params.id);

    if (!recipe) {
      return HttpResponse.json(
        { success: false, error: 'Recipe not found' },
        { status: 404 }
      );
    }

    // Return recipe with categories and author for ID '1'
    if (params.id === '1') {
      return HttpResponse.json({
        success: true,
        data: {
          ...recipe,
          author: mockUser,
          categories: [mockCategories[0], mockCategories[1]],
        }
      });
    }

    return HttpResponse.json({ success: true, data: recipe });
  }),

  http.get(`${API_URL}/recipes/my-recipes`, () => {
    const userRecipes = mockRecipes.filter((r) => r.author_id === mockUser.id);
    return HttpResponse.json({ success: true, data: userRecipes });
  }),

  http.post(`${API_URL}/recipes`, async ({ request }) => {
    const body = await request.json() as unknown;

    // Simulate error for specific title
    if (body.title === 'Error Recipe') {
      return HttpResponse.json(
        { success: false, message: 'Failed to create recipe' },
        { status: 400 }
      );
    }

    const newRecipe = {
      ...mockRecipe,
      id: 'new-recipe-id',
      ...body,
      author_id: mockUser.id,
      status: 'pending' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return HttpResponse.json({ success: true, data: newRecipe }, { status: 201 });
  }),

  http.patch(`${API_URL}/recipes/:id`, async ({ params, request }) => {
    const body = await request.json() as unknown;
    const recipe = mockRecipes.find((r) => r.id === params.id);

    if (!recipe) {
      return HttpResponse.json(
        { success: false, error: 'Recipe not found' },
        { status: 404 }
      );
    }

    const updatedRecipe = {
      ...recipe,
      ...body,
      updated_at: new Date().toISOString(),
    };

    return HttpResponse.json({ success: true, data: updatedRecipe });
  }),

  http.delete(`${API_URL}/recipes/:id`, ({ params }) => {
    const recipe = mockRecipes.find((r) => r.id === params.id);

    if (!recipe) {
      return HttpResponse.json(
        { success: false, error: 'Recipe not found' },
        { status: 404 }
      );
    }

    return HttpResponse.json({ success: true, data: null }, { status: 204 });
  }),

  http.patch(`${API_URL}/recipes/:id/approve`, ({ params }) => {
    const recipe = mockRecipes.find((r) => r.id === params.id);

    if (!recipe) {
      return HttpResponse.json(
        { success: false, error: 'Recipe not found' },
        { status: 404 }
      );
    }

    return HttpResponse.json({
      success: true,
      data: { ...recipe, status: 'approved' as const },
    });
  }),

  http.patch(`${API_URL}/recipes/:id/reject`, ({ params }) => {
    const recipe = mockRecipes.find((r) => r.id === params.id);

    if (!recipe) {
      return HttpResponse.json(
        { success: false, error: 'Recipe not found' },
        { status: 404 }
      );
    }

    return HttpResponse.json({
      success: true,
      data: { ...recipe, status: 'rejected' as const },
    });
  }),

  // Recipe Image endpoints
  http.post(`${API_URL}/recipes/:id/images`, async ({ params, request }) => {
    const recipe = mockRecipes.find((r) => r.id === params.id);

    if (!recipe) {
      return HttpResponse.json(
        { success: false, error: 'Recipe not found' },
        { status: 404 }
      );
    }

    const formData = await request.formData();
    const altText = formData.get('altText') as string;
    const isPrimary = formData.get('isPrimary') === 'true';
    const orderIndex = parseInt(formData.get('orderIndex') as string) || 0;
    const instructionId = formData.get('instructionId') as string | null;

    const newImage = {
      id: `img-${Date.now()}`,
      recipe_id: params.id as string,
      instruction_id: instructionId || null,
      url: `/uploads/recipes/mock-${Date.now()}.jpg`,
      alt_text: altText || 'Recipe image',
      is_primary: isPrimary,
      order_index: orderIndex,
    };

    return HttpResponse.json(
      { success: true, data: newImage },
      { status: 201 }
    );
  }),

  http.patch(`${API_URL}/recipes/images/:imageId`, async ({ params, request }) => {
    const body = await request.json() as { altText?: string; isPrimary?: boolean; orderIndex?: number };

    const updatedImage = {
      id: params.imageId as string,
      recipe_id: '1',
      instruction_id: null,
      url: '/uploads/recipes/mock-image.jpg',
      alt_text: body.altText || 'Updated image',
      is_primary: body.isPrimary ?? false,
      order_index: body.orderIndex ?? 0,
    };

    return HttpResponse.json({ success: true, data: updatedImage });
  }),

  http.delete(`${API_URL}/recipes/images/:imageId`, () => {
    return HttpResponse.json({ success: true, data: null }, { status: 204 });
  }),


  http.get(`${API_URL}/users`, ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedUsers = mockUsers.slice(startIndex, endIndex);

    return HttpResponse.json({
      success: true,
      data: {
        users: paginatedUsers,
        pagination: {
          page,
          limit,
          total: mockUsers.length,
          totalPages: Math.ceil(mockUsers.length / limit),
        },
      },
    });
  }),

  http.get(`${API_URL}/users/:id`, ({ params }) => {
    const user = mockUsers.find((u) => u.id === params.id);

    if (!user) {
      return HttpResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return HttpResponse.json({ success: true, data: user });
  }),

  http.patch(`${API_URL}/users/:id/role`, async ({ params, request }) => {
    const body = await request.json() as { role: string };
    const user = mockUsers.find((u) => u.id === params.id);

    if (!user) {
      return HttpResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return HttpResponse.json({
      success: true,
      data: { ...user, role: body.role },
    });
  }),

  http.patch(`${API_URL}/users/:id/profile`, async ({ params, request }) => {
    const body = await request.json() as unknown;
    const user = mockUsers.find((u) => u.id === params.id);

    if (!user) {
      return HttpResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return HttpResponse.json({
      success: true,
      data: { ...user, ...body },
    });
  }),

  http.post(`${API_URL}/users/:id/approve`, ({ params }) => {
    const user = mockUsers.find((u) => u.id === params.id);

    if (!user) {
      return HttpResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return HttpResponse.json({
      success: true,
      data: { ...user, is_approved: true, approved_at: new Date().toISOString() },
    });
  }),

  http.post(`${API_URL}/users/:id/reject`, ({ params }) => {
    const user = mockUsers.find((u) => u.id === params.id);

    if (!user) {
      return HttpResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return HttpResponse.json({ success: true, data: null }, { status: 204 });
  }),

  http.delete(`${API_URL}/users/:id`, ({ params }) => {
    const user = mockUsers.find((u) => u.id === params.id);

    if (!user) {
      return HttpResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return HttpResponse.json({ success: true, data: null }, { status: 204 });
  }),


  http.patch(`${API_URL}/profile/:id/profile`, async ({ request }) => {
    const body = await request.json() as unknown;

    // Simulate error for specific email
    if (body.email === 'error@example.com') {
      return HttpResponse.json(
        { success: false, message: 'Failed to update profile' },
        { status: 400 }
      );
    }

    return HttpResponse.json({
      success: true,
      data: { ...mockUser, ...body },
    });
  }),

  http.patch(`${API_URL}/profile/:id/theme`, async ({ request }) => {
    const body = await request.json() as { themePreference: string };

    return HttpResponse.json({
      success: true,
      data: { ...mockUser, theme_preference: body.themePreference },
    });
  }),

  http.patch(`${API_URL}/profile/:id/password`, async ({ request }) => {
    const body = await request.json() as { currentPassword?: string; newPassword: string };

    if (body.currentPassword && body.currentPassword !== 'password') {
      return HttpResponse.json(
        { success: false, error: 'Current password is incorrect' },
        { status: 400 }
      );
    }

    return HttpResponse.json({ success: true, data: null });
  }),

  // Categories endpoints
  http.get(`${API_URL}/categories`, () => {
    return HttpResponse.json({
      success: true,
      data: mockCategories,
    });
  }),

  http.get(`${API_URL}/categories/:id`, ({ params }) => {
    const category = mockCategories.find((c) => c.id === params.id);

    if (!category) {
      return HttpResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      );
    }

    return HttpResponse.json({ success: true, data: category });
  }),

  http.post(`${API_URL}/categories`, async ({ request }) => {
    const body = await request.json() as { name: string; slug: string };

    const newCategory = {
      id: `${mockCategories.length + 1}`,
      name: body.name,
      slug: body.slug,
    };

    return HttpResponse.json({ success: true, data: newCategory }, { status: 201 });
  }),

  http.patch(`${API_URL}/categories/:id`, async ({ params, request }) => {
    const body = await request.json() as { name?: string; slug?: string };
    const category = mockCategories.find((c) => c.id === params.id);

    if (!category) {
      return HttpResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      );
    }

    const updatedCategory = {
      ...category,
      ...body,
    };

    return HttpResponse.json({ success: true, data: updatedCategory });
  }),

  http.delete(`${API_URL}/categories/:id`, ({ params }) => {
    const category = mockCategories.find((c) => c.id === params.id);

    if (!category) {
      return HttpResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      );
    }

    return HttpResponse.json({ success: true, data: null }, { status: 204 });
  }),
];
