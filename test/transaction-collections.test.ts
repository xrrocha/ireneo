/**
 * Transaction Collection Tests
 *
 * Tests for Map and Set handling in transaction proxies.
 * These tests verify that mutations to objects retrieved from
 * Map.get() and Set iteration are properly tracked in the delta.
 */

import { describe, test } from 'node:test';
import * as assert from 'node:assert/strict';
import { createTransaction } from '../src/transaction.js';
import { createInMemoryEventLog } from '../src/event-log.js';

describe('Transaction Map handling', () => {
  test('tracks mutations to objects retrieved via Map.get()', async () => {
    const eventLog = createInMemoryEventLog();
    const txn = await createTransaction(eventLog);
    const root = txn.root as any;

    // Initialize Map with object
    root.users = new Map();
    root.users.set('alice', { name: 'Alice', age: 30 });
    await txn.save();

    // Get object via Map.get() and mutate it
    const user = root.users.get('alice');
    assert.ok(user, 'User should exist');
    assert.equal(user.name, 'Alice');

    user.age = 31;  // This mutation should be tracked!
    await txn.save();

    // Reload and verify mutation was persisted
    const txn2 = await createTransaction(eventLog);
    const root2 = txn2.root as any;
    const reloadedUser = root2.users.get('alice');

    assert.equal(reloadedUser.age, 31, 'Age mutation should be persisted');
    assert.equal(reloadedUser.name, 'Alice', 'Name should remain unchanged');
  });

  test('tracks deep mutations to Map values', async () => {
    const eventLog = createInMemoryEventLog();
    const txn = await createTransaction(eventLog);
    const root = txn.root as any;

    root.data = new Map();
    root.data.set('config', {
      settings: {
        enabled: true,
        threshold: 100
      }
    });
    await txn.save();

    // Deep mutation
    const config = root.data.get('config');
    config.settings.threshold = 200;
    await txn.save();

    // Reload and verify
    const txn2 = await createTransaction(eventLog);
    const root2 = txn2.root as any;
    const reloadedConfig = root2.data.get('config');

    assert.equal(reloadedConfig.settings.threshold, 200);
  });

  test('tracks mutations to multiple Map entries', async () => {
    const eventLog = createInMemoryEventLog();
    const txn = await createTransaction(eventLog);
    const root = txn.root as any;

    root.users = new Map();
    root.users.set('alice', { score: 100 });
    root.users.set('bob', { score: 200 });
    await txn.save();

    // Mutate both
    root.users.get('alice').score = 150;
    root.users.get('bob').score = 250;
    await txn.save();

    // Reload and verify
    const txn2 = await createTransaction(eventLog);
    const root2 = txn2.root as any;

    assert.equal(root2.users.get('alice').score, 150);
    assert.equal(root2.users.get('bob').score, 250);
  });

  test('handles Map.set() followed by Map.get() mutation', async () => {
    const eventLog = createInMemoryEventLog();
    const txn = await createTransaction(eventLog);
    const root = txn.root as any;

    root.cache = new Map();

    // Set and mutate in same transaction
    root.cache.set('item', { value: 'initial' });
    root.cache.get('item').value = 'updated';
    await txn.save();

    // Reload and verify
    const txn2 = await createTransaction(eventLog);
    const root2 = txn2.root as any;

    assert.equal(root2.cache.get('item').value, 'updated');
  });

  test('Map.get() returns undefined for missing keys', async () => {
    const eventLog = createInMemoryEventLog();
    const txn = await createTransaction(eventLog);
    const root = txn.root as any;

    root.map = new Map();
    await txn.save();

    const result = root.map.get('nonexistent');
    assert.equal(result, undefined);
  });

  test('Map.get() with primitive values (no wrapping needed)', async () => {
    const eventLog = createInMemoryEventLog();
    const txn = await createTransaction(eventLog);
    const root = txn.root as any;

    root.map = new Map();
    root.map.set('count', 42);
    root.map.set('name', 'test');
    await txn.save();

    assert.equal(root.map.get('count'), 42);
    assert.equal(root.map.get('name'), 'test');
  });
});

describe('Transaction Set handling', () => {
  test('Set mutations work correctly', async () => {
    const eventLog = createInMemoryEventLog();
    const txn = await createTransaction(eventLog);
    const root = txn.root as any;

    root.tags = new Set();
    root.tags.add('javascript');
    root.tags.add('typescript');
    await txn.save();

    root.tags.delete('javascript');
    root.tags.add('nodejs');
    await txn.save();

    // Reload and verify
    const txn2 = await createTransaction(eventLog);
    const root2 = txn2.root as any;

    assert.equal(root2.tags.has('javascript'), false);
    assert.equal(root2.tags.has('typescript'), true);
    assert.equal(root2.tags.has('nodejs'), true);
  });

  test('Set.clear() works correctly', async () => {
    const eventLog = createInMemoryEventLog();
    const txn = await createTransaction(eventLog);
    const root = txn.root as any;

    root.set = new Set([1, 2, 3]);
    await txn.save();

    root.set.clear();
    await txn.save();

    // Reload and verify
    const txn2 = await createTransaction(eventLog);
    const root2 = txn2.root as any;

    assert.equal(root2.set.size, 0);
  });

  test('Set with object values (iteration wrapping TODO)', async () => {
    const eventLog = createInMemoryEventLog();
    const txn = await createTransaction(eventLog);
    const root = txn.root as any;

    const obj1 = { id: 1, value: 'a' };
    const obj2 = { id: 2, value: 'b' };

    root.items = new Set();
    root.items.add(obj1);
    root.items.add(obj2);
    await txn.save();

    // Note: Mutating objects from Set iteration is NOT yet supported
    // This test just verifies Set storage works
    assert.equal(root.items.size, 2);
  });
});

describe('Transaction Map edge cases', () => {
  test('Map with object keys', async () => {
    const eventLog = createInMemoryEventLog();
    const txn = await createTransaction(eventLog);
    const root = txn.root as any;

    const key1 = { id: 1 };
    const key2 = { id: 2 };

    root.map = new Map();
    root.map.set(key1, 'value1');
    root.map.set(key2, 'value2');
    await txn.save();

    assert.equal(root.map.get(key1), 'value1');
    assert.equal(root.map.get(key2), 'value2');
    assert.equal(root.map.size, 2);
  });

  test('nested Maps', async () => {
    const eventLog = createInMemoryEventLog();
    const txn = await createTransaction(eventLog);
    const root = txn.root as any;

    root.outer = new Map();
    root.outer.set('inner', new Map([['key', 'value']]));
    await txn.save();

    const inner = root.outer.get('inner');
    assert.equal(inner.get('key'), 'value');

    inner.set('key', 'updated');
    await txn.save();

    // Reload and verify
    const txn2 = await createTransaction(eventLog);
    const root2 = txn2.root as any;

    assert.equal(root2.outer.get('inner').get('key'), 'updated');
  });

  test('Map delete and re-add same key', async () => {
    const eventLog = createInMemoryEventLog();
    const txn = await createTransaction(eventLog);
    const root = txn.root as any;

    root.map = new Map();
    root.map.set('key', { value: 1 });
    await txn.save();

    root.map.delete('key');
    root.map.set('key', { value: 2 });
    await txn.save();

    // Reload and verify
    const txn2 = await createTransaction(eventLog);
    const root2 = txn2.root as any;

    assert.equal(root2.map.get('key').value, 2);
  });
});

describe('Transaction nested collections', () => {
  test('Map containing arrays with mutations', async () => {
    const eventLog = createInMemoryEventLog();
    const txn = await createTransaction(eventLog);
    const root = txn.root as any;

    root.categories = new Map();
    root.categories.set('fruits', ['apple', 'banana']);
    root.categories.set('veggies', ['carrot', 'broccoli']);
    await txn.save();

    // Mutate array inside Map
    const fruits = root.categories.get('fruits');
    fruits.push('orange');
    await txn.save();

    // Reload and verify
    const txn2 = await createTransaction(eventLog);
    const root2 = txn2.root as any;

    const reloadedFruits = root2.categories.get('fruits');
    assert.deepEqual(reloadedFruits, ['apple', 'banana', 'orange']);
  });

  test('Array containing Maps with mutations', async () => {
    const eventLog = createInMemoryEventLog();
    const txn = await createTransaction(eventLog);
    const root = txn.root as any;

    const map1 = new Map([['name', 'Alice']]);
    const map2 = new Map([['name', 'Bob']]);
    root.users = [map1, map2];
    await txn.save();

    // Mutate Map inside array
    root.users[0].set('age', 30);
    await txn.save();

    // Reload and verify
    const txn2 = await createTransaction(eventLog);
    const root2 = txn2.root as any;

    assert.equal(root2.users[0].get('name'), 'Alice');
    assert.equal(root2.users[0].get('age'), 30);
  });

  test('Map containing objects with nested arrays', async () => {
    const eventLog = createInMemoryEventLog();
    const txn = await createTransaction(eventLog);
    const root = txn.root as any;

    root.data = new Map();
    root.data.set('user', { name: 'Alice', tags: ['admin', 'user'] });
    await txn.save();

    // Mutate nested array
    const user = root.data.get('user');
    user.tags.push('moderator');
    await txn.save();

    // Reload and verify
    const txn2 = await createTransaction(eventLog);
    const root2 = txn2.root as any;

    const reloadedUser = root2.data.get('user');
    assert.deepEqual(reloadedUser.tags, ['admin', 'user', 'moderator']);
  });

  test('deeply nested Maps (3 levels)', async () => {
    const eventLog = createInMemoryEventLog();
    const txn = await createTransaction(eventLog);
    const root = txn.root as any;

    root.level1 = new Map();
    root.level1.set('level2', new Map());
    root.level1.get('level2').set('level3', new Map());
    root.level1.get('level2').get('level3').set('value', 42);
    await txn.save();

    // Mutate deeply nested value
    root.level1.get('level2').get('level3').set('value', 100);
    await txn.save();

    // Reload and verify
    const txn2 = await createTransaction(eventLog);
    const root2 = txn2.root as any;

    const deepValue = root2.level1.get('level2').get('level3').get('value');
    assert.equal(deepValue, 100);
  });

  test('Array containing objects with Maps', async () => {
    const eventLog = createInMemoryEventLog();
    const txn = await createTransaction(eventLog);
    const root = txn.root as any;

    root.items = [
      { id: 1, metadata: new Map([['color', 'red']]) },
      { id: 2, metadata: new Map([['color', 'blue']]) }
    ];
    await txn.save();

    // Mutate Map inside object inside array
    root.items[0].metadata.set('size', 'large');
    await txn.save();

    // Reload and verify
    const txn2 = await createTransaction(eventLog);
    const root2 = txn2.root as any;

    assert.equal(root2.items[0].metadata.get('color'), 'red');
    assert.equal(root2.items[0].metadata.get('size'), 'large');
  });
});

