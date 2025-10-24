/**
 * Tests for Class Instance Preservation
 *
 * Verifies that class instances survive serialization/deserialization with:
 * - Methods intact and callable
 * - Prototype chains preserved
 * - Inheritance working correctly
 * - Circular references handled
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { serializeMemoryImage } from '../../src/serialize.js';
import { deserializeSnapshot } from '../../src/deserialize.js';
import { createClassRegistry } from '../../src/class-registry.js';

// ============================================================================
// Test Classes
// ============================================================================

/**
 * Simple class with methods
 */
class Employee {
  constructor(
    public empno: number,
    public name: string,
    public salary: number
  ) {}

  giveRaise(amount: number): void {
    this.salary += amount;
  }

  getName(): string {
    return this.name;
  }

  getAnnualSalary(): number {
    return this.salary * 12;
  }
}

/**
 * Class with inheritance
 */
class Manager extends Employee {
  constructor(
    empno: number,
    name: string,
    salary: number,
    public department: string
  ) {
    super(empno, name, salary);
  }

  getDetails(): string {
    return `${this.name} manages ${this.department}`;
  }

  // Override parent method
  getAnnualSalary(): number {
    return super.getAnnualSalary() + 5000; // Bonus
  }
}

/**
 * Class with nested instances and circular references
 */
class Department {
  employees: Employee[] = [];
  manager: Manager | null = null;

  constructor(public name: string) {}

  addEmployee(emp: Employee): void {
    this.employees.push(emp);
  }

  getTotalSalary(): number {
    return this.employees.reduce((sum, emp) => sum + emp.salary, 0);
  }
}

// ============================================================================
// Simple Class Method Tests
// ============================================================================

test('Simple class instance - methods work after restore', () => {
  // Setup
  const emp = new Employee(7839, 'KING', 5000);
  const registry = createClassRegistry({ Employee });

  // Serialize
  const json = serializeMemoryImage({ emp }, new WeakMap());

  // Deserialize
  const restored = deserializeSnapshot(json, registry) as { emp: Employee };

  // Verify class identity
  assert.ok(restored.emp instanceof Employee);
  assert.strictEqual(Object.getPrototypeOf(restored.emp), Employee.prototype);

  // Verify properties
  assert.strictEqual(restored.emp.empno, 7839);
  assert.strictEqual(restored.emp.name, 'KING');
  assert.strictEqual(restored.emp.salary, 5000);

  // Verify methods work
  assert.strictEqual(restored.emp.getName(), 'KING');
  assert.strictEqual(restored.emp.getAnnualSalary(), 60000);

  // Verify mutations work
  restored.emp.giveRaise(500);
  assert.strictEqual(restored.emp.salary, 5500);
  assert.strictEqual(restored.emp.getAnnualSalary(), 66000);
});

test('Multiple class instances in array', () => {
  // Setup
  const employees = [
    new Employee(7839, 'KING', 5000),
    new Employee(7698, 'BLAKE', 2850),
    new Employee(7782, 'CLARK', 2450)
  ];
  const registry = createClassRegistry({ Employee });

  // Serialize
  const json = serializeMemoryImage({ employees }, new WeakMap());

  // Deserialize
  const restored = deserializeSnapshot(json, registry) as { employees: Employee[] };

  // Verify all instances
  assert.strictEqual(restored.employees.length, 3);
  for (const emp of restored.employees) {
    assert.ok(emp instanceof Employee);
    assert.strictEqual(typeof emp.getName, 'function');
  }

  // Verify specific properties
  assert.strictEqual(restored.employees[0].getName(), 'KING');
  assert.strictEqual(restored.employees[1].getName(), 'BLAKE');
  assert.strictEqual(restored.employees[2].getName(), 'CLARK');
});

