import { drizzle } from 'drizzle-orm/postgres-js';
const postgres = require('postgres');
import { users } from './schema';

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgres@localhost:5432/template_db';

const client = postgres(connectionString);
const db = drizzle(client);

async function seed() {
  try {
    console.log('Seeding database...');

    await db.insert(users).values([
      {
        name: 'John Doe',
        email: 'john.doe@example.com',
      },
      {
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
      },
      {
        name: 'Bob Johnson',
        email: 'bob.johnson@example.com',
      },
    ]);

    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await client.end();
  }
}

seed();
