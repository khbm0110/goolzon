// Mock Supabase Client for Offline/Demo Mode
// This allows the app to function without a real Supabase connection by using localStorage.

const STORAGE_KEY_PREFIX = 'goolzon_mock_';

const mockStorage = {
  getItem: (key: string) => {
    try {
      const item = localStorage.getItem(STORAGE_KEY_PREFIX + key);
      return item ? JSON.parse(item) : null;
    } catch (e) { return null; }
  },
  setItem: (key: string, value: any) => {
    try {
      localStorage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify(value));
    } catch (e) { /* ignore */ }
  }
};

// Helper to simulate async delay
const delay = (ms: number = 200) => new Promise(resolve => setTimeout(resolve, ms));

const authSubscribers: ((event: string, session: any) => void)[] = [];

const notifyAuthSubscribers = (event: string, session: any) => {
    authSubscribers.forEach(cb => cb(event, session));
};

export const supabase = {
  auth: {
    getSession: async () => {
      await delay();
      const user = mockStorage.getItem('user_session');
      return { data: { session: user ? { user } : null }, error: null };
    },
    onAuthStateChange: (callback: any) => {
      authSubscribers.push(callback);
      // Fire immediately with current state
      const user = mockStorage.getItem('user_session');
      callback('INITIAL_SESSION', user ? { user } : null);
      
      return { data: { subscription: { unsubscribe: () => {
          const index = authSubscribers.indexOf(callback);
          if (index > -1) authSubscribers.splice(index, 1);
      } } } };
    },
    signInWithPassword: async ({ email, password }: any) => {
      await delay(500);

      const demoUsers: any = {
          'admin@goolzon.com': { id: 'admin-1', role: 'admin', name: 'المدير', username: 'admin' },
          'demo@goolzon.com': { id: 'user-1', role: 'user', name: 'مستخدم تجريبي', username: 'demo' },
      };
      const demoUser = demoUsers[email];

      if (!demoUser || password !== 'password123') {
        return { data: { user: null, session: null }, error: { message: "بيانات الاعتماد غير صالحة. جرب 'demo@goolzon.com' و 'password123'." } };
      }
      
      const user = {
        id: demoUser.id,
        email,
        created_at: new Date().toISOString(),
        user_metadata: {
            name: demoUser.name,
            username: demoUser.username,
            role: demoUser.role,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${demoUser.username}`
        }
      };
      mockStorage.setItem('user_session', user);
      notifyAuthSubscribers('SIGNED_IN', { user });
      return { data: { user, session: { user } }, error: null };
    },
    signUp: async ({ email, password, options }: any) => {
      await delay(500);
      const user = {
        id: `user-${Date.now()}`,
        email,
        created_at: new Date().toISOString(),
        user_metadata: { ...options?.data, role: 'user' }
      };
      mockStorage.setItem('user_session', user);
      notifyAuthSubscribers('SIGNED_IN', { user });
      return { data: { user, session: { user } }, error: null };
    },
    signOut: async () => {
      await delay(100);
      mockStorage.setItem('user_session', null);
      notifyAuthSubscribers('SIGNED_OUT', null);
      return { error: null };
    },
    getUser: async () => {
      await delay(50);
      const user = mockStorage.getItem('user_session');
      return { data: { user }, error: null };
    }
  },
  // This is a very simplified mock of the 'from' query builder needed by the app
  from: (table: string) => ({
      select: (columns = '*') => ({
          eq: (column: string, value: any) => ({
              single: async () => {
                  await delay(50);
                  if (table === 'profiles' && column === 'id') {
                      const user = mockStorage.getItem('user_session');
                      if (user && user.id === value) {
                          return { data: { ...user.user_metadata, id: user.id }, error: null };
                      }
                  }
                  return { data: null, error: { message: 'Not found' } };
              }
          }),
          order: () => ({ data: [], error: null }),
      }),
      update: (data: any) => ({
          eq: async (column: string, value: any) => {
               await delay(100);
               console.log(`[Mock] Updating ${table} where ${column}=${value} with`, data);
               return { data: null, error: null };
          }
      }),
       insert: (data: any) => ({
          select: (cols: string) => ({
              single: async () => {
                  await delay(100);
                  console.log(`[Mock] Inserting into ${table}:`, data);
                  // Mock response for adding a comment
                  return { data: { ...data, id: `new-id-${Date.now()}`, user: { name: 'You', avatar_url: '' } }, error: null };
              }
          })
      })
  }),
  channel: () => ({ on: () => ({ subscribe: () => {} }) }),
  removeChannel: () => {}
};