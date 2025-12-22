import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import Loader from '../Common/Loader';
import '../../styles/components/Transaction.css';

const TransactionHistory = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchTransactions();
  }, [filter, page]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const params = {
        limit: 20,
        offset: page * 20
      };

      if (filter !== 'all') {
        params.type = filter;
      }

      const response = await api.get('/transactions', { params });

      if (response.data.success) {
        const newTransactions = response.data.data;
        
        if (page === 0) {
          setTransactions(newTransactions);
        } else {
          setTransactions(prev => [...prev, ...newTransactions]);
        }

        setHasMore(newTransactions.length === 20);
      }
    } catch (error) {
      toast.error('Failed to load transactions');
      console.error('Fetch transactions error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setPage(0);
    setTransactions([]);
  };

  const loadMore = () => {
    setPage(prev => prev + 1);
  };

  if (loading && page === 0) {
    return <Loader message="Loading transactions..." />;
  }

  return (
    <div className="transaction-history-container">
      <header className="page-header">
        <button onClick={() => navigate('/dashboard')} className="btn-back">
          ← Back
        </button>
        <h1>Transaction History</h1>
      </header>

      <div className="filter-bar">
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => handleFilterChange('all')}
        >
          All
        </button>
        <button
          className={`filter-btn ${filter === 'transfer' ? 'active' : ''}`}
          onClick={() => handleFilterChange('transfer')}
        >
          Transfers
        </button>
        <button
          className={`filter-btn ${filter === 'deposit' ? 'active' : ''}`}
          onClick={() => handleFilterChange('deposit')}
        >
          Deposits
        </button>
        <button
          className={`filter-btn ${filter === 'withdrawal' ? 'active' : ''}`}
          onClick={() => handleFilterChange('withdrawal')}
        >
          Withdrawals
        </button>
      </div>

      <div className="transactions-table">
        {transactions.length === 0 ? (
          <div className="transactions-empty">
            <p>No transactions found</p>
          </div>
        ) : (
          <>
            {transactions.map((transaction) => (
              <div key={transaction.id} className="transaction-row">
                <div className="transaction-cell date">
                  {format(new Date(transaction.created_at), 'MMM dd, yyyy')}
                  <span className="time">
                    {format(new Date(transaction.created_at), 'HH:mm')}
                  </span>
                </div>
                
                <div className="transaction-cell type">
                  <span className={`type-badge ${transaction.transaction_type}`}>
                    {transaction.transaction_type}
                  </span>
                </div>
                
                <div className="transaction-cell account">
                  <p>{transaction.from_account_number || transaction.to_account_number}</p>
                  {transaction.description && (
                    <span className="description">{transaction.description}</span>
                  )}
                </div>
                
                <div className="transaction-cell reference">
                  {transaction.reference_number}
                </div>
                
                <div className="transaction-cell amount">
                  <span className={transaction.transaction_type === 'deposit' ? 'positive' : 'negative'}>
                    {transaction.transaction_type === 'deposit' ? '+' : '-'}
                    ${parseFloat(transaction.amount).toFixed(2)}
                  </span>
                </div>
                
                <div className="transaction-cell status">
                  <span className={`status-badge ${transaction.status}`}>
                    {transaction.status}
                  </span>
                </div>
              </div>
            ))}

            {hasMore && (
              <button
                onClick={loadMore}
                className="btn-load-more"
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Load More'}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default TransactionHistory;