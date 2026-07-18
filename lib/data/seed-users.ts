import type { User } from '@/types';

// ⚠️ DEVELOPMENT ONLY — fake accounts for building/testing the admin
// dashboard's user management screen before real Appwrite users exist.
export const MOCK_USERS: User[] = [
  {
    id: 'user-1',
    name: 'محمد العتيبي',
    username: 'motaibi',
    email: 'motaibi@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=motaibi',
    joinDate: '2024-03-12T00:00:00.000Z',
    role: 'user',
    status: 'active',
  },
  {
    id: 'user-2',
    name: 'سارة الدوسري',
    username: 'sara_d',
    email: 'sara@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sara',
    joinDate: '2024-06-01T00:00:00.000Z',
    role: 'user',
    status: 'active',
  },
  {
    id: 'user-3',
    name: 'خالد الشمري',
    username: 'khalidsh',
    email: 'khalid@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=khalid',
    joinDate: '2023-11-20T00:00:00.000Z',
    role: 'user',
    status: 'banned',
  },
];
