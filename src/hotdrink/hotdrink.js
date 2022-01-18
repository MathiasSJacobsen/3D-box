(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define("hd", [], factory);
	else if(typeof exports === 'object')
		exports["hd"] = factory();
	else
		root["hd"] = factory();
})(self, function() {
return /******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./lib/computation-graph.js":
/*!**********************************!*\
  !*** ./lib/computation-graph.js ***!
  \**********************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {



Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.VariableActivation = exports.TrackingPromise = exports.MethodActivation = exports.EvaluationGraph = exports.Deferred = void 0;

var _variable = _interopRequireDefault(__webpack_require__(/*! ./constraint-system/variable */ "./lib/constraint-system/variable.js"));

var _constraintSystemUtil = __webpack_require__(/*! ./constraint-system/constraint-system-util */ "./lib/constraint-system/constraint-system-util.js");

var _utilities = __webpack_require__(/*! ./utilities */ "./lib/utilities.js");

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {
    default: obj
  };
}

class Deferred {
  constructor() {
    this._promise = new Promise((r, j) => {
      this.resolve = v => {
        r(v);
      };

      this.reject = e => {
        j(e);
      };
    });
  }

  get promise() {
    return this._promise;
  }

}

exports.Deferred = Deferred;

class TrackingPromise {
  constructor(p, tracker) {
    this._promise = p;
    this._fulfillTracker = tracker;
  }

  then(onFulfilled, onRejected) {
    if (onFulfilled != null) this._fulfillTracker();
    return this._promise.then(onFulfilled, onRejected);
  }

  catch(onRejected) {
    return this._promise.catch(onRejected);
  }

  finally(onFinally) {
    return this._promise.finally(onFinally);
  }

}

exports.TrackingPromise = TrackingPromise;
const abandoned = {};

class VariableActivation {
  constructor(v) {
    this._pending = false;
    this._variable = v;
    this._deferred = new Deferred();
    this._outMethods = new Set();
    this._inMethod = null;
    (0, _utilities.mkRefCounted)(this, t => {
      t.reject(VariableActivation.abandoned);
      t._inMethod = null;
    });
  }

  get name() {
    return this._variable.name;
  }

  get inMethod() {
    return this._inMethod;
  }

  get outMethods() {
    return this._outMethods;
  }

  outMethodsSize() {
    return this._outMethods.size;
  }

  addOutMethod(m) {
    this._outMethods.add(m);
  }

  setInMethod(m) {
    this._inMethod = m;
  }

  resolve(v) {
    this._pending = false;
    return this._deferred.resolve(v);
  }

  reject(e) {
    this._pending = false;
    return this._deferred.reject(e);
  }

  get promise() {
    return this._deferred.promise;
  }

}

exports.VariableActivation = VariableActivation;
VariableActivation.abandoned = {};

class MethodActivation {
  constructor(f, promiseMask) {
    this._f = f;
    this._mask = promiseMask;
  }

  get ins() {
    return this._ins;
  }

  get outs() {
    return this._outs;
  }

  insSize() {
    return this._ins.length;
  }

  outsSize() {
    return this._outs.length;
  }

  async execute(ins, outs) {
    this._ins = ins;
    this._outs = outs;
    outs.forEach(o => o.setInMethod(this)); // retain all inputs

    ins.forEach(i => (0, _utilities.retain)(i)); // once _all_ output variable activations have been settled
    // (either by this method or by becoming abandoned), this method
    // activation has no use anymore; in particular it does not need
    // its input activations anymore, and it will release them.  We
    // use Promise.all to detect when all outputs have been settled
    // or rejected, but since Promise.all rejects immediately if any
    // of the promises it waits rejects, we do not wait for the output
    // promises directly, but rather for another set of promises
    // (oproms) that wrap the output promises and resolve regardless
    // whether the corresponding outputs reject or resolve.

    let oproms = outs.map(o => o.promise.then(v => null, e => null));
    Promise.all(oproms).then(() => {
      ins.forEach(i => {
        (0, _utilities.release)(i);
      });
    }); // FIXME: this can be replaced with Promise.allSettled(), once
    // it becomes supported

    let nonpromiseIns = ins.filter((e, i) => (this._mask[i] & _constraintSystemUtil.maskPromise) === 0); // these are regular in-parameters that are awaited before passing into method's f

    let modifiedIns = ins.filter((e, i) => (this._mask[i] & _constraintSystemUtil.maskUpdate) !== 0); // these are the inputs that are also outputs, and where there is aliasing between
    // the input and the output. Methods that perform this kind of modification can only
    // be executed when the inputs have reference count 1 (then all the other methods that
    // use those inputs have already finished (there can be at most one method that performs
    // such a modifying write)

    let mCount = modifiedIns.length;

    if (mCount > 0) {
      let def = new Deferred();
      let arr = [];

      for (let i = 0; i < modifiedIns.length; ++i) {
        arr.push(modifiedIns[i].name);
        (0, _utilities.setUniqueHandler)(modifiedIns[i], v => {
          if (--mCount === 0) def.resolve(null);
        });
      }

      await def.promise; // now all possibly modifying variables have only one reference
    }

    let inValues;

    try {
      // await for all non-promise inputs
      inValues = await Promise.all(nonpromiseIns.map(v => v.promise));
    } catch (e) {
      // if any non-promise input rejects, the wrapped f cannot be called, so
      // all outputs can be rejected
      outs.forEach(o => o.reject("a method's input was rejected"));
      return;
    } // construct the wrapped f's input argument from promise inputs
    // and the resolved values of non-promise inputs


    let inArgs = [],
        vind = 0;

    for (let i = 0; i < ins.length; ++i) {
      if ((this._mask[i] & _constraintSystemUtil.maskPromise) !== 0) {
        inArgs[i] = new TrackingPromise(ins[i].promise, () => ins[i].addOutMethod(this));
      } else {
        ins[i].addOutMethod(this);
        inArgs[i] = inValues[vind++];
      }
    }

    let r;

    try {
      r = await this._f(...inArgs); // in case of one return, result can be
      // a promise, we await for it here to
      // avoid unhandled rejection. (This also
      // allows a method that returns a
      // promise that resolves to an array)
    } catch (e) {
      // this error is from f itself; therefore we reject all outputs
      // with the reason e
      outs.forEach(o => o.reject(e));
      return;
    } // if method has more than one output, f should return an array


    if (outs.length > 1) {
      console.assert(Array.isArray(r) && outs.length == r.length, `Method result shoud be an array of ${outs.length} elements`);

      for (let i = 0; i < r.length; ++i) outs[i].resolve(r[i]); // r[i] can be a promise or a value

    } else {
      // only one output; result of f is not expected to be wrapped in a singleton array
      outs[0].resolve(r);
    }
  }

}

exports.MethodActivation = MethodActivation;

class EvaluationGraph {
  adjacentOutVertices(v) {
    if (v instanceof VariableActivation) return v.outMethods;else return v.outs;
  }

  outDegree(v) {
    if (v instanceof VariableActivation) return v.outMethodsSize();else return v.outsSize();
  }

  adjacentInVertices(v) {
    if (v instanceof VariableActivation) return v.inMethod != null ? [v.inMethod] : [];else return v.ins;
  }

  inDegree(v) {
    if (v instanceof VariableActivation) return v.inMethod != null ? 1 : 0;else return v.insSize();
  }

}

exports.EvaluationGraph = EvaluationGraph;

/***/ }),

/***/ "./lib/constraint-builder.js":
/*!***********************************!*\
  !*** ./lib/constraint-builder.js ***!
  \***********************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {



Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.LEFT = exports.ComponentScope = void 0;
Object.defineProperty(exports, "ParseState", ({
  enumerable: true,
  get: function () {
    return _parsing.ParseState;
  }
}));
exports.TypeError = exports.SetScope = exports.RIGHT = void 0;
exports.asLeft = asLeft;
exports.asRight = asRight;
exports.block = void 0;
exports.buildComponent = buildComponent;
exports.checkComponent = checkComponent;
exports.checkConstraint = checkConstraint;
exports.checkFirstMethod = checkFirstMethod;
exports.checkOtherMethod = checkOtherMethod;
exports.checkParameterList = checkParameterList;
exports.checkQualifiers = checkQualifiers;
exports.component = component;
exports.functionBody = void 0;
Object.defineProperty(exports, "hdl", ({
  enumerable: true,
  get: function () {
    return _parsing.hdl;
  }
}));
exports.isLeft = isLeft;
exports.isRight = isRight;
exports.jsCode = jsCode;
exports.left = left;
Object.defineProperty(exports, "mkParseState", ({
  enumerable: true,
  get: function () {
    return _parsing.mkParseState;
  }
}));
exports.pComponent = pComponent;
exports.pConstraint = pConstraint;
exports.pMethod = pMethod;
exports.pVariables = pVariables;
exports.qualifiedParameterList = qualifiedParameterList;
exports.qualifierList = qualifierList;
exports.right = right;
exports.stringLiteral = stringLiteral;
exports.templateLiteral = templateLiteral;
exports.topComponent = topComponent;
exports.withPos = withPos;

var _constraint = _interopRequireDefault(__webpack_require__(/*! ./constraint-system/constraint */ "./lib/constraint-system/constraint.js"));

var _parsing = __webpack_require__(/*! ./parsing */ "./lib/parsing.js");

var _lexingTools = __webpack_require__(/*! ./lexing-tools */ "./lib/lexing-tools.js");

var _component = _interopRequireDefault(__webpack_require__(/*! ./constraint-system/component */ "./lib/constraint-system/component.js"));

var _constraintSpec = _interopRequireDefault(__webpack_require__(/*! ./constraint-system/constraint-spec */ "./lib/constraint-system/constraint-spec.js"));

var _method = _interopRequireDefault(__webpack_require__(/*! ./constraint-system/method */ "./lib/constraint-system/method.js"));

var _variableReference = _interopRequireDefault(__webpack_require__(/*! ./constraint-system/variable-reference */ "./lib/constraint-system/variable-reference.js"));

var _constraintSystemUtil = __webpack_require__(/*! ./constraint-system/constraint-system-util */ "./lib/constraint-system/constraint-system-util.js");

var _utilities = __webpack_require__(/*! ./utilities */ "./lib/utilities.js");

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {
    default: obj
  };
}

const LEFT = 0;
exports.LEFT = LEFT;
const RIGHT = 1;
exports.RIGHT = RIGHT;

function left(v) {
  return {
    tag: LEFT,
    value: v
  };
}

function right(v) {
  return {
    tag: RIGHT,
    value: v
  };
} // %checks do not work


function isLeft(e) {
  return e.tag === LEFT;
}

function isRight(e) {
  return e.tag === RIGHT;
}

function asLeft(e) {
  if (e.tag !== LEFT) throw "Either cast error: no value on left";
  return e.value;
}

function asRight(e) {
  if (e.tag !== RIGHT) throw e.value;
  return e.value;
}

function withPos(p) {
  return (0, _parsing.lift2)((cp, v) => ({
    pos: cp,
    value: v
  }))(_parsing.currentPos, p);
}

class ComponentScope {
  constructor(cmp) {
    this._component = cmp;
  }

  get(key) {
    let m = this._component;

    while (m != null) {
      let v = m.variableDeclarations.get(key);
      if (v !== undefined) return v;else m = m.parent;
    }
  }

  has(key) {
    return this.get(key) !== undefined;
  }

}

exports.ComponentScope = ComponentScope;

class SetScope {
  constructor(s) {
    this._set = s;
  }

  get(k) {
    return this.has(k) ? k : undefined;
  }

  has(k) {
    return this._set.has(k);
  }

}

exports.SetScope = SetScope;

class TypeError extends Error {
  constructor(m, p) {
    super();
    this._msg = m;
    this._pos = p;
  }

  get message() {
    return this._pos.toString() + "\n" + this._msg;
  }

  set message(s) {
    throw Error("Cannot set the name of ParseError");
  }

}

exports.TypeError = TypeError;

function checkQualifiers(qs) {
  if (qs.length > 1) {
    let seen = new Set();

    for (let q of qs) {
      if (seen.has(q.value)) return left(new TypeError(`The same qualifier ${q.value} appears twice`, q.pos));
      seen.add(q.value);
    }
  }

  return right(null);
}

function checkParameterList(pars, scope) {
  let seenName = new Set();

  for (let par of pars) {
    // check qualifiers for duplicates
    let r = checkQualifiers(par.value.qualifiers);
    if (isLeft(r)) return left(asLeft(r)); // check if variable name duplicate

    let pn = par.value.parameterName;

    if (!scope.has(pn.value)) {
      return left(new TypeError(`Undefined variable name ${pn.value}`, pn.pos));
    }

    if (seenName.has(pn.value)) return left(new TypeError(`Parameter ${pn.value} appears twice in the same parameter list`, pn.pos));
    seenName.add(pn.value);
  }

  return right(seenName);
}

function checkFirstMethod(m, scope) {
  let ins = checkParameterList(m.ins, scope);
  if (isLeft(ins)) return ins;
  let outs = checkParameterList(m.outs, scope);
  if (isLeft(outs)) return outs;
  return right((0, _utilities.setUnion)(asRight(ins), asRight(outs)));
}

function checkOtherMethod(m, expectedVariableNames) {
  let scope = new SetScope(expectedVariableNames);
  let ins = checkParameterList(m.ins, scope);
  if (isLeft(ins)) return left(asLeft(ins));
  let outs = checkParameterList(m.outs, scope);
  if (isLeft(outs)) return left(asLeft(outs));
  let foundNames = (0, _utilities.setUnion)(asRight(ins), asRight(outs));

  if (!(0, _utilities.setEquals)(foundNames, expectedVariableNames)) {
    let missingVariables = Array.from((0, _utilities.setDifference)(expectedVariableNames, foundNames)).join();
    return left(new TypeError(`All methods in the same constraint must use the same variables; this method does not refer to variable ` + missingVariables, m.pos));
  } // FIXME: should test for method restriction


  return right(null);
}

function checkConstraint(c, scope) {
  if (c.methods.length === 0) {
    c.variableNames = new Set();
    return right(c);
  }

  let vs = checkFirstMethod(c.methods[0], scope);
  if (isLeft(vs)) return left(asLeft(vs));
  c.variableNames = asRight(vs);

  for (let i = 1; i < c.methods.length; ++i) {
    let r = checkOtherMethod(c.methods[i], asRight(vs));
    if (isLeft(r)) return left(asLeft(r));
  }

  return right(c);
}

function checkComponent(cmp) {
  for (let c of cmp.constraints) {
    let r = checkConstraint(c, new ComponentScope(cmp));
    if (isLeft(r)) return left(asLeft(r));
  }

  for (let c of cmp.components) {
    let r = checkComponent(c);

    if (isLeft(r)) {
      return left(asLeft(r));
    }
  }

  return right(cmp);
}

function jsCode(endMarkers, includeMarker = true) {
  return ps => {
    let s = "";

    while (true) {
      let nc = ps.peek();

      if (nc == null) {
        if (endMarkers.includes("")) return (0, _parsing.ok)(s, s.length > 0);else return (0, _parsing.failF)(() => ["<js code>"].concat(endMarkers), s.length > 0);
      }

      if (endMarkers.includes(nc)) {
        if (includeMarker) {
          (0, _parsing.item)(ps);
          s += nc;
        }

        return (0, _parsing.ok)(s);
      }

      if (["}", "]", ")"].includes(nc)) return (0, _parsing.fail)(["not " + nc], true); // mismatched brace

      let r = (0, _parsing.oneOf)(stringLiteral, templateLiteral, (0, _parsing.pBind)((0, _parsing.sat)(isOpenBrace), b => (0, _parsing.pBind)(jsCode([closingBraceOf(b)], true), c => (0, _parsing.ret)(b + c))), _parsing.item)(ps);
      if (!r.success) return r;
      s += r.value;
    }

    throw null; // dead code (needed to supress flowtype's complaint about mismatch in return type
  };
}

function isOpenBrace(c) {
  return c == "(" || c == "{" || c == "[";
}

function closingBraceOf(c) {
  switch (c) {
    case "(":
      return ")";

    case "{":
      return "}";

    case "[":
      return "]";
  }

  throw Error("HotDrink internal error: no closing brace defined for " + c);
}

function stringLiteral(ps) {
  let r = (0, _parsing.oneOf)((0, _parsing.pChar)("'"), (0, _parsing.pChar)('"'))(ps);
  if (!r.success) return r;
  const quote = r.value,
        equote = "\\" + quote;
  let str = r.value;
  r = (0, _parsing.lift)((s, q) => str + s.join("") + q, (0, _parsing.many)((0, _parsing.oneOf)((0, _parsing.exactString)("\\\\"), (0, _parsing.exactString)(equote), (0, _parsing.sat)(c => c != quote))), (0, _parsing.pChar)(quote))(ps);
  r.consumed = true; // we know by now the parser has consumed
  // in case there is an error, it must be reading <eof> expecting quote

  return r;
}

