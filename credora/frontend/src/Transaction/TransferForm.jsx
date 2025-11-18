import React, { useState } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';
import Loader from '../Common/Loader';
import '../../styles/components/Transaction.css';

const TransferForm = ({ accounts, selectedAccount, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    fromAccountId: selectedAccount?.id || '',
    toAccountNumber: '',
    amount: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.fromAccountId) {
      newErrors.fromAccountId = 'Please select source account';
    }

    if (!formData.toAccountNumber) {
      newErrors.toAccountNumber = 'Destination account is required';
    } else if (formData.toAccountNumber.length < 10) {
      newErrors.toAccountNumber = 'Invalid account number';
    }

    if (!formData.amount) {
      newErrors.amount = 'Amount is required';
    } else if (parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }

    // Check sufficient balance
    const selectedAcc = accounts.find(acc => acc.id === formData.fromAccountId);
    if (selectedAcc && parseFloat(formData.amount) > parseFloat(selectedAcc.balance)) {
      newErrors.amount = 'Insufficient balance';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/transactions', {
        fromAccountId: formData.fromAccountId,
        toAccountNumber: formData.toAccountNumber,
        amount: parseFloat(formData.amount),
        description: formData.description
      });

      if (response.data.success) {
        toast.success('Transfer successful!');
        onSuccess();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Transfer failed');
      console.error('Transfer error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loader message="Processing transfer..." fullScreen={false} />;
  }

  const selectedAcc = accounts.find(acc => acc.id === formData.fromAccountId);

  return (
    <form onSubmit={handleSubmit} className="transfer-form">
      <div className="form-group">
        <label htmlFor="fromAccountId">From Account</label>
        <select
          id="fromAccountId"
          name="fromAccountId"
          value={formData.fromAccountId}
          onChange={handleChange}
          className={errors.fromAccountId ? 'error' : ''}
        >
          <option value="">Select account</option>
          {accounts.map(account => (
            <option key={account.id} value={account.id}>
              {account.account_type} - ****{account.account_number.slice(-4)} 
              (${parseFloat(account.balance).toFixed(2)})
            </option>
          ))}
        </select>
        {errors.fromAccountId && (
          <span className="error-message">{errors.fromAccountId}</span>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="toAccountNumber">To Account Number</label>
        <input
          type="text"
          id="toAccountNumber"
          name="toAccountNumber"
          value={formData.toAccountNumber}
          onChange={handleChange}
          className={errors.toAccountNumber ? 'error' : ''}
          placeholder="Enter recipient account number"
          maxLength="20"
        />
        {errors.toAccountNumber && (
          <span className="error-message">{errors.toAccountNumber}</span>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="amount">Amount</label>
        <input
          type="number"
          id="amount"
          name="amount"
          value={formData.amount}
          onChange={handleChange}
          className={errors.amount ? 'error' : ''}
          placeholder="0.00"
          step="0.01"
          min="0.01"
        />
        {errors.amount && (
          <span className="error-message">{errors.amount}</span>
        )}
        {selectedAcc && (
          <p className="form-hint">
            Available balance: ${parseFloat(selectedAcc.balance).toFixed(2)}
          </p>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="description">Description (Optional)</label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Add a note..."
          rows="3"
          maxLength="200"
        />
      </div>

      <div className="form-actions">
        <button type="button" onClick={onCancel} className="btn-secondary">
          Cancel
        </button>
        <button type="submit" className="btn-primary">
          Transfer ${formData.amount || '0.00'}
        </button>
      </div>
    </form>
  );
};

export default TransferForm;