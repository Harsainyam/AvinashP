// LocalStorage for JWT token
export const setToken = (token) => {
  localStorage.setItem('credora_token', token);
};

export const getToken = () => {
  return localStorage.getItem('credora_token');
};

export const removeToken = () => {
  localStorage.removeItem('credora_token');
};

// SessionStorage for OTP (temporary)
export const setOTPSession = (userId, email) => {
  sessionStorage.setItem('credora_otp_session', JSON.stringify({ userId, email }));
};

export const getOTPSession = () => {
  const session = sessionStorage.getItem('credora_otp_session');
  return session ? JSON.parse(session) : null;
};

export const removeOTPSession = () => {
  sessionStorage.removeItem('credora_otp_session');
};

// LocalStorage for user data
export const setUser = (user) => {
  localStorage.setItem('credora_user', JSON.stringify(user));
};

export const getUser = () => {
  const user = localStorage.getItem('credora_user');
  return user ? JSON.parse(user) : null;
};

export const removeUser = () => {
  localStorage.removeItem('credora_user');
};

// IndexedDB for transaction history (optional)
class TransactionDB {
  constructor() {
    this.dbName = 'credora_transactions';
    this.storeName = 'transactions';
    this.version = 1;
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const objectStore = db.createObjectStore(this.storeName, {
            keyPath: 'id'
          });
          objectStore.createIndex('created_at', 'created_at', { unique: false });
          objectStore.createIndex('reference_number', 'reference_number', { unique: true });
        }
      };
    });
  }

  async saveTransactions(transactions) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const objectStore = transaction.objectStore(this.storeName);

      transactions.forEach(txn => {
        objectStore.put(txn);
      });

      transaction.oncomplete = () => resolve(true);
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async getTransactions(limit = 50) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const objectStore = transaction.objectStore(this.storeName);
      const index = objectStore.index('created_at');
      const request = index.openCursor(null, 'prev');
      const results = [];

      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor && results.length < limit) {
          results.push(cursor.value);
          cursor.continue();
        } else {
          resolve(results);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  async clearTransactions() {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const objectStore = transaction.objectStore(this.storeName);
      const request = objectStore.clear();

      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }
}

export const transactionDB = new TransactionDB();