function templateLiteral(ps) {
  const quote = "`",
        equote = "\\" + quote;
  let r = (0, _parsing.pChar)(quote)(ps);
  if (!r.success) return r;
  let str = r.value;

  while (true) {
    let r = (0, _parsing.must)((0, _parsing.oneOf)((0, _parsing.pChar)(quote), (0, _parsing.exactString)("${"), (0, _parsing.exactString)("\\\\"), (0, _parsing.exactString)(equote), _parsing.item))(ps); // throws if out of input

    if (r.value == quote) {
      str += quote;
      break;
    }

    if (r.value == "${") {
      str += "${";
      str += (0, _parsing.must)(jsCode(["}"]))(ps).value;
      continue;
    }

    str += r.value;
  }

  return (0, _parsing.ok)(str);
}

const block = (0, _parsing.context)("<function body block>", (0, _parsing.token)((0, _parsing.lift)((open, code_and_close) => open + code_and_close, (0, _parsing.pChar)("{"), jsCode(["}"]))));
exports.block = block;
const functionBody = (0, _parsing.context)("<function body>", (0, _parsing.oneOf)(block, (0, _parsing.pBind)((0, _parsing.token)(jsCode([";"])), body => (0, _parsing.ret)("return " + body))));
exports.functionBody = functionBody;

function pMethod(ps) {
  function _met(pos, name, ins, outs, body) {
    // for each input argument, construct a mask that tells which qualifiers were used
    let promiseMask = ins.map(p => {
      return (0, _utilities.foldl)((q1, q2) => orMasks(qualifier2mask(q1), q2), _constraintSystemUtil.maskNone, p.value.qualifiers.map(q => q.value));
    });
    const inparNames = ins.map(p => p.value.parameterName.value);
    let code;

    if (typeof body.value === "string") {
      code = {
        pos: body.pos,
        value: new Function(inparNames.join(), body.value)
      };
    } else code = body; // body was a spliced expression, so body.value must be a Function already


    return {
      pos,
      name,
      ins,
      outs,
      code,
      promiseMask
    };
  }

  const bodyParser = withPos((0, _parsing.oneOf)((0, _parsing.lift)((v, _) => v, _parsing.pSplice, (0, _parsing.word)(";")), (0, _parsing.pBind_)((0, _parsing.word)("=>"), functionBody), block));
  return (0, _parsing.context)("<method>", (0, _parsing.lift)(_met, _parsing.currentPos, (0, _parsing.opt)(withPos(_parsing.identifier), null), (0, _parsing.ignore)((0, _parsing.word)("(")), qualifiedParameterList("*!"), (0, _parsing.ignore)((0, _parsing.word)("->")), qualifiedParameterList(""), (0, _parsing.ignore)((0, _parsing.word)(")")), bodyParser))(ps);
}

function qualifier2mask(q) {
  switch (q) {
    case "*":
      return _constraintSystemUtil.maskPromise;

    case "!":
      return _constraintSystemUtil.maskUpdate;

    default:
      return _constraintSystemUtil.maskNone;
  }
}

function orMasks(m1, m2) {
  return m1 | m2;
}

function qualifierList(qualifiers) {
  return (0, _parsing.many)((0, _parsing.token)(withPos((0, _parsing.pChars)(qualifiers))));
}

function qualifiedParameterList(qualifiers = "*!") {
  //
  return (0, _parsing.sepList)(withPos((0, _parsing.lift)((qs, pname) => ({
    qualifiers: qs,
    parameterName: pname
  }), qualifierList(qualifiers), withPos(_parsing.identifier))), (0, _parsing.word)(","));
}

function pVariables(ps) {
  return (0, _parsing.inBetween)((0, _parsing.sepList)(identifierWithOptionalInitializer, (0, _parsing.word)(",")), (0, _parsing.word)("var"), (0, _parsing.word)(";"))(ps);
}

function identifierWithOptionalInitializer(ps) {
  return (0, _parsing.pBind)(_parsing.currentPos, pos => (0, _parsing.oneOf)((0, _parsing.lift)(name => ({
    pos,
    name,
    isReference: true
  }), (0, _parsing.ignore)((0, _parsing.word)("&")), _parsing.identifier), (0, _parsing.lift)((name, initializer) => ({
    pos,
    name,
    isReference: false,
    initializer
  }), _parsing.identifier, (0, _parsing.opt)(withPos(initializerExpression), undefined))))(ps);
}

function initializerExpression(ps) {
  return (0, _parsing.pBind_)((0, _parsing.word)("="), (0, _parsing.context)("<intitializer-expression>", (0, _parsing.pBind)(jsCode([",", ";"], false), e => (0, _parsing.ret)(new Function("return " + e)()))))(ps);
}

function pConstraint(ps) {
  return (0, _parsing.context)("<constraint>", (0, _parsing.lift)((pos, name, methods) => ({
    pos,
    name,
    variableNames: null,
    methods
  }), _parsing.currentPos, (0, _parsing.ignore)((0, _parsing.word)("constraint")), (0, _parsing.opt)(withPos(_parsing.identifier), null), (0, _parsing.ignore)((0, _parsing.word)("{")), (0, _parsing.many)(pMethod), (0, _parsing.ignore)((0, _parsing.word)("}"))))(ps);
}

const mkComponentAST = (pos, name, declarations) => {
  let variableDeclarations = new Map();
  let constraints = [];
  let components = [];
  let node = {
    parent: null,
    pos,
    name,
    variableDeclarations,
    constraints,
    components
  };

  for (let decl of declarations) {
    switch (decl.tag) {
      case "variable":
        for (let vdecl of decl.value) {
          variableDeclarations.set(vdecl.name, vdecl);
        }

        break;

      case "constraint":
        constraints.push(decl.value);
        break;

      case "component":
        decl.value.parent = node;
        components.push(decl.value);
        break;
    }
  }

  return node;
};

const componentBody = (0, _parsing.many)((0, _parsing.oneOf)((0, _parsing.pBind)(pVariables, v => (0, _parsing.ret)({
  tag: "variable",
  value: v
})), (0, _parsing.pBind)(pConstraint, v => (0, _parsing.ret)({
  tag: "constraint",
  value: v
})), (0, _parsing.pBind)(pComponent, v => (0, _parsing.ret)({
  tag: "component",
  value: v
}))));

function topComponent(name) {
  return ps => {
    return (0, _parsing.lift)(mkComponentAST, _parsing.currentPos, withPos((0, _parsing.ret)(name)), componentBody)(ps);
  };
}

function pComponent(ps) {
  return (0, _parsing.context)("<component>", (0, _parsing.lift)(mkComponentAST, _parsing.currentPos, (0, _parsing.ignore)((0, _parsing.word)("component")), withPos(_parsing.identifier), (0, _parsing.ignore)((0, _parsing.word)("{")), componentBody, (0, _parsing.ignore)((0, _parsing.word)("}"))))(ps);
}

function component(strs, ...splices) {
  let ps = (0, _parsing.hdl)(strs, ...splices);
  let r = (0, _parsing.must)((0, _parsing.pBind_)(_parsing.manyws, (0, _parsing.oneOf)(pComponent, topComponent((0, _constraintSystemUtil.freshComponentName)()))))(ps);
  (0, _parsing.must)(_parsing.eof)(ps);
  return buildComponent(asRight(checkComponent(r.value)));
}

function buildMethod(mnode, vmap) {
  var _mnode$name;

  return new _method.default(vmap.size, mnode.ins.map(v => vmap.get(v.value.parameterName.value)), mnode.outs.map(v => vmap.get(v.value.parameterName.value)), mnode.promiseMask, mnode.code.value, (mnode === null || mnode === void 0 ? void 0 : (_mnode$name = mnode.name) === null || _mnode$name === void 0 ? void 0 : _mnode$name.value) || "");
}

function buildAndAddConstraint(owner, cnode) {
  let variableNames = cnode.variableNames;
  if (variableNames == null) throw Error("Constraint node must be type checked before it is used for building a constraint");
  let name2index = new Map();
  let index = 0;

  for (let v of variableNames) name2index.set(v, index++);

  let ms = cnode.methods.map(m => buildMethod(m, name2index));
  let vrefs = Array.from(name2index.keys(), name => owner.getVariableReference(name));
  let cspec = new _constraintSpec.default(ms);
  let name = cnode.name != null ? cnode.name.value : null;
  return owner.emplaceConstraint(name, cspec, vrefs, false);
}

function buildComponent(compNode, owner = null) {
  let comp = new _component.default(compNode.name.value);
  if (owner != null) owner.addComponent(comp);

  for (let vdecl of compNode.variableDeclarations.values()) {
    if (vdecl.isReference) comp.emplaceVariableReference(vdecl.name);else {
      let init = vdecl.initializer != null ? vdecl.initializer.value : undefined;
      comp.emplaceVariable(vdecl.name, init);
    }
  }

  compNode.constraints.forEach(c => buildAndAddConstraint(comp, c));
  compNode.components.forEach(c => buildComponent(c, comp));
  return comp;
}

/***/ }),

/***/ "./lib/constraint-system/component.js":
/*!********************************************!*\
  !*** ./lib/constraint-system/component.js ***!
  \********************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {



Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports["default"] = void 0;

var _hdconsole = __webpack_require__(/*! ../hdconsole */ "./lib/hdconsole.js");

var _constraintSpec = _interopRequireDefault(__webpack_require__(/*! ./constraint-spec */ "./lib/constraint-system/constraint-spec.js"));

var _constraintSystem = _interopRequireDefault(__webpack_require__(/*! ./constraint-system */ "./lib/constraint-system/constraint-system.js"));

var _variableReference = _interopRequireDefault(__webpack_require__(/*! ./variable-reference */ "./lib/constraint-system/variable-reference.js"));

var _variable = _interopRequireDefault(__webpack_require__(/*! ./variable */ "./lib/constraint-system/variable.js"));

var _constraint = _interopRequireDefault(__webpack_require__(/*! ./constraint */ "./lib/constraint-system/constraint.js"));

var _constraintSystemUtil = __webpack_require__(/*! ./constraint-system-util */ "./lib/constraint-system/constraint-system-util.js");

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {
    default: obj
  };
}

class Component {
  // used for generating fresh constraint names
  constructor(name) {
    this._owner = null;
    this._system = null;
    this._name = name;
    this._vars = new Set();
    this._varRefs = new Map();
    this._varRefNames = new Map();
    this._constraints = new Map();
    this._constraintNames = new Map();
    this._nextFreshCIndex = 0;
    this._components = new Map();
  }

  clone(name = (0, _constraintSystemUtil.freshComponentName)()) {
    let that = new Component(name);
    let o2n = new Map(); // old2new
    // clone variable references

    for (let [n, v] of this._varRefs) {
      if (v.isOwningReference()) {
        o2n.set(v, that.emplaceVariable(n));
      } else o2n.set(v, that.emplaceVariableReference(n));
    } // clone constraints


    for (let [n, c] of this._constraints) {
      let nrefs = c._varRefs.map(vr => o2n.get(vr));

      if (!(0, _constraintSystemUtil.isStay)(c)) that.emplaceConstraint(n, c._cspec, nrefs, c._optional);
    } // clone nested components


    for (let [n, cmp] of this._components) that.addComponent(cmp.clone(n));

    return that;
  }

  get system() {
    return this._system;
  }

  get name() {
    return this._name;
  }

  connectSystem(system) {
    if (this._owner != null) {
      _hdconsole.hdconsole.error(`Tried to connect the nested component ${this._name}`);

      return false;
    }

    if (this._system === system) {
      _hdconsole.hdconsole.warn(`Same system connected twice to component ${this._name}`);

      return false;
    }

    if (this._system != null) {
      _hdconsole.hdconsole.error(`Trying to connect an already connected component ${this._name} to a another system`);

      return false;
    }

    this._connectSystem(system);

    return true;
  }

  _connectSystem(system) {
    this._system = system; // must set system already here
    // so that connect notifications
    // compare systems correctly FIXME: think abou this

    for (let c of this._components.values()) c._connectSystem(system);

    for (let c of this._constraints.values()) if (c._danglingCount === 0) system.addConstraint(c);
  }

  disconnectSystem() {
    if (this._system == null) {
      _hdconsole.hdconsole.error(`Tried to disconnect a component ${this._name} that is already disconnected`);

      return false;
    }

    if (this._owner != null) {
      _hdconsole.hdconsole.error(`Tried to disconnect a subcomponent ${this._name} when owner is still connected`);

      return false;
    }

    this._disconnectSystem();

    return true;
  }

  _disconnectSystem() {
    for (let c of this._components.values()) c._disconnectSystem();

    for (let c of this._constraints.values()) this._system.removeConstraint(c); // cast OK since we know system is connected


    this._system = null;
  }

  addComponent(c) {
    if (c._owner != null) {
      _hdconsole.hdconsole.error(`Tried to add component ${c._name} that already has an owner to component ${this._name}`);

      return;
    }

    if (c._system != null) {
      _hdconsole.hdconsole.error(`Tried to add to component ${this._name} the component ${c._name} that is connected to a system`);

      return;
    }

    if (this._components.has(c._name)) {
      _hdconsole.hdconsole.error(`Tried to add the component whose name ${c._name} already exists`);

      return;
    }

    c._owner = this;

    this._components.set(c._name, c);

    if (this._system != null) c.connectSystem(this._system);
  }

  emplaceVariable(n, v) {
    _hdconsole.hdconsole.assert(!this._varRefs.has(n), `Trying to add variable ${n} twice to component ${this._name}`);

    let vr = (0, _constraintSystemUtil.mkVariable)(this, v);

    this._varRefs.set(n, vr);

    this._varRefNames.set(vr, n);

    this._vars.add(vr.value); // cast ok, vr is an owning reference


    let name = "__stay__" + n;
    let c = new _constraint.default(this, (0, _constraintSystemUtil.stayConstraintSpec)(), [vr], true);

    this._constraints.set(name, c);

    this._constraintNames.set(c, name);

    return vr;
  }

  emplaceVariableReference(n) {
    _hdconsole.hdconsole.assert(!this._varRefs.has(n), `Trying to add variable reference ${n} twice to component ${this._name}`);

    let vr = new _variableReference.default(this);

    this._varRefs.set(n, vr);

    this._varRefNames.set(vr, n);

    return vr;
  }

  emplaceConstraint(n, cspec, vrefs, optional = false) {
    let c = new _constraint.default(this, cspec, vrefs, optional);
    if (n == null) n = this._nextFreshConstraintName();
    if (this._constraints.has(n)) throw `Constraint ${n} already exists in component ${this._name}`;

    this._constraints.set(n, c);

    this._constraintNames.set(c, n);

    return c;
  }

  _nextFreshConstraintName() {
    return "c#" + this._nextFreshCIndex++;
  }

  variableReferenceName(r) {
    let s = this._varRefNames.get(r);

    return s == null ? "<unnamed>" : s;
  }

  constraintName(c) {
    return this._constraintNames.get(c);
  }

  getVariableReference(n) {
    let r = this._varRefs.get(n);

    if (r != null) return r;
    if (this._owner == null) return undefined;
    return this._owner.getVariableReference(n);
  }

  get vs() {
    const comp = this;

    function varRef(property) {
      return comp._varRefs.get(property);
    }

    return new Proxy({}, {
      get: function (_, property) {
        return varRef(property);
      },
      set: function (_, property, value) {
        let ref = varRef(property);

        if (ref == null) {
          _hdconsole.hdconsole.warn(`Linking an unknown variable ${property}`);

          return false; // this causes a TypeError in strict mode
        } else {
          ref.link(value);
          return true;
        }
      }
    });
  }

  get cs() {
    const comp = this;
    return new Proxy({}, {
      get: function (_, property) {
        return comp._constraints.get(property);
      }
    });
  }

  get components() {
    const comp = this;
    return new Proxy({}, {
      get: function (_, property) {
        return comp._components.get(property);
      }
    });
  }

}

exports["default"] = Component;

/***/ }),

/***/ "./lib/constraint-system/constraint-spec.js":
/*!**************************************************!*\
  !*** ./lib/constraint-system/constraint-spec.js ***!
  \**************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {



Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports["default"] = void 0;

var _hdconsole = __webpack_require__(/*! ../hdconsole */ "./lib/hdconsole.js");

var _method = _interopRequireDefault(__webpack_require__(/*! ./method */ "./lib/constraint-system/method.js"));

var _variableReference = _interopRequireDefault(__webpack_require__(/*! ./variable-reference */ "./lib/constraint-system/variable-reference.js"));

var _utilities = __webpack_require__(/*! ../utilities */ "./lib/utilities.js");

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {
    default: obj
  };
}

class ConstraintSpec {
  constructor(methods) {
    this._methods = new Set(methods);

    _hdconsole.hdconsole.assert(this._methods.size > 0, "Constraint specification must have at least one method.");

    const firstMethod = (0, _utilities.first)(this._methods);

    if (firstMethod == null) {
      throw "Constraint specification must have at least one method."; //should not happend, this keeps flow happy
    }

    const nvars = firstMethod === null || firstMethod === void 0 ? void 0 : firstMethod.nvars;
    this._nvars = nvars;
    this._v2ins = [];

    for (let i = 0; i < nvars; ++i) this._v2ins.push([]);

    for (let m of this._methods) {
      _hdconsole.hdconsole.assert(m.nvars === nvars, `All methods in constraint specification must have the same number of variables`);

      for (let i of m.outs()) {
        this._v2ins[i].push(m);
      }
    }
  }

