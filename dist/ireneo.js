const E = {
  SET: "SET",
  DELETE: "DELETE",
  ARRAY_PUSH: "ARRAY_PUSH",
  ARRAY_POP: "ARRAY_POP",
  ARRAY_SHIFT: "ARRAY_SHIFT",
  ARRAY_UNSHIFT: "ARRAY_UNSHIFT",
  ARRAY_SPLICE: "ARRAY_SPLICE",
  ARRAY_SORT: "ARRAY_SORT",
  ARRAY_REVERSE: "ARRAY_REVERSE",
  ARRAY_FILL: "ARRAY_FILL",
  ARRAY_COPYWITHIN: "ARRAY_COPYWITHIN",
  MAP_SET: "MAP_SET",
  MAP_DELETE: "MAP_DELETE",
  MAP_CLEAR: "MAP_CLEAR",
  SET_ADD: "SET_ADD",
  SET_DELETE: "SET_DELETE",
  SET_CLEAR: "SET_CLEAR",
  SCRIPT: "SCRIPT"
}, O = {
  /** Marker for typed values (e.g., functions, dates, bigints) */
  TYPE: "__type__",
  /** Marker for class instances (preserves class identity across serialization) */
  CLASS: "__class__",
  /** Internal timestamp field for Date objects (preserves Date value while allowing properties) */
  DATE_VALUE: "__dateValue__"
}, Z = [
  "push",
  "pop",
  "shift",
  "unshift",
  "splice",
  "sort",
  "reverse",
  "fill",
  "copyWithin"
], ee = [
  "set",
  "delete",
  "clear"
], te = [
  "add",
  "delete",
  "clear"
];
function $e(t) {
  if (t == null) return !0;
  const e = typeof t;
  return e === "string" || e === "number" || e === "boolean" || e === "bigint" || e === "symbol";
}
function Je(t) {
  return Array.isArray(t) || t instanceof Map || t instanceof Set;
}
function Ge(t) {
  return t == null;
}
function qe(t) {
  return t !== null && typeof t == "object" && !(t instanceof Date) && !Array.isArray(t) && !(t instanceof Map) && !(t instanceof Set) && !(t instanceof RegExp);
}
function Xe(t) {
  const e = typeof t;
  return e === "object" && t !== null || e === "function";
}
var R = /* @__PURE__ */ ((t) => (t[t.NULL = 0] = "NULL", t[t.UNDEFINED = 1] = "UNDEFINED", t[t.PRIMITIVE = 2] = "PRIMITIVE", t[t.BIGINT = 3] = "BIGINT", t[t.SYMBOL = 4] = "SYMBOL", t[t.DATE = 5] = "DATE", t[t.REGEXP = 6] = "REGEXP", t[t.FUNCTION = 7] = "FUNCTION", t[t.ARRAY = 8] = "ARRAY", t[t.MAP = 9] = "MAP", t[t.SET = 10] = "SET", t[t.OBJECT = 11] = "OBJECT", t))(R || {});
function ne(t) {
  if (t === null)
    return {
      category: 0,
      isPrimitive: !0,
      isObject: !1,
      isCollection: !1,
      needsSpecialSerialization: !1
    };
  if (t === void 0)
    return {
      category: 1,
      isPrimitive: !0,
      isObject: !1,
      isCollection: !1,
      needsSpecialSerialization: !1
    };
  const e = typeof t;
  return e === "string" || e === "number" || e === "boolean" ? {
    category: 2,
    isPrimitive: !0,
    isObject: !1,
    isCollection: !1,
    needsSpecialSerialization: !1
  } : e === "bigint" ? {
    category: 3,
    isPrimitive: !0,
    isObject: !1,
    isCollection: !1,
    needsSpecialSerialization: !0
  } : e === "symbol" ? {
    category: 4,
    isPrimitive: !0,
    isObject: !1,
    isCollection: !1,
    needsSpecialSerialization: !0
  } : t instanceof Date ? {
    category: 5,
    isPrimitive: !1,
    isObject: !0,
    isCollection: !1,
    needsSpecialSerialization: !0
  } : t instanceof RegExp ? {
    category: 6,
    isPrimitive: !1,
    isObject: !0,
    isCollection: !1,
    needsSpecialSerialization: !0
  } : e === "function" ? {
    category: 7,
    isPrimitive: !1,
    isObject: !0,
    isCollection: !1,
    needsSpecialSerialization: !0
  } : Array.isArray(t) ? {
    category: 8,
    isPrimitive: !1,
    isObject: !0,
    isCollection: !0,
    needsSpecialSerialization: !1
  } : t instanceof Map ? {
    category: 9,
    isPrimitive: !1,
    isObject: !0,
    isCollection: !0,
    needsSpecialSerialization: !0
  } : t instanceof Set ? {
    category: 10,
    isPrimitive: !1,
    isObject: !0,
    isCollection: !0,
    needsSpecialSerialization: !0
  } : {
    category: 11,
    isPrimitive: !1,
    isObject: !0,
    isCollection: !1,
    needsSpecialSerialization: !1
  };
}
function se(t) {
  return typeof t == "object" && t !== null && O.CLASS in t && typeof t[O.CLASS] == "string";
}
function re(t) {
  if (typeof t != "object" || t === null)
    return !1;
  const e = Object.getPrototypeOf(t);
  return !(e === null || e === Object.prototype || t instanceof Date || t instanceof RegExp || t instanceof Map || t instanceof Set || t instanceof Array || t instanceof Error || ArrayBuffer.isView(t) || t instanceof ArrayBuffer);
}
function ie(t) {
  const e = Object.getPrototypeOf(t);
  if (!e || e === Object.prototype)
    return null;
  const n = e.constructor;
  return !n || !n.name ? null : n.name;
}
class oe {
  constructor() {
    this.seen = /* @__PURE__ */ new Map();
  }
  hasSeen(e) {
    return this.seen.has(e);
  }
  markSeen(e, n) {
    this.seen.set(e, n);
  }
  getReference(e) {
    return this.seen.has(e) ? {
      __type__: "ref",
      path: this.seen.get(e) || []
    } : null;
  }
}
class ce {
  constructor(e, n) {
    this.targetToPath = e, this.currentPath = n, this.seen = /* @__PURE__ */ new Map();
  }
  hasSeen(e) {
    return this.seen.has(e);
  }
  markSeen(e, n) {
    this.seen.set(e, n);
  }
  getReference(e) {
    const n = this.targetToPath.get(e);
    return n && n.length > 0 && !(n.length >= this.currentPath.length && this.currentPath.every((r, c) => r === n[c])) ? {
      __type__: "ref",
      path: n
    } : this.hasSeen(e) ? {
      __type__: "ref",
      path: this.seen.get(e).slice(this.currentPath.length)
    } : null;
  }
}
function k(t, e, n, s) {
  const r = typeof t == "object" && t !== null && s.get(t) || t, c = ne(r);
  switch (c.category) {
    case R.NULL:
    case R.UNDEFINED:
      return t;
    case R.PRIMITIVE:
      return t;
    case R.BIGINT:
      return {
        [O.TYPE]: "bigint",
        value: t.toString()
      };
    case R.SYMBOL:
      return {
        [O.TYPE]: "symbol",
        description: t.description
      };
    case R.DATE: {
      const o = s.get(t) || t, i = n.getReference(o);
      if (i) return i;
      n.markSeen(o, e);
      const a = o, l = a.getTime(), f = isNaN(l) ? null : a.toISOString(), u = {
        [O.TYPE]: "date",
        [O.DATE_VALUE]: f
        // Internal timestamp (null if invalid)
      }, p = Object.entries(a);
      for (const [m, P] of p)
        u[m] = k(
          P,
          [...e, m],
          n,
          s
        );
      return u;
    }
    case R.REGEXP: {
      const o = s.get(t) || t, i = n.getReference(o);
      if (i) return i;
      n.markSeen(o, e);
      const a = o;
      return {
        [O.TYPE]: "regexp",
        source: a.source,
        flags: a.flags,
        lastIndex: a.lastIndex
      };
    }
    case R.FUNCTION: {
      const o = t;
      return o.__type__ === "function" ? {
        [O.TYPE]: "function",
        sourceCode: o.sourceCode || t.toString()
      } : void 0;
    }
    case R.MAP:
    case R.SET:
    case R.ARRAY:
    case R.OBJECT: {
      const o = s.get(t) || t, i = n.getReference(o);
      if (i) return i;
      if (n.markSeen(o, e), c.category === R.MAP)
        return {
          [O.TYPE]: "map",
          entries: Array.from(o.entries()).map(
            ([f, u], p) => [
              k(
                f,
                [...e, "key", String(p)],
                n,
                s
              ),
              k(
                u,
                [...e, "value", String(p)],
                n,
                s
              )
            ]
          )
        };
      if (c.category === R.SET)
        return {
          [O.TYPE]: "set",
          values: Array.from(o.values()).map(
            (f, u) => k(f, [...e, String(u)], n, s)
          )
        };
      if (c.category === R.ARRAY)
        return t.map(
          (f, u) => k(
            f,
            [...e, String(u)],
            n,
            s
          )
        );
      const a = {}, l = t;
      if (re(o)) {
        const f = ie(o);
        f && (a[O.CLASS] = f);
      }
      for (const f in l)
        Object.prototype.hasOwnProperty.call(l, f) && (a[f] = k(
          l[f],
          [...e, f],
          n,
          s
        ));
      return a;
    }
    default:
      return;
  }
}
const ae = (t, e) => {
  const n = new oe(), s = k(t, [], n, e);
  return JSON.stringify(s, null, 2);
}, b = (t, e, n, s) => {
  const r = new ce(n, s);
  return k(t, s, r, e);
}, le = (t) => typeof t == "object" && t !== null && "__type__" in t && typeof t.__type__ == "string", W = (t) => {
  const n = new Function(`return (${t.sourceCode})`)();
  return n.__type__ = "function", n.sourceCode = t.sourceCode, n;
}, C = (t, e, n) => {
  if (!("__dateValue__" in t))
    throw new Error("Invalid Date serialization format: missing __dateValue__ field");
  const s = t.__dateValue__, r = s === null ? /* @__PURE__ */ new Date("invalid") : new Date(s);
  for (const [c, o] of Object.entries(t))
    c === "__type__" || c === "__dateValue__" || (r[c] = e(o, n));
  return r;
}, B = (t) => {
  const e = new RegExp(t.source, t.flags);
  return t.lastIndex !== void 0 && (e.lastIndex = t.lastIndex), e;
}, $ = (t) => BigInt(t.value), J = (t) => Symbol(t.description), z = (t) => typeof t == "object" && t !== null && "__unresolved_ref__" in t, fe = (t, e) => {
  const n = /* @__PURE__ */ new Map();
  for (const [s, r] of t.entries) {
    const c = typeof s == "object" && s !== null && s.__type__ && L[s.__type__]?.(s, e) || s, o = typeof r == "object" && r !== null && r.__type__ && L[r.__type__]?.(r, e) || r;
    n.set(c, o);
  }
  return n;
}, ue = (t, e) => {
  const n = /* @__PURE__ */ new Set();
  for (const s of t.values) {
    const r = typeof s == "object" && s !== null && s.__type__ && L[s.__type__]?.(s, e) || s;
    n.add(r);
  }
  return n;
}, L = {
  function: (t) => W(t),
  date: (t, e) => C(t, (s, r) => {
    if (s && typeof s == "object" && "__type__" in s) {
      const c = L[s.__type__];
      return c ? c(s, e) : s;
    }
    return s;
  }, e),
  regexp: (t) => B(t),
  bigint: (t) => $(t),
  symbol: (t) => J(t),
  ref: (t) => ({ __unresolved_ref__: t.path }),
  map: (t, e) => fe(t, e),
  set: (t, e) => ue(t, e)
};
function G(t, e, n) {
  const s = [];
  function r(o, i = []) {
    if (o === null || typeof o != "object")
      return o;
    if (o.__type__ && L[o.__type__]) {
      const a = L[o.__type__];
      if (!a) return o;
      const l = a(o, t);
      if (l && z(l))
        return s.push({
          parent: null,
          key: null,
          path: l.__unresolved_ref__
        }), l;
      if (l instanceof Date) {
        for (const f in l)
          if (Object.prototype.hasOwnProperty.call(l, f)) {
            const u = l[f];
            u && z(u) && s.push({
              parent: l,
              key: f,
              path: u.__unresolved_ref__
            });
          }
      }
      return l;
    }
    for (const a in o)
      if (Object.prototype.hasOwnProperty.call(o, a)) {
        const l = o[a];
        if (l && typeof l == "object")
          if (l.__type__ && L[l.__type__]) {
            const f = L[l.__type__];
            if (!f) continue;
            const u = f(l, t);
            if (u && z(u))
              s.push({
                parent: o,
                key: a,
                path: u.__unresolved_ref__
              });
            else if (o[a] = u, u instanceof Date) {
              for (const p in u)
                if (Object.prototype.hasOwnProperty.call(u, p)) {
                  const m = u[p];
                  m && z(m) && s.push({
                    parent: u,
                    key: p,
                    path: m.__unresolved_ref__
                  });
                }
            }
          } else {
            const f = r(l, [...i, a]);
            f !== l && (o[a] = f);
          }
      }
    if (n && se(o)) {
      const a = o.__class__, l = n.get(a);
      if (!l)
        throw new Error(
          `Cannot reconstruct instance of class "${a}" - class not registered. Provide the class constructor in the classes option when calling load().`
        );
      Object.setPrototypeOf(o, l.prototype), delete o.__class__;
    }
    return o;
  }
  let c = r(t);
  for (const o of s) {
    const { parent: i, key: a, path: l } = o, f = e(l, c);
    i && a !== null ? i[a] = f : i === null && a === null && (c = f);
  }
  return c;
}
function pe(t, e) {
  const n = typeof t == "string" ? JSON.parse(t) : t;
  return G(n, (r, c) => {
    let o = c;
    for (const i of r)
      if (o = o[i], o === void 0)
        throw new Error(
          `Cannot resolve snapshot ref path: ${r.join(".")}`
        );
    return o;
  }, e);
}
function de(t, e, n) {
  return G(t, (c, o) => {
    let i = o, a = !0;
    for (const l of c) {
      const f = i?.[l];
      if (f === void 0) {
        a = !1;
        break;
      }
      i = f;
    }
    if (a)
      return i;
    i = e;
    for (const l of c) {
      const f = i?.[l];
      if (f === void 0)
        throw new Error(
          `Cannot resolve event value ref path: ${c.join(".")} (not found in value scope or memory scope)`
        );
      i = f;
    }
    return i;
  }, n);
}
const ye = pe, v = (t, e, n = /* @__PURE__ */ new WeakMap(), s) => {
  if (t == null || typeof t != "object") return t;
  if (n.has(t))
    return n.get(t);
  if (le(t)) {
    const c = t;
    switch (c.__type__) {
      case "function":
        return W(
          c
        );
      case "date":
        return C(
          c,
          (a, l) => v(a, e, n),
          e
        );
      case "regexp":
        return B(
          c
        );
      case "bigint":
        return $(c);
      case "symbol":
        return J(
          c
        );
      case "ref": {
        const o = c;
        let i = e;
        for (const a of o.path)
          if (i = i[a], i === void 0)
            throw new Error(
              `Cannot resolve ref path: ${o.path.join(".")}`
            );
        return i;
      }
      case "map": {
        const o = c, i = /* @__PURE__ */ new Map();
        n.set(t, i);
        for (const [a, l] of o.entries) {
          const f = v(a, e, n), u = v(l, e, n);
          i.set(f, u);
        }
        return i;
      }
      case "set": {
        const o = c, i = /* @__PURE__ */ new Set();
        n.set(t, i);
        for (const a of o.values)
          i.add(v(a, e, n));
        return i;
      }
      case "circular":
        throw new Error(
          "Encountered explicit circular marker - this indicates a serialization issue"
        );
    }
  }
  if (Array.isArray(t)) {
    const c = [];
    n.set(t, c);
    for (const o of t)
      c.push(v(o, e, n));
    return c;
  }
  const r = {};
  n.set(t, r);
  for (const c in t)
    Object.prototype.hasOwnProperty.call(t, c) && (r[c] = v(
      t[c],
      e,
      n
    ));
  return r;
};
class Ee {
  createEvent(e, n, s) {
    const [r] = n;
    return {
      type: E.SET,
      path: e,
      value: b(
        r,
        s.proxyToTarget,
        s.targetToPath,
        e
      ),
      timestamp: Date.now()
    };
  }
  applyEvent(e, n, s, r) {
    const o = de(
      e.value,
      r
      // Memory root for external ref resolution
    );
    n instanceof Map ? n.set(s, o) : n[s] = o;
  }
}
class _e {
  createEvent(e) {
    return {
      type: E.DELETE,
      path: e,
      timestamp: Date.now()
    };
  }
  applyEvent(e, n, s) {
    delete n[s];
  }
}
class he {
  createEvent(e, n, s) {
    return {
      type: E.ARRAY_PUSH,
      path: e,
      items: n.map(
        (r) => b(
          r,
          s.proxyToTarget,
          s.targetToPath,
          e
        )
      ),
      timestamp: Date.now()
    };
  }
  applyEvent(e, n, s, r) {
    const c = e, o = n[s];
    for (const i of c.items)
      o.push(v(i, r));
  }
}
class me {
  createEvent(e) {
    return {
      type: E.ARRAY_POP,
      path: e,
      timestamp: Date.now()
    };
  }
  applyEvent(e, n, s) {
    n[s].pop();
  }
}
class Se {
  createEvent(e) {
    return {
      type: E.ARRAY_SHIFT,
      path: e,
      timestamp: Date.now()
    };
  }
  applyEvent(e, n, s) {
    n[s].shift();
  }
}
class ge {
  createEvent(e, n, s) {
    return {
      type: E.ARRAY_UNSHIFT,
      path: e,
      items: n.map(
        (r) => b(
          r,
          s.proxyToTarget,
          s.targetToPath,
          e
        )
      ),
      timestamp: Date.now()
    };
  }
  applyEvent(e, n, s, r) {
    const c = e, o = n[s], i = c.items.map((a) => v(a, r));
    o.unshift(...i);
  }
}
class Pe {
  createEvent(e, n, s) {
    return {
      type: E.ARRAY_SPLICE,
      path: e,
      start: n[0],
      deleteCount: n[1] || 0,
      items: n.slice(2).map(
        (r) => b(
          r,
          s.proxyToTarget,
          s.targetToPath,
          e
        )
      ),
      timestamp: Date.now()
    };
  }
  applyEvent(e, n, s, r) {
    const c = e, o = n[s], i = c.items.map((a) => v(a, r));
    o.splice(c.start, c.deleteCount, ...i);
  }
}
class we {
  createEvent(e) {
    return {
      type: E.ARRAY_SORT,
      path: e,
      timestamp: Date.now()
    };
  }
  applyEvent(e, n, s) {
    n[s].sort();
  }
}
class Ae {
  createEvent(e) {
    return {
      type: E.ARRAY_REVERSE,
      path: e,
      timestamp: Date.now()
    };
  }
  applyEvent(e, n, s) {
    n[s].reverse();
  }
}
class Te {
  createEvent(e, n, s) {
    return {
      type: E.ARRAY_FILL,
      path: e,
      value: b(
        n[0],
        s.proxyToTarget,
        s.targetToPath,
        e
      ),
      start: n[1],
      end: n[2],
      timestamp: Date.now()
    };
  }
  applyEvent(e, n, s, r) {
    const c = e, o = n[s], i = v(c.value, r);
    o.fill(i, c.start, c.end);
  }
}
class Re {
  createEvent(e, n) {
    return {
      type: E.ARRAY_COPYWITHIN,
      path: e,
      target: n[0],
      start: n[1],
      end: n[2],
      timestamp: Date.now()
    };
  }
  applyEvent(e, n, s) {
    const r = e;
    n[s].copyWithin(r.target, r.start, r.end);
  }
}
class ve {
  createEvent(e, n, s) {
    return {
      type: E.MAP_SET,
      path: e,
      key: b(
        n[0],
        s.proxyToTarget,
        s.targetToPath,
        e
      ),
      value: b(
        n[1],
        s.proxyToTarget,
        s.targetToPath,
        e
      ),
      timestamp: Date.now()
    };
  }
  applyEvent(e, n, s, r) {
    const c = e, o = n[s], i = v(c.key, r), a = v(c.value, r);
    o.set(i, a);
  }
}
class De {
  createEvent(e, n, s) {
    return {
      type: E.MAP_DELETE,
      path: e,
      key: b(
        n[0],
        s.proxyToTarget,
        s.targetToPath,
        e
      ),
      timestamp: Date.now()
    };
  }
  applyEvent(e, n, s, r) {
    const c = e, o = n[s], i = v(c.key, r);
    o.delete(i);
  }
}
class Me {
  createEvent(e) {
    return {
      type: E.MAP_CLEAR,
      path: e,
      timestamp: Date.now()
    };
  }
  applyEvent(e, n, s) {
    n[s].clear();
  }
}
class Ie {
  createEvent(e, n, s) {
    return {
      type: E.SET_ADD,
      path: e,
      value: b(
        n[0],
        s.proxyToTarget,
        s.targetToPath,
        e
      ),
      timestamp: Date.now()
    };
  }
  applyEvent(e, n, s, r) {
    const c = e, o = n[s], i = v(c.value, r);
    o.add(i);
  }
}
class Oe {
  createEvent(e, n, s) {
    return {
      type: E.SET_DELETE,
      path: e,
      value: b(
        n[0],
        s.proxyToTarget,
        s.targetToPath,
        e
      ),
      timestamp: Date.now()
    };
  }
  applyEvent(e, n, s, r) {
    const c = e, o = n[s], i = v(c.value, r);
    o.delete(i);
  }
}
class be {
  createEvent(e) {
    return {
      type: E.SET_CLEAR,
      path: e,
      timestamp: Date.now()
    };
  }
  applyEvent(e, n, s) {
    n[s].clear();
  }
}
class ke {
  createEvent(e, n) {
    return {
      type: E.SCRIPT,
      path: e,
      source: n[0],
      timestamp: Date.now()
    };
  }
  applyEvent() {
  }
}
class Le {
  constructor() {
    this.handlers = /* @__PURE__ */ new Map();
  }
  /**
   * Register a handler for an event type
   */
  register(e, n) {
    this.handlers.set(e, n);
  }
  /**
   * Create an event from a mutation
   *
   * Replaces 112 lines of switch cases in proxy.ts
   */
  createEvent(e, n, s, r) {
    const c = this.handlers.get(e);
    if (!c)
      throw new Error(`No handler registered for event type: ${e}`);
    return c.createEvent(n, s, r);
  }
  /**
   * Apply an event during replay
   *
   * Replaces 153 lines of switch cases in replay.ts
   */
  applyEvent(e, n, s, r) {
    const c = this.handlers.get(e.type);
    if (!c)
      throw new Error(`No handler registered for event type: ${e.type}`);
    c.applyEvent(e, n, s, r);
  }
  /**
   * Check if a handler is registered
   */
  hasHandler(e) {
    return this.handlers.has(e);
  }
}
const T = new Le();
T.register(E.SET, new Ee());
T.register(E.DELETE, new _e());
T.register(E.ARRAY_PUSH, new he());
T.register(E.ARRAY_POP, new me());
T.register(E.ARRAY_SHIFT, new Se());
T.register(E.ARRAY_UNSHIFT, new ge());
T.register(E.ARRAY_SPLICE, new Pe());
T.register(E.ARRAY_SORT, new we());
T.register(E.ARRAY_REVERSE, new Ae());
T.register(E.ARRAY_FILL, new Te());
T.register(E.ARRAY_COPYWITHIN, new Re());
T.register(E.MAP_SET, new ve());
T.register(E.MAP_DELETE, new De());
T.register(E.MAP_CLEAR, new Me());
T.register(E.SET_ADD, new Ie());
T.register(E.SET_DELETE, new Oe());
T.register(E.SET_CLEAR, new be());
T.register(E.SCRIPT, new ke());
const Ye = {
  Array: { eventPrefix: "ARRAY" },
  Map: { eventPrefix: "MAP" },
  Set: { eventPrefix: "SET" }
}, F = (t, e, n, s, r, c, o) => {
  const i = Ye[e];
  if (!i)
    throw new Error(`Unknown collection type: ${String(e)}`);
  return function(...a) {
    const l = r.targetToPath.get(t) || [], f = s.apply(t, a);
    if (c && o && !o.isReplaying) {
      const u = `${i.eventPrefix}_${n.toUpperCase()}`, p = T.createEvent(
        u,
        l,
        a,
        r
      );
      c.append(p);
    }
    return f;
  };
};
class xe {
  constructor() {
    this.typeName = "Array", this.mutatingMethods = Z;
  }
  isApplicable(e) {
    return Array.isArray(e);
  }
  wrapContents(e, n, s) {
    for (let r = 0; r < e.length; r++) {
      const c = [...n, String(r)];
      e[r] = s(e[r], c);
    }
  }
  isMethod(e, n) {
    return typeof n == "string" && typeof e[n] == "function";
  }
  isMutatingMethod(e) {
    return this.mutatingMethods.includes(e);
  }
  wrapMutatingMethod(e, n, s, r, c, o) {
    return F(
      e,
      this.typeName,
      n,
      s,
      r,
      c,
      o
    );
  }
}
class Ne {
  constructor() {
    this.typeName = "Map", this.mutatingMethods = ee;
  }
  isApplicable(e) {
    return e instanceof Map;
  }
  wrapContents(e, n, s) {
    const r = Array.from(e.entries());
    e.clear();
    for (const [c, o] of r) {
      const i = [...n, String(c)], a = s(c, i), l = s(o, i);
      e.set(a, l);
    }
  }
  isMethod(e, n) {
    return typeof n == "string" && typeof e[n] == "function";
  }
  isMutatingMethod(e) {
    return this.mutatingMethods.includes(e);
  }
  wrapMutatingMethod(e, n, s, r, c, o) {
    return F(
      e,
      this.typeName,
      n,
      s,
      r,
      c,
      o
    );
  }
}
class ze {
  constructor() {
    this.typeName = "Set", this.mutatingMethods = te;
  }
  isApplicable(e) {
    return e instanceof Set;
  }
  wrapContents(e, n, s) {
    const r = Array.from(e.values());
    e.clear();
    for (const c of r) {
      const o = [...n, String(c)], i = s(c, o);
      e.add(i);
    }
  }
  isMethod(e, n) {
    return typeof n == "string" && typeof e[n] == "function";
  }
  isMutatingMethod(e) {
    return this.mutatingMethods.includes(e);
  }
  wrapMutatingMethod(e, n, s, r, c, o) {
    return F(
      e,
      this.typeName,
      n,
      s,
      r,
      c,
      o
    );
  }
}
const He = [
  new xe(),
  new Ne(),
  new ze()
];
function j(t) {
  return He.find((e) => e.isApplicable(t));
}
function Ue(t, e, n) {
  const s = j(t);
  s && s.wrapContents(t, e, n);
}
const Fe = (t) => ({
  targetToProxy: /* @__PURE__ */ new WeakMap(),
  proxyToTarget: /* @__PURE__ */ new WeakMap(),
  targetToPath: /* @__PURE__ */ new WeakMap(),
  metadata: t
}), je = (t, e, n) => {
  const s = t;
  if (n.targetToProxy.has(s)) {
    const i = n.targetToProxy.get(s);
    if (i)
      return i;
  }
  const r = t;
  try {
    r.__type__ = "function", r.sourceCode = t.toString();
  } catch {
  }
  const c = {
    get(i, a) {
      return a === "__type__" && !i.__type__ ? "function" : a === "sourceCode" && !i.sourceCode ? i.toString() : i[a];
    },
    apply(i, a, l) {
      return i.apply(a, l);
    }
  }, o = new Proxy(r, c);
  return n.targetToProxy.set(t, o), n.proxyToTarget.set(o, t), n.targetToPath.set(t, e), o;
}, x = (t, e, n, s, r) => {
  if (typeof t == "function")
    return je(t, e, n);
  if (t === null || typeof t != "object" || n.proxyToTarget.has(t))
    return t;
  if (n.targetToProxy.has(t))
    return n.targetToProxy.get(t);
  const c = Ke(n, s, r), o = t, i = new Proxy(t, c);
  if (n.targetToProxy.set(o, i), n.proxyToTarget.set(i, o), n.targetToPath.set(o, e), j(t))
    Ue(
      t,
      e,
      (l, f) => x(l, f, n, s, r)
    );
  else
    for (const l in t)
      if (Object.prototype.hasOwnProperty.call(t, l))
        try {
          t[l] = x(
            t[l],
            [...e, l],
            n,
            s,
            r
          );
        } catch {
        }
  return i;
}, Ke = (t, e, n) => ({
  /**
   * GET trap - Intercepts property access
   *
   * Main job: Wrap collection mutation methods before returning them.
   */
  get(s, r) {
    const c = s[r];
    if (s instanceof Date) {
      if ([
        // Getters
        "getTime",
        "getFullYear",
        "getMonth",
        "getDate",
        "getDay",
        "getHours",
        "getMinutes",
        "getSeconds",
        "getMilliseconds",
        "getUTCFullYear",
        "getUTCMonth",
        "getUTCDate",
        "getUTCDay",
        "getUTCHours",
        "getUTCMinutes",
        "getUTCSeconds",
        "getUTCMilliseconds",
        "getTimezoneOffset",
        // Setters (these WILL be tracked as they mutate the timestamp)
        "setTime",
        "setFullYear",
        "setMonth",
        "setDate",
        "setHours",
        "setMinutes",
        "setSeconds",
        "setMilliseconds",
        "setUTCFullYear",
        "setUTCMonth",
        "setUTCDate",
        "setUTCHours",
        "setUTCMinutes",
        "setUTCSeconds",
        "setUTCMilliseconds",
        // Conversion methods
        "toISOString",
        "toDateString",
        "toTimeString",
        "toLocaleDateString",
        "toLocaleString",
        "toLocaleTimeString",
        "toUTCString",
        "toString",
        "toJSON",
        // Other
        "valueOf"
      ].includes(r)) {
        const i = c;
        return typeof i == "function" ? i.bind(s) : i;
      }
      if (r === Symbol.toPrimitive)
        return s[Symbol.toPrimitive].bind(s);
    }
    if (s instanceof RegExp) {
      if ([
        // Test/match methods
        "test",
        "exec",
        // Conversion methods
        "toString",
        // Symbol methods
        Symbol.match,
        Symbol.matchAll,
        Symbol.replace,
        Symbol.search,
        Symbol.split
      ].includes(r)) {
        const i = c;
        return typeof i == "function" ? i.bind(s) : i;
      }
      if (r === Symbol.toPrimitive)
        return s[Symbol.toPrimitive]?.bind(s);
    }
    if (typeof c == "function") {
      const o = j(s);
      if (o && o.isMethod(s, r)) {
        const i = String(r);
        if (o.isMutatingMethod(i))
          return o.wrapMutatingMethod(
            s,
            i,
            c,
            t,
            e,
            n
          );
        if (o.typeName === "Map" || o.typeName === "Set")
          return c.bind(s);
      }
    }
    if (c !== null && typeof c == "object") {
      const i = [...t.targetToPath.get(s) || [], String(r)];
      return x(
        c,
        i,
        t,
        e,
        n
      );
    }
    return c;
  },
  /**
   * SET trap - Intercepts property assignment
   *
   * This is the heart of mutation tracking. Every assignment triggers this.
   *
   * RUNTIME FLOW:
   *
   * When user writes: `scott.emps.king.sal = 5000`
   *
   * 1. JavaScript evaluates to: king_proxy.sal = 5000
   * 2. SET trap fires on king_proxy
   * 3. We look up king's path: ['emps', 'king']
   * 4. Build new path: ['emps', 'king', 'sal']
   * 5. Wrap value recursively (creates proxies if needed)
   * 6. Assign wrapped value to underlying object
   * 7. Create & log SET event
   *
   * IMPORTANT: We wrap the value BEFORE assigning it, ensuring that any
   * objects in the value tree are also tracked. This maintains the invariant:
   * "every object in the graph is either a proxy or immutable".
   */
  set(s, r, c) {
    const i = [...t.targetToPath.get(s) || [], String(r)], a = x(
      c,
      i,
      t,
      e,
      n
    );
    if (s[r] = a, e && n && !n.isReplaying) {
      const l = T.createEvent(
        E.SET,
        i,
        [a],
        // Will be serialized with smart reference detection
        t
      );
      e.append(l);
    }
    return !0;
  },
  /**
   * DELETE trap - Intercepts property deletion
   */
  deleteProperty(s, r) {
    const o = [...t.targetToPath.get(s) || [], String(r)];
    if (delete s[r], e && n && !n.isReplaying) {
      const i = T.createEvent(
        E.DELETE,
        o,
        [],
        t
      );
      e.append(i);
    }
    return !0;
  }
});
function q(t, e, n = {}) {
  const { createIntermediates: s = !1 } = n;
  if (e.length === 0)
    return null;
  if (e.length === 1)
    return {
      parent: t,
      key: e[0],
      exists: !0
      // We can't check existence without accessing, let caller decide
    };
  let r = t, c = !0;
  for (let i = 0; i < e.length - 1; i++) {
    const a = e[i];
    if (a)
      if (r instanceof Map) {
        if (!r.has(a))
          if (s) {
            const l = e[i + 1], f = l && /^\d+$/.test(l) ? [] : {};
            r.set(a, f);
          } else {
            c = !1;
            break;
          }
        r = r.get(a);
      } else if (r !== null && typeof r == "object") {
        if (!(a in r))
          if (s) {
            const l = e[i + 1];
            r[a] = l && /^\d+$/.test(l) ? [] : {};
          } else {
            c = !1;
            break;
          }
        r = r[a];
      } else {
        c = !1;
        break;
      }
  }
  const o = e[e.length - 1];
  return {
    parent: r,
    key: o,
    exists: c
  };
}
const K = (t, e) => {
  const n = q(t, e.path, { createIntermediates: !0 });
  if (!n)
    return;
  const { parent: s, key: r } = n;
  T.applyEvent(e, s, r, t);
}, U = async (t, e, n) => {
  if (n.isReplaying = !0, Array.isArray(e))
    for (const s of e)
      K(t, s);
  else
    for await (const s of e)
      K(t, s);
  n.isReplaying = !1;
}, X = async (t, e, n) => {
  if (e.stream)
    await U(t, e.stream(), n);
  else {
    const s = await e.getAll();
    await U(t, s, n);
  }
};
class Ve {
  constructor() {
    this.delta = /* @__PURE__ */ new Map(), this.DELETED = Symbol("deleted");
  }
  /**
   * Get deletion marker symbol
   */
  getDeletedSymbol() {
    return this.DELETED;
  }
  /**
   * Check if there are any uncommitted changes
   */
  isDirty() {
    return this.delta.size > 0;
  }
  /**
   * Get count of uncommitted changes
   */
  size() {
    return this.delta.size;
  }
  /**
   * Check if a path exists in delta
   */
  has(e) {
    return this.delta.has(e);
  }
  /**
   * Get value at path from delta
   */
  get(e) {
    return this.delta.get(e);
  }
  /**
   * Set value at path in delta
   */
  set(e, n) {
    this.delta.set(e, n);
  }
  /**
   * Mark a path as deleted in delta
   */
  delete(e) {
    this.delta.set(e, this.DELETED);
  }
  /**
   * Check if a path is marked as deleted
   */
  isDeleted(e) {
    return this.delta.get(e) === this.DELETED;
  }
  /**
   * Clear all uncommitted changes
   */
  clear() {
    this.delta.clear();
  }
  /**
   * Get all delta entries
   *
   * Returns array of [pathKey, value] tuples, sorted by path depth
   * (shallowest first). This ensures parent objects are created before children.
   */
  entries() {
    return Array.from(this.delta.entries()).sort((e, n) => {
      const s = e[0].split(".").length, r = n[0].split(".").length;
      return s - r;
    });
  }
  /**
   * Create a checkpoint of current delta state
   *
   * Returns a shallow copy of the delta Map that can be used to restore state later.
   * Used for transaction rollback (e.g., when script execution fails).
   */
  createCheckpoint() {
    return new Map(this.delta);
  }
  /**
   * Restore delta to a previously saved checkpoint
   *
   * Discards all changes made after the checkpoint was created.
   */
  restoreCheckpoint(e) {
    this.delta.clear();
    for (const [n, s] of e)
      this.delta.set(n, s);
  }
}
function We(t) {
  return t !== null && typeof t == "object";
}
function Y(t, e, n = /* @__PURE__ */ new WeakMap()) {
  if (!We(t))
    return t;
  if (n.has(t))
    return n.get(t);
  const s = e.has(t) ? e.get(t) : t;
  if (s !== t && n.has(s)) {
    const i = n.get(s);
    return n.set(t, i), i;
  }
  if (s instanceof Map) {
    const i = /* @__PURE__ */ new Map();
    n.set(t, i), s !== t && n.set(s, i);
    let a = !1;
    for (const [f, u] of s.entries()) {
      const p = Y(f, e, n), m = Y(u, e, n);
      i.set(p, m), (p !== f || m !== u) && (a = !0);
    }
    const l = a ? i : s;
    return n.set(t, l), s !== t && n.set(s, l), l;
  }
  if (s instanceof Set) {
    const i = /* @__PURE__ */ new Set();
    n.set(t, i), s !== t && n.set(s, i);
    let a = !1;
    for (const f of s.values()) {
      const u = Y(f, e, n);
      i.add(u), u !== f && (a = !0);
    }
    const l = a ? i : s;
    return n.set(t, l), s !== t && n.set(s, l), l;
  }
  if (Array.isArray(s)) {
    const i = [];
    n.set(t, i), s !== t && n.set(s, i);
    let a = !1;
    for (const f of s) {
      const u = Y(f, e, n);
      i.push(u), u !== f && (a = !0);
    }
    const l = a ? i : s;
    return n.set(t, l), s !== t && n.set(s, l), l;
  }
  const r = {};
  n.set(t, r), s !== t && n.set(s, r);
  let c = !1;
  for (const [i, a] of Object.entries(s)) {
    const l = Y(a, e, n);
    r[i] = l, l !== a && (c = !0);
  }
  const o = c ? r : s;
  return n.set(t, o), s !== t && n.set(s, o), o;
}
function M(t) {
  return t !== null && typeof t == "object";
}
function D(t, e, n, s, r) {
  if (s.has(t))
    return s.get(t);
  const c = e.getDeletedSymbol(), o = new Proxy(t, {
    get(i, a) {
      if (typeof a == "symbol")
        return i[a];
      const l = [...n, String(a)], f = l.join(".");
      if (e.has(f)) {
        const p = e.get(f);
        return p === c ? void 0 : M(p) ? r.has(p) ? p : D(p, e, l, s, r) : p;
      }
      const u = i[a];
      if (typeof u == "function" && Array.isArray(i)) {
        const p = String(a);
        return ["push", "pop", "shift", "unshift", "splice", "sort", "reverse"].includes(p) ? function(...w) {
          const y = n.join(".");
          let _;
          e.has(y) ? _ = e.get(y) : (_ = [...i], e.set(y, _));
          let S = w;
          return (p === "push" || p === "unshift" || p === "splice") && (S = w.map((d, h) => {
            if (!M(d)) return d;
            if (s.has(d)) return s.get(d);
            if (r.has(d)) return d;
            let A;
            if (p === "push")
              A = [...n, String(_.length + h)];
            else if (p === "unshift")
              A = [...n, String(h)];
            else {
              const I = w[0];
              if (h < 2) return d;
              A = [...n, String(I + h - 2)];
            }
            return D(d, e, A, s, r);
          })), u.apply(_, S);
        } : ["find", "findLast", "filter", "map", "flatMap"].includes(p) ? function(...w) {
          const y = u.apply(i, w);
          if (y == null) return y;
          if (p === "find" || p === "findLast") {
            if (M(y)) {
              const _ = i.indexOf(y);
              if (_ !== -1) {
                const S = [...n, String(_)];
                return D(y, e, S, s, r);
              }
            }
            return y;
          } else
            return Array.isArray(y) ? y.map((_, S) => {
              if (M(_)) {
                const g = i.indexOf(_);
                if (g !== -1) {
                  const d = [...n, String(g)];
                  return D(_, e, d, s, r);
                }
              }
              return _;
            }) : y;
        } : u.bind(i);
      }
      if (typeof u == "function" && i instanceof Map) {
        const p = String(a);
        return ["set", "delete", "clear"].includes(p) ? function(...y) {
          if (p === "set" && y.length >= 2) {
            const [_, S] = y, g = [...n, String(_)], d = g.join(".");
            let h = S;
            return M(S) && (s.has(S) ? h = s.get(S) : r.has(S) || (h = D(S, e, g, s, r))), e.set(d, h), i;
          }
          if (p === "delete" && y.length >= 1) {
            const [_] = y, g = [...n, String(_)].join(".");
            return e.delete(g), !0;
          }
          if (p === "clear") {
            const _ = new Set(i.keys()), S = n.join(".") + ".";
            for (const [g] of e.entries())
              if (g.startsWith(S)) {
                const d = g.slice(S.length);
                d.includes(".") || _.add(d);
              }
            for (const g of _) {
              const h = [...n, String(g)].join(".");
              e.delete(h);
            }
            return;
          }
          return u.apply(i, y);
        } : ["get"].includes(p) ? function(...y) {
          const [_] = y, S = [...n, String(_)], g = S.join(".");
          if (e.has(g)) {
            const h = e.get(g);
            return h === c ? void 0 : M(h) ? s.has(h) ? s.get(h) : r.has(h) ? h : D(h, e, S, s, r) : h;
          }
          const d = i.get(_);
          return d != null && M(d) ? s.has(d) ? s.get(d) : r.has(d) ? d : D(d, e, S, s, r) : d;
        } : ["values", "entries", "keys", "forEach"].includes(p) ? function(...y) {
          const _ = /* @__PURE__ */ new Map();
          for (const [g, d] of i.entries())
            _.set(g, d);
          const S = n.join(".") + ".";
          for (const [g, d] of e.entries())
            if (g.startsWith(S)) {
              const h = g.slice(S.length);
              if (!h.includes(".")) {
                const A = h;
                d === c ? _.delete(A) : _.set(A, d);
              }
            }
          if (p === "forEach") {
            const [g, d] = y;
            for (const [h, A] of _.entries()) {
              let I = A;
              if (M(A)) {
                const H = [...n, String(h)];
                s.has(A) ? I = s.get(A) : r.has(A) || (I = D(A, e, H, s, r));
              }
              g.call(d, I, h, i);
            }
            return;
          } else {
            let g;
            return p === "values" ? g = _.values() : p === "entries" ? g = _.entries() : g = _.keys(), {
              [Symbol.iterator]() {
                return this;
              },
              next() {
                const d = g.next();
                if (!d.done && d.value !== void 0) {
                  if (p === "values") {
                    const h = d.value;
                    if (M(h)) {
                      let A = null;
                      for (const [I, H] of _.entries())
                        if (H === h) {
                          A = I;
                          break;
                        }
                      if (A !== null && !s.has(h) && !r.has(h)) {
                        const I = [...n, String(A)];
                        d.value = D(h, e, I, s, r);
                      } else s.has(h) && (d.value = s.get(h));
                    }
                  } else if (p === "entries") {
                    const [h, A] = d.value;
                    if (M(A)) {
                      if (s.has(A))
                        d.value = [h, s.get(A)];
                      else if (!r.has(A)) {
                        const I = [...n, String(h)];
                        d.value = [h, D(A, e, I, s, r)];
                      }
                    }
                  }
                }
                return d;
              }
            };
          }
        } : u.bind(i);
      }
      if (typeof u == "function" && i instanceof Set) {
        const p = String(a);
        return ["add", "delete", "clear"].includes(p) ? function(...P) {
          const w = n.join(".");
          let y;
          if (e.has(w) ? y = e.get(w) : (y = new Set(i), e.set(w, y)), p === "add" && P.length >= 1) {
            const S = P[0];
            if (M(S) && !s.has(S) && !r.has(S)) {
              const g = [...n, String(S)];
              P[0] = D(S, e, g, s, r);
            }
          }
          return u.apply(y, P);
        } : u.bind(i);
      }
      return M(u) ? r.has(u) ? u : D(u, e, l, s, r) : u;
    },
    set(i, a, l) {
      const u = [...n, String(a)].join(".");
      return e.set(u, l), !0;
    },
    has(i, a) {
      const f = [...n, String(a)].join(".");
      return e.has(f) ? e.get(f) !== c : a in i;
    },
    deleteProperty(i, a) {
      const f = [...n, String(a)].join(".");
      return e.delete(f), !0;
    },
    ownKeys(i) {
      const a = Reflect.ownKeys(i), l = n.length > 0 ? n.join(".") + "." : "", f = /* @__PURE__ */ new Set();
      for (const [p, m] of e.entries())
        if (p.startsWith(l)) {
          const P = p.slice(l.length), w = P.indexOf("."), y = w === -1 ? P : P.slice(0, w);
          m !== c && f.add(y);
        }
      const u = new Set(a);
      for (const [p, m] of e.entries())
        if (p.startsWith(l)) {
          const P = p.slice(l.length);
          if (P.indexOf(".") === -1) {
            const y = P;
            m === c ? u.delete(y) : u.add(y);
          }
        }
      return Array.from(u);
    },
    getOwnPropertyDescriptor(i, a) {
      const f = [...n, String(a)].join(".");
      if (e.has(f)) {
        const u = e.get(f);
        return u === c ? void 0 : {
          value: u,
          writable: !0,
          enumerable: !0,
          configurable: !0
        };
      }
      return Reflect.getOwnPropertyDescriptor(i, a);
    }
  });
  return s.set(t, o), r.set(o, t), o;
}
async function Qe(t) {
  const e = new Ve(), n = e.getDeletedSymbol(), s = /* @__PURE__ */ new WeakMap(), r = /* @__PURE__ */ new WeakMap(), c = {};
  return await X(c, t, { isReplaying: !0 }), {
    root: D(c, e, [], s, r),
    isDirty() {
      return e.isDirty();
    },
    getUncommittedCount() {
      return e.size();
    },
    async save() {
      const i = e.entries(), a = /* @__PURE__ */ new WeakMap(), l = (f, u, p = []) => {
        if (!(u === null || typeof u != "object") && !f.has(u))
          if (f.set(u, p), Array.isArray(u))
            u.forEach((m, P) => l(f, m, [...p, String(P)]));
          else if (u instanceof Map) {
            let m = 0;
            u.forEach((P) => l(f, P, [...p, `map:${m++}`]));
          } else if (u instanceof Set) {
            let m = 0;
            u.forEach((P) => l(f, P, [...p, `set:${m++}`]));
          } else u instanceof Date || Object.entries(u).forEach(([m, P]) => l(f, P, [...p, m]));
      };
      for (const [f, u] of i) {
        const p = /* @__PURE__ */ new WeakMap();
        l(p, c);
        const m = f.split("."), P = q(c, m, { createIntermediates: !1 });
        if (!P)
          continue;
        const { parent: w, key: y } = P;
        if (u === n)
          w instanceof Map || w instanceof Set ? w.delete(y) : w !== null && typeof w == "object" && delete w[y], await t.append({
            type: "DELETE",
            path: m,
            timestamp: Date.now()
          });
        else {
          const _ = Y(u, r, a), S = b(
            _,
            /* @__PURE__ */ new WeakMap(),
            // proxyToTarget (empty since value is already unwrapped)
            p,
            // targetToPath from baseRaw for reference detection
            m
          );
          w instanceof Map ? w.set(y, _) : w !== null && typeof w == "object" && (w[y] = _), await t.append({
            type: "SET",
            path: m,
            value: S,
            timestamp: Date.now()
          });
        }
      }
      e.clear();
    },
    discard() {
      e.clear();
    },
    createCheckpoint() {
      return e.createCheckpoint();
    },
    restoreCheckpoint(i) {
      e.restoreCheckpoint(i);
    },
    unwrap(i) {
      return Y(i, r);
    }
  };
}
const N = /* @__PURE__ */ new WeakMap(), Q = (t = {}, e = {}) => {
  const { eventLog: n, replayState: s = { isReplaying: !1 }, metadata: r } = e, c = Fe(r), o = x(
    t,
    [],
    // Root path is empty array
    c,
    n,
    s
  );
  return N.set(o, c), o;
}, Ze = (t) => {
  const e = N.get(t);
  if (!e)
    throw new Error("Not a memory image root - use createMemoryImage() first");
  return ae(t, e.proxyToTarget);
}, et = (t) => ye(t), tt = async (t, e = {}) => {
  const n = { isReplaying: !0 }, s = Q({}, { ...e, replayState: n });
  return await U(s, t, n), s;
}, nt = async (t) => {
  if (!t.eventLog)
    throw new Error("eventLog is required for replayEventsFromLog");
  const e = { isReplaying: !0 }, n = Q({}, { ...t, replayState: e });
  return await X(n, t.eventLog, e), n;
}, Ce = {
  getDescriptor: () => null,
  getKeyProperty: () => null,
  isDisplayProperty: () => !0,
  getPropertyLabel: () => null
}, st = (t) => N.get(t)?.metadata || Ce, rt = (t) => N.get(t) || null, it = (t) => typeof t == "object" && t !== null && N.has(t), ot = () => {
  const t = [];
  return {
    append: async (e) => {
      t.push(e);
    },
    getAll: async () => [...t],
    clear: async () => {
      t.length = 0;
    },
    // Convenience property for testing
    get length() {
      return t.length;
    }
  };
}, ct = async (t) => {
  let e, n;
  try {
    e = await Promise.resolve().then(() => V), n = await Promise.resolve().then(() => V);
  } catch {
    throw new Error(
      "FileEventLog requires Node.js fs and readline modules. In browsers, consider using createIndexedDBEventLog() or implementing a custom event log using the File System Access API."
    );
  }
  return e.existsSync(t) || e.writeFileSync(t, ""), {
    /**
     * Appends an event to the log file.
     * Each event becomes one line (JSON + newline).
     */
    append: async (s) => {
      const r = JSON.stringify(s) + `
`;
      e.appendFileSync(t, r, "utf8");
    },
    /**
     * Loads ALL events into memory and returns them as an array.
     *
     * WARNING: For large logs (millions of events), this can consume lots of memory.
     * Use stream() instead for memory-efficient replay.
     */
    getAll: async () => {
      const s = e.readFileSync(t, "utf8");
      return s.trim() ? s.trim().split(`
`).map((r) => JSON.parse(r)) : [];
    },
    /**
     * Streams events one at a time as an async generator.
     *
     * This is the memory-efficient way to replay large event logs.
     * Uses Node.js readline to read file line-by-line without loading it all into memory.
     *
     * Usage:
     *   for await (const event of eventLog.stream()) {
     *     // Process event
     *   }
     */
    stream: async function* () {
      const s = e.createReadStream(t, { encoding: "utf8" }), r = n.createInterface({
        input: s,
        crlfDelay: 1 / 0
        // Treat \r\n as single line break
      });
      for await (const c of r)
        c.trim() && (yield JSON.parse(c));
    },
    /**
     * Clears all events by truncating the file.
     */
    clear: async () => {
      e.writeFileSync(t, "");
    }
  };
}, at = (t = "ireneo", e = "events") => {
  let n, s = !1;
  const r = new Promise((o, i) => {
    if (typeof indexedDB > "u") {
      i(new Error("IndexedDB not available (browser only)"));
      return;
    }
    const a = indexedDB.open(t);
    a.onerror = () => i(a.error), a.onsuccess = () => {
      const l = a.result, f = l.objectStoreNames.contains(e), u = l.version;
      if (l.close(), f) {
        const p = indexedDB.open(t, u);
        p.onerror = () => i(p.error), p.onsuccess = () => {
          n = p.result, o();
        };
      } else {
        const p = indexedDB.open(t, u + 1);
        p.onerror = () => i(p.error), p.onsuccess = () => {
          n = p.result, o();
        }, p.onupgradeneeded = (m) => {
          const P = m.target.result;
          P.objectStoreNames.contains(e) || P.createObjectStore(e, { autoIncrement: !0 });
        };
      }
    }, a.onupgradeneeded = (l) => {
      const f = l.target.result;
      f.objectStoreNames.contains(e) || f.createObjectStore(e, { autoIncrement: !0 });
    };
  }), c = () => {
    if (s)
      throw new Error(
        `EventLog (${e}) has been closed and cannot be used. This usually happens when switching between memory images.`
      );
  };
  return {
    /**
     * Appends an event to the IndexedDB store.
     * Event is stored as JavaScript object (no serialization needed).
     * @throws {Error} if the event log has been closed
     */
    append: async (o) => (c(), await r, new Promise((i, a) => {
      const u = n.transaction([e], "readwrite").objectStore(e).add(o);
      u.onsuccess = () => i(), u.onerror = () => a(u.error);
    })),
    /**
     * Retrieves all events from the store.
     * Returns them in key order (insertion order due to auto-increment).
     * @throws {Error} if the event log has been closed
     */
    getAll: async () => (c(), await r, new Promise((o, i) => {
      const f = n.transaction([e], "readonly").objectStore(e).getAll();
      f.onsuccess = () => o(f.result), f.onerror = () => i(f.error);
    })),
    /**
     * Clears all events from the store.
     * @throws {Error} if the event log has been closed
     */
    clear: async () => (c(), await r, new Promise((o, i) => {
      const f = n.transaction([e], "readwrite").objectStore(e).clear();
      f.onsuccess = () => o(), f.onerror = () => i(f.error);
    })),
    /**
     * Closes the IndexedDB connection and marks this event log as unusable.
     * Safe to call multiple times (idempotent).
     *
     * CRITICAL: Must be called when switching between memory images to prevent
     * blocking database version upgrades. An open connection will cause subsequent
     * indexedDB.open() calls to hang indefinitely with onblocked event.
     *
     * After calling close(), any subsequent calls to append/getAll/clear will throw.
     * This is intentional - prevents subtle bugs from using a closed event log.
     */
    close: async () => {
      if (!s) {
        s = !0;
        try {
          await r, n && (n.close(), await new Promise((o) => setTimeout(o, 50)));
        } catch (o) {
          console.warn(`EventLog close(): Database was never initialized (${e})`, o);
        }
      }
    }
  };
}, lt = (t = "ireneo-events") => {
  if (typeof localStorage > "u")
    throw new Error("LocalStorage not available (browser only)");
  return {
    /**
     * Appends an event to LocalStorage.
     * Reads entire array, adds event, writes back (inefficient for large logs).
     */
    append: async (e) => {
      const n = localStorage.getItem(t), s = n ? JSON.parse(n) : [];
      s.push(e), localStorage.setItem(t, JSON.stringify(s));
    },
    /**
     * Returns all events from LocalStorage.
     */
    getAll: async () => {
      const e = localStorage.getItem(t);
      return e ? JSON.parse(e) : [];
    },
    /**
     * Clears all events from LocalStorage.
     */
    clear: async () => {
      localStorage.removeItem(t);
    }
  };
}, Be = {}, V = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: Be
}, Symbol.toStringTag, { value: "Module" }));
export {
  R as ValueCategory,
  ne as classifyValue,
  ct as createFileEventLog,
  ot as createInMemoryEventLog,
  at as createIndexedDBEventLog,
  lt as createLocalStorageEventLog,
  Q as createMemoryImage,
  Qe as createTransaction,
  et as deserializeMemoryImageFromJson,
  rt as getMemoryImageInfrastructure,
  st as getMemoryImageMetadata,
  Je as isCollection,
  it as isMemoryImage,
  Ge as isNullish,
  Xe as isObject,
  qe as isPlainObject,
  $e as isPrimitive,
  nt as replayEventsFromLog,
  tt as replayEventsToMemoryImage,
  Ze as serializeMemoryImageToJson
};
