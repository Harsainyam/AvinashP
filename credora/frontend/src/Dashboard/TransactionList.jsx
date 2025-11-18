import React from 'react';
import { format } from 'date-fns';
import '../../styles/components/Dashboard.css';

const TransactionList = ({ transactions }) => {
  const getTransactionIcon = (type) => {
    switch (type) {
      case 'transfer':
        return '💸';
      case 'deposit':
        return '📥';
      case 'withdrawal':
        return '📤';
      case 'payment':
        return '💳';
      default:
        return '💰';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return '#10b981';
      case 'pending':
        return '#f59e0b';
      case 'failed':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  if (transactions.length === 0) {
    return (
      <div className="transactions-empty">
        <p>No transactions yet</p>
      </div>
    );
  }

  return (
    <div className="transactions-list">
      {transactions.map((transaction) => (
        <div key={transaction.id} className="transaction-item">
          <div className="transaction-icon">
            {getTransactionIcon(transaction.transaction_type)}
          </div>
          
          <div className="transaction-details">
            <p className="transaction-type">
              {transaction.transaction_type.charAt(0).toUpperCase() + 
               transaction.transaction_type.slice(1)}
            </p>
            <p className="transaction-account">
              {transaction.to_account_number || transaction.from_account_number}
            </p>
            <p className="transaction-date">
              {format(new Date(transaction.created_at), 'MMM dd, yyyy HH:mm')}
            </p>
          </div>
          
          <div className="transaction-amount">
            <p className={`amount ${transaction.transaction_type === 'deposit' ? 'positive' : 'negative'}`}>
              {transaction.transaction_type === 'deposit' ? '+' : '-'}
              ${parseFloat(transaction.amount).toFixed(2)}
            </p>
            <span
              className="transaction-status"
              style={{ color: getStatusColor(transaction.status) }}
            >
              {transaction.status}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TransactionList;