  get nvars() {
    return this._nvars;
  }

  ins(vIndex) {
    return this._v2ins[vIndex];
  }

  insSize(vIndex) {
    return this._v2ins[vIndex].length;
  }

  methods() {
    return this._methods;
  }

  hasMethod(m) {
    return this._methods.has(m);
  }

  prettyPrint(prefix, vrefs) {
    let s = "";

    for (let m of this._methods) {
      s += prefix + m.prettyPrint(vrefs) + "\n";
    }

    return s;
  }

}

exports["default"] = ConstraintSpec;

/***/ }),

/***/ "./lib/constraint-system/constraint-system-util.js":
/*!*********************************************************!*\
  !*** ./lib/constraint-system/constraint-system-util.js ***!
  \*********************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {



Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.enforceStayMethod = enforceStayMethod;
exports.freshComponentName = void 0;
exports.freshNameGenerator = freshNameGenerator;
exports.isConstraint = isConstraint;
exports.isMethod = isMethod;
exports.isOwnerOf = isOwnerOf;
exports.isStay = isStay;
exports.isVariable = isVariable;
exports.maskUpdate = exports.maskPromiseUpdate = exports.maskPromise = exports.maskNone = void 0;
exports.mkVariable = mkVariable;
exports.stayConstraintSpec = stayConstraintSpec;

var _component = _interopRequireDefault(__webpack_require__(/*! ./component */ "./lib/constraint-system/component.js"));

var _variableReference = _interopRequireDefault(__webpack_require__(/*! ./variable-reference */ "./lib/constraint-system/variable-reference.js"));

var _variable = _interopRequireDefault(__webpack_require__(/*! ./variable */ "./lib/constraint-system/variable.js"));

var _constraint = _interopRequireDefault(__webpack_require__(/*! ./constraint */ "./lib/constraint-system/constraint.js"));

var _method = _interopRequireDefault(__webpack_require__(/*! ./method */ "./lib/constraint-system/method.js"));

var _constraintSpec = _interopRequireDefault(__webpack_require__(/*! ./constraint-spec */ "./lib/constraint-system/constraint-spec.js"));

var _utilities = __webpack_require__(/*! ../utilities */ "./lib/utilities.js");

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {
    default: obj
  };
}

function mkVariable(owner, v) {
  let r = new _variableReference.default(owner);
  r.value = new _variable.default(r, v);
  return r;
}

function freshNameGenerator(prefix) {
  let n = 0;
  return () => prefix + n++;
}

const freshComponentName = freshNameGenerator("comp#");
exports.freshComponentName = freshComponentName;

function isOwnerOf(c1, c2) {
  while (c1 !== c2) {
    if (c2._owner == null) return false;else c2 = c2._owner;
  }

  return true;
} // FIXME: these are hacks because of trouble with instanceof and babel


function isConstraint(c) {
  return c.hasOwnProperty("_cspec");
}

function isVariable(v) {
  return v.hasOwnProperty("_activation");
}

function isMethod(v) {
  return v.hasOwnProperty("_promiseMask");
}

function isStay(c) {
  const method = (0, _utilities.first)(c._cspec._methods);
  return method != null && method.nvars === 1 && method.code.toString() === "a => a";
}

function enforceStayMethod(stay) {
  stay.selectedMethod = (0, _utilities.first)(stay._cspec._methods);
}

const maskNone = 0;
exports.maskNone = maskNone;
const maskPromise = 1;
exports.maskPromise = maskPromise;
const maskUpdate = 2;
exports.maskUpdate = maskUpdate;
const maskPromiseUpdate = maskPromise | maskUpdate;
exports.maskPromiseUpdate = maskPromiseUpdate;

function stayConstraintSpec() {
  return new _constraintSpec.default([new _method.default(1, [0], [0], [maskNone], a => a, "stay")]);
}

/***/ }),

/***/ "./lib/constraint-system/constraint-system.js":
/*!****************************************************!*\
  !*** ./lib/constraint-system/constraint-system.js ***!
  \****************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {



Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports["default"] = void 0;

var _graphAlgorithms = __webpack_require__(/*! ../graph-algorithms */ "./lib/graph-algorithms.js");

var _computationGraph = __webpack_require__(/*! ../computation-graph */ "./lib/computation-graph.js");

var _hdconsole = __webpack_require__(/*! ../hdconsole */ "./lib/hdconsole.js");

var _component = _interopRequireDefault(__webpack_require__(/*! ./component */ "./lib/constraint-system/component.js"));

var _method = _interopRequireDefault(__webpack_require__(/*! ./method */ "./lib/constraint-system/method.js"));

var _variable = _interopRequireDefault(__webpack_require__(/*! ./variable */ "./lib/constraint-system/variable.js"));

var _solutionGraph = __webpack_require__(/*! ./solution-graph */ "./lib/constraint-system/solution-graph.js");

var _simplePlanner = _interopRequireDefault(__webpack_require__(/*! ./simple-planner */ "./lib/constraint-system/simple-planner.js"));

var _constraintSystemUtil = __webpack_require__(/*! ./constraint-system-util */ "./lib/constraint-system/constraint-system-util.js");

var _utilities = __webpack_require__(/*! ../utilities */ "./lib/utilities.js");

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {
    default: obj
  };
}

class ConstraintSystem {
  // FIXME: move to a better place
  allConstraints() {
    return (0, _utilities.join)([this._musts, this._optionals.entries()]);
  }

  addComponent(c) {
    return c.connectSystem(this);
  }

  removeComponent(c) {
    if (c.system != this) {
      console.warn(`Tried to remove component ${c._name} from a constraint system in which it does not exist.`);
      return false;
    }

    return c.disconnectSystem();
  }

  prettyPrint() {
    let s = "-- musts --\n";

    for (let m of this._musts) s += m.prettyPrint();

    s += "-- optionals --\n";

    for (let m of this._optionals.entries()) s += m.prettyPrint();

    return s;
  }

  constructor() {
    this._optionals = new _utilities.PriorityList();
    this._musts = new Set();
    this._dirty = new Set();
    this._v2cs = new _utilities.OneToManyMap();
    this._usg = new _solutionGraph.UpstreamSolutionGraph(this);
    this._dsg = new _solutionGraph.DownstreamSolutionGraph(this);
  }

  update() {
    this.plan(this.allConstraints()); // FIXME: a little wasteful since plan iterates
    // all vars of all constraints, and same vars appear many time. OK for now

    this.solveFromConstraints(this.allConstraints());
  }

  variables() {
    return this._v2cs.keys();
  }

  constraints(v) {
    return this._v2cs.values(v);
  }

  *allConstraints() {
    for (let c of this._musts) yield c;

    for (let c of this._optionals.entries()) yield c;
  }

  isMust(c) {
    return this._musts.has(c);
  }

  isOptional(c) {
    return !this._musts.has(c);
  }

  addConstraint(c) {
    for (let v of c.variables()) this._v2cs.add(v, c);

    if (c._optional) this._optionals.pushBack(c);else this._musts.add(c);

    this._dirty.add(c);
  }

  removeConstraint(c) {
    for (let v of c.variables()) {
      this._v2cs.remove(v, c);

      if (this._v2cs.count(v) == 0) this._v2cs.removeKey(v);
    }

    if (c._optional) this._optionals.remove(c);else this._musts.delete(c);

    this._dirty.delete(c);
  }

  setDirty(c) {
    this._dirty.add(c);
  }

  gatherUpstreamConstraints(vs) {
    let r = (0, _utilities.filter)(v => (0, _constraintSystemUtil.isConstraint)(v), (0, _graphAlgorithms.reverseTopoSortFrom)(this._usg, vs));
    return r; // cast is to shut up flowtype
  }

  gatherDownstreamConstraints(vs) {
    let r = (0, _utilities.filter)(v => (0, _constraintSystemUtil.isConstraint)(v), (0, _graphAlgorithms.reverseTopoSortFrom)(this._dsg, vs));
    return r;
  }

  gatherDownstreamVariables(vs) {
    let r = (0, _utilities.filter)(v => (0, _constraintSystemUtil.isVariable)(v), (0, _graphAlgorithms.reverseTopoSortFrom)(this._dsg, vs));
    return r;
  }

  promoteVariable(v) {
    this.promoteConstraint(this.getStay(v));
  }

  promoteConstraint(c) {
    this._optionals.promote(c);
  }

  demoteConstraint(c) {
    this._optionals.demote(c);
  }

  strength(c) {
    if (this.isMust(c)) return this._optionals.highestPriority + 1;else return this._optionals.priority(c);
  }

  getStay(v) {
    for (let c of this._v2cs.values(v)) {
      if (c.name == "__stay__" + v.name) return c;
    }

    _hdconsole.hdconsole.assert(false, "Variable's stay constraint does not exists");

    return null;
  }

  planDirty() {
    return this.plan(this._dirty);
  }

  updateDirty() {
    this.planDirty();
    this.executeDirty();

    this._dirty.clear();
  }

  plan(toEnforce) {
    let vs = (0, _utilities.join)((0, _utilities.map)(c => c.variables(), toEnforce)); // all variables from all constraints in the enforce queues

    let constraintsThatNeedNewPlan = this.gatherUpstreamConstraints(vs); // gather all constraints upstream from these variables.
    // This includes all constraints reachable through any method
    // of an unenforced constraint. Quickplan does not do this since
    // it has a separate reenforcing phase, but we put all constraints
    // that may need to change into one bunch.
    // The point is that unenforced constraints may become enforceable,
    // and then they may force resolving of their upstream constraints.

    let enforceable = new Set(); // this is the set of constraints that is determined to be enforceable

    let forcedSet = new Set(); // this is the set of variables that are forced with the enforceable
    // methods

    let opts = new _utilities.BinaryHeap((c1, c2) => this.strength(c1) > this.strength(c2)); // initialize simple planner with all must constraints (should be enforceable)

    let sp = new _simplePlanner.default();
    (0, _utilities.forEach)(c => {
      c.clearSelectedMethod();

      c._initPruningData(); // FIXME: maybe just make methods viable again


      if (this.isMust(c)) {
        enforceable.add(c);
        sp.addConstraint(c);
      } else {
        opts.push(c);
      }
    }, constraintsThatNeedNewPlan); //

    _hdconsole.hdconsole.assert(sp.plan(), "no plan for must constraints"); // the conflicting constraints are in sp.constraints()


    while (!opts.empty()) {
      let opt = opts.pop();

      switch (sp.extendPlanIfPossible(opt, forcedSet)) {
        case false:
          break;

        case true:
          enforceable.add(opt);

          this._prune(opt, enforceable, forcedSet);

          break;

        case null:
          sp.clear();

          for (let c of enforceable) {
            //            c.clearSelectedMethod();
            sp.addConstraint(c);
          }

          sp.addConstraint(opt);

          if (sp.plan()) {
            enforceable.add(opt);

            this._prune(opt, enforceable, forcedSet);
          } else {
            sp.removeConstraint(opt);
            opt.clearSelectedMethod();
            sp.undoChangesAfterFailedPlan();
          }

          break;
      }
    }

    return enforceable;
  } // prune starting from constraint c


  _prune(c, constraintsOfInterest, forcedSet) {
    let inspected = new Set(); // initialize worklist with the variables that c forces

    let worklist = Array.from(c._forcedVariables, i => c.i2v(i));

    while (worklist.length > 0) {
      let v = worklist.pop();
      inspected.add(v);
      if (forcedSet.has(v)) continue;
      forcedSet.add(v); // inspect all constraints connected to v

      for (let cn of this.constraints(v)) {
        if (!cn.isEnforced()) continue;
        if (!constraintsOfInterest.has(cn)) continue;

        for (let vv of cn._makeMethodsNonviableByVariable(v)) {
          // vv iterates over the set of newly forced variables
          if (!inspected.has(vv)) {
            worklist.push(vv);
          }
        }
      }
    }
  }

  solveFromConstraints(cs) {
    this.solve((0, _utilities.join)((0, _utilities.map)(c => c.downstreamVariables(), cs)));
  }

  solve(vs) {
    let cs = [];

    for (let v of vs) {
      let c = this.getSourceConstraint(v);
      if (c != null) cs.push(c);
    } // Find the constraints that write to variables in vs.
    // Usually these are stay constraints, but could be other constraints if the
    // variable cannot stay in the chosen plan
    // NOTE: every variable must have a stay or other constraint that writes to it. Otherwise
    // constraints downstream from it are not found.


    let dsc = Array.from(this.gatherDownstreamConstraints(cs)).reverse();

    for (let c of dsc) this.scheduleConstraint(c);
  }

  executeDirty() {
    let dsc = Array.from(this.gatherDownstreamConstraints(this._dirty)).reverse();

    for (let c of dsc) this.scheduleConstraint(c);
  }

  getSourceConstraint(v) {
    for (let c of this._v2cs.values(v)) {
      if (c.isOutputVariable(v)) return c;
    }

    return null;
  }

  scheduleConstraint(c) {
    if (!c.isEnforced()) return; // if there is no selected method, there  is nothing to schedule

    let m = c.selectedMethod;
    let inDeferreds = Array.from(c.ins(m), v => v._activation); // push new activations to all outputs, but remember the previous onces

    let prevActs = [];
    (0, _utilities.forEach)(v => {
      prevActs.push(v._activation);
      v.pushNewActivation();
    }, c.outs(m));
    let outDeferreds = Array.from(c.outs(m), v => v._activation);
    new _computationGraph.MethodActivation(m.code, m._promiseMask).execute(inDeferreds, outDeferreds); // only release the old activations of outputs here; after a new method activation has been executed

    (0, _utilities.forEach)(v => (0, _utilities.release)(v), prevActs);
  } // touch order is fixed, last parameter gets highest


  scheduleCommand(ins, outs, f) {
    let inDeferreds = Array.from(ins, v => v._activation);
    let outArray = Array.from(outs); // push new activations to all outputs, but remember the previous onces

    let prevActs = [];
    (0, _utilities.forEach)(v => {
      prevActs.push(v._activation);
      v.pushNewActivation();
    }, outArray);
    let outDeferreds = Array.from(outArray, v => v._activation);
    new _computationGraph.MethodActivation(f, Array(inDeferreds.length).fill(false)).execute(inDeferreds, outDeferreds); // only release the old activations of outputs here; after a new method activation has been executed

    (0, _utilities.forEach)(v => (0, _utilities.release)(v), prevActs);
    outArray.forEach(v => this.promoteVariable(v));
    let enforceable = this.plan((0, _utilities.map)(v => this.getStay(v), outArray));
    this.solve(outArray);
  }

}

exports["default"] = ConstraintSystem;

/***/ }),

/***/ "./lib/constraint-system/constraint.js":
/*!*********************************************!*\
  !*** ./lib/constraint-system/constraint.js ***!
  \*********************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {



Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports["default"] = void 0;

var _hdconsole = __webpack_require__(/*! ../hdconsole */ "./lib/hdconsole.js");

var _constraintSystem = _interopRequireDefault(__webpack_require__(/*! ./constraint-system */ "./lib/constraint-system/constraint-system.js"));

var _constraintSpec = _interopRequireDefault(__webpack_require__(/*! ./constraint-spec */ "./lib/constraint-system/constraint-spec.js"));

var _method = _interopRequireDefault(__webpack_require__(/*! ./method */ "./lib/constraint-system/method.js"));

var _variableReference = _interopRequireDefault(__webpack_require__(/*! ./variable-reference */ "./lib/constraint-system/variable-reference.js"));

var _variable = _interopRequireDefault(__webpack_require__(/*! ./variable */ "./lib/constraint-system/variable.js"));

var _constraintSystemUtil = __webpack_require__(/*! ./constraint-system-util */ "./lib/constraint-system/constraint-system-util.js");

var _component = _interopRequireDefault(__webpack_require__(/*! ./component */ "./lib/constraint-system/component.js"));

var _utilities = __webpack_require__(/*! ../utilities */ "./lib/utilities.js");

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {
    default: obj
  };
}

class Constraint {
  // used in pruning
  // used in pruning
  // used in pruning
  prettyPrint() {
    let s = "constraint " + this.name + " {\n";
    s += "  ";

    for (let vr of this._varRefs) s += vr.prettyPrint() + "; ";

    s += "\n";
    s += this._cspec.prettyPrint("  ", this._varRefs);
    s += "}\n";
    return s;
  }

  substitute(vrs) {
    return new Constraint(this._owner, this._cspec, vrs, this._optional);
  }

