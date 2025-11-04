import db from '../config/database';
import { Recipe, RecipeWithDetails, UserRole, RecipeStatus, Ingredient, Instruction } from '../types';

export class RecipeService {
  static async getAll(
    userId?: string,
    userRole?: UserRole,
    page: number = 1,
    limit: number = 20,
    status?: RecipeStatus
  ): Promise<{ recipes: RecipeWithDetails[]; total: number }> {
    const offset = (page - 1) * limit;

    // Build base query for count
    let countQuery = db('recipes');

    // Filter based on user role
    if (!userId || userRole === UserRole.GUEST) {
      // Guests only see approved, public recipes
      countQuery = countQuery.where('recipes.is_private', false).where('recipes.status', RecipeStatus.APPROVED);
    } else if (userRole === UserRole.MEMBER) {
      // Members see approved recipes (both public and private) + their own recipes
      countQuery = countQuery.where((builder) => {
        builder
          .where('recipes.status', RecipeStatus.APPROVED)
          .orWhere('recipes.author_id', userId);
      });
    }
    // Admins see all recipes (no filter)

    if (status && userRole === UserRole.ADMIN) {
      countQuery = countQuery.where('recipes.status', status);
    }

    // Get total count
    const totalResult = await countQuery.clone().count('* as count').first();
    const total = parseInt(totalResult?.count as string) || 0;

    // Build query for fetching recipes with author info
    let query = db('recipes')
      .select(
        'recipes.*',
        db.raw('json_build_object(\'id\', author.id, \'first_name\', author.first_name, \'last_name\', author.last_name, \'email\', author.email) as author')
      )
      .leftJoin('users as author', 'recipes.author_id', 'author.id');

    // Apply same filters
    if (!userId || userRole === UserRole.GUEST) {
      query = query.where('recipes.is_private', false).where('recipes.status', RecipeStatus.APPROVED);
    } else if (userRole === UserRole.MEMBER) {
      query = query.where((builder) => {
        builder
          .where('recipes.status', RecipeStatus.APPROVED)
          .orWhere('recipes.author_id', userId);
      });
    }

    if (status && userRole === UserRole.ADMIN) {
      query = query.where('recipes.status', status);
    }

    const recipes = await query.orderBy('recipes.created_at', 'desc').limit(limit).offset(offset);

    return {
      recipes,
      total,
    };
  }

  static async getById(id: string, userId?: string, userRole?: UserRole): Promise<RecipeWithDetails | null> {
    const recipe = await db('recipes')
      .select(
        'recipes.*',
        db.raw('json_build_object(\'id\', author.id, \'first_name\', author.first_name, \'last_name\', author.last_name, \'email\', author.email) as author'),
        db.raw('json_build_object(\'id\', approver.id, \'first_name\', approver.first_name, \'last_name\', approver.last_name) as approved_by')
      )
      .leftJoin('users as author', 'recipes.author_id', 'author.id')
      .leftJoin('users as approver', 'recipes.approved_by_id', 'approver.id')
      .where('recipes.id', id)
      .first();

    if (!recipe) {
      return null;
    }

    // Check permissions
    if (!userId || userRole === UserRole.GUEST) {
      if (recipe.is_private || recipe.status !== RecipeStatus.APPROVED) {
        return null;
      }
    } else if (userRole === UserRole.MEMBER) {
      // Members can see: approved public recipes, all their own recipes, or approved private recipes
      const isOwnRecipe = recipe.author_id === userId;
      const isApprovedPublic = recipe.status === RecipeStatus.APPROVED && !recipe.is_private;
      const isApprovedPrivate = recipe.status === RecipeStatus.APPROVED && recipe.is_private;

      if (!isOwnRecipe && !isApprovedPublic && !isApprovedPrivate) {
        return null;
      }
    }

    // Get ingredients
    const ingredients = await db('ingredients')
      .where('recipe_id', id)
      .orderBy('order_index', 'asc');

    // Get instructions
    const instructions = await db('instructions')
      .where('recipe_id', id)
      .orderBy('step_number', 'asc');

    // Get categories
    const categories = await db('categories')
      .select('categories.*')
      .join('recipe_categories', 'categories.id', 'recipe_categories.category_id')
      .where('recipe_categories.recipe_id', id);

    // Get images
    const images = await db('recipe_images')
      .where('recipe_id', id)
      .orderBy('order_index', 'asc');

    return {
      ...recipe,
      ingredients,
      instructions,
      categories,
      images,
    };
  }

