import React from 'react';
import '../../styles/components/Dashboard.css';

const AccountCard = ({ account, isSelected, onClick }) => {
  const getAccountTypeIcon = (type) => {
    switch (type) {
      case 'savings':
        return '🏦';
      case 'checking':
        return '💳';
      case 'business':
        return '💼';
      default:
        return '💰';
    }
  };

  const getAccountTypeColor = (type) => {
    switch (type) {
      case 'savings':
        return '#667eea';
      case 'checking':
        return '#f093fb';
      case 'business':
        return '#4facfe';
      default:
        return '#43e97b';
    }
  };

  return (
    <div
      className={`account-card ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
      style={{
        borderLeft: `4px solid ${getAccountTypeColor(account.account_type)}`
      }}
    >
      <div className="account-card-header">
        <span className="account-icon">{getAccountTypeIcon(account.account_type)}</span>
        <span className="account-type">{account.account_type}</span>
      </div>
      
      <div className="account-card-body">
        <p className="account-number">{account.account_number}</p>
        <h3 className="account-balance">
          ${parseFloat(account.balance).toFixed(2)}
          <span className="currency">{account.currency}</span>
        </h3>
      </div>
      
      <div className="account-card-footer">
        <span className={`account-status status-${account.status}`}>
          {account.status}
        </span>
      </div>
    </div>
  );
};

export default AccountCard;