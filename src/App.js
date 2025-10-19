import React, { useState, useEffect } from 'react';
import { Plus, X, Edit2, Settings, ArrowLeft, Info } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const PurchaseDecisionApp = () => {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    q1: 3,
    q2: 3,
    q3: 3,
    q4: 3,
    q5: 3,
    status: 'Considering'
  });

  const questions = [
    { 
      id: 'q1', 
      text: 'Does this solve a daily problem?', 
      labels: ['No', 'Meh', 'Maybe', 'Probably', 'Yes'],
      descriptions: [
        'No, this doesn\'t fix anything I deal with',
        'It might help occasionally but not really',
        'It would make some things easier',
        'Yes, this would improve my daily routine',
        'Absolutely, I deal with this problem every single day'
      ]
    },
    { 
      id: 'q2', 
      text: 'Is this on my actual written priority list?', 
      labels: ['No', 'Related', 'Thinking', 'On list', 'Top priority'],
      descriptions: [
        'No, I just thought of it today',
        'It\'s related to something on my list',
        'I\'ve been thinking about it but haven\'t written it down',
        'It\'s on my list but not at the top',
        'Yes, it\'s literally on my priority list right now'
      ]
    },
    { 
      id: 'q3', 
      text: 'Will I still be glad I bought this in 3 months?', 
      labels: ['Forget it', 'Maybe', 'Not sure', 'Probably', 'Definitely'],
      descriptions: [
        'Honestly, I\'ll probably forget about it',
        'Maybe? Depends on my mood',
        'I think so, but not sure',
        'Probably yes, seems useful long-term',
        'Definitely, this has lasting value'
      ]
    },
    { 
      id: 'q4', 
      text: 'Can I afford this without stressing about other goals?', 
      labels: ['No', 'Set back', 'Tight', 'Room', 'Easy'],
      descriptions: [
        'No, this would hurt my Eid/emergency savings',
        'I could, but it would set me back',
        'It\'s tight but manageable',
        'Yes, I have room in my budget',
        'Easy, this won\'t impact my other goals at all'
      ]
    },
    { 
      id: 'q5', 
      text: 'Am I buying this for ME or for what others think?', 
      labels: ['For others', 'Mostly others', 'Half', 'Mostly me', 'For me'],
      descriptions: [
        '100% to impress/avoid judgment from others',
        'Mostly for others, a little for me',
        'Half and half, unsure',
        'Mostly for me, but I care a bit what others think',
        'Purely for me, don\'t care what anyone thinks'
      ]
    }
  ];

  // Load data on mount
  useEffect(() => {
    loadItems();
    loadCategories();
  }, []);

  const loadItems = async () => {
    try {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .order('score', { ascending: false });
      
      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error loading items:', error);
      alert('Failed to load items');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setCategories(data?.map(c => c.name) || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const calculateScore = (q1, q2, q3, q4, q5) => {
    return q1 + q2 + q3 + q4 + q5;
  };

  const getRecommendation = (score) => {
    if (score >= 20) return { text: 'Buy it, it\'s solid', color: 'text-green-600' };
    if (score >= 15) return { text: 'Maybe, think about it for a week first', color: 'text-blue-600' };
    if (score >= 10) return { text: 'Probably not, revisit later', color: 'text-yellow-600' };
    return { text: 'This is anxiety shopping, close the tab', color: 'text-red-600' };
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      price: '',
      q1: 3,
      q2: 3,
      q3: 3,
      q4: 3,
      q5: 3,
      status: 'Considering'
    });
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.category || !formData.price) {
      alert('Please fill in all fields');
      return;
    }

    const score = calculateScore(formData.q1, formData.q2, formData.q3, formData.q4, formData.q5);
    
    try {
      if (selectedItem) {
        // Update existing item
        const { error } = await supabase
          .from('items')
          .update({ ...formData, score })
          .eq('id', selectedItem.id);
        
        if (error) throw error;
      } else {
        // Insert new item
        const { error } = await supabase
          .from('items')
          .insert([{ ...formData, score }]);
        
        if (error) throw error;
      }
      
      await loadItems();
      setShowAddModal(false);
      setSelectedItem(null);
      resetForm();
    } catch (error) {
      console.error('Error saving item:', error);
      alert('Failed to save item');
    }
  };

  const handleEdit = (item) => {
    setSelectedItem(item);
    setFormData(item);
    setShowDetailModal(false);
    setShowAddModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        const { error } = await supabase
          .from('items')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
        
        await loadItems();
        setShowDetailModal(false);
      } catch (error) {
        console.error('Error deleting item:', error);
        alert('Failed to delete item');
      }
    }
  };

  const filteredItems = items
    .filter(item => filterStatus === 'all' || item.status === filterStatus)
    .filter(item => filterCategory === 'all' || item.category === filterCategory);

  const [newCategory, setNewCategory] = useState('');

  const addCategory = async () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      try {
        const { error } = await supabase
          .from('categories')
          .insert([{ name: newCategory.trim() }]);
        
        if (error) throw error;
        
        await loadCategories();
        setNewCategory('');
      } catch (error) {
        console.error('Error adding category:', error);
        alert('Failed to add category');
      }
    }
  };

  const deleteCategory = async (cat) => {
    if (window.confirm(`Delete category "${cat}"?`)) {
      try {
        const { error } = await supabase
          .from('categories')
          .delete()
          .eq('name', cat);
        
        if (error) throw error;
        
        await loadCategories();
      } catch (error) {
        console.error('Error deleting category:', error);
        alert('Failed to delete category');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <h1 className="text-xl font-semibold text-gray-900">Purchase Decision Tracker</h1>
          <button
            onClick={() => setShowCategoryModal(true)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <Settings className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex gap-3 max-w-4xl mx-auto">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="all">All Status</option>
            <option value="Considering">Considering</option>
            <option value="Purchased">Purchased</option>
            <option value="Canceled">Canceled</option>
          </select>
          
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Items List */}
      <div className="max-w-4xl mx-auto p-4">
        {filteredItems.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>No items yet. Click the + button to add one.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredItems.map(item => (
              <div
                key={item.id}
                onClick={() => {
                  setSelectedItem(item);
                  setShowDetailModal(true);
                }}
                className="bg-white p-4 rounded-lg border border-gray-200 cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{item.name}</h3>
                    <p className="text-sm text-gray-500">{item.category}</p>
                  </div>
                  <div className="text-right ml-4">
                    <div className="text-2xl font-bold text-gray-900">{item.score}</div>
                    <div className="text-xs text-gray-500">/ 25</div>
                  </div>
                </div>
                <div className="flex justify-between items-center mt-3">
                  <span className="text-sm font-medium text-gray-700">Rp {parseInt(item.price).toLocaleString('id-ID')}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    item.status === 'Purchased' ? 'bg-green-100 text-green-700' :
                    item.status === 'Canceled' ? 'bg-red-100 text-red-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gray-900 text-white rounded-full shadow-lg hover:bg-gray-800 flex items-center justify-center"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-4 overflow-y-auto z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl my-8">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-semibold">{selectedItem ? 'Edit Item' : 'Add New Item'}</h2>
              <button onClick={() => {
                setShowAddModal(false);
                setSelectedItem(null);
                resetForm();
              }}>
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Item Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="e.g., White sneakers"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Select category</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Price (Rp)</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="300000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="Considering">Considering</option>
                  <option value="Purchased">Purchased</option>
                  <option value="Canceled">Canceled</option>
                </select>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h3 className="font-medium text-gray-900 mb-4">Answer These Questions (1-5)</h3>
                
                {questions.map((q, idx) => (
                  <div key={q.id} className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <label className="block text-sm text-gray-700">{idx + 1}. {q.text}</label>
                      <button
                        onClick={() => {
                          setSelectedQuestion(q);
                          setShowInfoModal(true);
                        }}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <Info className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map(num => (
                        <button
                          key={num}
                          onClick={() => setFormData({...formData, [q.id]: num})}
                          className={`flex-1 py-3 rounded-lg border-2 transition-colors ${
                            formData[q.id] === num
                              ? 'border-gray-900 bg-gray-900 text-white'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          <div className="font-bold">{num}</div>
                          <div className="text-xs mt-1">{q.labels[num - 1]}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Total Score</span>
                  <span className="text-2xl font-bold text-gray-900">
                    {calculateScore(formData.q1, formData.q2, formData.q3, formData.q4, formData.q5)} / 25
                  </span>
                </div>
                <p className={`text-sm font-medium ${getRecommendation(calculateScore(formData.q1, formData.q2, formData.q3, formData.q4, formData.q5)).color}`}>
                  {getRecommendation(calculateScore(formData.q1, formData.q2, formData.q3, formData.q4, formData.q5)).text}
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setSelectedItem(null);
                  resetForm();
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
              >
                {selectedItem ? 'Update' : 'Add Item'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-4 overflow-y-auto z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl my-8">
            <div className="p-6 border-b border-gray-200">
              <button 
                onClick={() => setShowDetailModal(false)}
                className="mb-4"
              >
                <ArrowLeft className="w-6 h-6 text-gray-500" />
              </button>
              <h2 className="text-2xl font-semibold">{selectedItem.name}</h2>
              <div className="flex gap-3 mt-2">
                <span className="text-sm text-gray-600">{selectedItem.category}</span>
                <span className="text-sm font-medium">Rp {parseInt(selectedItem.price).toLocaleString('id-ID')}</span>
              </div>
            </div>

            <div className="p-6">
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Total Score</span>
                  <span className="text-3xl font-bold text-gray-900">{selectedItem.score} / 25</span>
                </div>
                <p className={`text-sm font-medium ${getRecommendation(selectedItem.score).color}`}>
                  {getRecommendation(selectedItem.score).text}
                </p>
              </div>

              <h3 className="font-medium text-gray-900 mb-4">Score Breakdown</h3>
              <div className="space-y-4">
                {questions.map((q, idx) => (
                  <div key={q.id} className="border-b border-gray-100 pb-3">
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-700">{idx + 1}. {q.text}</span>
                      <span className="font-bold text-gray-900">{selectedItem[q.id]} / 5</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gray-900 h-2 rounded-full transition-all"
                        style={{ width: `${(selectedItem[q.id] / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => handleDelete(selectedItem.id)}
                className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
              >
                Delete
              </button>
              <button
                onClick={() => handleEdit(selectedItem)}
                className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 flex items-center justify-center gap-2"
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info Modal */}
      {showInfoModal && selectedQuestion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-lg">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold">{selectedQuestion.text}</h2>
              <button onClick={() => setShowInfoModal(false)}>
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-4">Rate from 1-5 based on these descriptions:</p>
              <div className="space-y-3">
                {selectedQuestion.descriptions.map((desc, idx) => (
                  <div key={idx} className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold text-sm">
                      {idx + 1}
                    </div>
                    <p className="text-sm text-gray-700 pt-1">{desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 border-t border-gray-200">
              <button
                onClick={() => setShowInfoModal(false)}
                className="w-full px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Management Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-semibold">Manage Categories</h2>
              <button onClick={() => setShowCategoryModal(false)}>
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addCategory()}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="New category name"
                />
                <button
                  onClick={addCategory}
                  className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
                >
                  Add
                </button>
              </div>

              <div className="space-y-2">
                {categories.map(cat => (
                  <div key={cat} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-900">{cat}</span>
                    <button
                      onClick={() => deleteCategory(cat)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseDecisionApp;