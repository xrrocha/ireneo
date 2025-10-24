/**
 * Ireneo Demo: TodoMVC with Mutation Sourcing
 *
 * This demo showcases Ireneo's automatic mutation tracking by building
 * a simple todo app with a live event log visualization.
 */

import { createIndexedDBEventLog } from '../event-log.js';
import { createTransaction, type Transaction } from '../transaction.js';
import type { EventLog } from '../types.js';

// ===== Types =====

interface Todo {
  id: number;
  text: string;
  done: boolean;
  createdAt: Date;
}

interface AppState {
  todos: Todo[];
  nextId: number;
}

// ===== Global State =====

let eventLog: EventLog;
let txn: Transaction;
let root: AppState;

// ===== Initialization =====

async function init() {
  try {
    // 1. Create event log (persistent storage in browser)
    eventLog = createIndexedDBEventLog('ireneo-demo', 'todos');

    // 2. Create transaction (loads from event log if it exists)
    txn = await createTransaction(eventLog);

    // 3. Get root object (this is our app's state)
    root = txn.root as AppState;

    // 4. Initialize structure (only runs once, on first load)
    if (!root.todos) {
      root.todos = [];
      root.nextId = 1;
    }

    // Initialize theme
    const savedTheme = localStorage.getItem('ireneo-demo-theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);

    // Setup event listeners
    setupEventListeners();

    // Initial render
    await render();

    console.log('Ireneo demo initialized');
    console.log(`Loaded ${root.todos.length} todos from IndexedDB`);
  } catch (err) {
    console.error('Initialization error:', err);
    alert('Failed to initialize app. Check console for details.');
  }
}

// ===== Todo Operations =====

async function addTodo(text: string) {
  if (!text.trim()) return;

  root.todos.push({
    id: root.nextId++,
    text: text.trim(),
    done: false,
    createdAt: new Date()
  });

  // Auto-save to persist events
  await save();

  // Clear input
  const input = document.getElementById('new-todo') as HTMLInputElement;
  if (input) {
    input.value = '';
  }

  await render();
}

async function toggleTodo(id: number) {
  const todo = root.todos.find(t => t.id === id);
  if (todo) {
    todo.done = !todo.done;
    await save();
    await render();
  }
}

async function deleteTodo(id: number) {
  const index = root.todos.findIndex(t => t.id === id);
  if (index >= 0) {
    root.todos.splice(index, 1);
    await save();
    await render();
  }
}

async function save() {
  try {
    await txn.save();
    showStatus('Saved to IndexedDB', 'success');
  } catch (err) {
    console.error('Save error:', err);
    showStatus('Save failed', 'error');
  }
}

async function clearAll() {
  if (!confirm('Clear all todos and events? This cannot be undone.')) {
    return;
  }

  try {
    // Clear todos
    root.todos.length = 0;
    root.nextId = 1;

    // Save and clear event log
    await txn.save();
    if (eventLog.clear) {
      await eventLog.clear();
    }

    // Recreate transaction
    txn = await createTransaction(eventLog);
    root = txn.root as AppState;
    root.todos = [];
    root.nextId = 1;

    await render();
    showStatus('All data cleared', 'success');
  } catch (err) {
    console.error('Clear error:', err);
    showStatus('Clear failed', 'error');
  }
}

// ===== Rendering =====

async function render() {
  renderTodos();
  await renderEvents();
}

function renderTodos() {
  const list = document.getElementById('todo-list');
  if (!list) return;

  if (root.todos.length === 0) {
    list.innerHTML = '<li class="empty-state" style="text-align: center; color: var(--text-tertiary); padding: 2rem;">No todos yet. Add one above!</li>';
    return;
  }

  list.innerHTML = root.todos.map(todo => `
    <li class="todo-item ${todo.done ? 'done' : ''}">
      <input
        type="checkbox"
        ${todo.done ? 'checked' : ''}
        onchange="window.toggleTodoAsync(${todo.id})"
      />
      <span class="todo-text">${escapeHtml(todo.text)}</span>
      <button class="todo-delete" onclick="window.deleteTodoAsync(${todo.id})" title="Delete">×</button>
    </li>
  `).join('');
}

async function renderEvents() {
  const list = document.getElementById('event-list');
  const countEl = document.getElementById('event-count');
  const sizeEl = document.getElementById('storage-size');

  if (!list || !countEl || !sizeEl) return;

  try {
    const events = await eventLog.getAll();

    if (events.length === 0) {
      list.innerHTML = '<div class="empty-state" style="text-align: center; color: var(--text-tertiary); padding: 2rem;">No events yet. Interact with todos to see mutations!</div>';
      countEl.textContent = '0 events';
      sizeEl.textContent = '0 KB';
      return;
    }

    // Show last 50 events (most recent first)
    const recent = events.slice(-50).reverse();

    list.innerHTML = recent.map(event => {
      const pathStr = JSON.stringify(event.path);
      let valueStr = '';

      if (event.type === 'SET' && 'value' in event) {
        valueStr = `<div class="event-value">value: ${formatValue((event as any).value)}</div>`;
      } else if (event.type === 'ARRAY_PUSH' && 'items' in event) {
        valueStr = `<div class="event-value">pushed: ${formatValue((event as any).items[0])}</div>`;
      } else if (event.type === 'ARRAY_SPLICE' && 'start' in event) {
        valueStr = `<div class="event-value">index: ${(event as any).start}, deleted: ${(event as any).deleteCount}</div>`;
      }

      return `
        <div class="event event-${event.type}">
          <span class="event-type">${event.type}</span>
          <div class="event-path">${escapeHtml(pathStr)}</div>
          ${valueStr}
        </div>
      `;
    }).join('');

    // Update stats
    countEl.textContent = `${events.length} event${events.length !== 1 ? 's' : ''}`;

    // Estimate storage size
    const sizeBytes = JSON.stringify(events).length;
    const sizeKB = (sizeBytes / 1024).toFixed(1);
    sizeEl.textContent = `${sizeKB} KB`;
  } catch (err) {
    console.error('Error rendering events:', err);
    list.innerHTML = '<div style="color: var(--danger); padding: 1rem;">Error loading events</div>';
  }
}

// ===== Event Listeners =====

function setupEventListeners() {
  // Add todo
  const addBtn = document.getElementById('add-btn');
  const input = document.getElementById('new-todo') as HTMLInputElement;

  if (addBtn && input) {
    addBtn.addEventListener('click', () => {
      addTodo(input.value).catch(console.error);
    });

    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        addTodo(input.value).catch(console.error);
      }
    });
  }

  // Clear all
  const clearAllBtn = document.getElementById('clear-all-btn');
  if (clearAllBtn) {
    clearAllBtn.addEventListener('click', clearAll);
  }

  // Theme toggle
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }

  // Expose async wrappers to window for onclick handlers
  (window as any).toggleTodoAsync = (id: number) => toggleTodo(id).catch(console.error);
  (window as any).deleteTodoAsync = (id: number) => deleteTodo(id).catch(console.error);
}

// ===== Theme =====

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  const next = current === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('ireneo-demo-theme', next);
  updateThemeIcon(next);
}

function updateThemeIcon(theme: string) {
  const toggle = document.getElementById('theme-toggle');
  if (toggle) {
    toggle.textContent = theme === 'light' ? '🌙' : '☀️';
  }
}

// ===== Utilities =====

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatValue(value: any): string {
  if (typeof value === 'string') {
    return `"${escapeHtml(value)}"`;
  }
  return escapeHtml(JSON.stringify(value, null, 2));
}

function showStatus(message: string, type: 'success' | 'error') {
  // Simple console log for now - could enhance with toast notifications
  console.log(`[${type.toUpperCase()}] ${message}`);
}

// ===== Start =====

// Initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