describe('Transaction iterator protocol', () => {
  test('Map.entries() returns wrapped values', async () => {
    const eventLog = createInMemoryEventLog();
    const txn = await createTransaction(eventLog);
    const root = txn.root as any;

    root.users = new Map();
    root.users.set('alice', { age: 30 });
    root.users.set('bob', { age: 25 });
    await txn.save();

    // Iterate and mutate
    for (const [key, user] of root.users.entries()) {
      user.age += 1;
    }
    await txn.save();

    // Reload and verify
    const txn2 = await createTransaction(eventLog);
    const root2 = txn2.root as any;

    assert.equal(root2.users.get('alice').age, 31);
    assert.equal(root2.users.get('bob').age, 26);
  });

  test('Map.values() returns wrapped values', async () => {
    const eventLog = createInMemoryEventLog();
    const txn = await createTransaction(eventLog);
    const root = txn.root as any;

    root.users = new Map();
    root.users.set('alice', { score: 100 });
    root.users.set('bob', { score: 200 });
    await txn.save();

    // Iterate using values()
    for (const user of root.users.values()) {
      user.score += 10;
    }
    await txn.save();

    // Reload and verify
    const txn2 = await createTransaction(eventLog);
    const root2 = txn2.root as any;

    assert.equal(root2.users.get('alice').score, 110);
    assert.equal(root2.users.get('bob').score, 210);
  });

  test('Map.forEach() receives wrapped values', async () => {
    const eventLog = createInMemoryEventLog();
    const txn = await createTransaction(eventLog);
    const root = txn.root as any;

    root.counters = new Map();
    root.counters.set('a', { count: 1 });
    root.counters.set('b', { count: 2 });
    await txn.save();

    // Use forEach to mutate
    root.counters.forEach((counter: any) => {
      counter.count *= 2;
    });
    await txn.save();

    // Reload and verify
    const txn2 = await createTransaction(eventLog);
    const root2 = txn2.root as any;

    assert.equal(root2.counters.get('a').count, 2);
    assert.equal(root2.counters.get('b').count, 4);
  });

  test('Array.find() returns wrapped object', async () => {
    const eventLog = createInMemoryEventLog();
    const txn = await createTransaction(eventLog);
    const root = txn.root as any;

    root.todos = [
      { id: 1, title: 'Buy milk', done: false },
      { id: 2, title: 'Walk dog', done: false }
    ];
    await txn.save();

    // Find and mutate
    const todo = root.todos.find((t: any) => t.id === 1);
    todo.done = true;
    await txn.save();

    // Reload and verify
    const txn2 = await createTransaction(eventLog);
    const root2 = txn2.root as any;

    assert.equal(root2.todos[0].done, true);
  });

  test('Array.filter() returns wrapped objects', async () => {
    const eventLog = createInMemoryEventLog();
    const txn = await createTransaction(eventLog);
    const root = txn.root as any;

    root.items = [
      { id: 1, active: true, value: 10 },
      { id: 2, active: false, value: 20 },
      { id: 3, active: true, value: 30 }
    ];
    await txn.save();

    // Filter and mutate
    const activeItems = root.items.filter((item: any) => item.active);
    activeItems.forEach((item: any) => {
      item.value += 5;
    });
    await txn.save();

    // Reload and verify
    const txn2 = await createTransaction(eventLog);
    const root2 = txn2.root as any;

    assert.equal(root2.items[0].value, 15);  // was 10, active
    assert.equal(root2.items[1].value, 20);  // was 20, not active (unchanged)
    assert.equal(root2.items[2].value, 35);  // was 30, active
  });
});
