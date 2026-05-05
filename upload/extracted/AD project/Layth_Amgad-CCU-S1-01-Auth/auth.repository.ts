import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { db } from '../../config/database';
import { DatabaseError } from '../../shared/errors';
import { User, UserWithPassword, CreateUserInput } from './auth.types';

interface UserRow extends RowDataPacket {
  id: number;
  full_name: string;
  email: string;
  password_hash: string;
  role: string;
  created_at: string;
  updated_at: string;
}

// Convert database row to user domain model (without password)
const mapUser = (row: UserRow): User => ({
  id: row.id,
  fullName: row.full_name,
  email: row.email,
  role: row.role as User['role'],
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

// Convert database row to user domain model (including password for auth operations)
const mapUserWithPassword = (row: UserRow): UserWithPassword => ({
  ...mapUser(row),
  passwordHash: row.password_hash
});

export const authRepository = {
  // Find user by email for authentication checks
  async findByEmail(email: string): Promise<UserWithPassword | null> {
    const [rows] = await db.execute<UserRow[]>(
      'SELECT id, full_name, email, password_hash, role, created_at, updated_at FROM users WHERE email = ? LIMIT 1',
      [email]
    );
    if (rows.length === 0) {
      return null;
    }
    return mapUserWithPassword(rows[0]);
  },

  // Find user by ID for profile retrieval
  async findById(id: number): Promise<User | null> {
    const [rows] = await db.execute<UserRow[]>(
      'SELECT id, full_name, email, password_hash, role, created_at, updated_at FROM users WHERE id = ? LIMIT 1',
      [id]
    );
    if (rows.length === 0) {
      return null;
    }
    return mapUser(rows[0]);
  },

  // Create new user account with hashed password
  async create(input: CreateUserInput): Promise<User> {
    const [result] = await db.execute<ResultSetHeader>(
      'INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [input.fullName, input.email, input.passwordHash, input.role]
    );
    const user = await this.findById(result.insertId);
    if (!user) {
      throw new DatabaseError('Failed to create user');
    }
    return user;
  }
};