  constructor(owner, cspec, vrefs, optional = false) {
    this._owner = owner;
    this._cspec = cspec;
    this._varRefs = [];
    this._vars = Array(cspec.nvars).fill(null);
    this._used = Array(cspec.nvars).fill(true); // FIXME: this is probably not used anymore

    this._danglingCount = cspec.nvars;
    this._optional = optional; // _vars is only used when all refs are resolved

    this._indices = new Map();
    let i = 0;

    for (let r of vrefs) {
      _hdconsole.hdconsole.assert((0, _constraintSystemUtil.isOwnerOf)(r._owner, this._owner), `Constructing constraint ${this.name} with a foreign variable reference`);

      this._varRefs[i] = r;
      {
        let index = i; // for correct scoping

        r.subscribe(v => {
          if (v !== null) {
            // connect
            if (this._vars[index] !== null) console.log("NOTNULL", this._vars[index]); // FIXME: is this necessary still?

            this._vars[index] = v;

            this._indices.set(v, index);

            if (--this._danglingCount == 0) {
              let s = this.system;
              if (s != null) s.addConstraint(this);
            }
          } else {
            // disconnect
            if (this._vars[index] === null) return; // already disconnected

            if (this._danglingCount++ == 0) {
              let s = this.system;
              if (s != null) s.removeConstraint(this);
            }

            this._indices.delete(this._vars[index]);

            this._vars[index] = null;
          }
        });
      }
      ++i;
    }

    this._initPruningData();

    this.clearSelectedMethod();
  }

  equals(c) {
    return this === c;
  }

  get name() {
    return this._owner == null ? "<unnamed>" : this._owner.constraintName(this);
  }

  get owner() {
    return this._owner;
  }

  get nvars() {
    return this._cspec.nvars;
  }

  get system() {
    return this._owner.system;
  }

  i2v(i) {
    return this._vars[i];
  }

  v2i(v) {
    _hdconsole.hdconsole.assert(this._indices.has(v), "unknown variable in Constraint.v2i: " + v.name);

    return this._indices.get(v);
  }

  variables() {
    return this._vars;
  }

  outs(m) {
    return m.vOuts(this._vars);
  }

  ins(m) {
    return m.vIns(this._vars);
  }

  nonOuts(m) {
    return m.vNonOuts(this._vars);
  }

  methods() {
    return this._cspec.methods();
  }

  hasMethod(m) {
    return this._cspec.hasMethod(m);
  }

  viableMethods() {
    return this._viableMethods;
  }

  get selectedMethod() {
    return this._selectedMethod;
  }

  set selectedMethod(m) {
    _hdconsole.hdconsole.assert(this._cspec.hasMethod(m), "selecting a method not in the constraint");

    this._selectedMethod = m;

    for (let i of m.ins()) this._used[i] = true;
  }

  clearSelectedMethod() {
    this._selectedMethod = null;
  }

  isEnforced() {
    return this._selectedMethod != null;
  }

  isOutputVariable(v) {
    if (this.selectedMethod == null) return false;else return this.selectedMethod.isOut(this.v2i(v));
  }

  isInputVariable(v) {
    if (this.selectedMethod == null) return false;else return this.selectedMethod.isIn(this.v2i(v));
  }

  isNonOutputVariable(v) {
    if (this.selectedMethod == null) return false;else return this.selectedMethod.isNonOut(this.v2i(v));
  }

  downstreamVariables() {
    if (this.selectedMethod == null) return (0, _utilities.mkEmptyIterable)();else return this.selectedMethod.vOuts(this._vars);
  }

  downstreamAndUndetermined() {
    if (this.selectedMethod == null) return this._vars;else return this.selectedMethod.vOuts(this._vars);
  }

  upstreamVariables() {
    if (this.selectedMethod == null) return (0, _utilities.mkEmptyIterable)();else return this.selectedMethod.vNonOuts(this._vars);
  }

  upstreamAndUndetermined() {
    if (this.selectedMethod == null) return this._vars;else return this.selectedMethod.vNonOuts(this._vars);
  }

  _initPruningData() {
    this._viableMethods = new Set();
    this._forcedVariables = new Set();
    this._outCounts = Array(this.nvars).fill(0);

    for (let m of this.methods()) {
      this._viableMethods.add(m);

      for (let i of m.outs()) this._outCounts[i] += 1;
    }

    const vmcount = this._viableMethods.size;

    for (let i = 0; i < this.nvars; ++i) {
      if (this._outCounts[i] === vmcount) this._forcedVariables.add(i);
    }
  }

  _makeMethodViable(m) {
    _hdconsole.hdconsole.assert(!this._viableMethods.has(m), "making a method viable twice");

    _hdconsole.hdconsole.assert(this.hasMethod(m), "unknown method");

    let vmcountOld = this._viableMethods.size;

    this._viableMethods.add(m);

    let newlyUnforced = [];

    for (let i of m.outs()) this._outCounts[i] += 1;

    for (let i of m.nonOuts()) {
      if (this._outCounts[i] === vmcountOld) {
        this._forcedVariables.delete(i);

        newlyUnforced.push(i);
      }
    }

    return newlyUnforced;
  } // returns the indices of the newly forced variables


  _makeMethodNonviable(m) {
    _hdconsole.hdconsole.assert(this._viableMethods.has(m), "making a method nonviable twice");

    _hdconsole.hdconsole.assert(this._viableMethods.size >= 2, "trying to make the last viable method nonviable");

    this._viableMethods.delete(m);

    let vmcount = this._viableMethods.size;
    let newlyForced = [];

    for (let i of m.outs()) this._outCounts[i] -= 1;

    for (let i of m.nonOuts()) {
      if (this._outCounts[i] === vmcount) {
        this._forcedVariables.add(i);

        newlyForced.push(i);
      }
    } // FIXME: remove at some point


    for (let i = 0; i < this._outCounts.length; ++i) _hdconsole.hdconsole.assert(this._outCounts[i] >= 0);

    return newlyForced;
  }

  _makeMethodsNonviableByVariable(v) {
    let vi = this.v2i(v);
    if (this._forcedVariables.has(vi)) return (0, _utilities.mkEmptyIterable)();
    let newlyForced = new Set();

    for (let m of (0, _utilities.filter)(m => m.isOut(vi), this._viableMethods)) {
      for (let vv of (0, _utilities.map)(v => this.i2v(v), this._makeMethodNonviable(m))) {
        newlyForced.add(vv);
      }
    }

    return newlyForced;
  }

}

exports["default"] = Constraint;

/***/ }),

/***/ "./lib/constraint-system/method.js":
/*!*****************************************!*\
  !*** ./lib/constraint-system/method.js ***!
  \*****************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {



Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports["default"] = void 0;

var _hdconsole = __webpack_require__(/*! ../hdconsole */ "./lib/hdconsole.js");

var _utilities = __webpack_require__(/*! ../utilities */ "./lib/utilities.js");

class Method {
  constructor(nvars, ins, outs, promiseMask, code, name) {
    this._ins = new Set(ins);
    this._outs = new Set(outs); // compute _nonOuts

    let indices = Array.from(Array(nvars).keys()); // [0, 1, ..., nvars-1]

    this._outs.forEach(i => indices[i] = null); // mark with null the indices that are outputs


    this._nonOuts = new Set();

    for (let e of indices) {
      if (e != null) this._nonOuts.add(e);
    }

    this._promiseMask = Array.from(promiseMask);

    _hdconsole.hdconsole.assert(this._ins.size === this._promiseMask.length, "Number of input arguments and length of promise mask must be the same");

    this.code = code;
    if (name != null) this._name = name;
  }

  get name() {
    return this._name == null ? "" : this._name;
  }

  get nvars() {
    return this._outs.size + this._nonOuts.size;
  }

  validIndex(i) {
    return i >= 0 && i < this.nvars;
  }

  ins() {
    return this._ins;
  }

  outs() {
    return this._outs;
  }

  nonOuts() {
    return this._nonOuts;
  }

  vIns(vs) {
    return (0, _utilities.map)(i => vs[i], this._ins);
  }

  vOuts(vs) {
    return (0, _utilities.map)(i => vs[i], this._outs);
  }

  vNonOuts(vs) {
    return (0, _utilities.map)(i => vs[i], this._nonOuts);
  }

  nIns() {
    return this._ins.size;
  }

  nOuts() {
    return this._outs.size;
  }

  nNonOuts() {
    return this._nonOuts.size;
  }

  isIn(i) {
    return this._ins.has(i);
  }

  isOut(i) {
    return this._outs.has(i);
  }

  isNonOut(i) {
    return this._nonOuts.has(i);
  }

  prettyPrint(vrefs) {
    let s = this.name + "(";

    for (const i of this._nonOuts) s += vrefs[i].name + " ";

    s += "->";

    for (const i of this._outs) s += " " + vrefs[i].name;

    s += ");";
    return s;
  }

}

exports["default"] = Method;

/***/ }),

/***/ "./lib/constraint-system/simple-planner.js":
/*!*************************************************!*\
  !*** ./lib/constraint-system/simple-planner.js ***!
  \*************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {



Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports["default"] = void 0;

var _variable = _interopRequireDefault(__webpack_require__(/*! ./variable */ "./lib/constraint-system/variable.js"));

var _constraint = _interopRequireDefault(__webpack_require__(/*! ./constraint */ "./lib/constraint-system/constraint.js"));

var _method = _interopRequireDefault(__webpack_require__(/*! ./method */ "./lib/constraint-system/method.js"));

var _hdconsole = __webpack_require__(/*! ../hdconsole */ "./lib/hdconsole.js");

var _utilities = __webpack_require__(/*! ../utilities */ "./lib/utilities.js");

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {
    default: obj
  };
}

class SimplePlanner {
  // record if selected method changes, so we can undo
  // to a previous solution
  constructor() {
    this._v2cs = new _utilities.OneToManyMap();
    this._freeVars = new Set();
    this._forcedByPlan = new Map();
    this._changeList = [];
  }

  addConstraint(c) {
    for (let v of c.variables()) {
      this._v2cs.add(v, c);

      switch (this._v2cs.count(v)) {
        case 1:
          this._freeVars.add(v);

          break;

        case 2:
          this._freeVars.delete(v);

          break;
      }
    }
  }

  removeConstraint(c) {
    for (let v of c.variables()) {
      this._v2cs.remove(v, c);

      switch (this._v2cs.count(v)) {
        case 0:
          this._freeVars.delete(v);

          this._v2cs.removeKey(v);

          break;

        case 1:
          this._freeVars.add(v);

          break;
      }
    }
  }

  clear() {
    this._v2cs.clear();

    this._freeVars.clear(); //    this._forcedByPlan.clear();

  }

  plan() {
    let foundFree = true;

    while (foundFree) {
      foundFree = false;

      for (let [c, m] of this.freeMethods()) {
        foundFree = true;
        let oldm = c.selectedMethod;

        if (oldm !== m && oldm != null) {
          this._changeList.push([c, oldm]);

          for (let v of c.outs(oldm)) this._forcedByPlan.delete(v); // clear old methods forced by data

        }

        c.selectedMethod = m;

        for (let v of c.outs(m)) this._forcedByPlan.set(v, m);

        this.removeConstraint(c);
      }
    }

    if (this._v2cs.countKeys() === 0) {
      this._changeList = []; // no undo info after successful plan

      return true;
    } else {
      return false;
    }
  }

  undoChangesAfterFailedPlan() {
    for (let [c, m] of this._changeList) {
      let oldm = c.selectedMethod;

      if (oldm != null) {
        for (let v of c.outs(oldm)) this._forcedByPlan.delete(v);
      }

      for (let v of c.outs(m)) this._forcedByPlan.set(v, m);

      c.selectedMethod = m;
    }
  }

  extendPlanIfPossible(c, forcedSet) {
    // FIXME: special case for stays for speed
    if ((0, _utilities.every)(m => (0, _utilities.some)(v => forcedSet.has(v), c.outs(m)), c._viableMethods)) return false; // if every method has some output to a forced variable,
    // the constraint is unenforceable

    if ((0, _utilities.every)(v => !this._forcedByPlan.has(v), c.variables())) {
      let m = (0, _utilities.first)(c._viableMethods); // just pick the first (likely only method) for the plan

      _hdconsole.hdconsole.assert(m != null, "constraint has no viable methods");

      if (m == null) return false; // FIXME: think if asserting is the best way: could just return false?

      c.selectedMethod = m;

      for (let v of c.outs(m)) {
        this._forcedByPlan.set(v, m);
      } // Methods that have an output to a forcedByPlan variable
      // cannot be added to the plan. But methods that have
      // nonOutputs that are forced, could lead to a cycle.
      // So we ban all constraints that have have variables
      // forced by the current plan.
      // This could be detected, but instead we just say
      // that it is unusure if plan is possible or not.
      // The usual case
      // of calling this function is with stay constraints,
      // and then cycles are not an issue.


      return true;
    }

    return null; // don't know if c can be enforced, must do planning
  }

  *freeMethods() {
    let seen = new Set(); // check constraint only once

    for (let v of this._freeVars) {
      for (let c of this._v2cs.values(v)) {
        // FIXME: this loop should only happen once, because v is free.
        // right?
        if (!seen.has(c)) {
          seen.add(c);

          for (let m of c.viableMethods()) {
            if ((0, _utilities.every)(v => this._freeVars.has(v), c.outs(m))) {
              yield [c, m];
              break; // only generate the first method per constraint
            }
          }
        }
      }
    }
  }

  firstFreeMethod() {
    return (0, _utilities.first)(this.freeMethods());
  }

  constraints() {
    let cs = new Set();

    for (let v of this._v2cs.keys()) {
      for (let c of this._v2cs.values(v)) cs.add(c);
    }

    return cs;
  }

}

exports["default"] = SimplePlanner;

/***/ }),

/***/ "./lib/constraint-system/solution-graph.js":
/*!*************************************************!*\
  !*** ./lib/constraint-system/solution-graph.js ***!
  \*************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {



Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.UpstreamSolutionGraph = exports.DownstreamSolutionGraph = void 0;

var _constraint = _interopRequireDefault(__webpack_require__(/*! ./constraint */ "./lib/constraint-system/constraint.js"));

var _variable = _interopRequireDefault(__webpack_require__(/*! ./variable */ "./lib/constraint-system/variable.js"));

var _constraintSystem = _interopRequireDefault(__webpack_require__(/*! ./constraint-system */ "./lib/constraint-system/constraint-system.js"));

var _constraintSystemUtil = __webpack_require__(/*! ./constraint-system-util */ "./lib/constraint-system/constraint-system-util.js");

var _utilities = __webpack_require__(/*! ../utilities */ "./lib/utilities.js");

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {
    default: obj
  };
}

class DownstreamSolutionGraph {
  constructor(system) {
    this._system = system;
  }

  adjacentOutVertices(v) {
    if ((0, _constraintSystemUtil.isConstraint)(v)) {
      return v.downstreamAndUndetermined();
    } else return (0, _utilities.filter)(c => c.isNonOutputVariable(v) || !c.isEnforced(), this._system._v2cs.values(v));
  }

  outDegree(v) {
    if ((0, _constraintSystemUtil.isConstraint)(v)) {
      return v.selectedMethod != null ? v.selectedMethod.nOuts() : 0;
    } else {
      return (0, _utilities.count)(this.adjacentOutVertices(v)); // not constant time
    }
  }

}

exports.DownstreamSolutionGraph = DownstreamSolutionGraph;

class UpstreamSolutionGraph {
  constructor(system) {
    this._system = system;
  }

  adjacentOutVertices(v) {
    if ((0, _constraintSystemUtil.isConstraint)(v)) {
      return v.upstreamAndUndetermined();
    } else return (0, _utilities.filter)(c => c.isOutputVariable(v) || !c.isEnforced(), this._system._v2cs.values(v));
  }

  outDegree(v) {
    if ((0, _constraintSystemUtil.isConstraint)(v)) {
      return v.selectedMethod != null ? v.selectedMethod.nNonOuts() : 0;
    } else {
      return (0, _utilities.count)(this.adjacentOutVertices(v)); // not constant time
    }
  }

}

exports.UpstreamSolutionGraph = UpstreamSolutionGraph;

/***/ }),

/***/ "./lib/constraint-system/variable-reference.js":
/*!*****************************************************!*\
  !*** ./lib/constraint-system/variable-reference.js ***!
  \*****************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {



Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports["default"] = void 0;

var _component = _interopRequireDefault(__webpack_require__(/*! ./component */ "./lib/constraint-system/component.js"));

var _constraintSystem = _interopRequireDefault(__webpack_require__(/*! ./constraint-system */ "./lib/constraint-system/constraint-system.js"));

var _variable = _interopRequireDefault(__webpack_require__(/*! ./variable */ "./lib/constraint-system/variable.js"));

var _utilities = __webpack_require__(/*! ../utilities */ "./lib/utilities.js");

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {
    default: obj
  };
}

class VariableReference extends _utilities.ObservableReference {
  constructor(owner) {
    super();
    this._owner = owner;
  }

  get system() {
    return this._owner.system;
  }

  get name() {
    return this._owner.variableReferenceName(this);
  }

  isOwningReference() {
    return this.value == null ? false : this.value._owner === this;
  }

  prettyPrint() {
    let s = this.name;
    if (this.value != null) s += ":" + this.value._index;
    return s;
  }

}

exports["default"] = VariableReference;

/***/ }),

