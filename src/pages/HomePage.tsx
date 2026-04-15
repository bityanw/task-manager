import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Task } from '../types';

const HomePage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'due_date' | 'priority' | 'status'>('due_date');
  const [filter, setFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTask, setNewTask] = useState<{
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    due_date: string;
    status: 'pending' | 'in_progress' | 'completed';
  }>({
    title: '',
    description: '',
    priority: 'medium',
    due_date: '',
    status: 'pending',
  });

  useEffect(() => {
    fetchTasks();
  }, [sortBy, filter]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let query = supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id);

      // 应用过滤器
      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      // 应用排序
      query = query.order(sortBy, { ascending: true });

      const { data, error } = await query;
      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('获取任务失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from('tasks').insert({
        ...newTask,
        user_id: user.id,
      });
      if (error) throw error;

      setShowAddModal(false);
      setNewTask({
        title: '',
        description: '',
        priority: 'medium',
        due_date: '',
        status: 'pending',
      });
      fetchTasks();
    } catch (error) {
      console.error('添加任务失败:', error);
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: 'completed' })
        .eq('id', taskId);
      if (error) throw error;
      fetchTasks();
    } catch (error) {
      console.error('更新任务状态失败:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-blue-600">任务管理</h1>
            </div>
            <div className="flex items-center">
              <button
                onClick={async () => {
                  await supabase.auth.signOut();
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                登出
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* 侧边栏分类导航 */}
          <div className="lg:w-1/4">
            <div className="bg-white rounded-lg shadow-md p-4">
              <h2 className="text-lg font-semibold mb-4">任务分类</h2>
              <div className="space-y-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`w-full text-left px-4 py-2 rounded-md ${filter === 'all' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}
                >
                  全部任务
                </button>
                <button
                  onClick={() => setFilter('pending')}
                  className={`w-full text-left px-4 py-2 rounded-md ${filter === 'pending' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}
                >
                  待处理
                </button>
                <button
                  onClick={() => setFilter('in_progress')}
                  className={`w-full text-left px-4 py-2 rounded-md ${filter === 'in_progress' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}
                >
                  进行中
                </button>
                <button
                  onClick={() => setFilter('completed')}
                  className={`w-full text-left px-4 py-2 rounded-md ${filter === 'completed' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}
                >
                  已完成
                </button>
              </div>

              <h2 className="text-lg font-semibold mt-6 mb-4">排序方式</h2>
              <div className="space-y-2">
                <button
                  onClick={() => setSortBy('due_date')}
                  className={`w-full text-left px-4 py-2 rounded-md ${sortBy === 'due_date' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}
                >
                  截止日期
                </button>
                <button
                  onClick={() => setSortBy('priority')}
                  className={`w-full text-left px-4 py-2 rounded-md ${sortBy === 'priority' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}
                >
                  优先级
                </button>
                <button
                  onClick={() => setSortBy('status')}
                  className={`w-full text-left px-4 py-2 rounded-md ${sortBy === 'status' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}
                >
                  状态
                </button>
              </div>
            </div>
          </div>

          {/* 任务列表 */}
          <div className="lg:w-3/4">
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">任务列表</h2>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  添加任务
                </button>
              </div>

              {loading ? (
                <div className="flex justify-center py-10">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : tasks.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  暂无任务
                </div>
              ) : (
                <div className="space-y-4">
                  {tasks.map((task) => (
                    <div key={task.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm">
                      <div className="flex justify-between items-start">
                        <h3 className="text-md font-medium">{task.title}</h3>
                        <div className="flex gap-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(task.status)}`}>
                            {task.status === 'pending' ? '待处理' : task.status === 'in_progress' ? '进行中' : '已完成'}
                          </span>
                          <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(task.priority)}`}>
                            {task.priority === 'high' ? '高' : task.priority === 'medium' ? '中' : '低'}优先级
                          </span>
                        </div>
                      </div>
                      {task.description && (
                        <p className="text-sm text-gray-600 mt-2">{task.description}</p>
                      )}
                      <div className="flex justify-between items-center mt-4">
                        {task.due_date && (
                          <span className="text-sm text-gray-500">
                            截止日期: {new Date(task.due_date).toLocaleDateString()}
                          </span>
                        )}
                        {task.status !== 'completed' && (
                          <button
                            onClick={() => handleCompleteTask(task.id)}
                            className="px-3 py-1 bg-green-500 text-white text-sm rounded-md hover:bg-green-600"
                          >
                            标记为完成
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 添加任务模态框 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">添加新任务</h2>
            <form onSubmit={handleAddTask} className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  标题
                </label>
                <input
                  type="text"
                  id="title"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  描述
                </label>
                <textarea
                  id="description"
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                ></textarea>
              </div>
              <div>
                <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
                  优先级
                </label>
                <select
                  id="priority"
                  value={newTask.priority}
                  onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as 'low' | 'medium' | 'high' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">低</option>
                  <option value="medium">中</option>
                  <option value="high">高</option>
                </select>
              </div>
              <div>
                <label htmlFor="due_date" className="block text-sm font-medium text-gray-700 mb-1">
                  截止日期
                </label>
                <input
                  type="date"
                  id="due_date"
                  value={newTask.due_date}
                  onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;