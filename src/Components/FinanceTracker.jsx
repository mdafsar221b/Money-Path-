import React, { useState, useEffect } from 'react';

const FinanceTracker = () => {

  // Helper to get a clean initial data structure
  const getInitialData = () => ({
    currentMonth: new Date().toISOString().slice(0, 7), // 'YYYY-MM' format
    transactions: [],
    categories: ['Udhari', 'Outside', 'Useless'],
    roommates: ['You', 'Ravi'],
    sharedExpenses: [],
    history: [],
  });
  
  // Load data from localStorage or initialize with the new structure
  const loadData = () => {
    try {
      const saved = localStorage.getItem('financeData');
      if (saved) {
        const parsed = JSON.parse(saved);
        // If data is in the old format, migrate it to the new structure
        if (!parsed.hasOwnProperty('currentMonth')) {
          console.log("Old data format detected. Migrating to new structure.");
          const migratedData = getInitialData();
          migratedData.transactions = parsed.transactions || [];
          migratedData.categories = parsed.categories || ['Udhari', 'Outside', 'Useless'];
          migratedData.roommates = parsed.roommates || ['You', 'Ravi'];
          migratedData.sharedExpenses = parsed.sharedExpenses || [];
          return migratedData;
        }
        return parsed;
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
    // Return a fresh slate if no data exists
    return getInitialData();
  };

  const [data, setData] = useState(loadData);
  const [activeTab, setActiveTab] = useState('personal');
  const [expandedHistoryKey, setExpandedHistoryKey] = useState(null); // To track open dropdown in history
  const [expandedCategory, setExpandedCategory] = useState(null); // To track open dropdown in personal tab
  const [expandedRoommate, setExpandedRoommate] = useState(null); // To track open dropdown in shared tab


  // Personal transaction form state
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [newCategory, setNewCategory] = useState('');

  // Shared expense form state
  const [sharedAmount, setSharedAmount] = useState('');
  const [sharedDescription, setSharedDescription] = useState('');
  const [paidBy, setPaidBy] = useState('You');

  // Effect to check if the month has changed on component load
  useEffect(() => {
    const checkAndArchiveMonth = () => {
        const currentMonthStr = new Date().toISOString().slice(0, 7);
        
        // Only run if the stored month is different from the actual current month
        if (data.currentMonth !== currentMonthStr) {
            console.log(`New month detected! Archiving data for ${data.currentMonth}`);
            
            // Do not archive if there are no transactions
            if (data.transactions.length === 0 && data.sharedExpenses.length === 0) {
                 setData(prevData => ({
                    ...prevData,
                    currentMonth: currentMonthStr,
                }));
                return;
            }

            // 1. Calculate summaries for the month that just ended
            const personalTotal = data.transactions.reduce((sum, t) => sum + t.amount, 0);
            const categoryTotals = data.transactions.reduce((acc, t) => {
                acc[t.category] = (acc[t.category] || 0) + t.amount;
                return acc;
            }, {});
            const totalShared = data.sharedExpenses.reduce((sum, e) => sum + e.amount, 0);
            const perPersonShare = data.roommates.length > 0 ? totalShared / data.roommates.length : 0;
            const paidByEach = data.roommates.reduce((acc, roommate) => {
                acc[roommate] = data.sharedExpenses
                    .filter(e => e.paidBy === roommate)
                    .reduce((sum, e) => sum + e.amount, 0);
                return acc;
            }, {});
            const settlements = data.roommates.map(roommate => ({
                name: roommate,
                paid: paidByEach[roommate] || 0,
                balance: (paidByEach[roommate] || 0) - perPersonShare
            }));

            // 2. Create the history entry, now including the raw transaction data
            const historyEntry = {
                month: data.currentMonth,
                personalTotal,
                categoryTotals,
                totalShared,
                settlements,
                transactions: data.transactions,
                sharedExpenses: data.sharedExpenses,
            };

            // 3. Reset for the new month
            setData(prevData => ({
                ...prevData,
                currentMonth: currentMonthStr,
                transactions: [],
                sharedExpenses: [],
                history: [...prevData.history, historyEntry],
            }));
        }
    };

    checkAndArchiveMonth();
    // This effect should only run once on mount after data is loaded.
  }, []);


  // Save to localStorage whenever data changes
  useEffect(() => {
    try {
      localStorage.setItem('financeData', JSON.stringify(data));
    } catch (error) {
      console.error('Error saving data:', error);
    }
  }, [data]);

  // Helper to format 'YYYY-MM' into 'Month Year'
  const formatMonth = (monthStr) => {
    if (!monthStr) return '';
    const date = new Date(monthStr + '-02'); // Using day '02' to avoid timezone issues
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

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
    setAmount(''); setDescription(''); setSelectedCategory(''); setNewCategory('');
  };

  const deleteTransaction = (id) => {
    setData(prev => ({ ...prev, transactions: prev.transactions.filter(t => t.id !== id) }));
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
    setData(prev => ({ ...prev, sharedExpenses: [...prev.sharedExpenses, expense] }));
    setSharedAmount(''); setSharedDescription('');
  };

  const deleteSharedExpense = (id) => {
    setData(prev => ({ ...prev, sharedExpenses: prev.sharedExpenses.filter(e => e.id !== id) }));
  };

  const addRoommate = () => {
    const name = prompt('Enter roommate name:');
    if (name && name.trim() && !data.roommates.includes(name.trim())) {
      setData(prev => ({ ...prev, roommates: [...prev.roommates, name.trim()] }));
    }
  };
  
  const handleHistoryToggle = (key) => {
    setExpandedHistoryKey(prevKey => (prevKey === key ? null : key));
  };

  const handleCategoryToggle = (category) => {
    setExpandedCategory(prevCategory => (prevCategory === category ? null : category));
  };

  const handleRoommateToggle = (name) => {
    setExpandedRoommate(prevName => (prevName === name ? null : name));
  };

  // --- CALCULATIONS FOR CURRENT MONTH ---
  const personalTotal = data.transactions.reduce((sum, t) => sum + t.amount, 0);
  const categoryTotals = data.transactions.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {});
  const totalShared = data.sharedExpenses.reduce((sum, e) => sum + e.amount, 0);
  const perPersonShare = data.roommates.length > 0 ? totalShared / data.roommates.length : 0;
  const paidByEach = data.roommates.reduce((acc, roommate) => {
    acc[roommate] = data.sharedExpenses.filter(e => e.paidBy === roommate).reduce((sum, e) => sum + e.amount, 0);
    return acc;
  }, {});
  const settlements = data.roommates.map(roommate => {
    const paid = paidByEach[roommate] || 0;
    const balance = paid - perPersonShare;
    const amountToSettle = balance < 0 ? Math.abs(balance) * data.roommates.length : 0;
    return { name: roommate, paid, balance, amountToSettle };
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 bg-white min-h-screen">
        <div className="text-center mb-4">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">MoneyPath</h1>
            <p className="text-sm sm:text-base text-gray-600">Expenses for {formatMonth(data.currentMonth)}</p>
        </div>
      
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-4 sm:mb-6">
        <div className="flex space-x-4 sm:space-x-8">
          <button onClick={() => setActiveTab('personal')} className={`py-2 px-1 border-b-2 font-medium text-xs sm:text-sm ${activeTab === 'personal' ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500'}`}>Personal</button>
          <button onClick={() => setActiveTab('shared')} className={`py-2 px-1 border-b-2 font-medium text-xs sm:text-sm ${activeTab === 'shared' ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500'}`}>Shared</button>
          <button onClick={() => setActiveTab('history')} className={`py-2 px-1 border-b-2 font-medium text-xs sm:text-sm ${activeTab === 'history' ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500'}`}>History</button>
        </div>
      </div>

      {/* Personal Expenses Tab */}
      {activeTab === 'personal' && (
        <div>
          <div className="bg-gray-50 p-3 sm:p-4 rounded-lg mb-4 sm:mb-6">
            <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Add Personal Expense</h2>
            <div className="space-y-3">
              <input type="number" placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 text-sm sm:text-base"/>
              <input type="text" placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 text-sm sm:text-base"/>
              <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 text-sm sm:text-base" disabled={!!newCategory}>
                <option value="">Select Category</option>
                {data.categories.map(cat => (<option key={cat} value={cat}>{cat}</option>))}
              </select>
              <input type="text" placeholder="Or new category" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 text-sm sm:text-base"/>
            </div>
            <button onClick={addTransaction} className="w-full mt-4 bg-gray-900 text-white px-4 py-2 rounded text-sm sm:text-base">Add Transaction</button>
          </div>
          <div className="bg-gray-50 p-3 sm:p-4 rounded-lg mb-4 sm:mb-6">
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Current Month Summary</h3>
            <div className="mb-4"><p className="text-lg sm:text-xl font-bold">Total Spent: ₹{personalTotal.toFixed(2)}</p></div>
            <div className="space-y-2">
              {Object.entries(categoryTotals).map(([category, total]) => {
                  const isExpanded = expandedCategory === category;
                  const categoryTransactions = data.transactions.filter(t => t.category === category);
                  return (
                    <div key={category} className="bg-white rounded border">
                      <button onClick={() => handleCategoryToggle(category)} className="w-full flex justify-between items-center p-2 text-sm text-left" disabled={categoryTransactions.length === 0}>
                        <span className="font-medium text-sm sm:text-base">{category}</span>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-sm sm:text-base">₹{total.toFixed(2)}</span>
                          {categoryTransactions.length > 0 && (<svg className={`w-3 h-3 text-gray-500 transform transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>)}
                        </div>
                      </button>
                      {isExpanded && (<div className="pl-4 pr-2 pb-2"><div className="border-l-2 border-gray-200 pl-3 space-y-1 pt-1">{[...categoryTransactions].reverse().map(transaction => (<div key={transaction.id} className="flex justify-between items-center text-xs text-gray-700 py-1"><div className="flex-1 min-w-0"><p className="truncate pr-2">{transaction.description}</p><p className="text-gray-400 text-[10px]">{transaction.date}</p></div><div className="flex items-center flex-shrink-0"><span className="font-mono pr-3">₹{transaction.amount.toFixed(2)}</span><button onClick={() => deleteTransaction(transaction.id)} className="text-red-500 hover:text-red-700"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button></div></div>))}</div></div>)}
                    </div>
                  )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Shared Expenses Tab */}
      {activeTab === 'shared' && (
        <div>
          <div className="bg-gray-50 p-3 sm:p-4 rounded-lg mb-4 sm:mb-6">
            <div className="flex justify-between items-center mb-3 sm:mb-4"><h2 className="text-base sm:text-lg font-semibold">Add Shared Expense</h2><button onClick={addRoommate} className="text-xs sm:text-sm text-gray-600 border border-gray-300 px-2 sm:px-3 py-1 rounded">Add Roommate</button></div>
            <div className="space-y-3">
              <input type="number" placeholder="Amount" value={sharedAmount} onChange={(e) => setSharedAmount(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 text-sm sm:text-base" />
              <input type="text" placeholder="Description" value={sharedDescription} onChange={(e) => setSharedDescription(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 text-sm sm:text-base" />
              <select value={paidBy} onChange={(e) => setPaidBy(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 text-sm sm:text-base">{data.roommates.map(roommate => (<option key={roommate} value={roommate}>{roommate}</option>))}</select>
            </div>
            <button onClick={addSharedExpense} className="w-full mt-4 bg-gray-900 text-white px-4 py-2 rounded text-sm sm:text-base">Add Shared Expense</button>
          </div>
          <div className="bg-gray-50 p-3 sm:p-4 rounded-lg mb-4 sm:mb-6">
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Current Month Settlement</h3>
            <div className="mb-4"><p className="text-base sm:text-lg">Total Shared: ₹{totalShared.toFixed(2)}</p><p className="text-xs sm:text-sm text-gray-600">Per Person: ₹{perPersonShare.toFixed(2)}</p></div>
            <div className="space-y-2">
              {settlements.map(person => {
                const isExpanded = expandedRoommate === person.name;
                const roommateExpenses = data.sharedExpenses.filter(e => e.paidBy === person.name);
                return (
                  <div key={person.name} className="bg-white rounded border">
                    <button onClick={() => handleRoommateToggle(person.name)} className="w-full text-left p-3" disabled={roommateExpenses.length === 0}>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium text-sm sm:text-base">{person.name}</p>
                          <p className="text-xs sm:text-sm text-gray-500">Paid: ₹{person.paid.toFixed(2)}</p>
                           {person.amountToSettle > 0 && (
                            <p className="text-blue-600 font-medium text-xs mt-1">Needs to spend ₹{person.amountToSettle.toFixed(2)} to settle</p>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0 flex items-center">
                          <div>
                            {person.balance > 0 ? (<p className="text-green-600 font-medium text-xs sm:text-sm">Gets back: ₹{person.balance.toFixed(2)}</p>)
                            : person.balance < 0 ? (<p className="text-red-600 font-medium text-xs sm:text-sm">Owes: ₹{Math.abs(person.balance).toFixed(2)}</p>)
                            : (<p className="text-gray-500 font-medium text-xs sm:text-sm">Settled</p>)}
                          </div>
                          {roommateExpenses.length > 0 && (<svg className={`w-3 h-3 ml-2 text-gray-500 transform transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>)}
                        </div>
                      </div>
                    </button>
                    {isExpanded && (
                      <div className="px-3 pb-2">
                         <div className="border-l-2 border-gray-200 pl-3 ml-1 space-y-1">
                          {[...roommateExpenses].reverse().map(expense => (
                            <div key={expense.id} className="flex justify-between items-center text-xs text-gray-700 py-1">
                               <div className="flex-1 min-w-0">
                                  <p className="truncate pr-2">{expense.description}</p>
                                  <p className="text-gray-400 text-[10px]">{expense.date}</p>
                                </div>
                                <div className="flex items-center flex-shrink-0">
                                  <span className="font-mono pr-3">₹{expense.amount.toFixed(2)}</span>
                                  <button onClick={() => deleteSharedExpense(expense.id)} className="text-red-500 hover:text-red-700">
                                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                  </button>
                                </div>
                            </div>
                          ))}
                         </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div>
          <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-800">Expense History</h2>
          {data.history.length === 0 ? (
            <div className="text-center py-10"><p className="text-gray-500">You have no archived months yet.</p><p className="text-gray-400 text-sm">Your first summary will appear here after the current month ends.</p></div>
          ) : (
            <div className="space-y-6">
              {[...data.history].reverse().map(entry => (
                <div key={entry.month} className="bg-gray-50 p-4 rounded-lg border">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3">{formatMonth(entry.month)}</h3>
                  <div className="mb-4">
                    <h4 className="font-semibold mb-2 text-sm sm:text-base">Personal Summary</h4>
                    <div className="mb-2"><p className="text-md sm:text-lg font-bold">Total Spent: ₹{entry.personalTotal.toFixed(2)}</p></div>
                    <div className="space-y-1">
                      {Object.entries(entry.categoryTotals).map(([category, total]) => {
                        const key = `${entry.month}-personal-${category}`;
                        const isExpanded = expandedHistoryKey === key;
                        const categoryTransactions = entry.transactions?.filter(t => t.category === category) || [];
                        return (
                          <div key={category} className="bg-white rounded border">
                            <button onClick={() => handleHistoryToggle(key)} className="w-full flex justify-between items-center p-2 text-sm text-left" disabled={categoryTransactions.length === 0}>
                              <span className="font-medium">{category}</span>
                              <div className="flex items-center space-x-2"><span className="font-semibold">₹{total.toFixed(2)}</span>{categoryTransactions.length > 0 && (<svg className={`w-3 h-3 text-gray-500 transform transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>)}</div>
                            </button>
                            {isExpanded && (<div className="pl-4 pr-2 pb-2"><div className="border-l-2 border-gray-200 pl-3 space-y-1 pt-1">{categoryTransactions.map(transaction => (<div key={transaction.id} className="flex justify-between items-center text-xs text-gray-700"><span className="truncate pr-2">{transaction.description}</span><span className="font-mono flex-shrink-0">₹{transaction.amount.toFixed(2)}</span></div>))}</div></div>)}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2 text-sm sm:text-base">Shared Summary</h4>
                    <p className="text-md sm:text-lg mb-2">Total Shared: ₹{entry.totalShared.toFixed(2)}</p>
                    <div className="space-y-2">
                      {entry.settlements.map(person => {
                          const key = `${entry.month}-shared-${person.name}`;
                          const isExpanded = expandedHistoryKey === key;
                          const roommateExpenses = entry.sharedExpenses?.filter(e => e.paidBy === person.name) || [];
                          return(
                            <div key={person.name} className="bg-white rounded text-sm border">
                              <button onClick={() => handleHistoryToggle(key)} className="w-full flex justify-between items-center p-2 text-left" disabled={roommateExpenses.length === 0}>
                                <div className="flex-1"><p className="font-medium">{person.name}</p><p className="text-xs text-gray-500">Paid: ₹{person.paid.toFixed(2)}</p></div>
                                <div className="text-right flex-shrink-0 flex items-center">
                                  {person.balance > 0 ? (<p className="text-green-600 font-medium">Got back: ₹{person.balance.toFixed(2)}</p>) : person.balance < 0 ? (<p className="text-red-600 font-medium">Owed: ₹{Math.abs(person.balance).toFixed(2)}</p>) : (<p className="text-gray-500 font-medium">Settled</p>)}
                                  {roommateExpenses.length > 0 && (<svg className={`w-3 h-3 ml-2 text-gray-500 transform transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>)}
                                </div>
                              </button>
                              {isExpanded && (<div className="pl-4 pr-2 pb-2"><div className="border-l-2 border-gray-200 pl-3 space-y-1 pt-1">{roommateExpenses.map(expense => (<div key={expense.id} className="flex justify-between items-center text-xs text-gray-700"><span className="truncate pr-2">{expense.description}</span><span className="font-mono flex-shrink-0">₹{expense.amount.toFixed(2)}</span></div>))}</div></div>)}
                            </div>
                          )
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FinanceTracker;