/***/ "./lib/constraint-system/variable.js":
/*!*******************************************!*\
  !*** ./lib/constraint-system/variable.js ***!
  \*******************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {



Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports["default"] = void 0;

var _computationGraph = __webpack_require__(/*! ../computation-graph */ "./lib/computation-graph.js");

var Obs = _interopRequireWildcard(__webpack_require__(/*! ../observable */ "./lib/observable.js"));

var _variableReference = _interopRequireDefault(__webpack_require__(/*! ./variable-reference */ "./lib/constraint-system/variable-reference.js"));

var _constraintSystem = _interopRequireDefault(__webpack_require__(/*! ./constraint-system */ "./lib/constraint-system/constraint-system.js"));

var _utilities = __webpack_require__(/*! ../utilities */ "./lib/utilities.js");

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {
    default: obj
  };
}

function _getRequireWildcardCache(nodeInterop) {
  if (typeof WeakMap !== "function") return null;
  var cacheBabelInterop = new WeakMap();
  var cacheNodeInterop = new WeakMap();
  return (_getRequireWildcardCache = function (nodeInterop) {
    return nodeInterop ? cacheNodeInterop : cacheBabelInterop;
  })(nodeInterop);
}

function _interopRequireWildcard(obj, nodeInterop) {
  if (!nodeInterop && obj && obj.__esModule) {
    return obj;
  }

  if (obj === null || typeof obj !== "object" && typeof obj !== "function") {
    return {
      default: obj
    };
  }

  var cache = _getRequireWildcardCache(nodeInterop);

  if (cache && cache.has(obj)) {
    return cache.get(obj);
  }

  var newObj = {};
  var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor;

  for (var key in obj) {
    if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) {
      var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null;

      if (desc && (desc.get || desc.set)) {
        Object.defineProperty(newObj, key, desc);
      } else {
        newObj[key] = obj[key];
      }
    }
  }

  newObj.default = obj;

  if (cache) {
    cache.set(obj, newObj);
  }

  return newObj;
}

let freshIndex = (() => {
  let ind = 0;
  return () => ++ind;
})();

class Variable {
  // for debugging purposes
  // holds observers
  get value() {
    return this._inError ? undefined : this._value;
  }

  get error() {
    return this._inError ? this._error : undefined;
  }

  get stale() {
    return !this._pending && this._inError;
  }

  get pending() {
    return this._pending;
  }

  constructor(owner, v = undefined) {
    this._index = freshIndex();
    this._owner = owner;
    this._value = undefined;
    this._error = undefined;
    this._inError = false;
    this._pending = true;
    this._subject = new Obs.Subject(o => {
      let evt = {
        value: this._value,
        pending: this._pending,
        inError: this._inError
      };
      if (this._inError) evt.error = this._error;
      o.next(evt);
    });
    this.pushNewActivation();
    if (v !== undefined) this._activation.resolve(v);
  }

  subscribe(o) {
    return this._subject.subscribe(o);
  }

  subscribeValue(o) {
    return this._subject.filter(e => e.hasOwnProperty("value")).map(e => e.value).subscribe(o);
  }

  subscribePending(o) {
    return this._subject.filter(e => e.hasOwnProperty("pending")).map(e => e.pending).subscribe(o);
  }

  subscribeError(o) {
    return this._subject.filter(e => e.hasOwnProperty("inError") || e.hasOwnProperty("error")).map(e => {
      let r = {};
      if (e.hasOwnProperty("error")) r.error = e.error;
      if (e.hasOwnProperty("inError")) r.inError = e.inError;
      return r;
    }).subscribe(o);
  }

  pushNewActivation() {
    let r = new _computationGraph.VariableActivation(this);
    this._activation = r;

    if (this._pending === false) {
      this._pending = true;

      this._subject.sendNext({
        pending: true
      });
    }

    r.promise.then(val => {
      if (r === this._activation) {
        // is the activation still the newest
        this._value = val;
        let evt = {
          value: val
        };

        if (this._inError) {
          this._inError = false;
          evt.inError = false;
        }

        this._pending = false;
        evt.pending = false;

        this._subject.sendNext(evt);
      }
    }, e => {
      if (r === this._activation) {
        this._error = e;
        let evt = {
          error: e
        };

        if (!this._inError) {
          this._inError = true;
          evt.inError = true;
        }

        this._pending = false;
        evt.pending = false;

        this._subject.sendNext(evt);
      }
    });
    return r;
  }

  get currentPromise() {
    return this._activation.promise;
  }

  get owner() {
    return this._owner;
  }

  get system() {
    return this._owner.system;
  }

  get name() {
    if (this._owner == null) return "<unnamed>";else return this._owner.name;
  }

  set(v) {
    this.assign(v);
    let s = this.system;
    if (s != null) s.updateDirty();
    return this;
  }

  fail(e) {
    this._assign().reject(e);

    let s = this.system;
    if (s != null) s.updateDirty();
    return this;
  }

  assign(v) {
    this._assign().resolve(v);
  }

  _assign() {
    let prevActivation = this._activation;
    this.pushNewActivation();
    let s = this.system;

    if (s != null) {
      s.promoteVariable(this);
      let sc = s.getSourceConstraint(this);
      if (sc != null) s.setDirty(sc);
      s.setDirty(s.getStay(this));
    }

    (0, _utilities.release)(prevActivation);
    return this._activation;
  }

  touch() {
    let s = this.system;
    if (s != null) s.promoteVariable(this);
    return this;
  }

  _touchPlanSolve() {
    this.touch();
    let s = this.system;
    let prevActivation = this._activation;
    this.pushNewActivation();

    if (s == null) {
      (0, _utilities.release)(prevActivation);
      return this._activation;
    }

    let pushedActivation = this._activation;
    let sc = s.getSourceConstraint(this);
    s.setDirty(sc != null ? sc : s.getStay(this));
    s.updateDirty(); // solving pushes new activations to variables, also possibly to this._activation.
    // This happens if 'this' cannot stay in the current plan.

    (0, _utilities.release)(prevActivation); // return the activation that should be resolved or rejected

    return pushedActivation;
  }

}

exports["default"] = Variable;

/***/ }),

/***/ "./lib/graph-algorithms.js":
/*!*********************************!*\
  !*** ./lib/graph-algorithms.js ***!
  \*********************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {



Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.dfsVisit = dfsVisit;
exports.reverseTopoSort = reverseTopoSort;
exports.reverseTopoSortFrom = reverseTopoSortFrom;

var _utilities = __webpack_require__(/*! ./utilities */ "./lib/utilities.js"); // export type { DfsAdjacencyVisitor };


function dfsVisit(g, vs, visitor, visited) {
  if (visited == null) visited = new Set();
  let stack = [];
  let it = (0, _utilities.iterableToIterator)(vs);

  while (true) {
    let n = it.next();

    if (n.done) {
      if (stack.length === 0) break; // returns

      let v;
      [v, it] = stack.pop();
      visitor.finishVertex(v);
      continue;
    }

    let v = n.value;

    if (visited.has(v)) {
      continue;
    }

    visitor.discoverVertex(v);
    visited.add(v);
    stack.push([v, it]);
    it = (0, _utilities.iterableToIterator)(g.adjacentOutVertices(v));
  }
}

function reverseTopoSort(g) {
  return reverseTopoSortFrom(g, g.vertices());
}

class TopoVisitor {
  constructor() {
    this.result = [];
  }

  discoverVertex(v) {}

  finishVertex(v) {
    this.result.push(v);
  }

}

function reverseTopoSortFrom(g, vs) {
  let vis = new TopoVisitor();
  dfsVisit(g, vs, vis);
  return vis.result;
}

/***/ }),

/***/ "./lib/hdconsole.js":
/*!**************************!*\
  !*** ./lib/hdconsole.js ***!
  \**************************/
/***/ ((__unused_webpack_module, exports) => {



Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.hdconsole = exports["default"] = exports.HdError = exports.HdConsole = void 0;

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
}
/**
 * The HdConsole class replicates basic functionality of Console, and adds methods to turn logging on and off.
 */


class HdConsole {
  /**
   * @param name Name of the console
   */
  constructor(name) {
    _defineProperty(this, "error", console.error);

    _defineProperty(this, "assert", console.assert);

    this._name = name;
    this.on();
  }

  off() {
    this.log = (...args) => {};

    this.warn = (...args) => {};

    this.error = (...args) => {};

    this.assert = (_, ...args) => {};
  }
  /**
   * Only log errors and asserts
   */


  errorsOnly() {
    this.off();
    this.error = console.error;
    this.assert = console.assert;
  }
  /**
   * Enable all logging
   */


  on() {
    this.log = console.log;
    this.warn = console.warn;
    this.error = console.error;
    this.assert = console.assert;
  }

}
/**
 *
 * Default console used for logging by hotdrink.
 *
 * @type {HdConsole}
 */


exports.HdConsole = HdConsole;
const hdconsole = new HdConsole("HotDrink");
exports.hdconsole = hdconsole;
var _default = {
  hdconsole
};
exports["default"] = _default;

class HdError extends Error {
  constructor(msg, ...params) {
    super(msg, ...params); // Maintains proper stack trace for where our error was thrown (only available on V8)

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, HdError);
    }

    this.name = "HdError";
  }

}

exports.HdError = HdError;

/***/ }),

/***/ "./lib/hotdrink.js":
/*!*************************!*\
  !*** ./lib/hotdrink.js ***!
  \*************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {



Object.defineProperty(exports, "__esModule", ({
  value: true
}));
var _exportNames = {
  defaultConstraintSystem: true,
  constraintSystemInVisNodesAndEdges: true,
  constraintSystemInVisAllNodesAndEdges: true,
  ConstraintSystem: true,
  Method: true,
  component: true,
  hdl: true,
  hdconsole: true,
  maskPromiseUpdate: true,
  maskUpdate: true,
  maskPromise: true,
  maskNone: true,
  MaskType: true,
  Component: true,
  Constraint: true,
  ConstraintSpec: true,
  Variable: true,
  VariableReference: true,
  SimplePlanner: true
};
Object.defineProperty(exports, "Component", ({
  enumerable: true,
  get: function () {
    return _component.default;
  }
}));
Object.defineProperty(exports, "Constraint", ({
  enumerable: true,
  get: function () {
    return _constraint.default;
  }
}));
Object.defineProperty(exports, "ConstraintSpec", ({
  enumerable: true,
  get: function () {
    return _constraintSpec.default;
  }
}));
Object.defineProperty(exports, "ConstraintSystem", ({
  enumerable: true,
  get: function () {
    return _constraintSystem.default;
  }
}));
Object.defineProperty(exports, "MaskType", ({
  enumerable: true,
  get: function () {
    return _constraintSystemUtil.MaskType;
  }
}));
Object.defineProperty(exports, "Method", ({
  enumerable: true,
  get: function () {
    return _method.default;
  }
}));
Object.defineProperty(exports, "SimplePlanner", ({
  enumerable: true,
  get: function () {
    return _simplePlanner.default;
  }
}));
Object.defineProperty(exports, "Variable", ({
  enumerable: true,
  get: function () {
    return _variable.default;
  }
}));
Object.defineProperty(exports, "VariableReference", ({
  enumerable: true,
  get: function () {
    return _variableReference.default;
  }
}));
Object.defineProperty(exports, "component", ({
  enumerable: true,
  get: function () {
    return _constraintBuilder.component;
  }
}));
exports.constraintSystemInVisAllNodesAndEdges = constraintSystemInVisAllNodesAndEdges;
exports.constraintSystemInVisNodesAndEdges = constraintSystemInVisNodesAndEdges;
exports.defaultConstraintSystem = void 0;
Object.defineProperty(exports, "hdconsole", ({
  enumerable: true,
  get: function () {
    return _hdconsole.hdconsole;
  }
}));
Object.defineProperty(exports, "hdl", ({
  enumerable: true,
  get: function () {
    return _constraintBuilder.hdl;
  }
}));
Object.defineProperty(exports, "maskNone", ({
  enumerable: true,
  get: function () {
    return _constraintSystemUtil.maskNone;
  }
}));
Object.defineProperty(exports, "maskPromise", ({
  enumerable: true,
  get: function () {
    return _constraintSystemUtil.maskPromise;
  }
}));
Object.defineProperty(exports, "maskPromiseUpdate", ({
  enumerable: true,
  get: function () {
    return _constraintSystemUtil.maskPromiseUpdate;
  }
}));
Object.defineProperty(exports, "maskUpdate", ({
  enumerable: true,
  get: function () {
    return _constraintSystemUtil.maskUpdate;
  }
}));

var _constraintSystem = _interopRequireDefault(__webpack_require__(/*! ./constraint-system/constraint-system */ "./lib/constraint-system/constraint-system.js"));

var _method = _interopRequireDefault(__webpack_require__(/*! ./constraint-system/method */ "./lib/constraint-system/method.js"));

var _constraintBuilder = __webpack_require__(/*! ./constraint-builder */ "./lib/constraint-builder.js");

var _hdconsole = __webpack_require__(/*! ./hdconsole */ "./lib/hdconsole.js");

var _solutionGraph = __webpack_require__(/*! ./constraint-system/solution-graph */ "./lib/constraint-system/solution-graph.js");

Object.keys(_solutionGraph).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  if (key in exports && exports[key] === _solutionGraph[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _solutionGraph[key];
    }
  });
});

var _constraintSystemUtil = __webpack_require__(/*! ./constraint-system/constraint-system-util */ "./lib/constraint-system/constraint-system-util.js");

Object.keys(_constraintSystemUtil).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  if (key in exports && exports[key] === _constraintSystemUtil[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _constraintSystemUtil[key];
    }
  });
});

var _component = _interopRequireDefault(__webpack_require__(/*! ./constraint-system/component */ "./lib/constraint-system/component.js"));

var _constraint = _interopRequireDefault(__webpack_require__(/*! ./constraint-system/constraint */ "./lib/constraint-system/constraint.js"));

var _constraintSpec = _interopRequireDefault(__webpack_require__(/*! ./constraint-system/constraint-spec */ "./lib/constraint-system/constraint-spec.js"));

var _variable = _interopRequireDefault(__webpack_require__(/*! ./constraint-system/variable */ "./lib/constraint-system/variable.js"));

var _variableReference = _interopRequireDefault(__webpack_require__(/*! ./constraint-system/variable-reference */ "./lib/constraint-system/variable-reference.js"));

var _simplePlanner = _interopRequireDefault(__webpack_require__(/*! ./constraint-system/simple-planner */ "./lib/constraint-system/simple-planner.js"));

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {
    default: obj
  };
}

const defaultConstraintSystem = new _constraintSystem.default();
exports.defaultConstraintSystem = defaultConstraintSystem;

let objectId = (() => {
  let m = new WeakMap();
  let counter = 0;

  let wm = o => {
    let id = m.get(o);
    if (id !== undefined) return id;else {
      let curr = counter++;
      m.set(o, curr);
      return curr;
    }
  };

  return wm;
})();

function constraintSystemInVisNodesAndEdges(cs) {
  let nodes = [];
  let edges = [];

  for (let v of cs.variables()) {
    nodes.push({
      id: objectId(v),
      label: v.name,
      shape: "box"
    });
  }

  for (let c of cs.allConstraints()) {
    let mcounter = 0;
    if (!c.isEnforced()) continue;
    let m = c.selectedMethod;
    let id = `m#${objectId(c)}-${mcounter}`;
    console.log("ID: ", id, "C.M", c.name + "." + m.name);
    let color = "lime";
    nodes.push({
      id: id,
      label: c.name + "." + m.name,
      cid: "C#" + objectId(c),
      color: color
    });

    for (let v of c.nonOuts(m)) edges.push({
      from: objectId(v),
      to: id,
      arrows: "to",
      dashes: true
    });

    for (let v of c.outs(m)) edges.push({
      from: id,
      to: objectId(v),
      arrows: "to"
    }); // FIXME: ins should be the complement of outs


    ++mcounter;
  }

  return [nodes, edges];
}

function constraintSystemInVisAllNodesAndEdges(cs) {
  let nodes = [];
  let edges = [];

  for (let v of cs.variables()) {
    nodes.push({
      id: objectId(v),
      label: v.name,
      shape: "box"
    });
  }

  for (let c of cs.allConstraints()) {
    let mcounter = 0; //if (!c.isEnforced()) continue;

    for (let m of c.methods()) {
      let id = `m#${objectId(c)}-${mcounter}`;
      console.log("ID: ", id, "C.M", c.name + "." + m.name);
      let color = "lime";
      nodes.push({
        id: id,
        label: c.name + "." + m.name,
        cid: "C#" + objectId(c),
        color: color
      });

      for (let v of c.nonOuts(m)) {
        edges.push({
          from: objectId(v),
          to: id,
          arrows: "to",
          dashes: true
        });
        console.log("INS: ", v.name);
      }

      for (let v of c.outs(m)) {
        edges.push({
          from: id,
          to: objectId(v),
          arrows: "to"
          /*, label: "FROM_C_"+c.name+"_M_"+m.name+"+TO_"+v.name*/

        });
        console.log("OUTS: ", v.name);
      } // FIXME: ins should be the complement of outs


      ++mcounter;
    }
  }

  return [nodes, edges];
}