test('Class instance without registry deserializes as plain object', () => {
  // Setup
  const emp = new Employee(7839, 'KING', 5000);

  // Serialize
  const json = serializeMemoryImage({ emp }, new WeakMap());

  // Deserialize without registry - should work but be a plain object
  const restored = deserializeSnapshot(json) as { emp: any };

  // Verify it's a plain object, not an Employee instance
  assert.ok(!(restored.emp instanceof Employee));
  assert.strictEqual(Object.getPrototypeOf(restored.emp), Object.prototype);

  // Verify properties are preserved
  assert.strictEqual(restored.emp.empno, 7839);
  assert.strictEqual(restored.emp.name, 'KING');
  assert.strictEqual(restored.emp.salary, 5000);

  // Verify methods don't work (not a class instance)
  assert.strictEqual(typeof restored.emp.getName, 'undefined');

  // Verify __class__ marker is preserved
  assert.strictEqual(restored.emp.__class__, 'Employee');
});

// ============================================================================
// Inheritance Chain Tests
// ============================================================================

test('Inheritance - subclass methods work after restore', () => {
  // Setup
  const mgr = new Manager(7566, 'JONES', 2975, 'RESEARCH');
  const registry = createClassRegistry({ Manager, Employee });

  // Serialize
  const json = serializeMemoryImage({ mgr }, new WeakMap());

  // Deserialize
  const restored = deserializeSnapshot(json, registry) as { mgr: Manager };

  // Verify class identity
  assert.ok(restored.mgr instanceof Manager);
  assert.ok(restored.mgr instanceof Employee);
  assert.strictEqual(Object.getPrototypeOf(restored.mgr), Manager.prototype);

  // Verify properties
  assert.strictEqual(restored.mgr.empno, 7566);
  assert.strictEqual(restored.mgr.name, 'JONES');
  assert.strictEqual(restored.mgr.department, 'RESEARCH');

  // Verify parent methods
  assert.strictEqual(restored.mgr.getName(), 'JONES');

  // Verify child methods
  assert.strictEqual(restored.mgr.getDetails(), 'JONES manages RESEARCH');

  // Verify method override
  assert.strictEqual(restored.mgr.getAnnualSalary(), 40700); // (2975 * 12) + 5000
});

test('Inheritance - prototype chain is preserved', () => {
  // Setup
  const mgr = new Manager(7566, 'JONES', 2975, 'RESEARCH');
  const registry = createClassRegistry({ Manager, Employee });

  // Serialize
  const json = serializeMemoryImage({ mgr }, new WeakMap());

  // Deserialize
  const restored = deserializeSnapshot(json, registry) as { mgr: Manager };

  // Verify prototype chain
  const proto1 = Object.getPrototypeOf(restored.mgr);
  assert.strictEqual(proto1, Manager.prototype);

  const proto2 = Object.getPrototypeOf(proto1);
  assert.strictEqual(proto2, Employee.prototype);

  const proto3 = Object.getPrototypeOf(proto2);
  assert.strictEqual(proto3, Object.prototype);
});

test('Mixed instances - both parent and child classes', () => {
  // Setup
  const team = [
    new Employee(7782, 'CLARK', 2450),
    new Manager(7566, 'JONES', 2975, 'RESEARCH'),
    new Employee(7934, 'MILLER', 1300)
  ];
  const registry = createClassRegistry({ Employee, Manager });

  // Serialize
  const json = serializeMemoryImage({ team }, new WeakMap());

  // Deserialize
  const restored = deserializeSnapshot(json, registry) as { team: (Employee | Manager)[] };

  // Verify instances
  assert.ok(restored.team[0] instanceof Employee);
  assert.ok(!(restored.team[0] instanceof Manager));

  assert.ok(restored.team[1] instanceof Manager);
  assert.ok(restored.team[1] instanceof Employee);

  assert.ok(restored.team[2] instanceof Employee);
  assert.ok(!(restored.team[2] instanceof Manager));

  // Verify methods
  assert.strictEqual(restored.team[0].getName(), 'CLARK');
  assert.strictEqual((restored.team[1] as Manager).getDetails(), 'JONES manages RESEARCH');
  assert.strictEqual(restored.team[2].getName(), 'MILLER');
});

// ============================================================================
// Circular Reference Tests
// ============================================================================

