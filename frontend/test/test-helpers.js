// Test Framework
class TestRunner {
  constructor() {
    this.tests = [];
    this.results = {
      passed: 0,
      failed: 0,
      total: 0
    };
  }

  describe(suiteName, callback) {
    const suite = {
      name: suiteName,
      tests: []
    };
    
    const it = (testName, testFn) => {
      suite.tests.push({
        name: testName,
        fn: testFn
      });
    };

    callback(it);
    this.tests.push(suite);
  }

  async run() {
    this.results = { passed: 0, failed: 0, total: 0 };
    const resultsDiv = document.getElementById('test-results');
    resultsDiv.innerHTML = '<h2>Running Tests...</h2>';

    for (const suite of this.tests) {
      const suiteDiv = document.createElement('div');
      suiteDiv.className = 'test-suite';
      suiteDiv.innerHTML = `<h3>${suite.name}</h3>`;

      for (const test of suite.tests) {
        this.results.total++;
        const testDiv = document.createElement('div');
        testDiv.className = 'test-case';

        try {
          await test.fn();
          testDiv.className += ' passed';
          testDiv.innerHTML = `✓ ${test.name}`;
          this.results.passed++;
        } catch (error) {
          testDiv.className += ' failed';
          testDiv.innerHTML = `
            <div>✗ ${test.name}</div>
            <div class="error-message">${error.message}</div>
          `;
          this.results.failed++;
        }

        suiteDiv.appendChild(testDiv);
      }

      resultsDiv.appendChild(suiteDiv);
    }

    this.displaySummary();
  }

  displaySummary() {
    const summaryDiv = document.createElement('div');
    summaryDiv.className = 'test-summary';
    summaryDiv.innerHTML = `
      <h3>Test Summary</h3>
      <p>Total: ${this.results.total}</p>
      <p class="passed">Passed: ${this.results.passed}</p>
      <p class="failed">Failed: ${this.results.failed}</p>
      <p>Success Rate: ${((this.results.passed / this.results.total) * 100).toFixed(2)}%</p>
    `;
    document.getElementById('test-results').appendChild(summaryDiv);
  }
}

// Assertion Library
const expect = (actual) => ({
  toBe: (expected) => {
    if (actual !== expected) {
      throw new Error(`Expected ${actual} to be ${expected}`);
    }
  },
  toEqual: (expected) => {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      throw new Error(`Expected ${JSON.stringify(actual)} to equal ${JSON.stringify(expected)}`);
    }
  },
  toBeTruthy: () => {
    if (!actual) {
      throw new Error(`Expected ${actual} to be truthy`);
    }
  },
  toBeFalsy: () => {
    if (actual) {
      throw new Error(`Expected ${actual} to be falsy`);
    }
  },
  toContain: (expected) => {
    if (!actual.includes(expected)) {
      throw new Error(`Expected ${actual} to contain ${expected}`);
    }
  },
  toBeGreaterThan: (expected) => {
    if (actual <= expected) {
      throw new Error(`Expected ${actual} to be greater than ${expected}`);
    }
  },
  toBeDefined: () => {
    if (actual === undefined) {
      throw new Error(`Expected value to be defined`);
    }
  },
  toBeNull: () => {
    if (actual !== null) {
      throw new Error(`Expected ${actual} to be null`);
    }
  },
  toHaveProperty: (property) => {
    if (!actual.hasOwnProperty(property)) {
      throw new Error(`Expected object to have property ${property}`);
    }
  }
});

// API Helper
class APIHelper {
  constructor(baseURL = 'http://localhost:5000/api') {
    this.baseURL = baseURL;
    this.token = null;
  }

  setToken(token) {
    this.token = token;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers
    });

    const data = await response.json();
    return { response, data };
  }

  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  async post(endpoint, body) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  }

  async put(endpoint, body) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body)
    });
  }

  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

// Test Data Generator
class TestDataGenerator {
  static generateEmail() {
    return `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}@test.com`;
  }

  static generatePassword() {
    return 'Test@1234';
  }

  static generateUser() {
    return {
      email: this.generateEmail(),
      password: this.generatePassword(),
      firstName: 'Test',
      lastName: 'User',
      phone: '+1234567890',
      dateOfBirth: '1990-01-01',
      address: '123 Test Street, Test City, TC 12345'
    };
  }

  static generateAccountNumber() {
    return '100' + Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
  }

  static generateAmount() {
    return (Math.random() * 1000 + 10).toFixed(2);
  }
}

// Wait Helper
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Export for use in tests
window.TestRunner = TestRunner;
window.expect = expect;
window.APIHelper = APIHelper;
window.TestDataGenerator = TestDataGenerator;
window.wait = wait;