/***/ }),

/***/ "./lib/lexing-tools.js":
/*!*****************************!*\
  !*** ./lib/lexing-tools.js ***!
  \*****************************/
/***/ ((__unused_webpack_module, exports) => {



Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.Position = void 0;
exports.isAlpha = isAlpha;
exports.isAlphaNum = isAlphaNum;
exports.isAlphaPlus = isAlphaPlus;
exports.isDigit = isDigit;
exports.isWhitespace = isWhitespace;

class Position {
  // 0-indexed position on the entire input string
  // 1-indexed
  // 0-indexed
  // name of a source (file) the position refers to
  constructor(pos, row, col, source) {
    this._pos = pos;
    this._row = row;
    this._col = col;
    if (source !== undefined) this._source = source;
  }

  get pos() {
    return this._pos;
  }

  get row() {
    return this._row;
  }

  get col() {
    return this._col;
  }

  get source() {
    return this._source != null ? this._source : "-";
  }

  toString() {
    return this.source + ":" + this.row + ":" + this.col;
  }

  advance(str) {
    for (let i = 0; i < str.length; ++i) {
      if (str[i] === "\n") {
        this._row++;
        this._col = 0;
      } else {
        this._col++;
      }

      this._pos++;
    }
  }

  clone() {
    let p = new Position(this.pos, this.row, this.col);
    if (this.hasOwnProperty("_source")) p._source = this._source; // optional parameters do not accept null,
    // therefore we set _source after construction
    // We only set it if the property exists in the source;
    //   otherwise we might get _source to exist but be undefined in target,
    //   and then source and target would not compare (deep)equal

    return p;
  }

}

exports.Position = Position;

function isWhitespace(c) {
  switch (c) {
    case " ":
    case "\t":
    case "\r":
    case "\n":
      return true;

    default:
      return false;
  }
}

function isDigit(c) {
  return c >= "0" && c <= "9";
}

function isAlpha(c) {
  return c >= "a" && c <= "z" || c >= "A" && c <= "Z";
}

function isAlphaPlus(c) {
  return isAlpha(c) || c === "_" || c === "$";
}

function isAlphaNum(c) {
  return isAlphaPlus(c) || isDigit(c);
}

/***/ }),

/***/ "./lib/observable.js":
/*!***************************!*\
  !*** ./lib/observable.js ***!
  \***************************/
/***/ ((__unused_webpack_module, exports) => {



Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.SubscriptionObserver = exports.Subject = exports.ReplaySubject = exports.Observable = exports.HdSubscription = exports.BehaviorSubject = void 0;
exports.mkObserver = mkObserver; // create an observer from separate functions

function mkObserver(obs, err, complete) {
  if (typeof obs === "function") {
    let observer = {};
    observer.next = obs;
    if (err != null) observer.error = err;
    if (complete != null) observer.complete = complete;
    return observer;
  } else {
    return obs;
  }
}

class Observable {
  constructor(subscriber) {
    this._subscriber = subscriber;
  }

  subscribe(obs, err, complete) {
    let observer = mkObserver(obs, err, complete);
    let subscription = new HdSubscription(observer);

    try {
      if (observer.start != null) observer.start(subscription);
    } catch (e) {// FIXME: HostReportError(e)
    }

    if (subscription.closed) return subscription;
    let subscriptionObserver = new SubscriptionObserver(subscription);

    try {
      let cleanup = this._subscriber(subscriptionObserver);

      if (typeof cleanup === "object") cleanup = () => cleanup.unsubscribe(); // must be a Subscription object

      subscription._cleanup = cleanup;
    } catch (e) {
      subscriptionObserver.error(e);
    }

    if (subscription.closed) subscription.cleanup();
    return subscription;
  } // FIXME Implement later
  // [Symbol.observable]() : Observable;


  static of(...items) {
    return new Observable(observer => {
      for (let item of items) {
        observer.next(item);
        if (observer.closed) return;
      }

      observer.complete();
    });
  } // FIXME Implement later
  // static from(obs: Observable<T> | Iterable<T>) : Observable<T> {
  //
  // }


  filter(p) {
    return new Observable(observer => {
      let o = mkObserver(observer);
      if (o.next == null) o = {
        next: e => {}
      };
      let s = this.subscribe(e => {
        if (p(e) == true) o.next(e);
      });
      return s;
    });
  }

  map(f) {
    return new Observable(observer => {
      let o = mkObserver(observer);
      if (o.next == null) o = {
        next: e => {}
      };
      let s = this.subscribe(e => {
        let o = mkObserver(observer);
        o.next(f(e));
      });
      return s;
    });
  }

}

exports.Observable = Observable;

class HdSubscription {
  constructor(observer) {
    this._observer = observer;
    this._cleanup = undefined;
  }

  unsubscribe() {
    this._observer = undefined;
    this.cleanup();
  }

  get closed() {
    return this._observer === undefined;
  }

  cleanup() {
    const cUp = this._cleanup;
    if (cUp === undefined) return;
    this._cleanup = undefined;

    try {
      cUp();
    } catch (e) {
      /* FIXME: HostReportErrors(e) */
    }
  }

}

exports.HdSubscription = HdSubscription;

class SubscriptionObserver {
  constructor(s) {
    this._subscription = s;
  }

  get closed() {
    return this._subscription.closed;
  }

  next(value) {
    let s = this._subscription; // appeasing flowtype

    if (s.closed) return;

    if (s._observer.next != null) {
      try {
        s._observer.next(value);
      } catch (e) {
        /* FIXME: HostReportErrors(e) */
      }
    }
  }

  error(errorValue) {
    let s = this._subscription; // appeasing flowtype

    if (s.closed) return; // FIXME, why not test this.closed ?

    if (s._observer.error != null) {
      try {
        s._observer.error(errorValue);
      } catch (e) {
        /* FIXME: HostReportErrors(e) */
      }
    }

    this._subscription.cleanup();
  }

  complete() {
    let s = this._subscription; // appeasing flowtype

    if (s.closed) return;

    if (s._observer.complete != null) {
      try {
        s._observer.complete();
      } catch (e) {
        /* FIXME: HostReportErrors(e) */
      }
    }

    this._subscription.cleanup();
  }

}

exports.SubscriptionObserver = SubscriptionObserver;

class Subject extends Observable {
  constructor(f = o => {}) {
    let state = {
      observers: new Set(),
      done: false
    };
    super(o => {
      if (!state.done) state.observers.add(o);
      f(o);
      return () => state.observers.delete(o); // this is a no-op if done==true
    });
    this._subjectState = state;
  }

  sendNext(v) {
    if (this._subjectState.done) return;

    for (const obs of this._subjectState.observers) obs.next(v);
  }

  sendError(e) {
    if (this._subjectState.done) return;
    this._subjectState.done = true;

    for (const obs of this._subjectState.observers) obs.error(e);
  }

  sendComplete() {
    if (this._subjectState.done) return;
    this._subjectState.done = true;

    for (const obs of this._subjectState.observers) obs.complete();
  }

  get nObservers() {
    return this._subjectState.observers.size;
  }

}

exports.Subject = Subject;

class ReplaySubject extends Subject {
  constructor(limit = 1) {
    let state = {
      past: [],
      pastLimit: limit,
      isCompleted: false,
      isError: false
    };
    super(o => {
      for (let v of state.past) o.next(v);

      if (state.isError) o.error(state.error);else if (state.isCompleted) o.complete();
    });
    this._replaySubjectState = state;
  }

  sendNext(v) {
    this._replaySubjectState.past.push(v);

    if (this._replaySubjectState.past.length > this._replaySubjectState.pastLimit) {
      this._replaySubjectState.past.shift();
    }

    super.sendNext(v);
  }

  sendError(e) {
    this._replaySubjectState.isError = true;
    this._replaySubjectState.error = e;
    super.sendError(e);
  }

  sendComplete() {
    this._replaySubjectState.isCompleted = true;
    super.sendComplete();
  }

}

exports.ReplaySubject = ReplaySubject;

class BehaviorSubject extends ReplaySubject {
  constructor(v) {
    super(1);

    this._replaySubjectState.past.push(v);
  }

}

exports.BehaviorSubject = BehaviorSubject;

/***/ }),

/***/ "./lib/parsing.js":
/*!************************!*\
  !*** ./lib/parsing.js ***!
  \************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {



Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.blockComment = exports.alphaPlus = exports.alphaNum = exports.ParseState = exports.ParseError = void 0;
exports.context = context;
exports.digit = exports.currentPos = void 0;
exports.eof = eof;
exports.exactString = exactString;
exports.fail = fail;
exports.failF = failF;
exports.failure = failure;
exports.go = go;
exports.hdl = hdl;
exports.identifier = identifier;
exports.ignore = ignore;
exports.inBetween = inBetween;
exports.item = item;
exports.keyword = keyword;
exports.lift = lift;
exports.lift2 = lift2;
exports.lift3 = lift3;
exports.lift4 = lift4;
exports.lift5 = lift5;
exports.lineComment = void 0;
exports.many = many;
exports.many1 = many1;
exports.manyws = void 0;
exports.mkParseState = mkParseState;
exports.must = must;
exports.named = named;
exports.nat = void 0;
exports.notFollowedBy = notFollowedBy;
exports.ok = ok;
exports.oneOf = oneOf;
exports.onews = void 0;
exports.opt = opt;
exports.pBind = pBind;
exports.pBind_ = pBind_;
exports.pChar = pChar;
exports.pChars = pChars;
exports.pNot = pNot;
exports.pSplice = void 0;
exports.pTry = pTry;
exports.parens = parens;
exports.peekItem = peekItem;
exports.ret = ret;
exports.sat = sat;
exports.sepList = sepList;
exports.token = token;
exports.until = until;
exports.word = word;

var lex = _interopRequireWildcard(__webpack_require__(/*! ./lexing-tools */ "./lib/lexing-tools.js"));

var _peekIterator = _interopRequireDefault(__webpack_require__(/*! ./peek-iterator */ "./lib/peek-iterator.js"));

var _utilities = __webpack_require__(/*! ./utilities */ "./lib/utilities.js");

var _hdconsole = __webpack_require__(/*! ./hdconsole */ "./lib/hdconsole.js");

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {
    default: obj
  };
}

function _getRequireWildcardCache(nodeInterop) {
  if (typeof WeakMap !== "function") return null;
  var cacheBabelInterop = new WeakMap();
  var cacheNodeInterop = new WeakMap();
  return (_getRequireWildcardCache = function (nodeInterop) {
    return nodeInterop ? cacheNodeInterop : cacheBabelInterop;
  })(nodeInterop);
}

function _interopRequireWildcard(obj, nodeInterop) {
  if (!nodeInterop && obj && obj.__esModule) {
    return obj;
  }

  if (obj === null || typeof obj !== "object" && typeof obj !== "function") {
    return {
      default: obj
    };
  }

  var cache = _getRequireWildcardCache(nodeInterop);

  if (cache && cache.has(obj)) {
    return cache.get(obj);
  }

  var newObj = {};
  var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor;

  for (var key in obj) {
    if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) {
      var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null;

      if (desc && (desc.get || desc.set)) {
        Object.defineProperty(newObj, key, desc);
      } else {
        newObj[key] = obj[key];
      }
    }
  }

  newObj.default = obj;

  if (cache) {
    cache.set(obj, newObj);
  }

  return newObj;
}

class ParseState {
  constructor(input, splices = [], pos = new lex.Position(0, 1, 0)) {
    this._input = new _peekIterator.default(input);
    this._context = [];
    this._splices = splices;
    this.pos = pos;
  }

  pushContext(str) {
    this._context.push([str, this.pos.clone()]);
  }

  popContext() {
    this._context.pop();
  }

  checkpoint() {
    this._input.checkpoint(this.pos.clone());
  }

  forgetCheckpoint() {
    this._input.forgetCheckpoint();
  }

  resetCheckpoint() {
    this.pos = this._input.reset();
  }

  peek() {
    return this._input.peek();
  }

  advance() {
    let i = this._input.next();

    if (!i.done) this.pos.advance(i.value);
    return i.value;
  }

  getSplice(i) {
    return this._splices[i];
  }

  parseErrorF(expF, msg) {
    // extract the topmost context, if any
    let ctxName, ctxPos;
    if (this._context.length > 0) [ctxName, ctxPos] = this._context[this._context.length - 1];
    this.checkpoint();
    let r = lift((spc, nonspc) => spc + nonspc.join(""), manyws, many(sat(c => !lex.isWhitespace(c), "")))(this);
    this.resetCheckpoint();
    let unexpected = "<?>";
    if (r.success) unexpected = r.value;
    return new ParseError(this.pos.clone(), expF, unexpected, ctxName, ctxPos, msg);
  }

  parseError(exp, msg) {
    return this.parseErrorF(() => exp, msg);
  }

}

exports.ParseState = ParseState;

function mkParseState(s, splices = []) {
  // $FlowFixMe
  return new ParseState(s[Symbol.iterator](), splices);
}

function ok(t, c = true) {
  return {
    success: true,
    value: t,
    consumed: c
  };
}

function fail(es, c = false) {
  return failF(() => es, c);
}

function failF(ef, c = false) {
  return {
    success: false,
    expecting: ef,
    consumed: c
  };
}

class ParseError extends Error {
  constructor(pos, expF, unexp, ctxName, ctxPos, msg) {
    super();
    this._pos = pos;
    this._expecting = expF;
    this._unexpected = unexp;
    this._ctxName = ctxName;
    this._ctxPos = ctxPos;
    this._msg = msg;
  }

  get name() {
    return "HotDrink Parse Error";
  }

  set name(s) {
    throw Error("Cannot set the name of ParseError");
  }

  get message() {
    let msg = this._pos.toString() + "\n";
    if (this._msg != null) msg += this._msg + "\n";

    let e = this._formatExpecting();

    let u = this._unexpected != null ? this._unexpected : "<eof>";
    if (e !== "") msg += "Expecting " + e + ". ";
    msg += "Unexpected " + u + "\n";

    if (this._ctxName != null && this._ctxPos != null) {
      msg += "\n" + "  while parsing " + this._ctxName + " (" + this._ctxPos.toString() + ")\n";
    }

    return msg;
  }

  set message(s) {
    throw Error("Cannot set the message of ParseError");
  }

  _formatExpecting() {
    let es = this._expecting();

    if (es.length == 1) return es[0];
    if (es.length > 1) return "one of (" + es.join(", ") + ")";
    return "";
  }

}

exports.ParseError = ParseError;

function item(ps) {
  let v = ps.advance();
  if (v == null) return fail(["<item>"]);else return ok(v);
}

function peekItem(ps) {
  let v = ps.peek();
  if (v == null) return fail(["<peek-item>"]);else return ok(v, false);
}

function failure(ps) {
  return fail([]);
}

function ret(v, consumed = false) {
  return ps => ok(v, consumed);
}

function eof(ps) {
  return peekItem(ps).success ? fail(["<eof>"]) : ok(null, false);
}

function sat(predicate, name = "<sat: ?>") {
  let f = ps => {
    let r = peekItem(ps);
    if (r.success && predicate(r.value)) return item(ps);else return fail([name]);
  };

  f.parserName = name;
  return f;
}

function pChar(c) {
  return sat(x => x === c, c);
}

function pChars(cs) {
  return sat(x => (0, _utilities.some)(v => v === x, cs), `<any of '${cs}'>`);
}

const alphaPlus = sat(lex.isAlphaPlus, "<letter>");
exports.alphaPlus = alphaPlus;
const alphaNum = sat(lex.isAlphaNum, "<letter or digit>");
exports.alphaNum = alphaNum;
const digit = sat(lex.isDigit, "<digit>");
exports.digit = digit;

function many(p) {
  return oneOf(many1(p), ret([]));
}

function many1(p) {
  return ps => {
    return lift((v, vs) => {
      vs.unshift(v);
      return vs;
    }, p, many(p))(ps);
  };
}

function exactString(s) {
  let result = ps => {
    ps.checkpoint();

    for (let c of s) {
      let r = item(ps);

      if (r.success && r.value != c || !r.success) {
        ps.resetCheckpoint();
        return fail([s]);
      }
    }

    ps.forgetCheckpoint();
    return ok(s, s.length > 0); // consumes if nonzero length
  };

  result.parserName = s;
  return result;
}

const lineComment = lift((pre, rest, nl) => pre + rest.join("") + nl, exactString("//"), many(sat(t => t !== "\n")), // fails at '\n' and also at <eof>
oneOf(pChar("\n"), pBind_(eof, ret(""))));
exports.lineComment = lineComment;
const blockComment = lift((pre, rest, post) => pre + rest.join("") + post, exactString("/*"), many(pBind_(pNot(exactString("*/")), item)), oneOf(exactString("*/"), pBind_(eof, ret(""))));
exports.blockComment = blockComment;
const onews = sat(lex.isWhitespace, "<whitespace>");
exports.onews = onews;
const manyws = lift(a => a.join(""), many(oneOf(onews, lineComment, blockComment)));
exports.manyws = manyws;