test('Circular references between class instances', () => {
  // Setup - create circular structure
  const dept = new Department('RESEARCH');
  const emp1 = new Employee(7839, 'KING', 5000);
  const emp2 = new Employee(7698, 'BLAKE', 2850);

  dept.addEmployee(emp1);
  dept.addEmployee(emp2);

  // Create object with reference back to department
  const org = {
    dept,
    mainEmployee: emp1,
    departments: [dept] // Circular ref
  };

  const registry = createClassRegistry({ Department, Employee });

  // Serialize
  const json = serializeMemoryImage(org, new WeakMap());

  // Deserialize
  const restored = deserializeSnapshot(json, registry) as typeof org;

  // Verify structure
  assert.ok(restored.dept instanceof Department);
  assert.ok(restored.mainEmployee instanceof Employee);
  assert.strictEqual(restored.departments.length, 1);

  // Verify circular references are preserved (same object identity)
  assert.strictEqual(restored.dept, restored.departments[0]);
  assert.strictEqual(restored.mainEmployee, restored.dept.employees[0]);

  // Verify methods work
  assert.strictEqual(restored.dept.getTotalSalary(), 7850);
  assert.strictEqual(restored.mainEmployee.getName(), 'KING');

  // Verify mutations
  restored.dept.employees[0].giveRaise(1000);
  assert.strictEqual(restored.dept.getTotalSalary(), 8850);
});

test('Class instance with self-reference', () => {
  // Setup
  class Node {
    next: Node | null = null;

    constructor(public value: number) {}

    getValue(): number {
      return this.value;
    }
  }

  const node1 = new Node(1);
  const node2 = new Node(2);
  const node3 = new Node(3);

  node1.next = node2;
  node2.next = node3;
  node3.next = node1; // Circular!

  const registry = createClassRegistry({ Node });

  // Serialize
  const json = serializeMemoryImage({ start: node1 }, new WeakMap());

  // Deserialize
  const restored = deserializeSnapshot(json, registry) as { start: Node };

  // Verify structure
  assert.ok(restored.start instanceof Node);
  assert.ok(restored.start.next instanceof Node);
  assert.ok(restored.start.next?.next instanceof Node);

  // Verify circular reference
  assert.strictEqual(restored.start.next?.next?.next, restored.start);

  // Verify methods
  assert.strictEqual(restored.start.getValue(), 1);
  assert.strictEqual(restored.start.next?.getValue(), 2);
  assert.strictEqual(restored.start.next?.next?.getValue(), 3);
});

// ============================================================================
// Prototype Chain Integrity Tests
// ============================================================================

test('Prototype methods are shared, not duplicated', () => {
  // Setup
  const emp1 = new Employee(7839, 'KING', 5000);
  const emp2 = new Employee(7698, 'BLAKE', 2850);
  const registry = createClassRegistry({ Employee });

  // Serialize
  const json = serializeMemoryImage({ emp1, emp2 }, new WeakMap());

  // Deserialize
  const restored = deserializeSnapshot(json, registry) as { emp1: Employee; emp2: Employee };

  // Verify methods are the SAME function (shared via prototype)
  assert.strictEqual(restored.emp1.getName, restored.emp2.getName);
  assert.strictEqual(restored.emp1.giveRaise, restored.emp2.giveRaise);
  assert.strictEqual(restored.emp1.getAnnualSalary, restored.emp2.getAnnualSalary);

  // Verify they point to prototype methods
  assert.strictEqual(restored.emp1.getName, Employee.prototype.getName);
  assert.strictEqual(restored.emp2.getName, Employee.prototype.getName);
});

test('Modified prototype methods affect all instances', () => {
  // Setup
  const emp1 = new Employee(7839, 'KING', 5000);
  const emp2 = new Employee(7698, 'BLAKE', 2850);
  const registry = createClassRegistry({ Employee });

  // Serialize
  const json = serializeMemoryImage({ emp1, emp2 }, new WeakMap());

  // Deserialize
  const restored = deserializeSnapshot(json, registry) as { emp1: Employee; emp2: Employee };

  // Modify prototype method
  const originalGetName = Employee.prototype.getName;
  Employee.prototype.getName = function() {
    return `Employee: ${this.name}`;
  };

  // Verify both instances use new method
  assert.strictEqual(restored.emp1.getName(), 'Employee: KING');
  assert.strictEqual(restored.emp2.getName(), 'Employee: BLAKE');

  // Restore original
  Employee.prototype.getName = originalGetName;
});

