import type { Knex } from 'knex';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const knexConfig: { [key: string]: Knex.Config } = {
  development: {
    client: 'postgresql',
    connection: process.env.DATABASE_URL || {
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 5432,
      user: process.env.DB_USER || 'recipeuser',
      password: process.env.DB_PASSWORD || 'recipepass',
      database: process.env.DB_NAME || 'recipedb',
    },
    pool: {
      min: 2,
      max: 10,
    },
    migrations: {
      tableName: 'knex_migrations',
      directory: path.join(__dirname, '../../migrations'),
      extension: 'ts',
    },
    seeds: {
      directory: path.join(__dirname, '../../seeds'),
      extension: 'ts',
    },
  },

  production: {
    client: 'postgresql',
    connection: process.env.DATABASE_URL,
    pool: {
      min: 2,
      max: 10,
    },
    migrations: {
      tableName: 'knex_migrations',
      directory: path.join(__dirname, '../../migrations'),
      extension: 'ts',
    },
    seeds: {
      directory: path.join(__dirname, '../../seeds'),
      extension: 'ts',
    },
  },

  test: {
    client: 'postgresql',
    connection: process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/recipes_test',
    pool: {
      min: 2,
      max: 10,
    },
    migrations: {
      tableName: 'knex_migrations',
      directory: path.join(__dirname, '../../migrations'),
      extension: 'ts',
    },
    seeds: {
      directory: path.join(__dirname, '../../seeds'),
      extension: 'ts',
    },
  },
};

export default knexConfig;
