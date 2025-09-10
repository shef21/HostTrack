import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, Brain } from 'lucide-react';
import { memoryApi } from '../services/api';
import { Memory, MemoryCreate } from '../types';

const MemoryManager: React.FC = () => {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<MemoryCreate>({
    title: '',
    content: '',
    category: '',
  });

  useEffect(() => {
    loadMemories();
  }, []);

  const loadMemories = async () => {
    try {
      const data = await memoryApi.getMemories();
      setMemories(data);
    } catch (error) {
      console.error('Error loading memories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await memoryApi.createMemory(formData);
      setFormData({ title: '', content: '', category: '' });
      setShowCreateForm(false);
      loadMemories();
    } catch (error) {
      console.error('Error creating memory:', error);
    }
  };

  const handleUpdateMemory = async (id: string) => {
    try {
      await memoryApi.updateMemory(id, formData);
      setEditingId(null);
      setFormData({ title: '', content: '', category: '' });
      loadMemories();
    } catch (error) {
      console.error('Error updating memory:', error);
    }
  };

  const handleDeleteMemory = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this memory?')) {
      try {
        await memoryApi.deleteMemory(id);
        loadMemories();
      } catch (error) {
        console.error('Error deleting memory:', error);
      }
    }
  };

  const startEdit = (memory: Memory) => {
    setEditingId(memory.id);
    setFormData({
      title: memory.title,
      content: memory.content,
      category: memory.category || '',
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({ title: '', content: '', category: '' });
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="card p-8">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="card-hover">
        {/* Header */}
        <div className="p-6 border-b bg-gradient-to-r from-purple-50 to-pink-50">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Memory Manager</h2>
                <p className="text-gray-600">Store and manage your property-related memories</p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="btn-primary flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Memory</span>
            </button>
          </div>
        </div>

        {/* Create Form */}
        {showCreateForm && (
          <div className="p-6 border-b bg-gray-50">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Memory</h3>
            <form onSubmit={handleCreateMemory} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Content
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category (optional)
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div className="flex space-x-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                >
                  Save Memory
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Memories List */}
        <div className="p-6">
          {memories.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No memories yet. Create your first memory!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {memories.map((memory) => (
                <div key={memory.id} className="border border-gray-200 rounded-lg p-4">
                  {editingId === memory.id ? (
                    <div className="space-y-4">
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-medium"
                      />
                      <textarea
                        value={formData.content}
                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                      <input
                        type="text"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        placeholder="Category (optional)"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleUpdateMemory(memory.id)}
                          className="flex items-center px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                        >
                          <Save className="w-4 h-4 mr-1" />
                          Save
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="flex items-center px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
                        >
                          <X className="w-4 h-4 mr-1" />
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg font-medium text-gray-900">{memory.title}</h3>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => startEdit(memory)}
                            className="p-1 text-gray-400 hover:text-gray-600"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteMemory(memory.id)}
                            className="p-1 text-gray-400 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      {memory.category && (
                        <span className="inline-block px-2 py-1 text-xs font-medium bg-primary-100 text-primary-800 rounded-full mb-2">
                          {memory.category}
                        </span>
                      )}
                      <p className="text-gray-700 whitespace-pre-wrap">{memory.content}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        Created: {new Date(memory.created_at).toLocaleDateString()}
                        {memory.updated_at !== memory.created_at && (
                          <span> • Updated: {new Date(memory.updated_at).toLocaleDateString()}</span>
                        )}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MemoryManager;