  static async create(
    data: {
      title: string;
      description: string;
      prepTime: number;
      cookTime: number;
      servings: number;
      difficulty: string;
      isPrivate: boolean;
      ingredients: Omit<Ingredient, 'id' | 'recipe_id'>[];
      instructions: Omit<Instruction, 'id' | 'recipe_id'>[];
      categoryIds?: string[];
    },
    authorId: string,
    userRole: UserRole
  ): Promise<RecipeWithDetails> {
    return db.transaction(async (trx) => {
      // Determine status based on user role
      const status = userRole === UserRole.ADMIN ? RecipeStatus.APPROVED : RecipeStatus.PENDING;
      const approvedById = userRole === UserRole.ADMIN ? authorId : null;

      // Create recipe
      const [recipe] = await trx('recipes')
        .insert({
          title: data.title,
          description: data.description,
          prep_time: data.prepTime,
          cook_time: data.cookTime,
          servings: data.servings,
          difficulty: data.difficulty,
          is_private: data.isPrivate,
          status,
          author_id: authorId,
          approved_by_id: approvedById,
        })
        .returning('*');

      // Create ingredients
      if (data.ingredients.length > 0) {
        await trx('ingredients').insert(
          data.ingredients.map((ing) => ({
            recipe_id: recipe.id,
            quantity: ing.quantity,
            unit: ing.unit,
            name: ing.name,
            order_index: ing.order_index,
          }))
        );
      }

      // Create instructions
      if (data.instructions.length > 0) {
        await trx('instructions').insert(
          data.instructions.map((inst) => ({
            recipe_id: recipe.id,
            step_number: inst.step_number,
            description: inst.description,
          }))
        );
      }

      // Link categories
      if (data.categoryIds && data.categoryIds.length > 0) {
        await trx('recipe_categories').insert(
          data.categoryIds.map((catId) => ({
            recipe_id: recipe.id,
            category_id: catId,
          }))
        );
      }

      return this.getById(recipe.id, authorId, userRole) as Promise<RecipeWithDetails>;
    });
  }

  static async update(
    id: string,
    data: Partial<{
      title: string;
      description: string;
      prepTime: number;
      cookTime: number;
      servings: number;
      difficulty: string;
      isPrivate: boolean;
      ingredients: Omit<Ingredient, 'id' | 'recipe_id'>[];
      instructions: Omit<Instruction, 'id' | 'recipe_id'>[];
      categoryIds: string[];
    }>,
    userId: string,
    userRole: UserRole
  ): Promise<RecipeWithDetails | null> {
    return db.transaction(async (trx) => {
      const recipe = await trx('recipes').where('id', id).first();

      if (!recipe) {
        return null;
      }

      // Check permissions
      if (userRole !== UserRole.ADMIN && recipe.author_id !== userId) {
        throw new Error('You do not have permission to update this recipe');
      }

      // Update recipe
      const updateData: any = {};
      if (data.title !== undefined) updateData.title = data.title;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.prepTime !== undefined) updateData.prep_time = data.prepTime;
      if (data.cookTime !== undefined) updateData.cook_time = data.cookTime;
      if (data.servings !== undefined) updateData.servings = data.servings;
      if (data.difficulty !== undefined) updateData.difficulty = data.difficulty;
      if (data.isPrivate !== undefined) updateData.is_private = data.isPrivate;

      if (Object.keys(updateData).length > 0) {
        await trx('recipes').where('id', id).update(updateData);
      }

      // Update ingredients
      if (data.ingredients) {
        await trx('ingredients').where('recipe_id', id).del();
        if (data.ingredients.length > 0) {
          await trx('ingredients').insert(
            data.ingredients.map((ing) => ({
              recipe_id: id,
              quantity: ing.quantity,
              unit: ing.unit,
              name: ing.name,
              order_index: ing.order_index,
            }))
          );
        }
      }

      // Update instructions
      if (data.instructions) {
        await trx('instructions').where('recipe_id', id).del();
        if (data.instructions.length > 0) {
          await trx('instructions').insert(
            data.instructions.map((inst) => ({
              recipe_id: id,
              step_number: inst.step_number,
              description: inst.description,
            }))
          );
        }
      }

      // Update categories
      if (data.categoryIds) {
        await trx('recipe_categories').where('recipe_id', id).del();
        if (data.categoryIds.length > 0) {
          await trx('recipe_categories').insert(
            data.categoryIds.map((catId) => ({
              recipe_id: id,
              category_id: catId,
            }))
          );
        }
      }

      return this.getById(id, userId, userRole) as Promise<RecipeWithDetails>;
    });
  }

  static async delete(id: string, userId: string, userRole: UserRole): Promise<boolean> {
    const recipe = await db('recipes').where('id', id).first();

    if (!recipe) {
      return false;
    }

    // Check permissions
    if (userRole !== UserRole.ADMIN && recipe.author_id !== userId) {
      throw new Error('You do not have permission to delete this recipe');
    }

    await db('recipes').where('id', id).del();
    return true;
  }

  static async approve(id: string, approverId: string): Promise<RecipeWithDetails | null> {
    await db('recipes')
      .where('id', id)
      .update({
        status: RecipeStatus.APPROVED,
        approved_by_id: approverId,
      });

    return this.getById(id, approverId, UserRole.ADMIN);
  }

  static async reject(id: string, approverId: string): Promise<RecipeWithDetails | null> {
    await db('recipes')
      .where('id', id)
      .update({
        status: RecipeStatus.REJECTED,
        approved_by_id: approverId,
      });

    return this.getById(id, approverId, UserRole.ADMIN);
  }

  static async getUserRecipes(userId: string): Promise<RecipeWithDetails[]> {
    const recipes = await db('recipes')
      .select('recipes.*')
      .where('author_id', userId)
      .orderBy('created_at', 'desc');

    return Promise.all(
      recipes.map((recipe) => this.getById(recipe.id, userId, UserRole.MEMBER) as Promise<RecipeWithDetails>)
    );
  }
}
