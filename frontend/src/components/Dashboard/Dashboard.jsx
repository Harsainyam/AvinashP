import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import api from '../../services/api';
import AccountCard from './AccountCard';
import TransactionList from './TransactionList';
import TransferForm from '../Transaction/TransferForm';
import Notification from '../Common/Notification';
import Loader from '../Common/Loader';
import { toast } from 'react-toastify';
import '../../styles/components/Dashboard.css';

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [accounts, setAccounts] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch accounts
      const accountsResponse = await api.get('/accounts?fresh=true');
      if (accountsResponse.data.success) {
        setAccounts(accountsResponse.data.data);
        if (accountsResponse.data.data.length > 0) {
          setSelectedAccount(accountsResponse.data.data[0]);
        }
      }

      // Fetch recent transactions
      const transactionsResponse = await api.get('/transactions?limit=10');
      if (transactionsResponse.data.success) {
        setRecentTransactions(transactionsResponse.data.data);
      }

    } catch (error) {
      console.error('Dashboard fetch error:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
    toast.success('Dashboard refreshed');
  };

  const handleTransferSuccess = () => {
    setShowTransferModal(false);
    fetchDashboardData();
  };

  if (loading) {
    return <Loader message="Loading dashboard..." />;
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <h1 className="dashboard-logo">🏦 Credora</h1>
        </div>
        <div className="header-right">
          <button
            className="btn-icon"
            onClick={handleRefresh}
            disabled={refreshing}
            title="Refresh"
          >
            {refreshing ? '⟳' : '↻'}
          </button>
          <Notification />
          <div className="user-menu">
            <button className="user-button">
              <span className="user-avatar">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </span>
              <span className="user-name">
                {user?.firstName} {user?.lastName}
              </span>
            </button>
            <div className="user-dropdown">
              <button onClick={() => navigate('/profile')}>Profile</button>
              <button onClick={() => navigate('/settings')}>Settings</button>
              <button onClick={logout} className="logout-btn">Logout</button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-main">
        <div className="dashboard-welcome">
          <h2>Welcome back, {user?.firstName}!</h2>
          <p>Manage your accounts and transactions</p>
        </div>

        {/* Accounts Section */}
        <section className="dashboard-section">
          <div className="section-header">
            <h3>Your Accounts</h3>
            <button className="btn-primary" onClick={() => setShowTransferModal(true)}>
              💸 New Transfer
            </button>
          </div>
          
          <div className="accounts-grid">
            {accounts.map(account => (
              <AccountCard
                key={account.id}
                account={account}
                isSelected={selectedAccount?.id === account.id}
                onClick={() => setSelectedAccount(account)}
              />
            ))}
          </div>
        </section>

        {/* Recent Transactions */}
        <section className="dashboard-section">
          <div className="section-header">
            <h3>Recent Transactions</h3>
            <button
              className="btn-link"
              onClick={() => navigate('/transactions')}
            >
              View All →
            </button>
          </div>
          
          <TransactionList transactions={recentTransactions} />
        </section>

        {/* Quick Stats */}
        <section className="dashboard-section">
          <h3>Quick Stats</h3>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">💰</div>
              <div className="stat-content">
                <p className="stat-label">Total Balance</p>
                <h4 className="stat-value">
                  ${accounts.reduce((sum, acc) => sum + parseFloat(acc.balance), 0).toFixed(2)}
                </h4>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">📊</div>
              <div className="stat-content">
                <p className="stat-label">Transactions</p>
                <h4 className="stat-value">{recentTransactions.length}</h4>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">🏦</div>
              <div className="stat-content">
                <p className="stat-label">Active Accounts</p>
                <h4 className="stat-value">{accounts.length}</h4>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="modal-overlay" onClick={() => setShowTransferModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>New Transfer</h3>
              <button
                className="modal-close"
                onClick={() => setShowTransferModal(false)}
              >
                ×
              </button>
            </div>
            <TransferForm
              accounts={accounts}
              selectedAccount={selectedAccount}
              onSuccess={handleTransferSuccess}
              onCancel={() => setShowTransferModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;