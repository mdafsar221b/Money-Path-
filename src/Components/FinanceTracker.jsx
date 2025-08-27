import React, { useState, useEffect } from 'react';

const FinanceTracker = () => {
  // Load data from localStorage or initialize empty state
  const loadData = () => {
    try {
      const saved = localStorage.getItem('financeData');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
    return {
      transactions: [],
      categories: ['Udhari', 'Outside', 'Useless'],
      roommates: ['You', 'Ravi'],
      sharedExpenses: []
    };
  };

  const [data, setData] = useState(loadData);
  const [activeTab, setActiveTab] = useState('personal');

  // Personal transaction form
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [newCategory, setNewCategory] = useState('');

  // Shared expense form
  const [sharedAmount, setSharedAmount] = useState('');
  const [sharedDescription, setSharedDescription] = useState('');
  const [paidBy, setPaidBy] = useState('You');

  // Save to localStorage whenever data changes
  useEffect(() => {
    try {
      localStorage.setItem('financeData', JSON.stringify(data));
    } catch (error) {
      console.error('Error saving data:', error);
    }
  }, [data]);

  const addTransaction = () => {
    if (!amount || !description) return;
    
    const category = newCategory.trim() || selectedCategory;
    if (!category) return;

    const transaction = {
      id: Date.now(),
      amount: parseFloat(amount),
      description: description.trim(),
      category,
      date: new Date().toLocaleDateString()
    };

    setData(prev => ({
      ...prev,
      transactions: [...prev.transactions, transaction],
      categories: newCategory.trim() && !prev.categories.includes(newCategory.trim()) 
        ? [...prev.categories, newCategory.trim()] 
        : prev.categories
    }));

    // Reset form
    setAmount('');
    setDescription('');
    setSelectedCategory('');
    setNewCategory('');
  };

  const deleteTransaction = (id) => {
    setData(prev => ({
      ...prev,
      transactions: prev.transactions.filter(t => t.id !== id)
    }));
  };

  const addSharedExpense = () => {
    if (!sharedAmount || !sharedDescription) return;

    const expense = {
      id: Date.now(),
      amount: parseFloat(sharedAmount),
      description: sharedDescription.trim(),
      paidBy,
      date: new Date().toLocaleDateString()
    };

    setData(prev => ({
      ...prev,
      sharedExpenses: [...prev.sharedExpenses, expense]
    }));

    setSharedAmount('');
    setSharedDescription('');
  };

  const deleteSharedExpense = (id) => {
    setData(prev => ({
      ...prev,
      sharedExpenses: prev.sharedExpenses.filter(e => e.id !== id)
    }));
  };

  const addRoommate = () => {
    const name = prompt('Enter roommate name:');
    if (name && name.trim() && !data.roommates.includes(name.trim())) {
      setData(prev => ({
        ...prev,
        roommates: [...prev.roommates, name.trim()]
      }));
    }
  };

  // Calculate totals
  const personalTotal = data.transactions.reduce((sum, t) => sum + t.amount, 0);
  
  const categoryTotals = data.transactions.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {});

  // Calculate shared expense settlements
  const totalShared = data.sharedExpenses.reduce((sum, e) => sum + e.amount, 0);
  const perPersonShare = totalShared / data.roommates.length;
  
  const paidByEach = data.roommates.reduce((acc, roommate) => {
    acc[roommate] = data.sharedExpenses
      .filter(e => e.paidBy === roommate)
      .reduce((sum, e) => sum + e.amount, 0);
    return acc;
  }, {});

  const settlements = data.roommates.map(roommate => ({
    name: roommate,
    paid: paidByEach[roommate] || 0,
    owes: perPersonShare,
    balance: (paidByEach[roommate] || 0) - perPersonShare
  }));

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 bg-white min-h-screen">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-900">Finance Tracker</h1>
      
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-4 sm:mb-6">
        <div className="flex space-x-4 sm:space-x-8">
          <button
            onClick={() => setActiveTab('personal')}
            className={`py-2 px-1 border-b-2 font-medium text-xs sm:text-sm ${
              activeTab === 'personal'
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500'
            }`}
          >
            Personal Expenses
          </button>
          <button
            onClick={() => setActiveTab('shared')}
            className={`py-2 px-1 border-b-2 font-medium text-xs sm:text-sm ${
              activeTab === 'shared'
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500'
            }`}
          >
            Shared Expenses
          </button>
        </div>
      </div>

      {/* Personal Expenses Tab */}
      {activeTab === 'personal' && (
        <div>
          {/* Add Transaction Form */}
          <div className="bg-gray-50 p-3 sm:p-4 rounded-lg mb-4 sm:mb-6">
            <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Add Personal Expense</h2>
            <div className="space-y-3">
              <input
                type="number"
                placeholder="Amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm sm:text-base"
              />
              <input
                type="text"
                placeholder="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm sm:text-base"
              />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm sm:text-base"
                disabled={!!newCategory}
              >
                <option value="">Select Category</option>
                {data.categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Or new category"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm sm:text-base"
              />
            </div>
            <button
              onClick={addTransaction}
              className="w-full mt-4 bg-gray-900 text-white px-4 py-2 rounded text-sm sm:text-base"
            >
              Add Transaction
            </button>
          </div>

          {/* Personal Summary */}
          <div className="bg-gray-50 p-3 sm:p-4 rounded-lg mb-4 sm:mb-6">
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Summary</h3>
            <div className="mb-4">
              <p className="text-lg sm:text-xl font-bold">Total Spent: ₹{personalTotal.toFixed(2)}</p>
            </div>
            <div className="space-y-2">
              {Object.entries(categoryTotals).map(([category, total]) => (
                <div key={category} className="flex justify-between items-center p-2 bg-white rounded border">
                  <span className="font-medium text-sm sm:text-base">{category}</span>
                  <span className="font-bold text-sm sm:text-base">₹{total.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Transaction List */}
          <div>
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Recent Transactions</h3>
            {data.transactions.length === 0 ? (
              <p className="text-gray-500 text-sm sm:text-base">No transactions yet</p>
            ) : (
              <div className="space-y-2">
                {[...data.transactions].reverse().map(transaction => (
                  <div key={transaction.id} className="flex justify-between items-center p-3 border border-gray-200 rounded">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm sm:text-base truncate">{transaction.description}</p>
                      <p className="text-xs sm:text-sm text-gray-500">{transaction.category} • {transaction.date}</p>
                    </div>
                    <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0 ml-2">
                      <span className="font-bold text-sm sm:text-base">₹{transaction.amount.toFixed(2)}</span>
                      <button
                        onClick={() => deleteTransaction(transaction.id)}
                        className="text-red-600 hover:text-red-800 text-xs sm:text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Shared Expenses Tab */}
      {activeTab === 'shared' && (
        <div>
          {/* Add Shared Expense Form */}
          <div className="bg-gray-50 p-3 sm:p-4 rounded-lg mb-4 sm:mb-6">
            <div className="flex justify-between items-center mb-3 sm:mb-4">
              <h2 className="text-base sm:text-lg font-semibold">Add Shared Expense</h2>
              <button
                onClick={addRoommate}
                className="text-xs sm:text-sm text-gray-600 border border-gray-300 px-2 sm:px-3 py-1 rounded"
              >
                Add Roommate
              </button>
            </div>
            <div className="space-y-3">
              <input
                type="number"
                placeholder="Amount"
                value={sharedAmount}
                onChange={(e) => setSharedAmount(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm sm:text-base"
              />
              <input
                type="text"
                placeholder="Description"
                value={sharedDescription}
                onChange={(e) => setSharedDescription(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm sm:text-base"
              />
              <select
                value={paidBy}
                onChange={(e) => setPaidBy(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm sm:text-base"
              >
                {data.roommates.map(roommate => (
                  <option key={roommate} value={roommate}>{roommate}</option>
                ))}
              </select>
            </div>
            <button
              onClick={addSharedExpense}
              className="w-full mt-4 bg-gray-900 text-white px-4 py-2 rounded text-sm sm:text-base"
            >
              Add Shared Expense
            </button>
          </div>

          {/* Settlement Summary */}
          <div className="bg-gray-50 p-3 sm:p-4 rounded-lg mb-4 sm:mb-6">
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Settlement Summary</h3>
            <div className="mb-4">
              <p className="text-base sm:text-lg">Total Shared: ₹{totalShared.toFixed(2)}</p>
              <p className="text-xs sm:text-sm text-gray-600">Per Person: ₹{perPersonShare.toFixed(2)}</p>
            </div>
            <div className="space-y-3">
              {settlements.map(person => (
                <div key={person.name} className="flex justify-between items-center p-3 border border-gray-200 rounded">
                  <div className="flex-1">
                    <p className="font-medium text-sm sm:text-base">{person.name}</p>
                    <p className="text-xs sm:text-sm text-gray-500">Paid: ₹{person.paid.toFixed(2)}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {person.balance > 0 ? (
                      <p className="text-green-600 font-medium text-xs sm:text-sm">Gets back: ₹{person.balance.toFixed(2)}</p>
                    ) : person.balance < 0 ? (
                      <p className="text-red-600 font-medium text-xs sm:text-sm">Owes: ₹{Math.abs(person.balance).toFixed(2)}</p>
                    ) : (
                      <p className="text-gray-500 font-medium text-xs sm:text-sm">Settled</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Shared Expense List */}
          <div>
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Shared Expenses</h3>
            {data.sharedExpenses.length === 0 ? (
              <p className="text-gray-500 text-sm sm:text-base">No shared expenses yet</p>
            ) : (
              <div className="space-y-2">
                {[...data.sharedExpenses].reverse().map(expense => (
                  <div key={expense.id} className="flex justify-between items-center p-3 border border-gray-200 rounded">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm sm:text-base truncate">{expense.description}</p>
                      <p className="text-xs sm:text-sm text-gray-500">Paid by {expense.paidBy} • {expense.date}</p>
                    </div>
                    <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0 ml-2">
                      <span className="font-bold text-sm sm:text-base">₹{expense.amount.toFixed(2)}</span>
                      <button
                        onClick={() => deleteSharedExpense(expense.id)}
                        className="text-red-600 hover:text-red-800 text-xs sm:text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FinanceTracker;