const d = {
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
}, g = {
  /** Marker for typed values (e.g., functions, dates, bigints) */
  TYPE: "__type__",
  /** Marker for class instances (preserves class identity across serialization) */
  CLASS: "__class__",
  /** Internal timestamp field for Date objects (preserves Date value while allowing properties) */
  DATE_VALUE: "__dateValue__"
}, W = [
  "push",
  "pop",
  "shift",
  "unshift",
  "splice",
  "sort",
  "reverse",
  "fill",
  "copyWithin"
], K = [
  "set",
  "delete",
  "clear"
], V = [
  "add",
  "delete",
  "clear"
];
function Ye(e) {
  if (e == null) return !0;
  const t = typeof e;
  return t === "string" || t === "number" || t === "boolean" || t === "bigint" || t === "symbol";
}
function Le(e) {
  return Array.isArray(e) || e instanceof Map || e instanceof Set;
}
function Ce(e) {
  return e == null;
}
function ze(e) {
  return e !== null && typeof e == "object" && !(e instanceof Date) && !Array.isArray(e) && !(e instanceof Map) && !(e instanceof Set) && !(e instanceof RegExp);
}
function He(e) {
  const t = typeof e;
  return t === "object" && e !== null || t === "function";
}
var m = /* @__PURE__ */ ((e) => (e[e.NULL = 0] = "NULL", e[e.UNDEFINED = 1] = "UNDEFINED", e[e.PRIMITIVE = 2] = "PRIMITIVE", e[e.BIGINT = 3] = "BIGINT", e[e.SYMBOL = 4] = "SYMBOL", e[e.DATE = 5] = "DATE", e[e.REGEXP = 6] = "REGEXP", e[e.FUNCTION = 7] = "FUNCTION", e[e.ARRAY = 8] = "ARRAY", e[e.MAP = 9] = "MAP", e[e.SET = 10] = "SET", e[e.OBJECT = 11] = "OBJECT", e))(m || {});
function $(e) {
  if (e === null)
    return {
      category: 0,
      isPrimitive: !0,
      isObject: !1,
      isCollection: !1,
      needsSpecialSerialization: !1
    };
  if (e === void 0)
    return {
      category: 1,
      isPrimitive: !0,
      isObject: !1,
      isCollection: !1,
      needsSpecialSerialization: !1
    };
  const t = typeof e;
  return t === "string" || t === "number" || t === "boolean" ? {
    category: 2,
    isPrimitive: !0,
    isObject: !1,
    isCollection: !1,
    needsSpecialSerialization: !1
  } : t === "bigint" ? {
    category: 3,
    isPrimitive: !0,
    isObject: !1,
    isCollection: !1,
    needsSpecialSerialization: !0
  } : t === "symbol" ? {
    category: 4,
    isPrimitive: !0,
    isObject: !1,
    isCollection: !1,
    needsSpecialSerialization: !0
  } : e instanceof Date ? {
    category: 5,
    isPrimitive: !1,
    isObject: !0,
    isCollection: !1,
    needsSpecialSerialization: !0
  } : e instanceof RegExp ? {
    category: 6,
    isPrimitive: !1,
    isObject: !0,
    isCollection: !1,
    needsSpecialSerialization: !0
  } : t === "function" ? {
    category: 7,
    isPrimitive: !1,
    isObject: !0,
    isCollection: !1,
    needsSpecialSerialization: !0
  } : Array.isArray(e) ? {
    category: 8,
    isPrimitive: !1,
    isObject: !0,
    isCollection: !0,
    needsSpecialSerialization: !1
  } : e instanceof Map ? {
    category: 9,
    isPrimitive: !1,
    isObject: !0,
    isCollection: !0,
    needsSpecialSerialization: !0
  } : e instanceof Set ? {
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
function J(e) {
  return typeof e == "object" && e !== null && g.CLASS in e && typeof e[g.CLASS] == "string";
}
function G(e) {
  if (typeof e != "object" || e === null)
    return !1;
  const t = Object.getPrototypeOf(e);
  return !(t === null || t === Object.prototype || e instanceof Date || e instanceof RegExp || e instanceof Map || e instanceof Set || e instanceof Array || e instanceof Error || ArrayBuffer.isView(e) || e instanceof ArrayBuffer);
}
function q(e) {
  const t = Object.getPrototypeOf(e);
  if (!t || t === Object.prototype)
    return null;
  const n = t.constructor;
  return !n || !n.name ? null : n.name;
}
class X {
  constructor() {
    this.seen = /* @__PURE__ */ new Map();
  }
  hasSeen(t) {
    return this.seen.has(t);
  }
  markSeen(t, n) {
    this.seen.set(t, n);
  }
  getReference(t) {
    return this.seen.has(t) ? {
      __type__: "ref",
      path: this.seen.get(t) || []
    } : null;
  }
}
class Q {
  constructor(t, n) {
    this.targetToPath = t, this.currentPath = n, this.seen = /* @__PURE__ */ new Map();
  }
  hasSeen(t) {
    return this.seen.has(t);
  }
  markSeen(t, n) {
    this.seen.set(t, n);
  }
  getReference(t) {
    const n = this.targetToPath.get(t);
    return n && n.length > 0 && !(n.length >= this.currentPath.length && this.currentPath.every((i, c) => i === n[c])) ? {
      __type__: "ref",
      path: n
    } : this.hasSeen(t) ? {
      __type__: "ref",
      path: this.seen.get(t).slice(this.currentPath.length)
    } : null;
  }
}
function P(e, t, n, r) {
  const i = typeof e == "object" && e !== null && r.get(e) || e, c = $(i);
  switch (c.category) {
    case m.NULL:
    case m.UNDEFINED:
      return e;
    case m.PRIMITIVE:
      return e;
    case m.BIGINT:
      return {
        [g.TYPE]: "bigint",
        value: e.toString()
      };
    case m.SYMBOL:
      return {
        [g.TYPE]: "symbol",
        description: e.description
      };
    case m.DATE: {
      const o = r.get(e) || e, s = n.getReference(o);
      if (s) return s;
      n.markSeen(o, t);
      const a = o, l = a.getTime(), f = isNaN(l) ? null : a.toISOString(), p = {
        [g.TYPE]: "date",
        [g.DATE_VALUE]: f
        // Internal timestamp (null if invalid)
      }, u = Object.entries(a);
      for (const [y, E] of u)
        p[y] = P(
          E,
          [...t, y],
          n,
          r
        );
      return p;
    }
    case m.REGEXP: {
      const o = r.get(e) || e, s = n.getReference(o);
      if (s) return s;
      n.markSeen(o, t);
      const a = o;
      return {
        [g.TYPE]: "regexp",
        source: a.source,
        flags: a.flags,
        lastIndex: a.lastIndex
      };
    }
    case m.FUNCTION: {
      const o = e;
      return o.__type__ === "function" ? {
        [g.TYPE]: "function",
        sourceCode: o.sourceCode || e.toString()
      } : void 0;
    }
    case m.MAP:
    case m.SET:
    case m.ARRAY:
    case m.OBJECT: {
      const o = r.get(e) || e, s = n.getReference(o);
      if (s) return s;
      if (n.markSeen(o, t), c.category === m.MAP)
        return {
          [g.TYPE]: "map",
          entries: Array.from(o.entries()).map(
            ([f, p], u) => [
              P(
                f,
                [...t, "key", String(u)],
                n,
                r
              ),
              P(
                p,
                [...t, "value", String(u)],
                n,
                r
              )
            ]
          )
        };
      if (c.category === m.SET)
        return {
          [g.TYPE]: "set",
          values: Array.from(o.values()).map(
            (f, p) => P(f, [...t, String(p)], n, r)
          )
        };
      if (c.category === m.ARRAY)
        return e.map(
          (f, p) => P(
            f,
            [...t, String(p)],
            n,
            r
          )
        );
      const a = {}, l = e;
      if (G(o)) {
        const f = q(o);
        f && (a[g.CLASS] = f);
      }
      for (const f in l)
        Object.prototype.hasOwnProperty.call(l, f) && (a[f] = P(
          l[f],
          [...t, f],
          n,
          r
        ));
      return a;
    }
    default:
      return;
  }
}
const Z = (e, t) => {
  const n = new X(), r = P(e, [], n, t);
  return JSON.stringify(r, null, 2);
}, w = (e, t, n, r) => {
  const i = new Q(n, r);
  return P(e, r, i, t);
}, ee = (e) => typeof e == "object" && e !== null && "__type__" in e && typeof e.__type__ == "string", z = (e) => {
  const n = new Function(`return (${e.sourceCode})`)();
  return n.__type__ = "function", n.sourceCode = e.sourceCode, n;
}, H = (e, t, n) => {
  if (!("__dateValue__" in e))
    throw new Error("Invalid Date serialization format: missing __dateValue__ field");
  const r = e.__dateValue__, i = r === null ? /* @__PURE__ */ new Date("invalid") : new Date(r);
  for (const [c, o] of Object.entries(e))
    c === "__type__" || c === "__dateValue__" || (i[c] = t(o, n));
  return i;
}, N = (e) => {
  const t = new RegExp(e.source, e.flags);
  return e.lastIndex !== void 0 && (t.lastIndex = e.lastIndex), t;
}, k = (e) => BigInt(e.value), U = (e) => Symbol(e.description), O = (e) => typeof e == "object" && e !== null && "__unresolved_ref__" in e, te = (e, t) => {
  const n = /* @__PURE__ */ new Map();
  for (const [r, i] of e.entries) {
    const c = typeof r == "object" && r !== null && r.__type__ && T[r.__type__]?.(r, t) || r, o = typeof i == "object" && i !== null && i.__type__ && T[i.__type__]?.(i, t) || i;
    n.set(c, o);
  }
  return n;
}, ne = (e, t) => {
  const n = /* @__PURE__ */ new Set();
  for (const r of e.values) {
    const i = typeof r == "object" && r !== null && r.__type__ && T[r.__type__]?.(r, t) || r;
    n.add(i);
  }
  return n;
}, T = {
  function: (e) => z(e),
  date: (e, t) => H(e, (r, i) => {
    if (r && typeof r == "object" && "__type__" in r) {
      const c = T[r.__type__];
      return c ? c(r, t) : r;
    }
    return r;
  }, t),
  regexp: (e) => N(e),
  bigint: (e) => k(e),
  symbol: (e) => U(e),
  ref: (e) => ({ __unresolved_ref__: e.path }),
  map: (e, t) => te(e, t),
  set: (e, t) => ne(e, t)
};
function F(e, t, n) {
  const r = [];
  function i(o, s = []) {
    if (o === null || typeof o != "object")
      return o;
    if (o.__type__ && T[o.__type__]) {
      const a = T[o.__type__];
      if (!a) return o;
      const l = a(o, e);
      if (l && O(l))
        return r.push({
          parent: null,
          key: null,
          path: l.__unresolved_ref__
        }), l;
      if (l instanceof Date) {
        for (const f in l)
          if (Object.prototype.hasOwnProperty.call(l, f)) {
            const p = l[f];
            p && O(p) && r.push({
              parent: l,
              key: f,
              path: p.__unresolved_ref__
            });
          }
      }
      return l;
    }
    for (const a in o)
      if (Object.prototype.hasOwnProperty.call(o, a)) {
        const l = o[a];
        if (l && typeof l == "object")
          if (l.__type__ && T[l.__type__]) {
            const f = T[l.__type__];
            if (!f) continue;
            const p = f(l, e);
            if (p && O(p))
              r.push({
                parent: o,
                key: a,
                path: p.__unresolved_ref__
              });
            else if (o[a] = p, p instanceof Date) {
              for (const u in p)
                if (Object.prototype.hasOwnProperty.call(p, u)) {
                  const y = p[u];
                  y && O(y) && r.push({
                    parent: p,
                    key: u,
                    path: y.__unresolved_ref__
                  });
                }
            }
          } else {
            const f = i(l, [...s, a]);
            f !== l && (o[a] = f);
          }
      }
    if (n && J(o)) {
      const a = o.__class__, l = n.get(a);
      if (!l)
        throw new Error(
          `Cannot reconstruct instance of class "${a}" - class not registered. Provide the class constructor in the classes option when calling load().`
        );
      Object.setPrototypeOf(o, l.prototype), delete o.__class__;
    }
    return o;
  }
  let c = i(e);
  for (const o of r) {
    const { parent: s, key: a, path: l } = o, f = t(l, c);
    s && a !== null ? s[a] = f : s === null && a === null && (c = f);
  }
  return c;
}
function re(e, t) {
  const n = typeof e == "string" ? JSON.parse(e) : e;
  return F(n, (i, c) => {
    let o = c;
    for (const s of i)
      if (o = o[s], o === void 0)
        throw new Error(
          `Cannot resolve snapshot ref path: ${i.join(".")}`
        );
    return o;
  }, t);
}
function se(e, t, n) {
  return F(e, (c, o) => {
    let s = o, a = !0;
    for (const l of c) {
      const f = s?.[l];
      if (f === void 0) {
        a = !1;
        break;
      }
      s = f;
    }
    if (a)
      return s;
    s = t;
    for (const l of c) {
      const f = s?.[l];
      if (f === void 0)
        throw new Error(
          `Cannot resolve event value ref path: ${c.join(".")} (not found in value scope or memory scope)`
        );
      s = f;
    }
    return s;
  }, n);
}
const oe = re, S = (e, t, n = /* @__PURE__ */ new WeakMap(), r) => {
  if (e == null || typeof e != "object") return e;
  if (n.has(e))
    return n.get(e);
  if (ee(e)) {
    const c = e;
    switch (c.__type__) {
      case "function":
        return z(
          c
        );
      case "date":
        return H(
          c,
          (a, l) => S(a, t, n),
          t
        );
      case "regexp":
        return N(
          c
        );
      case "bigint":
        return k(c);
      case "symbol":
        return U(
          c
        );
      case "ref": {
        const o = c;
        let s = t;
        for (const a of o.path)
          if (s = s[a], s === void 0)
            throw new Error(
              `Cannot resolve ref path: ${o.path.join(".")}`
            );
        return s;
      }
      case "map": {
        const o = c, s = /* @__PURE__ */ new Map();
        n.set(e, s);
        for (const [a, l] of o.entries) {
          const f = S(a, t, n), p = S(l, t, n);
          s.set(f, p);
        }
        return s;
      }
      case "set": {
        const o = c, s = /* @__PURE__ */ new Set();
        n.set(e, s);
        for (const a of o.values)
          s.add(S(a, t, n));
        return s;
      }
      case "circular":
        throw new Error(
          "Encountered explicit circular marker - this indicates a serialization issue"
        );
    }
  }
  if (Array.isArray(e)) {
    const c = [];
    n.set(e, c);
    for (const o of e)
      c.push(S(o, t, n));
    return c;
  }
  const i = {};
  n.set(e, i);
  for (const c in e)
    Object.prototype.hasOwnProperty.call(e, c) && (i[c] = S(
      e[c],
      t,
      n
    ));
  return i;
};
class ie {
  createEvent(t, n, r) {
    const [i] = n;
    return {
      type: d.SET,
      path: t,
      value: w(
        i,
        r.proxyToTarget,
        r.targetToPath,
        t
      ),
      timestamp: Date.now()
    };
  }
  applyEvent(t, n, r, i) {
    const c = t;
    n[r] = se(
      c.value,
      i
      // Memory root for external ref resolution
    );
  }
}
class ce {
  createEvent(t) {
    return {
      type: d.DELETE,
      path: t,
      timestamp: Date.now()
    };
  }
  applyEvent(t, n, r) {
    delete n[r];
  }
}
class ae {
  createEvent(t, n, r) {
    return {
      type: d.ARRAY_PUSH,
      path: t,
      items: n.map(
        (i) => w(
          i,
          r.proxyToTarget,
          r.targetToPath,
          t
        )
      ),
      timestamp: Date.now()
    };
  }
  applyEvent(t, n, r, i) {
    const c = t, o = n[r];
    for (const s of c.items)
      o.push(S(s, i));
  }
}
class le {
  createEvent(t) {
    return {
      type: d.ARRAY_POP,
      path: t,
      timestamp: Date.now()
    };
  }
  applyEvent(t, n, r) {
    n[r].pop();
  }
}
class fe {
  createEvent(t) {
    return {
      type: d.ARRAY_SHIFT,
      path: t,
      timestamp: Date.now()
    };
  }
  applyEvent(t, n, r) {
    n[r].shift();
  }
}
class pe {
  createEvent(t, n, r) {
    return {
      type: d.ARRAY_UNSHIFT,
      path: t,
      items: n.map(
        (i) => w(
          i,
          r.proxyToTarget,
          r.targetToPath,
          t
        )
      ),
      timestamp: Date.now()
    };
  }
  applyEvent(t, n, r, i) {
    const c = t, o = n[r], s = c.items.map((a) => S(a, i));
    o.unshift(...s);
  }
}
class ue {
  createEvent(t, n, r) {
    return {
      type: d.ARRAY_SPLICE,
      path: t,
      start: n[0],
      deleteCount: n[1] || 0,
      items: n.slice(2).map(
        (i) => w(
          i,
          r.proxyToTarget,
          r.targetToPath,
          t
        )
      ),
      timestamp: Date.now()
    };
  }
  applyEvent(t, n, r, i) {
    const c = t, o = n[r], s = c.items.map((a) => S(a, i));
    o.splice(c.start, c.deleteCount, ...s);
  }
}
class de {
  createEvent(t) {
    return {
      type: d.ARRAY_SORT,
      path: t,
      timestamp: Date.now()
    };
  }
  applyEvent(t, n, r) {
    n[r].sort();
  }
}
class ye {
  createEvent(t) {
    return {
      type: d.ARRAY_REVERSE,
      path: t,
      timestamp: Date.now()
    };
  }
  applyEvent(t, n, r) {
    n[r].reverse();
  }
}
class Ee {
  createEvent(t, n, r) {
    return {
      type: d.ARRAY_FILL,
      path: t,
      value: w(
        n[0],
        r.proxyToTarget,
        r.targetToPath,
        t
      ),
      start: n[1],
      end: n[2],
      timestamp: Date.now()
    };
  }
  applyEvent(t, n, r, i) {
    const c = t, o = n[r], s = S(c.value, i);
    o.fill(s, c.start, c.end);
  }
}
class _e {
  createEvent(t, n) {
    return {
      type: d.ARRAY_COPYWITHIN,
      path: t,
      target: n[0],
      start: n[1],
      end: n[2],
      timestamp: Date.now()
    };
  }
  applyEvent(t, n, r) {
    const i = t;
    n[r].copyWithin(i.target, i.start, i.end);
  }
}
class he {
  createEvent(t, n, r) {
    return {
      type: d.MAP_SET,
      path: t,
      key: w(
        n[0],
        r.proxyToTarget,
        r.targetToPath,
        t
      ),
      value: w(
        n[1],
        r.proxyToTarget,
        r.targetToPath,
        t
      ),
      timestamp: Date.now()
    };
  }
  applyEvent(t, n, r, i) {
    const c = t, o = n[r], s = S(c.key, i), a = S(c.value, i);
    o.set(s, a);
  }
}
class me {
  createEvent(t, n, r) {
    return {
      type: d.MAP_DELETE,
      path: t,
      key: w(
        n[0],
        r.proxyToTarget,
        r.targetToPath,
        t
      ),
      timestamp: Date.now()
    };
  }
  applyEvent(t, n, r, i) {
    const c = t, o = n[r], s = S(c.key, i);
    o.delete(s);
  }
}
class Se {
  createEvent(t) {
    return {
      type: d.MAP_CLEAR,
      path: t,
      timestamp: Date.now()
    };
  }
  applyEvent(t, n, r) {
    n[r].clear();
  }
}
class ge {
  createEvent(t, n, r) {
    return {
      type: d.SET_ADD,
      path: t,
      value: w(
        n[0],
        r.proxyToTarget,
        r.targetToPath,
        t
      ),
      timestamp: Date.now()
    };
  }
  applyEvent(t, n, r, i) {
    const c = t, o = n[r], s = S(c.value, i);
    o.add(s);
  }
}
class we {
  createEvent(t, n, r) {
    return {
      type: d.SET_DELETE,
      path: t,
      value: w(
        n[0],
        r.proxyToTarget,
        r.targetToPath,
        t
      ),
      timestamp: Date.now()
    };
  }
  applyEvent(t, n, r, i) {
    const c = t, o = n[r], s = S(c.value, i);
    o.delete(s);
  }
}
class Ae {
  createEvent(t) {
    return {
      type: d.SET_CLEAR,
      path: t,
      timestamp: Date.now()
    };
  }
  applyEvent(t, n, r) {
    n[r].clear();
  }
}
class Pe {
  createEvent(t, n) {
    return {
      type: d.SCRIPT,
      path: t,
      source: n[0],
      timestamp: Date.now()
    };
  }
  applyEvent() {
  }
}
class Te {
  constructor() {
    this.handlers = /* @__PURE__ */ new Map();
  }
  /**
   * Register a handler for an event type
   */
  register(t, n) {
    this.handlers.set(t, n);
  }
  /**
   * Create an event from a mutation
   *
   * Replaces 112 lines of switch cases in proxy.ts
   */
  createEvent(t, n, r, i) {
    const c = this.handlers.get(t);
    if (!c)
      throw new Error(`No handler registered for event type: ${t}`);
    return c.createEvent(n, r, i);
  }
  /**
   * Apply an event during replay
   *
   * Replaces 153 lines of switch cases in replay.ts
   */
  applyEvent(t, n, r, i) {
    const c = this.handlers.get(t.type);
    if (!c)
      throw new Error(`No handler registered for event type: ${t.type}`);
    c.applyEvent(t, n, r, i);
  }
  /**
   * Check if a handler is registered
   */
  hasHandler(t) {
    return this.handlers.has(t);
  }
}
const _ = new Te();
_.register(d.SET, new ie());
_.register(d.DELETE, new ce());
_.register(d.ARRAY_PUSH, new ae());
_.register(d.ARRAY_POP, new le());
_.register(d.ARRAY_SHIFT, new fe());
_.register(d.ARRAY_UNSHIFT, new pe());
_.register(d.ARRAY_SPLICE, new ue());
_.register(d.ARRAY_SORT, new de());
_.register(d.ARRAY_REVERSE, new ye());
_.register(d.ARRAY_FILL, new Ee());
_.register(d.ARRAY_COPYWITHIN, new _e());
_.register(d.MAP_SET, new he());
_.register(d.MAP_DELETE, new me());
_.register(d.MAP_CLEAR, new Se());
_.register(d.SET_ADD, new ge());
_.register(d.SET_DELETE, new we());
_.register(d.SET_CLEAR, new Ae());
_.register(d.SCRIPT, new Pe());
const Re = {
  Array: { eventPrefix: "ARRAY" },
  Map: { eventPrefix: "MAP" },
  Set: { eventPrefix: "SET" }
}, M = (e, t, n, r, i, c, o) => {
  const s = Re[t];
  if (!s)
    throw new Error(`Unknown collection type: ${String(t)}`);
  return function(...a) {
    const l = i.targetToPath.get(e) || [], f = r.apply(e, a);
    if (c && o && !o.isReplaying) {
      const p = `${s.eventPrefix}_${n.toUpperCase()}`, u = _.createEvent(
        p,
        l,
        a,
        i
      );
      c.append(u);
    }
    return f;
  };
}, De = (e) => ({
  targetToProxy: /* @__PURE__ */ new WeakMap(),
  proxyToTarget: /* @__PURE__ */ new WeakMap(),
  targetToPath: /* @__PURE__ */ new WeakMap(),
  metadata: e
}), Ie = (e, t, n) => {
  if (n.targetToProxy.has(e))
    return n.targetToProxy.get(e);
  const r = e;
  try {
    r.__type__ = "function", r.sourceCode = e.toString();
  } catch {
  }
  const i = {
    get(o, s) {
      return s === "__type__" && !o.__type__ ? "function" : s === "sourceCode" && !o.sourceCode ? o.toString() : o[s];
    },
    apply(o, s, a) {
      return o.apply(s, a);
    }
  }, c = new Proxy(r, i);
  return n.targetToProxy.set(e, c), n.proxyToTarget.set(c, e), n.targetToPath.set(e, t), c;
}, D = (e, t, n, r, i) => {
  if (typeof e == "function")
    return Ie(e, t, n);
  if (e === null || typeof e != "object" || n.proxyToTarget.has(e))
    return e;
  if (n.targetToProxy.has(e))
    return n.targetToProxy.get(e);
  const c = Oe(n, r, i), o = new Proxy(e, c);
  if (n.targetToProxy.set(e, o), n.proxyToTarget.set(o, e), n.targetToPath.set(e, t), e instanceof Map) {
    const s = Array.from(e.entries());
    e.clear();
    for (const [a, l] of s) {
      const f = D(
        a,
        [...t, "key"],
        n,
        r,
        i
      ), p = D(
        l,
        [...t, String(a)],
        n,
        r,
        i
      );
      e.set(f, p);
    }
  } else if (e instanceof Set) {
    const s = Array.from(e.values());
    e.clear();
    for (const a of s) {
      const l = D(
        a,
        [...t, String(a)],
        n,
        r,
        i
      );
      e.add(l);
    }
  } else
    for (const s in e)
      if (Object.prototype.hasOwnProperty.call(e, s))
        try {
          e[s] = D(
            e[s],
            [...t, s],
            n,
            r,
            i
          );
        } catch {
        }
  return o;
}, Oe = (e, t, n) => ({
  /**
   * GET trap - Intercepts property access
   *
   * Main job: Wrap collection mutation methods before returning them.
   */
  get(r, i) {
    const c = r[i];
    if (r instanceof Date) {
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
      ].includes(i)) {
        const s = c;
        return typeof s == "function" ? s.bind(r) : s;
      }
      if (i === Symbol.toPrimitive)
        return r[Symbol.toPrimitive].bind(r);
    }
    if (r instanceof RegExp) {
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
      ].includes(i)) {
        const s = c;
        return typeof s == "function" ? s.bind(r) : s;
      }
      if (i === Symbol.toPrimitive)
        return r[Symbol.toPrimitive]?.bind(r);
    }
    if (Array.isArray(r) && typeof c == "function") {
      const o = String(i);
      if (W.includes(o))
        return M(
          r,
          "Array",
          o,
          c,
          e,
          t,
          n
        );
    }
    if (r instanceof Map && typeof c == "function") {
      const o = String(i);
      return K.includes(o) ? M(
        r,
        "Map",
        o,
        c,
        e,
        t,
        n
      ) : c.bind(r);
    }
    if (r instanceof Set && typeof c == "function") {
      const o = String(i);
      return V.includes(o) ? M(
        r,
        "Set",
        o,
        c,
        e,
        t,
        n
      ) : c.bind(r);
    }
    if (c !== null && typeof c == "object") {
      const s = [...e.targetToPath.get(r) || [], String(i)];
      return D(
        c,
        s,
        e,
        t,
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
  set(r, i, c) {
    const s = [...e.targetToPath.get(r) || [], String(i)], a = D(
      c,
      s,
      e,
      t,
      n
    );
    if (r[i] = a, t && n && !n.isReplaying) {
      const l = _.createEvent(
        d.SET,
        s,
        [a],
        // Will be serialized with smart reference detection
        e
      );
      t.append(l);
    }
    return !0;
  },
  /**
   * DELETE trap - Intercepts property deletion
   */
  deleteProperty(r, i) {
    const o = [...e.targetToPath.get(r) || [], String(i)];
    if (delete r[i], t && n && !n.isReplaying) {
      const s = _.createEvent(
        d.DELETE,
        o,
        [],
        e
      );
      t.append(s);
    }
    return !0;
  }
}), Y = (e, t) => {
  let n = e;
  for (let i = 0; i < t.path.length - 1; i++) {
    const c = t.path[i];
    if (c) {
      if (!(c in n)) {
        const o = t.path[i + 1];
        n[c] = o && /^\d+$/.test(o) ? [] : {};
      }
      n = n[c];
    }
  }
  const r = t.path[t.path.length - 1];
  r && _.applyEvent(t, n, r, e);
}, b = async (e, t, n) => {
  if (n.isReplaying = !0, Array.isArray(t))
    for (const r of t)
      Y(e, r);
  else
    for await (const r of t)
      Y(e, r);
  n.isReplaying = !1;
}, j = async (e, t, n) => {
  if (t.stream)
    await b(e, t.stream(), n);
  else {
    const r = await t.getAll();
    await b(e, r, n);
  }
};
class Me {
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
  has(t) {
    return this.delta.has(t);
  }
  /**
   * Get value at path from delta
   */
  get(t) {
    return this.delta.get(t);
  }
  /**
   * Set value at path in delta
   */
  set(t, n) {
    this.delta.set(t, n);
  }
  /**
   * Mark a path as deleted in delta
   */
  delete(t) {
    this.delta.set(t, this.DELETED);
  }
  /**
   * Check if a path is marked as deleted
   */
  isDeleted(t) {
    return this.delta.get(t) === this.DELETED;
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
    return Array.from(this.delta.entries()).sort((t, n) => {
      const r = t[0].split(".").length, i = n[0].split(".").length;
      return r - i;
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
  restoreCheckpoint(t) {
    this.delta.clear();
    for (const [n, r] of t)
      this.delta.set(n, r);
  }
}
function be(e) {
  return e !== null && typeof e == "object";
}
function R(e, t, n = /* @__PURE__ */ new WeakMap()) {
  if (!be(e))
    return e;
  if (n.has(e))
    return n.get(e);
  const r = t.has(e) ? t.get(e) : e;
  if (r !== e && n.has(r)) {
    const s = n.get(r);
    return n.set(e, s), s;
  }
  if (r instanceof Map) {
    const s = /* @__PURE__ */ new Map();
    n.set(e, s), r !== e && n.set(r, s);
    let a = !1;
    for (const [f, p] of r.entries()) {
      const u = R(f, t, n), y = R(p, t, n);
      s.set(u, y), (u !== f || y !== p) && (a = !0);
    }
    const l = a ? s : r;
    return n.set(e, l), r !== e && n.set(r, l), l;
  }
  if (r instanceof Set) {
    const s = /* @__PURE__ */ new Set();
    n.set(e, s), r !== e && n.set(r, s);
    let a = !1;
    for (const f of r.values()) {
      const p = R(f, t, n);
      s.add(p), p !== f && (a = !0);
    }
    const l = a ? s : r;
    return n.set(e, l), r !== e && n.set(r, l), l;
  }
  if (Array.isArray(r)) {
    const s = [];
    n.set(e, s), r !== e && n.set(r, s);
    let a = !1;
    for (const f of r) {
      const p = R(f, t, n);
      s.push(p), p !== f && (a = !0);
    }
    const l = a ? s : r;
    return n.set(e, l), r !== e && n.set(r, l), l;
  }
  const i = {};
  n.set(e, i), r !== e && n.set(r, i);
  let c = !1;
  for (const [s, a] of Object.entries(r)) {
    const l = R(a, t, n);
    i[s] = l, l !== a && (c = !0);
  }
  const o = c ? i : r;
  return n.set(e, o), r !== e && n.set(r, o), o;
}
function L(e) {
  return e !== null && typeof e == "object";
}
function v(e, t, n, r, i) {
  if (r.has(e))
    return r.get(e);
  const c = t.getDeletedSymbol(), o = new Proxy(e, {
    get(s, a) {
      if (typeof a == "symbol")
        return s[a];
      const l = [...n, String(a)], f = l.join(".");
      if (t.has(f)) {
        const u = t.get(f);
        return u === c ? void 0 : L(u) ? i.has(u) ? u : v(u, t, l, r, i) : u;
      }
      const p = s[a];
      if (typeof p == "function" && Array.isArray(s)) {
        const u = String(a);
        return ["push", "pop", "shift", "unshift", "splice", "sort", "reverse"].includes(u) ? function(...E) {
          const A = n.join(".");
          let h;
          return t.has(A) ? h = t.get(A) : (h = [...s], t.set(A, h)), p.apply(h, E);
        } : p.bind(s);
      }
      return L(p) ? i.has(p) ? p : v(p, t, l, r, i) : p;
    },
    set(s, a, l) {
      const p = [...n, String(a)].join(".");
      return t.set(p, l), !0;
    },
    has(s, a) {
      const f = [...n, String(a)].join(".");
      return t.has(f) ? t.get(f) !== c : a in s;
    },
    deleteProperty(s, a) {
      const f = [...n, String(a)].join(".");
      return t.delete(f), !0;
    },
    ownKeys(s) {
      const a = Reflect.ownKeys(s), l = n.length > 0 ? n.join(".") + "." : "", f = /* @__PURE__ */ new Set();
      for (const [u, y] of t.entries())
        if (u.startsWith(l)) {
          const E = u.slice(l.length), A = E.indexOf("."), h = A === -1 ? E : E.slice(0, A);
          y !== c && f.add(h);
        }
      const p = new Set(a);
      for (const [u, y] of t.entries())
        if (u.startsWith(l)) {
          const E = u.slice(l.length);
          if (E.indexOf(".") === -1) {
            const h = E;
            y === c ? p.delete(h) : p.add(h);
          }
        }
      return Array.from(p);
    },
    getOwnPropertyDescriptor(s, a) {
      const f = [...n, String(a)].join(".");
      if (t.has(f)) {
        const p = t.get(f);
        return p === c ? void 0 : {
          value: p,
          writable: !0,
          enumerable: !0,
          configurable: !0
        };
      }
      return Reflect.getOwnPropertyDescriptor(s, a);
    }
  });
  return r.set(e, o), i.set(o, e), o;
}
async function Ne(e) {
  const t = new Me(), n = t.getDeletedSymbol(), r = /* @__PURE__ */ new WeakMap(), i = /* @__PURE__ */ new WeakMap(), c = {};
  return await j(c, e, { isReplaying: !0 }), {
    root: v(c, t, [], r, i),
    isDirty() {
      return t.isDirty();
    },
    getUncommittedCount() {
      return t.size();
    },
    async save() {
      const s = t.entries(), a = /* @__PURE__ */ new WeakMap(), l = (f, p, u = []) => {
        if (!(p === null || typeof p != "object") && !f.has(p))
          if (f.set(p, u), Array.isArray(p))
            p.forEach((y, E) => l(f, y, [...u, String(E)]));
          else if (p instanceof Map) {
            let y = 0;
            p.forEach((E) => l(f, E, [...u, `map:${y++}`]));
          } else if (p instanceof Set) {
            let y = 0;
            p.forEach((E) => l(f, E, [...u, `set:${y++}`]));
          } else p instanceof Date || Object.entries(p).forEach(([y, E]) => l(f, E, [...u, y]));
      };
      for (const [f, p] of s) {
        const u = /* @__PURE__ */ new WeakMap();
        l(u, c);
        const y = f.split(".");
        let E = c;
        for (let h = 0; h < y.length - 1; h++)
          E = E[y[h]];
        const A = y[y.length - 1];
        if (p === n)
          delete E[A], await e.append({
            type: "DELETE",
            path: y,
            timestamp: Date.now()
          });
        else {
          const h = R(p, i, a), x = w(
            h,
            /* @__PURE__ */ new WeakMap(),
            // proxyToTarget (empty since value is already unwrapped)
            u,
            // targetToPath from baseRaw for reference detection
            y
          );
          E[A] = h, await e.append({
            type: "SET",
            path: y,
            value: x,
            timestamp: Date.now()
          });
        }
      }
      t.clear();
    },
    discard() {
      t.clear();
    },
    createCheckpoint() {
      return t.createCheckpoint();
    },
    restoreCheckpoint(s) {
      t.restoreCheckpoint(s);
    },
    unwrap(s) {
      return R(s, i);
    }
  };
}
const I = /* @__PURE__ */ new WeakMap(), B = (e = {}, t = {}) => {
  const { eventLog: n, replayState: r = { isReplaying: !1 }, metadata: i } = t, c = De(i), o = D(
    e,
    [],
    // Root path is empty array
    c,
    n,
    r
  );
  return I.set(o, c), o;
}, ke = (e) => {
  const t = I.get(e);
  if (!t)
    throw new Error("Not a memory image root - use createMemoryImage() first");
  return Z(e, t.proxyToTarget);
}, Ue = (e) => oe(e), Fe = async (e, t = {}) => {
  const n = { isReplaying: !0 }, r = B({}, { ...t, replayState: n });
  return await b(r, e, n), r;
}, je = async (e) => {
  if (!e.eventLog)
    throw new Error("eventLog is required for replayEventsFromLog");
  const t = { isReplaying: !0 }, n = B({}, { ...e, replayState: t });
  return await j(n, e.eventLog, t), n;
}, ve = {
  getDescriptor: () => null,
  getKeyProperty: () => null,
  isDisplayProperty: () => !0,
  getPropertyLabel: () => null
}, Be = (e) => I.get(e)?.metadata || ve, We = (e) => I.get(e) || null, Ke = (e) => typeof e == "object" && e !== null && I.has(e), Ve = () => {
  const e = [];
  return {
    append: async (t) => {
      e.push(t);
    },
    getAll: async () => [...e],
    clear: async () => {
      e.length = 0;
    },
    // Convenience property for testing
    get length() {
      return e.length;
    }
  };
}, $e = async (e) => {
  let t, n;
  try {
    t = await Promise.resolve().then(() => C), n = await Promise.resolve().then(() => C);
  } catch {
    throw new Error(
      "FileEventLog requires Node.js fs and readline modules. In browsers, consider using createIndexedDBEventLog() or implementing a custom event log using the File System Access API."
    );
  }
  return t.existsSync(e) || t.writeFileSync(e, ""), {
    /**
     * Appends an event to the log file.
     * Each event becomes one line (JSON + newline).
     */
    append: async (r) => {
      const i = JSON.stringify(r) + `
`;
      t.appendFileSync(e, i, "utf8");
    },
    /**
     * Loads ALL events into memory and returns them as an array.
     *
     * WARNING: For large logs (millions of events), this can consume lots of memory.
     * Use stream() instead for memory-efficient replay.
     */
    getAll: async () => {
      const r = t.readFileSync(e, "utf8");
      return r.trim() ? r.trim().split(`
`).map((i) => JSON.parse(i)) : [];
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
      const r = t.createReadStream(e, { encoding: "utf8" }), i = n.createInterface({
        input: r,
        crlfDelay: 1 / 0
        // Treat \r\n as single line break
      });
      for await (const c of i)
        c.trim() && (yield JSON.parse(c));
    },
    /**
     * Clears all events by truncating the file.
     */
    clear: async () => {
      t.writeFileSync(e, "");
    }
  };
}, Je = (e = "ireneo", t = "events") => {
  let n, r = !1;
  const i = new Promise((o, s) => {
    if (typeof indexedDB > "u") {
      s(new Error("IndexedDB not available (browser only)"));
      return;
    }
    const a = indexedDB.open(e);
    a.onerror = () => s(a.error), a.onsuccess = () => {
      const l = a.result, f = l.objectStoreNames.contains(t), p = l.version;
      if (l.close(), f) {
        const u = indexedDB.open(e, p);
        u.onerror = () => s(u.error), u.onsuccess = () => {
          n = u.result, o();
        };
      } else {
        const u = indexedDB.open(e, p + 1);
        u.onerror = () => s(u.error), u.onsuccess = () => {
          n = u.result, o();
        }, u.onupgradeneeded = (y) => {
          const E = y.target.result;
          E.objectStoreNames.contains(t) || E.createObjectStore(t, { autoIncrement: !0 });
        };
      }
    }, a.onupgradeneeded = (l) => {
      const f = l.target.result;
      f.objectStoreNames.contains(t) || f.createObjectStore(t, { autoIncrement: !0 });
    };
  }), c = () => {
    if (r)
      throw new Error(
        `EventLog (${t}) has been closed and cannot be used. This usually happens when switching between memory images.`
      );
  };
  return {
    /**
     * Appends an event to the IndexedDB store.
     * Event is stored as JavaScript object (no serialization needed).
     * @throws {Error} if the event log has been closed
     */
    append: async (o) => (c(), await i, new Promise((s, a) => {
      const p = n.transaction([t], "readwrite").objectStore(t).add(o);
      p.onsuccess = () => s(), p.onerror = () => a(p.error);
    })),
    /**
     * Retrieves all events from the store.
     * Returns them in key order (insertion order due to auto-increment).
     * @throws {Error} if the event log has been closed
     */
    getAll: async () => (c(), await i, new Promise((o, s) => {
      const f = n.transaction([t], "readonly").objectStore(t).getAll();
      f.onsuccess = () => o(f.result), f.onerror = () => s(f.error);
    })),
    /**
     * Clears all events from the store.
     * @throws {Error} if the event log has been closed
     */
    clear: async () => (c(), await i, new Promise((o, s) => {
      const f = n.transaction([t], "readwrite").objectStore(t).clear();
      f.onsuccess = () => o(), f.onerror = () => s(f.error);
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
      if (!r) {
        r = !0;
        try {
          await i, n && (n.close(), await new Promise((o) => setTimeout(o, 50)));
        } catch (o) {
          console.warn(`EventLog close(): Database was never initialized (${t})`, o);
        }
      }
    }
  };
}, Ge = (e = "ireneo-events") => {
  if (typeof localStorage > "u")
    throw new Error("LocalStorage not available (browser only)");
  return {
    /**
     * Appends an event to LocalStorage.
     * Reads entire array, adds event, writes back (inefficient for large logs).
     */
    append: async (t) => {
      const n = localStorage.getItem(e), r = n ? JSON.parse(n) : [];
      r.push(t), localStorage.setItem(e, JSON.stringify(r));
    },
    /**
     * Returns all events from LocalStorage.
     */
    getAll: async () => {
      const t = localStorage.getItem(e);
      return t ? JSON.parse(t) : [];
    },
    /**
     * Clears all events from LocalStorage.
     */
    clear: async () => {
      localStorage.removeItem(e);
    }
  };
}, xe = {}, C = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: xe
}, Symbol.toStringTag, { value: "Module" }));
export {
  m as ValueCategory,
  $ as classifyValue,
  $e as createFileEventLog,
  Ve as createInMemoryEventLog,
  Je as createIndexedDBEventLog,
  Ge as createLocalStorageEventLog,
  B as createMemoryImage,
  Ne as createTransaction,
  Ue as deserializeMemoryImageFromJson,
  We as getMemoryImageInfrastructure,
  Be as getMemoryImageMetadata,
  Le as isCollection,
  Ke as isMemoryImage,
  Ce as isNullish,
  He as isObject,
  ze as isPlainObject,
  Ye as isPrimitive,
  je as replayEventsFromLog,
  Fe as replayEventsToMemoryImage,
  ke as serializeMemoryImageToJson
};
