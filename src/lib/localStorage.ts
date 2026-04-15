import { Task, User } from '../types';

// 本地存储键名
const STORAGE_KEYS = {
  USER: 'task-manager-user',
  TASKS: 'task-manager-tasks',
  TASK_HISTORY: 'task-manager-task-history',
};

// 模拟认证服务
export const auth = {
  // 注册
  signUp: async ({ email, password }: { email: string; password: string }) => {
    // 检查用户是否已存在
    const existingUser = localStorage.getItem(STORAGE_KEYS.USER);
    if (existingUser) {
      return { error: { message: '用户已存在' } };
    }

    // 创建新用户
    const user: User = {
      id: `user-${Date.now()}`,
      email,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.TASK_HISTORY, JSON.stringify([]));

    return { data: { user } };
  },

  // 登录
  signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
    const userStr = localStorage.getItem(STORAGE_KEYS.USER);
    if (!userStr) {
      return { error: { message: '用户不存在' } };
    }

    const user = JSON.parse(userStr);
    // 简单验证，实际应用中应该验证密码
    if (user.email === email) {
      return { data: { user } };
    } else {
      return { error: { message: '邮箱或密码错误' } };
    }
  },

  // 登出
  signOut: async () => {
    localStorage.removeItem(STORAGE_KEYS.USER);
    return { error: null };
  },

  // 获取当前用户
  getUser: async () => {
    const userStr = localStorage.getItem(STORAGE_KEYS.USER);
    if (userStr) {
      return { data: { user: JSON.parse(userStr) } };
    } else {
      return { data: { user: null } };
    }
  },

  // 监听认证状态变化
  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    // 模拟认证状态变化
    const userStr = localStorage.getItem(STORAGE_KEYS.USER);
    const session = userStr ? { user: JSON.parse(userStr) } : null;
    callback('INITIAL_SESSION', session);

    // 监听存储变化
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEYS.USER) {
        const session = e.newValue ? { user: JSON.parse(e.newValue) } : null;
        callback(e.newValue ? 'SIGNED_IN' : 'SIGNED_OUT', session);
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return { data: { subscription: { unsubscribe: () => window.removeEventListener('storage', handleStorageChange) } } };
  },
};

// 模拟任务服务
export const tasks = {
  // 获取任务列表
  select: () => {
    return {
      eq: (field: string, value: string) => {
        return {
          order: (column: string, options: { ascending: boolean }) => {
            return {
              async execute() {
                const tasksStr = localStorage.getItem(STORAGE_KEYS.TASKS);
                const tasks = tasksStr ? JSON.parse(tasksStr) : [];
                // 过滤任务
                const filteredTasks = tasks.filter((task: Task) => task[field] === value);
                // 排序
                filteredTasks.sort((a: Task, b: Task) => {
                  if (a[column] < b[column]) return options.ascending ? -1 : 1;
                  if (a[column] > b[column]) return options.ascending ? 1 : -1;
                  return 0;
                });
                return { data: filteredTasks, error: null };
              },
            };
          },
          async execute() {
            const tasksStr = localStorage.getItem(STORAGE_KEYS.TASKS);
            const tasks = tasksStr ? JSON.parse(tasksStr) : [];
            const filteredTasks = tasks.filter((task: Task) => task[field] === value);
            return { data: filteredTasks, error: null };
          },
        };
      },
      order: (column: string, options: { ascending: boolean }) => {
        return {
          async execute() {
            const tasksStr = localStorage.getItem(STORAGE_KEYS.TASKS);
            const tasks = tasksStr ? JSON.parse(tasksStr) : [];
            // 排序
            tasks.sort((a: Task, b: Task) => {
              if (a[column] < b[column]) return options.ascending ? -1 : 1;
              if (a[column] > b[column]) return options.ascending ? 1 : -1;
              return 0;
            });
            return { data: tasks, error: null };
          },
        };
      },
      async execute() {
        const tasksStr = localStorage.getItem(STORAGE_KEYS.TASKS);
        const tasks = tasksStr ? JSON.parse(tasksStr) : [];
        return { data: tasks, error: null };
      },
    };
  },

  // 插入任务
  insert: async (task: Partial<Task>) => {
    const tasksStr = localStorage.getItem(STORAGE_KEYS.TASKS);
    const tasks = tasksStr ? JSON.parse(tasksStr) : [];
    
    const newTask: Task = {
      id: `task-${Date.now()}`,
      user_id: task.user_id!,
      title: task.title!,
      description: task.description || '',
      priority: task.priority || 'medium',
      due_date: task.due_date || null,
      status: task.status || 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    tasks.push(newTask);
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));

    return { data: [newTask], error: null };
  },

  // 更新任务
  update: (updates: Partial<Task>) => {
    return {
      eq: (field: string, value: string) => {
        return {
          async execute() {
            const tasksStr = localStorage.getItem(STORAGE_KEYS.TASKS);
            const tasks = tasksStr ? JSON.parse(tasksStr) : [];
            
            const updatedTasks = tasks.map((task: Task) => {
              if (task[field] === value) {
                return {
                  ...task,
                  ...updates,
                  updated_at: new Date().toISOString(),
                };
              }
              return task;
            });

            localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(updatedTasks));
            return { data: updatedTasks, error: null };
          },
        };
      },
    };
  },

  // 删除任务
  delete: () => {
    return {
      eq: (field: string, value: string) => {
        return {
          async execute() {
            const tasksStr = localStorage.getItem(STORAGE_KEYS.TASKS);
            const tasks = tasksStr ? JSON.parse(tasksStr) : [];
            
            const filteredTasks = tasks.filter((task: Task) => task[field] !== value);
            localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(filteredTasks));
            return { data: null, error: null };
          },
        };
      },
    };
  },
};

// 模拟Supabase客户端
export const supabase = {
  auth,
  from: (table: string) => {
    if (table === 'tasks') {
      return tasks;
    }
    return {} as any;
  },
};