function pBind(p, f) {
  return ps => {
    const r1 = p(ps);
    if (!r1.success) return r1; // p failed, hence fail

    let r2 = f(r1.value)(ps);
    if (!r2.consumed) r2.consumed = r1.consumed; // consumed is true if either consumed

    return r2;
  };
}

function pBind_(p, q) {
  return pBind(p, _ => q);
}

function opt(p, v) {
  return ps => {
    ps.checkpoint();
    let r = p(ps);

    if (r.success) {
      ps.forgetCheckpoint();
      return ok(r.value, r.consumed);
    } else {
      ps.resetCheckpoint();
      return ok(v, false);
    }
  };
}

const _ignoreTag = {};

function ignore(p) {
  return lift(() => _ignoreTag, p);
}

function lift(f, ...parsers) {
  return ps => {
    let rs = [];
    let consumed = false;

    for (let p of parsers) {
      let r = p(ps);
      r.consumed = r.consumed || consumed;
      consumed = r.consumed;
      if (!r.success) return r;
      if (r.value !== _ignoreTag) rs.push(r.value);
    }

    return ok(f(...rs));
  };
}

function lift2(f) {
  return (p1, p2) => lift(f, p1, p2);
}

function lift3(f) {
  return (p1, p2, p3) => lift(f, p1, p2, p3);
}

function lift4(f) {
  return (p1, p2, p3, p4) => lift(f, p1, p2, p3, p4);
}

function lift5(f) {
  return (p1, p2, p3, p4, p5) => lift(f, p1, p2, p3, p4, p5);
}

function go(pg) {
  return function (ps) {
    let consumed = false;
    let pr = pg.next();

    while (!pr.done) {
      let r = pr.value(ps);
      r.consumed = r.consumed || consumed;
      consumed = r.consumed;
      if (!r.success) return r;
      pr = pg.next(r.value);
    }

    if (pr.value === undefined) {
      // if this happens, the generator is faulty
      _hdconsole.hdconsole.assert(false, "Incorrect yield parser");

      return fail(["<?>"], consumed);
    } else return ok(pr.value, consumed);
  };
}

function inBetween(p, open, close) {
  return go(function* () {
    yield open;
    const v = yield p;
    yield close;
    return v;
  }());
}

function parens(p) {
  return inBetween(p, word("("), word(")"));
}

function oneOf(...qs) {
  return ps => {
    let es = [];

    for (let q of qs) {
      let r = q(ps);
      if (r.success || r.consumed) return r;else es.push(r.expecting);
    } // all failed without consuming, concatenate expecting info


    return failF(() => Array.prototype.concat(...es.map(f => f()))); // one level flatten (Array.flat() not yet in many browsers)
    // FIXME: remove duplicates
  };
}

function pNot(p) {
  return ps => {
    ps.checkpoint();
    let r = p(ps);

    if (!r.success && !r.consumed) {
      ps.resetCheckpoint();
      return ok(null, false);
    }

    let consumed = r.consumed;

    if (r.success) {
      ps.resetCheckpoint();
      consumed = false;
    } else {
      ps.forgetCheckpoint();
    }

    return fail(["not(" + p.parserName + ")"], consumed);
  };
}

function until(p) {
  return lift(ls => ls.join(""), many(pBind_(pNot(p), item)));
}

function notFollowedBy(q1, q2) {
  return ps => {
    ps.checkpoint();
    let r1 = q1(ps);

    if (!r1.success) {
      ps.forgetCheckpoint();
      return r1;
    }

    let r2 = pNot(q2)(ps);

    if (r2.success) {
      ps.forgetCheckpoint();
      return r1;
    }

    if (r2.consumed) {
      ps.forgetCheckpoint();
      return r2;
    } else {
      ps.resetCheckpoint();
      return fail([q1.parserName + " not followed by " + q2.parserName]);
    }
  };
}

function pTry(q) {
  return ps => {
    ps.checkpoint();
    let r = q(ps);

    if (r.success) {
      ps.forgetCheckpoint();
      return r;
    }

    ps.resetCheckpoint();
    return fail([q.parserName]);
  };
}

function must(p, msg) {
  return ps => {
    let r = p(ps);
    if (r.success) return r;else throw ps.parseErrorF(r.expecting, msg);
  };
}

function named(p, name = "<?>") {
  let q = ps => {
    let r = p(ps);
    if (!r.success) r.expecting = () => [name];
    return r;
  };

  q.parserName = name;
  return q;
}

function token(q) {
  return lift((v, _) => v, q, manyws);
}

function word(s) {
  return token(exactString(s));
}

function keyword(s) {
  return named(token(notFollowedBy(exactString(s), named(alphaNum, "<alphanum>"))), `<keyword: ${s}>`);
}

function identifier(ps) {
  return lift((h, t, _) => h + t.join(""), sat(lex.isAlphaPlus, "<identifier>"), many(sat(lex.isAlphaNum)), manyws)(ps);
}

let nat = lift(ds => Number(ds.join("")), named(token(notFollowedBy(named(many1(digit), "<nat>"), named(alphaPlus, "<alphaplus>"))), "<nat>"));
exports.nat = nat;

function sepList(element, sep) {
  return ps => {
    let r = element(ps);
    if (!r.success) return r.consumed ? r : ok([], false); // if element parser consumed and failed, then fail

    let rs = many(pBind_(sep, element))(ps);
    rs.consumed = r.consumed || rs.consumed;
    if (rs.success) rs.value.unshift(r.value);
    return rs;
  };
}

const currentPos = ps => ok(ps.pos.clone(), false);

exports.currentPos = currentPos;

function context(str, p) {
  return ps => {
    ps.pushContext(str);

    try {
      return p(ps);
    } finally {
      ps.popContext();
    }
  };
}

function hdl(strs, ...splices) {
  let pstr = "";

  for (let i = 0; i < splices.length; ++i) {
    pstr += strs[i];
    pstr += "###" + i + "###";
  }

  if (strs.length > 0) pstr += strs[strs.length - 1];
  let ps = mkParseState(pstr, splices);
  return ps;
}

const pSplice = ps => pBind(inBetween(nat, exactString("###"), word("###")), key => ret(ps.getSplice(key)))(ps);

exports.pSplice = pSplice;

/***/ }),

/***/ "./lib/peek-iterator.js":
/*!******************************!*\
  !*** ./lib/peek-iterator.js ***!
  \******************************/
/***/ ((__unused_webpack_module, exports) => {



Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports["default"] = void 0;

class PeekIterator {
  constructor(iter) {
    this._iter = iter;
    this._currentIndex = 0;
    this._firstIndex = 0;
    this._buffer = [];
    this._checkpoints = [];
  }

  next() {
    if (this._fetch(1) === 0) return {
      done: true
    };
    let r = {
      value: this._at(this._currentIndex++),
      done: false
    };

    this._collect();

    return r;
  }

  _ind2buf(i) {
    return i - this._firstIndex;
  }

  _at(i) {
    return this._buffer[this._ind2buf(i)];
  }

  _fetch(n) {
    let currentlyRead = this._buffer.length - this._ind2buf(this._currentIndex);

    let toRead = n - currentlyRead;

    while (toRead > 0) {
      let v = this._iter.next();

      if (v.done) break;
      toRead--;

      this._buffer.push(v.value);
    }

    return n - toRead;
  }

  _collect() {
    let toRemove = this._checkpoints.length === 0 ? this._currentIndex - this._firstIndex : this._checkpoints[0].index - this._firstIndex;
    this._firstIndex += toRemove;

    this._buffer.splice(0, toRemove);
  }

  checkpoint(d) {
    this._checkpoints.push({
      index: this._currentIndex,
      value: d
    });
  }

  forgetCheckpoint() {
    if (this._checkpoints.pop() === undefined) {
      throw "Trying to forget a nonexisting checkpoint in PeekIterator";
    }

    this._collect();
  }

  reset() {
    if (this._checkpoints.length === 0) {
      throw "Trying to reset to a nonexisting checkpoint in PeekIterator";
    }

    let r = this._checkpoints.pop();

    this._currentIndex = r.index;

    this._collect();

    return r.value;
  }

  peek() {
    this._fetch(1);

    return this._at(this._currentIndex);
  }

  peekMany(n) {
    this._fetch(n);

    return this._buffer.slice(this._ind2buf(this._currentIndex), this._ind2buf(this._currentIndex + n));
  }

}

exports["default"] = PeekIterator;

/***/ }),

/***/ "./lib/utilities.js":
/*!**************************!*\
  !*** ./lib/utilities.js ***!
  \**************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {



Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.RefListNode = exports.RefList = exports.PriorityList = exports.OneToManyMap = exports.ObservableReference = exports.ListNode = exports.LinkedList = exports.BinaryHeap = void 0;
exports.adjacentFind = adjacentFind;
exports.bisame = bisame;
exports.bisimilar = bisimilar;
exports.copy = copy;
exports.count = count;
exports.equals = equals;
exports.every = every;
exports.every2 = every2;
exports.filter = filter;
exports.first = first;
exports.firstKeepOpen = firstKeepOpen;
exports.foldl = foldl;
exports.forEach = forEach;
exports.isSortedBy = isSortedBy;
exports.isUnique = isUnique;
exports.iterableToIterator = iterableToIterator;
exports.iteratorToIterable = iteratorToIterable;
exports.join = join;
exports.map = map;
exports.mapEquals = mapEquals;
exports.mkEmptyIterable = mkEmptyIterable;
exports.mkEmptyIterator = mkEmptyIterator;
exports.mkRefCounted = mkRefCounted;
exports.mkSingletonIterable = mkSingletonIterable;
exports.modifyMapValue = modifyMapValue;
exports.nonnull_cast = nonnull_cast;
exports.orderedMapEquals = orderedMapEquals;
exports.orderedSetEquals = orderedSetEquals;
exports.refCount = refCount;
exports.release = release;
exports.rest = rest;
exports.retain = retain;
exports.sameElements = sameElements;
exports.setDifference = setDifference;
exports.setDifferenceTo = setDifferenceTo;
exports.setEquals = setEquals;
exports.setUnion = setUnion;
exports.setUnionTo = setUnionTo;
exports.setUnionToWithDiff = setUnionToWithDiff;
exports.setUniqueHandler = setUniqueHandler;
exports.some = some;
exports.subsetOf = subsetOf;
exports.throw_on_null = throw_on_null;
exports.until = until;
exports.zip = zip;
exports.zipWith = zipWith;

var _hdconsole = __webpack_require__(/*! ./hdconsole.js */ "./lib/hdconsole.js");

var Obs = _interopRequireWildcard(__webpack_require__(/*! ./observable.js */ "./lib/observable.js"));

function _getRequireWildcardCache(nodeInterop) {
  if (typeof WeakMap !== "function") return null;
  var cacheBabelInterop = new WeakMap();
  var cacheNodeInterop = new WeakMap();
  return (_getRequireWildcardCache = function (nodeInterop) {
    return nodeInterop ? cacheNodeInterop : cacheBabelInterop;
  })(nodeInterop);
}

function _interopRequireWildcard(obj, nodeInterop) {
  if (!nodeInterop && obj && obj.__esModule) {
    return obj;
  }

  if (obj === null || typeof obj !== "object" && typeof obj !== "function") {
    return {
      default: obj
    };
  }

  var cache = _getRequireWildcardCache(nodeInterop);

  if (cache && cache.has(obj)) {
    return cache.get(obj);
  }

  var newObj = {};
  var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor;

  for (var key in obj) {
    if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) {
      var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null;

      if (desc && (desc.get || desc.set)) {
        Object.defineProperty(newObj, key, desc);
      } else {
        newObj[key] = obj[key];
      }
    }
  }

  newObj.default = obj;

  if (cache) {
    cache.set(obj, newObj);
  }

  return newObj;
}

function equals(a, b) {
  a = a;
  b = b;
  if (a === b) return true;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;

    for (let i = 0; i < a.length; ++i) if (!equals(a[i], b[i])) return false;

    return true;
  }

  if (a instanceof Set && b instanceof Set) return orderedSetEquals(a, b); // Equality of keys is by ===, not by equals

  if (a instanceof Map && b instanceof Map) return orderedMapEquals(a, b);

  if (typeof a === "object" && a !== null) {
    // for any other kind of object (even function object)
    // find .equals method if one exists
    if (typeof a.equals === "function") return a.equals(b);else if (b != null) {
      // otherwise recurse through all members
      let ak = Object.keys(a),
          bk = Object.keys(b);
      if (ak.length !== bk.length) return false;

      for (let m of ak) if (!equals(a[m], b[m])) return false;

      return true;
    }
  }

  if (typeof a === "function" && typeof a.equals === "function") return a.equals(b); // by default functions are the same only if === says so; but if a function object has
  // the equals member, then that member determines equality

  return false;
} // two ordered Sets are equal if they have the same keys in the same order


function orderedSetEquals(s1, s2) {
  if (s1.size !== s2.size) return false;
  return bisame(s1, s2);
} // two ordered Maps are equal if they have the same keys, in the same
// order, and for each key, values are equal


function orderedMapEquals(s1, s2) {
  if (s1.size !== s2.size) return false;
  return every2(([key1, value1], [key2, value2]) => key1 === key2 && equals(value1, value2), s1, s2);
} // two Sets are `set equal' if they have the same keys


function setEquals(s1, s2) {
  if (s1.size !== s2.size) return false;

  for (let k of s1.keys()) if (!s2.has(k)) return false;

  return true;
} // two Maps are `set equal' if they have the same keys and for each key, values are equal


function mapEquals(s1, s2) {
  if (s1.size !== s2.size) return false;

  for (let [k, v] of s1) {
    if (!equals(s2.get(k), v)) return false;
  }

  return true;
}

function copy(a) {
  return _copy(a);
}

function _copy(a) {
  if (Array.isArray(a)) return a.map(v => copy(v));
  if (a instanceof Set) return new Set(a);
  if (a instanceof Map) return new Map(map(([k, v]) => [k, copy(v)], a));

  if (typeof a === "object" && a !== null) {
    if (typeof a.copy === "function") return a.copy();else {
      let b = Object.create(Object.getPrototypeOf(a));

      for (let m of Object.keys(a)) b[m] = copy(a[m]);

      return b;
    }
  }

  if (typeof a === "function" && typeof a.copy === "function") return a.copy(); // here should be a value, or something that is shared by reference

  return a;
}

function subsetOf(sub, sup) {
  for (let k of sub.keys()) if (!sup.has(k)) return false;

  return true;
}

function modifyMapValue(m, k, fn) {
  let newv = fn(m.get(k));
  m.set(k, newv);
  return newv;
}

function setUnion(s1, s2) {
  let s = new Set();
  setUnionTo(s, s1);
  setUnionTo(s, s2);
  return s;
}

function setUnionTo(s1, s2) {
  for (let v of s2) s1.add(v);
}

function setUnionToWithDiff(s1, s2) {
  let diff = new Set();

  for (let v of s2) if (!s1.has(v)) {
    s1.add(v);
    diff.add(v);
  }

  return diff;
}

function setDifference(s1, s2) {
  let s = new Set();

  for (let v of s1) if (!s2.has(v)) s.add(v);

  return s;
}

function setDifferenceTo(s1, s2) {
  for (let v of s2) s1.delete(v);
}

function* mkEmptyIterable() {}

function* mkSingletonIterable(v) {
  yield v;
}

function mkEmptyIterator() {
  // flowtype wants iterators to have @@iterator, which is an iterable's method,
  // and does not need to be in iterator. To appease flowtype,
  // we define a dummy in flowtype-comments
  return {
    /*:: @@iterator(): Iterator<T> { return ({}: any); }, */
    // $FlowFixMe: computed property
    next: () => ({
      done: true,
      value: undefined
    })
  };
}

function iteratorToIterable(it) {
  let v = {};

  v[Symbol.iterator] = function () {
    return it;
  };

  return v; //    return ({ [Symbol.iterator]: () => it }: any);
}

function iterableToIterator(it) {
  return it[Symbol.iterator]();
}

function map(fn, iterable) {
  return {
    [Symbol.iterator]: () => {
      const iterator = iterable[Symbol.iterator]();
      let mapIterator = {};

      mapIterator.next = () => {
        const {
          done,
          value
        } = iterator.next();
        return {
          done,
          value: done ? undefined : fn(value)
        };
      };

      if (typeof iterator.return === "function") {
        mapIterator.return = v => {
          return iterator.return(v);
        };
      }

      if (typeof iterator.throw === "function") {
        mapIterator.throw = e => {
          return iterator.throw(e);
        }; // assuming that if .throw throws, iterator relases resources, sets itself closed etc.

      }

      return mapIterator;
    }
  };
}

