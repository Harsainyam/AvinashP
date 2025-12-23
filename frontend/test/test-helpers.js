// Enhanced Test Framework with better error handling
class TestRunner {
  constructor() {
    this.tests = [];
    this.results = {
      passed: 0,
      failed: 0,
      total: 0,
      duration: 0
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
    this.results = { passed: 0, failed: 0, total: 0, duration: 0 };
    const resultsDiv = document.getElementById('test-results');
    resultsDiv.innerHTML = '<h2>Running Tests...</h2>';
    
    const startTime = Date.now();

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
          const errorMsg = error.message || 'Unknown error';
          const errorStack = error.stack ? `\n${error.stack}` : '';
          testDiv.innerHTML = `
            <div>✗ ${test.name}</div>
            <div class="error-message">${this.escapeHtml(errorMsg)}${errorStack ? `<pre style="margin-top: 0.5rem; font-size: 0.75rem;">${this.escapeHtml(errorStack)}</pre>` : ''}</div>
          `;
          this.results.failed++;
          console.error(`Test failed: ${test.name}`, error);
        }

        suiteDiv.appendChild(testDiv);
      }

      resultsDiv.appendChild(suiteDiv);
    }

    this.results.duration = Date.now() - startTime;
    this.displaySummary();
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  displaySummary() {
    const summaryDiv = document.createElement('div');
    summaryDiv.className = 'test-summary';
    const duration = (this.results.duration / 1000).toFixed(2);
    summaryDiv.innerHTML = `
      <h3>Test Summary</h3>
      <p>Total: ${this.results.total}</p>
      <p class="passed">Passed: ${this.results.passed}</p>
      <p class="failed">Failed: ${this.results.failed}</p>
      <p>Success Rate: ${this.results.total > 0 ? ((this.results.passed / this.results.total) * 100).toFixed(2) : 0}%</p>
      <p>Duration: ${duration}s</p>
    `;
    document.getElementById('test-results').appendChild(summaryDiv);
  }
}

// Enhanced Assertion Library
const expect = (actual) => ({
  toBe: (expected) => {
    if (actual !== expected) {
      throw new Error(`Expected "${actual}" to be "${expected}"`);
    }
  },
  toEqual: (expected) => {
    const actualStr = JSON.stringify(actual);
    const expectedStr = JSON.stringify(expected);
    if (actualStr !== expectedStr) {
      throw new Error(`Expected ${actualStr} to equal ${expectedStr}`);
    }
  },
  toBeTruthy: () => {
    if (!actual) {
      throw new Error(`Expected "${actual}" to be truthy`);
    }
  },
  toBeFalsy: () => {
    if (actual) {
      throw new Error(`Expected "${actual}" to be falsy`);
    }
  },
  toContain: (expected) => {
    if (Array.isArray(actual)) {
      if (!actual.includes(expected)) {
        throw new Error(`Expected array [${actual}] to contain "${expected}"`);
      }
    } else if (typeof actual === 'string') {
      if (!actual.includes(expected)) {
        throw new Error(`Expected string "${actual}" to contain "${expected}"`);
      }
    } else {
      throw new Error(`toContain requires array or string, got ${typeof actual}`);
    }
  },
  toBeGreaterThan: (expected) => {
    if (actual <= expected) {
      throw new Error(`Expected ${actual} to be greater than ${expected}`);
    }
  },
  toBeLessThan: (expected) => {
    if (actual >= expected) {
      throw new Error(`Expected ${actual} to be less than ${expected}`);
    }
  },
  toBeDefined: () => {
    if (actual === undefined) {
      throw new Error(`Expected value to be defined`);
    }
  },
  toBeUndefined: () => {
    if (actual !== undefined) {
      throw new Error(`Expected value to be undefined, got "${actual}"`);
    }
  },
  toBeNull: () => {
    if (actual !== null) {
      throw new Error(`Expected "${actual}" to be null`);
    }
  },
  toHaveProperty: (property) => {
    if (typeof actual !== 'object' || actual === null) {
      throw new Error(`Expected value to be an object, got ${typeof actual}`);
    }
    if (!actual.hasOwnProperty(property)) {
      throw new Error(`Expected object to have property "${property}". Available properties: ${Object.keys(actual).join(', ')}`);
    }
  },
  toMatch: (regex) => {
    if (!regex.test(actual)) {
      throw new Error(`Expected "${actual}" to match pattern ${regex}`);
    }
  },
  toBeInstanceOf: (constructor) => {
    if (!(actual instanceof constructor)) {
      throw new Error(`Expected value to be instance of ${constructor.name}`);
    }
  }
});

// Enhanced API Helper with better error handling
class APIHelper {
  constructor(baseURL = 'http://localhost:5000/api') {
    this.baseURL = baseURL;
    this.token = null;
    this.timeout = 10000;
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

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      let data;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        data = { error: 'Non-JSON response', body: text };
      }

      return { response, data, status: response.status, ok: response.ok };
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after ${this.timeout}ms: ${url}`);
      }
      
      throw new Error(`Network error: ${error.message}`);
    }
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

  async patch(endpoint, body) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body)
    });
  }

  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

// Test Data Generator
// Test Data Generator
class TestDataGenerator {
  static generateEmail() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    return `test_${timestamp}_${random}@credora-test.com`;
  }

  static generatePassword() {
    // Ensure it meets validation: min 8 chars, uppercase, lowercase, number, special char
    return 'Test@1234';
  }

  static generateUser() {
    const id = Math.random().toString(36).substring(2, 7);
    return {
      email: this.generateEmail(),
      password: this.generatePassword(),
      firstName: `TestUser${id}`,
      lastName: `Smith${id}`,
      phone: "9876543210",
      dateOfBirth: '1990-01-01',
      address: '123 Test Street, Test City, TC 12345'
    };
  }
  
  // ... rest of the class
}

// Utility Functions
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const retry = async (fn, maxAttempts = 3, delay = 1000) => {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxAttempts) {
        throw error;
      }
      console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
      await wait(delay);
    }
  }
};

// Storage Helper for test data
class TestStorage {
  static set(key, value) {
    sessionStorage.setItem(`credora_test_${key}`, JSON.stringify(value));
  }

  static get(key) {
    const value = sessionStorage.getItem(`credora_test_${key}`);
    return value ? JSON.parse(value) : null;
  }

  static remove(key) {
    sessionStorage.removeItem(`credora_test_${key}`);
  }

  static clear() {
    const keys = Object.keys(sessionStorage);
    keys.forEach(key => {
      if (key.startsWith('credora_test_')) {
        sessionStorage.removeItem(key);
      }
    });
  }
}

// Export for use in tests
window.TestRunner = TestRunner;
window.expect = expect;
window.APIHelper = APIHelper;
window.TestDataGenerator = TestDataGenerator;
window.TestStorage = TestStorage;
window.wait = wait;
window.retry = retry;