test('Own properties shadow prototype properties correctly', () => {
  // Setup
  const emp = new Employee(7839, 'KING', 5000);

  // Add own property that shadows a method name
  (emp as any).getName = 'Not a function!';

  const registry = createClassRegistry({ Employee });

  // Serialize
  const json = serializeMemoryImage({ emp }, new WeakMap());

  // Deserialize
  const restored = deserializeSnapshot(json, registry) as { emp: Employee & { getName: string } };

  // Verify own property is preserved
  assert.strictEqual(restored.emp.getName, 'Not a function!');
  assert.strictEqual(typeof restored.emp.getName, 'string');

  // Verify prototype still has the method
  assert.strictEqual(typeof Employee.prototype.getName, 'function');

  // Delete own property to reveal prototype method
  delete (restored.emp as any).getName;
  assert.strictEqual(typeof restored.emp.getName, 'function');
  assert.strictEqual(restored.emp.getName(), 'KING');
});

// ============================================================================
// Edge Cases
// ============================================================================

test('Empty class instance (no properties)', () => {
  // Setup
  class EmptyClass {
    doSomething(): string {
      return 'something';
    }
  }

  const instance = new EmptyClass();
  const registry = createClassRegistry({ EmptyClass });

  // Serialize
  const json = serializeMemoryImage({ instance }, new WeakMap());

  // Deserialize
  const restored = deserializeSnapshot(json, registry) as { instance: EmptyClass };

  // Verify
  assert.ok(restored.instance instanceof EmptyClass);
  assert.strictEqual(restored.instance.doSomething(), 'something');
});

test('Class instance with complex properties', () => {
  // Setup
  class ComplexEmployee extends Employee {
    skills: string[] = [];
    metadata: Map<string, unknown> = new Map();
    startDate: Date = new Date();

    constructor(empno: number, name: string, salary: number) {
      super(empno, name, salary);
    }

    addSkill(skill: string): void {
      this.skills.push(skill);
    }
  }

  const emp = new ComplexEmployee(7839, 'KING', 5000);
  emp.addSkill('JavaScript');
  emp.addSkill('TypeScript');
  emp.metadata.set('location', 'NYC');
  emp.startDate = new Date('2020-01-15');

  const registry = createClassRegistry({ ComplexEmployee, Employee });

  // Serialize
  const json = serializeMemoryImage({ emp }, new WeakMap());

  // Deserialize
  const restored = deserializeSnapshot(json, registry) as { emp: ComplexEmployee };

  // Verify instance
  assert.ok(restored.emp instanceof ComplexEmployee);
  assert.ok(restored.emp instanceof Employee);

  // Verify complex properties
  assert.deepStrictEqual(restored.emp.skills, ['JavaScript', 'TypeScript']);
  assert.ok(restored.emp.metadata instanceof Map);
  assert.strictEqual(restored.emp.metadata.get('location'), 'NYC');
  assert.ok(restored.emp.startDate instanceof Date);
  assert.strictEqual(restored.emp.startDate.toISOString(), '2020-01-15T00:00:00.000Z');

  // Verify methods
  emp.addSkill('Python');
  assert.strictEqual(restored.emp.skills.length, 2);
});

test('Nested class instances', () => {
  // Setup
  class Address {
    constructor(
      public street: string,
      public city: string
    ) {}

    getFullAddress(): string {
      return `${this.street}, ${this.city}`;
    }
  }

  class Person {
    constructor(
      public name: string,
      public address: Address
    ) {}

    getInfo(): string {
      return `${this.name} lives at ${this.address.getFullAddress()}`;
    }
  }

  const person = new Person(
    'John',
    new Address('123 Main St', 'NYC')
  );

  const registry = createClassRegistry({ Person, Address });

  // Serialize
  const json = serializeMemoryImage({ person }, new WeakMap());

  // Deserialize
  const restored = deserializeSnapshot(json, registry) as { person: Person };

  // Verify nested instances
  assert.ok(restored.person instanceof Person);
  assert.ok(restored.person.address instanceof Address);

  // Verify methods work at all levels
  assert.strictEqual(restored.person.getInfo(), 'John lives at 123 Main St, NYC');
  assert.strictEqual(restored.person.address.getFullAddress(), '123 Main St, NYC');
});