function filter(fn, iterable) {
  return {
    [Symbol.iterator]: () => {
      const iterator = iterable[Symbol.iterator]();
      let filterIterator = {};

      filterIterator.next = () => {
        let done = false;
        let value = undefined;

        do {
          ({
            done,
            value
          } = iterator.next());
        } while (!done && !fn(value));

        return {
          done,
          value
        };
      };

      if (typeof iterator.return === "function") {
        filterIterator.return = v => {
          return iterator.return(v);
        };
      }

      if (typeof iterator.throw === "function") {
        filterIterator.throw = e => {
          return iterator.throw(e);
        }; // assuming that if .throw throws, iterator relases resources, sets itself closed etc.

      }

      return filterIterator;
    }
  };
}

function until(fn, iterable) {
  return {
    [Symbol.iterator]: () => {
      const iterator = iterable[Symbol.iterator]();
      let untilIterator = {};

      let step = () => iterator.next();

      untilIterator.done = false;

      untilIterator.next = () => {
        if (untilIterator.done) return {
          done: true
        };
        let {
          done,
          value
        } = step();

        step = () => iterator.next();

        if (done) {
          // normal closing of iterator: assuming it releases resources
          untilIterator.done = true;
          return {
            done: true
          };
        }

        done = fn(value);

        if (done) {
          if (typeof iterator.return === "function") iterator.return(); // call return to release resources

          return {
            done: true
          };
        } else {
          return {
            done: false,
            value: value
          };
        }
      };

      if (typeof iterator.return === "function") {
        untilIterator.return = v => {
          return iterator.return(v);
        };
      }

      if (typeof iterator.throw === "function") {
        untilIterator.throw = e => {
          step = () => iterator.throw(e);

          return untilIterator.next(); // we do not catch exceptions and call iterator.return; assuming that
          // if iterator.throw throws, iterator releases resources
        };
      }

      return untilIterator;
    }
  };
}

function every(fn, iterable) {
  for (let i of iterable) if (!fn(i)) return false;

  return true;
}

function some(fn, iterable) {
  for (let i of iterable) if (fn(i)) return true;

  return false;
}

function forEach(fn, iterable) {
  for (let i of iterable) fn(i);

  return fn;
}

function adjacentFind(cmp, iterable) {
  let iter = iterableToIterator(iterable);
  let r = iter.next();
  if (r.done) return null;
  let prevVal = r.value;

  while (true) {
    let curr = iter.next();
    if (curr.done) return null;

    if (cmp(prevVal, curr.value)) {
      if (typeof iter.return === "function") iter.return(); // release resources
      // FIXME: how to convince flowtype that return may exist?

      return [prevVal, curr.value];
    } else {
      prevVal = curr.value;
    }
  }
}

function isSortedBy(cmp, iterable) {
  return adjacentFind((a, b) => !cmp(a, b), iterable) === null;
}

function count(iterable) {
  let i = 0;

  for (let _ of iterable) ++i;

  return i;
}

function first(iterable) {
  const iterator = iterable[Symbol.iterator]();
  let r = iterator.next();
  if (r.done) return undefined;else {
    if (typeof iterator.return === "function") iterator.return();
    return r.value;
  }
}

function firstKeepOpen(iterable) {
  let r = iterable[Symbol.iterator]().next();
  if (r.done) return undefined;else return r.value;
}

function rest(iterable) {
  let iterator = iterableToIterator(iterable);
  iterator.next();
  return iteratorToIterable(iterator);
}

function foldl(fn, u, iterable) {
  let acc = u;

  for (let t of iterable) acc = fn(t, acc);

  return acc;
}

function join(it1) {
  return {
    [Symbol.iterator]: () => {
      let outerIt = iterableToIterator(it1);
      let innerIt;
      let innerDone = true;
      let allDone = false; // FIXME can one call next repeatedly after past the end?

      return {
        next: () => {
          if (allDone) return {
            done: true
          }; //            let a: { value: Iterable<T>, done: false } | { done: true };
          //            let b: { value: T, done: false } | { done: true };

          let a;
          let b;

          while (true) {
            if (innerDone == true) {
              a = outerIt.next();
              if (a.done) return {
                done: true
              };
              innerIt = iterableToIterator(a.value);
            }

            b = innerIt.next();

            if (b.done) {
              innerDone = true;
              continue;
            }

            innerDone = false;
            return {
              done: false,
              value: b.value
            };
          }
        },
        return: v => {
          if (allDone) return {
            done: true,
            value: v
          };
          allDone = true;

          if (!innerDone && typeof innerIt.return === "function") {
            // FIXME: how to express optional iterator properties in flowtype?
            innerIt.return(v); // close the currently open inner iterator
          }

          return {
            done: true,
            value: v
          };
        },
        throw: e => {
          if (allDone) throw e; // FIXME: think how to deal with throw
        }
      };
    }
  };
}

function zipWith(fn, it1, it2) {
  let done = false;
  return {
    [Symbol.iterator]: () => {
      const i1 = it1[Symbol.iterator](),
            i2 = it2[Symbol.iterator]();
      return {
        next: () => {
          if (done) return {
            done: true
          };
          const a = i1.next(),
                b = i2.next();
          done = a.done || b.done;
          if (!a.done && typeof i1.return === "function") i1.return();
          if (!b.done && typeof i2.return === "function") i2.return();
          if (done) return {
            done: true
          };else {
            return {
              done: false,
              value: fn(a.value, b.value)
            };
          }
        },
        return: v => {
          if (typeof i1.return === "function") i1.return();
          if (typeof i2.return === "function") i2.return();
          done = true;
          return {
            done: true,
            value: v
          };
        }
      };
    }
  };
}

function zip(it1, it2) {
  return zipWith((a, b) => [a, b], it1, it2);
}

function bisimilar(it1, it2) {
  return every2((a, b) => equals(a, b), it1, it2);
}

function bisame(it1, it2) {
  return every2((a, b) => a === b, it1, it2);
}

function every2(fn, it1, it2) {
  const i1 = it1[Symbol.iterator](),
        i2 = it2[Symbol.iterator]();

  while (true) {
    const a = i1.next(),
          b = i2.next();

    if (!a.done && !b.done) {
      if (!fn(a.value, b.value)) return false;else continue;
    }

    if (a.done && b.done) return true; // in this case i1 and i2 should have released resources

    if (!a.done) {
      if (typeof i1.return === "function") i1.return();
      return false;
    }

    if (!b.done) {
      if (typeof i2.return === "function") i2.return();
      return false;
    }
  }

  return true; // dead code; added to appease flowtype
}

function sameElements(a, b) {
  let m = new Map();

  for (let k of a) modifyMapValue(m, k, c => c == null ? 1 : c + 1);

  for (let k of b) {
    let c = m.get(k);
    if (c === 1) m.delete(k);else if (c === undefined) return false; // this closes b
    else m.set(k, c - 1);
  }

  return m.size === 0;
}

class OneToManyMap {
  constructor() {
    this._m = new Map();
  }

  hasKey(k) {
    return this._m.has(k);
  }

  keys() {
    return this._m.keys();
  }

  values(k) {
    let s = this._m.get(k);

    if (s !== undefined) return s.values();else return mkEmptyIterable();
  }

  countKeys() {
    return this._m.size;
  }

  count(k) {
    let s = this._m.get(k);

    return s === undefined ? 0 : s.size;
  }

  addKey(k) {
    if (this._m.get(k) === undefined) this._m.set(k, new Set());
    return this;
  }

  add(k, v) {
    let s = this._m.get(k);

    if (s === undefined) {
      s = new Set();

      this._m.set(k, s);
    }

    s.add(v);
    return this;
  }

  addMany(k, ite) {
    let s = this._m.get(k);

    if (s === undefined) {
      s = new Set();

      this._m.set(k, s);
    } // even with empty iterator, key is always added


    for (let v of ite) s.add(v);
  }

  remove(k, v) {
    let s = this._m.get(k);

    if (s === undefined) return false;else return s.delete(v);
  }

  removeKey(k) {
    this._m.delete(k);
  }

  clear() {
    this._m.clear();
  }

}

exports.OneToManyMap = OneToManyMap;
let refCountMap = new WeakMap();
let disposerMap = new WeakMap();
let uniqueHandlerMap = new WeakMap(); // shall only be called after initRefCounting called

function mkRefCounted(o, disposer, uniqueHandler) {
  _hdconsole.hdconsole.assert(refCount(o) === 0, "trying to make an object reference counted twice");

  disposerMap.set(o, disposer);
  if (uniqueHandler != null) uniqueHandlerMap.set(o, uniqueHandler);
  refCountMap.set(o, 1);
  return o;
}

function setUniqueHandler(o, uniqueHandler) {
  uniqueHandlerMap.set(o, uniqueHandler);
}

function retain(o) {
  let cnt = refCountMap.get(o);

  if (cnt == null) {
    _hdconsole.hdconsole.assert(cnt != null, "trying to retain a non-refcounted object"); //retain old behaviour (undefined + 1 === NaN)


    refCountMap.set(o, NaN); //TODO Should this be set to NaN? removing line seems better.
  } else {
    refCountMap.set(o, cnt + 1);
  }

  return o;
}

function release(o) {
  let cnt = refCountMap.get(o);

  _hdconsole.hdconsole.assert(cnt != null && cnt > 0, "trying to release an already released object");

  --cnt;
  refCountMap.set(o, cnt);
  if (cnt > 1) return cnt;

  if (cnt === 1) {
    let uniqueHandler = uniqueHandlerMap.get(o);
    if (uniqueHandler != null) uniqueHandler(o);
  } else {
    // cnt === 0
    let disposer = disposerMap.get(o);
    if (disposer != null) disposer(o);
  }

  return cnt;
}

function refCount(o) {
  let cnt = refCountMap.get(o);
  return cnt === undefined ? 0 : cnt;
}

function isUnique(o) {
  return refCount(o) === 1;
}

class RefList {
  constructor() {
    this._head = null;
  }

  front() {
    if (this._head != null) return this._head.data;
  }

  pushFront(t) {
    this._head = new RefListNode(this._head, t);
    return this._head;
  }

}

exports.RefList = RefList;

class RefListNode {
  constructor(n, d) {
    console.assert(refCount(d) > 0);
    this.next = n;
    this.data = d;
  }

  releaseTail() {
    let n = this.next;

    while (n != null) {
      release(n.data);
      n = n.next;
    }

    this.next = null;
  }

}

exports.RefListNode = RefListNode;

class ListNode {
  constructor(p, n, d) {
    this.prev = p;
    this.next = n;
    this.data = d;
  }

}

exports.ListNode = ListNode;

class LinkedList {
  constructor() {
    this._head = null;
    this._tail = null;
    this._size = 0;
  }

  insertNode(pos, n) {
    if (pos == null) {
      n.prev = this._tail;
      n.next = null;
      this._tail = n;
    } else {
      n.prev = pos.prev;
      n.next = pos;
      pos.prev = n;
    }

    if (n.prev == null) this._head = n;else n.prev.next = n;
    this._size++;
    return n;
  }

  insert(pos, v) {
    return this.insertNode(pos, new ListNode(null, null, v));
  }

  pushFront(v) {
    return this.insert(this._head, v);
  }

  pushNodeFront(n) {
    return this.insertNode(this._head, n);
  }

  pushBack(v) {
    return this.insert(null, v);
  }

  pushNodeBack(n) {
    return this.insertNode(null, n);
  }

  removeNode(pos) {
    if (pos.next == null) this._tail = pos.prev;else pos.next.prev = pos.prev;
    if (pos.prev == null) this._head = pos.next;else pos.prev.next = pos.next;
    this._size--;
    return pos;
  }

  remove(pos) {
    return this.removeNode(pos).data;
  }

  popFront() {
    return this._head == null ? null : this.remove(this._head);
  }

  popBack() {
    return this._tail == null ? null : this.remove(this._tail);
  }
  /*:: @@iterator(): Iterator<T> { return ({}: any); } */
  // $FlowFixMe: computed property


  [Symbol.iterator]() {
    let curr = this._head;
    return {
      next: () => {
        if (curr == null) return {
          done: true
        };else {
          let r = {
            value: curr.data,
            done: false
          };
          curr = curr.next;
          return r;
        }
      }
    };
  }

  reverseIterator() {
    let curr = this._tail;
    return {
      next: () => {
        if (curr == null) return {
          done: true
        };else {
          let r = {
            value: curr.data,
            done: false
          };
          curr = curr.prev;
          return r;
        }
      }
    };
  }

}

exports.LinkedList = LinkedList;

class PriorityList {
  size() {
    return this._list._size;
  }

  constructor() {
    this._nodeMap = new Map();
    this._list = new LinkedList();
    this._highestPriority = -1;
    this._lowestPriority = 0;
  } // FIXME: if insert in the middle, may have to assign priorities down (or up) to list
  // For now this is not implemented, as it is unsure whether it will be needed or not
  // insertBefore(t: ?T, u: T) {
  //  let n = t != null ? this._nodeMap.get(t) : null;
  //  this._list.insert(n, u); // inserts as last if t null or not found
  // }
  // Precondition: t is in the priority list


  _access(t) {
    let n = this._nodeMap.get(t);

    if (n == null) console.log(t.name);
    if (n == null) console.log(this.size());

    _hdconsole.hdconsole.assert(n != null, "element not found in priority list");

    if (n == null) throw "Should not happen, element not found in priority list"; // this is to appease flow

    return n;
  }

  remove(t) {
    let n = this._nodeMap.get(t);

    if (n != null) {
      // only remove if not already removed
      this._nodeMap.delete(t);

      this._list.remove(n);
    }
  }

  promote(t) {
    let node = this._access(t);

    node.data.priority = ++this._highestPriority;

    this._list.pushNodeFront(this._list.removeNode(node));
  }

  demote(t) {
    let node = this._access(t);

    node.data.priority = --this._lowestPriority;

    this._list.pushNodeBack(this._list.removeNode(node));
  }

  get highestPriority() {
    return this._highestPriority;
  }

  get lowestPriority() {
    return this._lowestPriority;
  }

  priority(t) {
    return this._access(t).data.priority;
  }

  pushBack(t) {
    this._nodeMap.set(t, this._list.pushBack({
      data: t,
      priority: --this._lowestPriority
    }));
  }

  pushFront(t) {
    this._nodeMap.set(t, this._list.pushFront({
      data: t,
      priority: ++this._highestPriority
    }));
  } // an iterable that iterates over just the T values, ignores priority value


  entries() {
    return map(pd => pd.data, this);
  }
  /*:: @@iterator(): Iterator<PriData<T>> { return ({}: any); } */
  // $FlowFixMe: computed property


  [Symbol.iterator]() {
    return this._list[Symbol.iterator]();
  }

  hasHigherPriority(a, b) {
    return this._access(a).data.priority > this._access(b).data.priority;
  }

}

exports.PriorityList = PriorityList;

class ObservableReference {
  // holds observers
  // link to another reference
  constructor(value = null) {
    this._value = value;
    this._subject = new Obs.Subject(o => {
      o.next(this._value);
    });
    this._subscription = null;
  }

  subscribe(s) {
    return this._subject.subscribe(s);
  }

  get value() {
    return this._value;
  }

  set value(v) {
    if (this._subscription != null) {
      this._subscription.unsubscribe();

      this._subscription = null;
    }

    this._setValue(v);
  }

  _setValue(v) {
    if (this._value !== null) this._subject.sendNext(null);
    this._value = v;
    if (v !== null) this._subject.sendNext(v);
  }

  link(target) {
    this.value = null; // unsubscribes, if already linked

    this._subscription = target.subscribe(v => {
      this._setValue(v);
    });
  }

}

exports.ObservableReference = ObservableReference;

function throw_on_null(t) {
  if (t == null) throw "Expected non-null";
  return t;
}

function nonnull_cast(t) {
  return t;
}

class BinaryHeap {
  constructor(cmp) {
    this._cmp = cmp;
    this._data = [null]; // empty unused element at 0 allows simpler index math
  }

  size() {
    return this._data.length - 1;
  }

  empty() {
    return this.size() === 0;
  }

  _swap(i, j) {
    let tmp = this._data[i];
    this._data[i] = this._data[j];
    this._data[j] = tmp;
  }

  _percolateUp(i) {
    while (i >= 2) {
      let parent = Math.floor(i / 2);

      if (this._cmp(this._data[i], this._data[parent])) {
        this._swap(i, parent);

        i = parent;
      } else break;
    }
  }

  push(t) {
    this._data.push(t);

    this._percolateUp(this.size());
  }

  _percolateDown(i) {
    while (2 * i <= this.size()) {
      let smallerChild = this._minOfSiblings(2 * i);

      if (!this._cmp(this._data[i], this._data[smallerChild])) {
        this._swap(i, smallerChild);

        i = smallerChild;
      } else break;
    }
  }

  _minOfSiblings(i) {
    if (i >= this.size() || this._cmp(this._data[i], this._data[i + 1])) return i;else return i + 1;
  }

  pop() {
    let ret = this._data[1];

    let last = this._data.pop();

    if (this.size() > 0) {
      this._data[1] = last;

      this._percolateDown(1);
    }

    return ret;
  }

}

exports.BinaryHeap = BinaryHeap;

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __webpack_require__("./lib/hotdrink.js");
/******/ 	
/******/ 	return __webpack_exports__;
/******/ })()
;
});
//# sourceMappingURL=hotdrink.js.map