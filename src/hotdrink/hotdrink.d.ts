

//////////////////////////////////////////////////////////////
//
// File ./graph-concepts.d.ts
//
//////////////////////////////////////////////////////////////


export interface Graph<VertexDescriptor, EdgeDescriptor> {
  source(e: EdgeDescriptor): VertexDescriptor;

  target(e: EdgeDescriptor): VertexDescriptor;

  edge(
    src: VertexDescriptor,
    target: VertexDescriptor
  ): EdgeDescriptor | null | undefined;

  hasEdge(src: VertexDescriptor, target: VertexDescriptor): boolean;

  hasVertex(v: VertexDescriptor): boolean;
}

export interface VertexLabels<VertexDescriptor, VertexLabel> {
  vertexLabel(v: VertexDescriptor): VertexLabel | null | undefined;
}

export interface AssignableVertexLabels<VertexDescriptor, VertexLabel>
  extends VertexLabels<VertexDescriptor, VertexLabel> {
  setVertexLabel(v: VertexDescriptor, l: VertexLabel): void;
}

export interface EdgeLabels<EdgeDescriptor, EdgeLabel> {
  edgeLabel(e: EdgeDescriptor): EdgeLabel | null | undefined;
}

export interface AssignableEdgeLabels<EdgeDescriptor, EdgeLabel>
  extends EdgeLabels<EdgeDescriptor, EdgeLabel> {
  setEdgeLabel(e: EdgeDescriptor, l: EdgeLabel): void;
}

export interface Labels<
  VertexDescriptor,
  EdgeDescriptor,
  VertexLabel,
  EdgeLabel
> extends VertexLabels<VertexDescriptor, VertexLabel>,
    EdgeLabels<EdgeDescriptor, EdgeLabel> {}

export interface AssignableLabels<
  VertexDescriptor,
  EdgeDescriptor,
  VertexLabel,
  EdgeLabel
> extends AssignableVertexLabels<VertexDescriptor, VertexLabel>,
    AssignableEdgeLabels<EdgeDescriptor, EdgeLabel> {}

export interface VertexListIteration<VertexDescriptor> {
  vertices(): Iterable<VertexDescriptor>;
}

export interface EdgeListIteration<EdgeDescriptor> {
  edges(): Iterable<EdgeDescriptor>;
}

export interface AdjacencyIteration<VertexDescriptor> {
  adjacentOutVertices(v: VertexDescriptor): Iterable<VertexDescriptor>;

  outDegree(v: VertexDescriptor): number;
}

export interface BidirectionalAdjacencyIteration<VertexDescriptor>
  extends AdjacencyIteration<VertexDescriptor> {
  adjacentInVertices(v: VertexDescriptor): Iterable<VertexDescriptor>;

  inDegree(v: VertexDescriptor): number;
}

export interface UndirectedAdjacencyIteration<VertexDescriptor> {
  adjacentVertices(v: VertexDescriptor): Iterable<VertexDescriptor>;

  degree(v: VertexDescriptor): number;
}

export interface GrowableGraph<
  VertexDescriptor,
  EdgeDescriptor,
  VertexLabel,
  EdgeLabel
> extends Graph<VertexDescriptor, EdgeDescriptor> {
  addVertex(l: VertexLabel | null | undefined): VertexDescriptor;

  addVertexDescriptor(
    vd: VertexDescriptor,
    l: VertexLabel | null | undefined
  ): VertexDescriptor;

  addEdge(
    s: VertexDescriptor,
    t: VertexDescriptor,
    l: EdgeLabel | null | undefined
  ): EdgeDescriptor;
}

export interface ShrinkableGraph<VertexDescriptor, EdgeDescriptor>
  extends Graph<VertexDescriptor, EdgeDescriptor> {
  removeVertex(v: VertexDescriptor): boolean;

  removeEdge(e: EdgeDescriptor): boolean;

  removeEdgeBetween(s: VertexDescriptor, t: VertexDescriptor): boolean;
}

export interface ModifiableGraph<
  VertexDescriptor,
  EdgeDescriptor,
  VertexLabel,
  EdgeLabel
> extends GrowableGraph<
      VertexDescriptor,
      EdgeDescriptor,
      VertexLabel,
      EdgeLabel
    >,
    ShrinkableGraph<VertexDescriptor, EdgeDescriptor> {}


//////////////////////////////////////////////////////////////
//
// File ./utilities.d.ts
//
//////////////////////////////////////////////////////////////



export function equals<T>(a: T, b: T): boolean;

export function orderedSetEquals<
  Key,
  Value,
  M extends Set<Key> | Map<Key, Value>
>(s1: M, s2: M): boolean;

export function orderedMapEquals<Key, Value, M extends Map<Key, Value>>(
  s1: M,
  s2: M
): boolean;

export function setEquals<Key, Value, M extends Set<Key> | Map<Key, Value>>(
  s1: M,
  s2: M
): boolean;

export function mapEquals<Key, Value, M extends Map<Key, Value>>(
  s1: M,
  s2: M
): boolean;

export function copy<T>(a: T): T;

export function subsetOf<Key, Value, M extends Set<Key> | Map<Key, Value>>(
  sub: M,
  sup: M
): boolean;

export function modifyMapValue<Key, Value>(
  m: Map<Key, Value>,
  k: Key,
  fn: (arg0: Value | null | undefined) => Value
): Value;

export function setUnion<T>(s1: Iterable<T>, s2: Iterable<T>): Set<T>;

export function setUnionTo<T>(s1: Set<T>, s2: Iterable<T>): void;

export function setUnionToWithDiff<T>(s1: Set<T>, s2: Iterable<T>): Set<T>;

export function setDifference<T>(s1: Set<T>, s2: Set<T>): Set<T>;

export function setDifferenceTo<T>(s1: Set<T>, s2: Iterable<T>): void;

export function mkEmptyIterable<T>(): Iterable<T>; //used to be generator

export function mkSingletonIterable<T>(v: T): Iterable<T>; //used to be generator

export function mkEmptyIterator<T>(): Iterator<T>;

//I don't know why there is a $ in the types below, and it might be a bug with the extra types U, and V in Iterable?
//TODO ask Jaakko

export function iteratorToIterable<T, U, V>(
  it: /*$*/ Iterator<T, U, V>
): /*$*/ Iterable<T /*, U, V*/>;

export function iterableToIterator<T, U, V>(
  it: /*$*/ Iterable<T /*, U, V*/>
): /*$*/ Iterator<T, U, V>;

export function map<T, U>(
  fn: (arg0: T) => U,
  iterable: Iterable<T>
): Iterable<U>;

export function filter<T>(
  fn: (arg0: T) => boolean,
  iterable: Iterable<T>
): Iterable<T>;

export function until<T>(
  fn: (...args: Array<any>) => any,
  iterable: Iterable<T>
): Iterable<T>;

export function every<T>(
  fn: (arg0: T) => boolean,
  iterable: Iterable<T>
): boolean;

export function some<T>(
  fn: (arg0: T) => boolean,
  iterable: Iterable<T>
): boolean;

export function forEach<T, U>(
  fn: (arg0: T) => U,
  iterable: Iterable<T>
): (arg0: T) => U;

export function adjacentFind<T, U, V>(
  cmp: (arg0: T, arg1: T) => boolean,
  iterable: /*$*/ Iterable<T /*, U, V*/>
): [T, T] | null | undefined;

export function isSortedBy<T>(
  cmp: (arg0: T, arg1: T) => boolean,
  iterable: Iterable<T>
): boolean;

export function count<T>(iterable: Iterable<T>): number;

export function first<T>(iterable: Iterable<T>): T | null | undefined;

export function firstKeepOpen<T>(iterable: Iterable<T>): T | null | undefined;

export function rest<T>(iterable: Iterable<T>): Iterable<T>;

export function foldl<T, U>(
  fn: (arg0: T, arg1: U) => U,
  u: U,
  iterable: Iterable<T>
): U;

export function join<T>(it1: Iterable<Iterable<T>>): Iterable<T>;

export function zipWith<T, U, A>(
  fn: (arg0: T, arg1: U) => A,
  it1: Iterable<T>,
  it2: Iterable<U>
): Iterable<A>;

export function zip<T, U>(it1: Iterable<T>, it2: Iterable<U>): Iterable<[T, U]>;

export function bisimilar<T>(it1: Iterable<T>, it2: Iterable<T>): boolean;

export function bisame<T>(it1: Iterable<T>, it2: Iterable<T>): boolean;

export function every2<T, U>(
  fn: (arg0: T, arg1: U) => boolean,
  it1: Iterable<T>,
  it2: Iterable<U>
): boolean;

export function sameElements<T>(a: Iterable<T>, b: Iterable<T>): boolean;

export declare class OneToManyMap<Key, Value> {
  private _m: Map<Key, Set<Value>>;

  hasKey(k: Key): boolean;

  keys(): Iterator<Key>;

  values(k: Key): Iterable<Value>;

  countKeys(): number;

  count(k: Key): number;

  addKey(k: Key): OneToManyMap<Key, Value>;

  add(k: Key, v: Value): OneToManyMap<Key, Value>;

  addMany(k: Key, ite: Iterable<Value>): void;

  remove(k: Key, v: Value): boolean;

  removeKey(k: Key): void;

  clear(): void;
}

export function mkRefCounted<T extends {}>(
  o: T,
  disposer: (arg0: T) => any,
  uniqueHandler?: (arg0: T) => any
): T;

export function setUniqueHandler<T extends {}>(
  o: T,
  uniqueHandler: (arg0: T) => any
): void;

export function retain<T extends {}>(o: T): T;

export function release<T extends {}>(o: T): number;

export function refCount<T extends {}>(o: T): number;

export function isUnique<T extends {}>(o: T): boolean;

export declare class RefList<T extends {}> {
  private _head: RefListNode<T> | null | undefined;

  constructor(n: RefListNode<T> | null | undefined, d: T);

  front(): T | null | undefined;

  pushFront(t: T): RefListNode<T>;
}

export declare class RefListNode<T extends {}> {
  next: RefListNode<T> | null | undefined;
  data: T;

  releaseTail(): void;
}

export declare class ListNode<T> {
  prev: ListNode<T> | null | undefined;
  next: ListNode<T> | null | undefined;
  data: T;

  constructor(
    p: ListNode<T> | null | undefined,
    n: ListNode<T> | null | undefined,
    d: T
  );
}

export declare class LinkedList<T> {
  private _head: ListNode<T> | null | undefined;
  private _tail: ListNode<T> | null | undefined;
  private _size: number;

  insertNode(pos: ListNode<T> | null | undefined, n: ListNode<T>): ListNode<T>;

  insert(pos: ListNode<T> | null | undefined, v: T): ListNode<T>;

  pushFront(v: T): ListNode<T>;

  pushNodeFront(n: ListNode<T>): ListNode<T>;

  pushBack(v: T): ListNode<T>;

  pushNodeBack(n: ListNode<T>): ListNode<T>;

  removeNode(pos: ListNode<T>): ListNode<T>;

  remove(pos: ListNode<T>): T;

  popFront(): T | null | undefined;

  popBack(): T | null | undefined;

  reverseIterator(): Iterator<T>;

  //TODO find out what a Symbol.iterator is
  // [key: Symbol.iterator]: Iterator<T>;
}

type PriData<T> = {
  data: T;
  priority: number;
};

export declare class PriorityList<T> {
  private _nodeMap: Map<T, ListNode<PriData<T>>>;
  private _list: LinkedList<PriData<T>>;
  private _highestPriority: number;

  get highestPriority(): number;

  private _lowestPriority: number;

  get lowestPriority(): number;

  size(): number;

  remove(t: T): void;

  promote(t: T): void;

  demote(t: T): void;

  priority(t: T): number;

  pushBack(t: T): void;

  pushFront(t: T): void;

  entries(): Iterable<T>;

  hasHigherPriority(a: T, b: T): boolean;

  private _access(t: T): ListNode<PriData<T>>;

  //TODO find out what a Symbol.iterator is
  // [key: Symbol.iterator]: Iterator<PriData<T>>;
}

export declare class ObservableReference<T> {
  private _subject: Subject<any>;
  private _subscription: Subscription | null | undefined;
  private _value: T | null;

  constructor(value?: T | null);

  get value(): T | null;
  set value(v: T | null);

  subscribe(s: any): Subscription;

  link(target: ObservableReference<T>): void;

  private _setValue(v: T | null | undefined): void;
}

export function throw_on_null<T>(t: T | null | undefined): T;

export function nonnull_cast<T>(t: T | null | undefined): T;

export declare class BinaryHeap<T> {
  private _data: Array<T>;
  private _cmp: (arg0: T, arg1: T) => boolean;

  constructor(cmp: (arg0: T, arg1: T) => boolean);

  size(): number;

  empty(): boolean;

  pop(): T;

  push(t: T): void;

  private _swap(i: number, j: number): void;

  private _percolateUp(i: number): void;

  private _percolateDown(i: number): void;

  private _minOfSiblings(i: number): number;
}


//////////////////////////////////////////////////////////////
//
// File ./adjacency-list-graph.d.ts
//
//////////////////////////////////////////////////////////////


export type EdgeDescriptorT<V> = [V, V];
export type vertex_descriptor = number;
export type edge_descriptor = EdgeDescriptorT<vertex_descriptor>;
type Connections<V> = {
  outs: Set<V>;
  ins: Set<V>;
};

export declare class AdjacencyList<VertexDescriptor, VertexLabel, EdgeLabel> {
  private _vertices: Map<VertexDescriptor, Connections<VertexDescriptor>>;
  private _vlabels: Map<VertexDescriptor, VertexLabel>;
  private _elabels: Map<VertexDescriptor, Map<VertexDescriptor, EdgeLabel>>;

  source(e: EdgeDescriptorT<VertexDescriptor>): VertexDescriptor;

  target(e: EdgeDescriptorT<VertexDescriptor>): VertexDescriptor;

  edge(
    source: VertexDescriptor,
    target: VertexDescriptor
  ): EdgeDescriptorT<VertexDescriptor> | null | undefined;

  hasEdge(source: VertexDescriptor, target: VertexDescriptor): boolean;

  hasVertex(v: VertexDescriptor): boolean;

  vertexLabel(v: VertexDescriptor): VertexLabel | null | undefined;

  edgeLabel(e: EdgeDescriptorT<VertexDescriptor>): EdgeLabel | null | undefined;

  vertices(): Iterable<VertexDescriptor>;

  edges(): Iterable<EdgeDescriptorT<VertexDescriptor>>;

  adjacentOutVertices(v: VertexDescriptor): Iterable<VertexDescriptor>;

  adjacentInVertices(v: VertexDescriptor): Iterable<VertexDescriptor>;

  outDegree(v: VertexDescriptor): number;

  inDegree(v: VertexDescriptor): number;

  addEdge(
    src: VertexDescriptor,
    target: VertexDescriptor,
    l: EdgeLabel | null | undefined
  ): EdgeDescriptorT<VertexDescriptor>;

  addVertex(l: VertexLabel | null | undefined): VertexDescriptor;

  addVertexDescriptor(
    v: VertexDescriptor,
    l: VertexLabel | null | undefined
  ): VertexDescriptor;

  removeEdgeBetween(s: VertexDescriptor, t: VertexDescriptor): boolean;

  removeEdge(e: EdgeDescriptorT<VertexDescriptor>): boolean;

  removeVertex(v: VertexDescriptor): boolean;

  setVertexLabel(v: VertexDescriptor, l: VertexLabel): void;

  setEdgeLabel(e: EdgeDescriptorT<VertexDescriptor>, l: EdgeLabel): void;

  private _vertex(v: VertexDescriptor): Connections<VertexDescriptor>;

  private _setEdgeLabel(
    s: VertexDescriptor,
    t: VertexDescriptor,
    l: EdgeLabel
  ): void;
}

export declare class AdjacencyListOpaqueDescriptors<
  VertexLabel,
  EdgeLabel
> extends AdjacencyList<vertex_descriptor, VertexLabel, EdgeLabel> {
  private _fresh: vertex_descriptor;

  addVertex(l: VertexLabel | null | undefined): vertex_descriptor;

  addVertexDescriptor(
    v: vertex_descriptor,
    l: VertexLabel | null | undefined
  ): vertex_descriptor;
}


//////////////////////////////////////////////////////////////
//
// File ./computation-graph.d.ts
//
//////////////////////////////////////////////////////////////



declare class Deferred<T> {
  resolve: (arg0: T) => void;
  reject: (arg0: any) => void;
  private _promise: Promise<T>;

  promise(): Promise<T>;
}

declare class TrackingPromise<T> {
  private _promise: Promise<T>;
  private _fulfillTracker: () => any;

  constructor(p: Promise<T>, tracker: () => any);

  then(
    onFulfilled: ((...args: Array<any>) => any) | null | undefined,
    onRejected?: ((...args: Array<any>) => any) | null | undefined
  ): Promise<T>;

  catch(onRejected: (...args: Array<any>) => any): Promise<T>;

  finally(onFinally: (...args: Array<any>) => any): Promise<T>;
}

export declare class VariableActivation {
  private _deferred: Deferred<any>;
  private _pending: boolean;
  private _variable: Variable<any>;
  private _outMethods: Set<MethodActivation>;

  constructor(v: Variable<any>);

  get outMethods(): Iterable<MethodActivation>;

  private _inMethod: MethodActivation | null | undefined;

  get inMethod(): MethodActivation | null | undefined;

  get name(): string;

  get promise(): Promise<any>;

  outMethodsSize(): number;

  addOutMethod(m: MethodActivation): void;

  setInMethod(m: MethodActivation): void;

  resolve(v: any): void;

  reject(e: any): void;
}

export declare class MethodActivation {
  private _f: (...args: Array<any>) => any;
  private _mask: Array<MaskType>;
  private _ins: Array<VariableActivation>;

  constructor(f: Function, promiseMask: Array<MaskType>);

  get ins(): Iterable<VariableActivation>;

  private _outs: Array<VariableActivation>;

  get outs(): Iterable<VariableActivation>;

  insSize(): number;

  outsSize(): number;

  execute(
    ins: Array<VariableActivation>,
    outs: Array<VariableActivation>
  ): Promise<any>;
}

type eg_vertex_descriptor = VariableActivation | MethodActivation;

declare class EvaluationGraph
  implements BidirectionalAdjacencyIteration<eg_vertex_descriptor>
{
  adjacentOutVertices(v: eg_vertex_descriptor): Iterable<eg_vertex_descriptor>;

  outDegree(v: eg_vertex_descriptor): number;

  adjacentInVertices(v: eg_vertex_descriptor): Iterable<eg_vertex_descriptor>;

  inDegree(v: eg_vertex_descriptor): number;
}


//////////////////////////////////////////////////////////////
//
// File ./constraint-builder.d.ts
//
//////////////////////////////////////////////////////////////



type LEFT_type = 0;
type RIGHT_type = 1;

type LeftType<L> = {
  tag: LEFT_type;
  value: L;
};
type RightType<R> = {
  tag: RIGHT_type;
  value: R;
};
type Either<L, R> = LeftType<L> | RightType<R>;

export function isLeft<L, R>(e: Either<L, R>): boolean;

export function isRight<L, R>(e: Either<L, R>): boolean;

type WithPosition<T> = {
  pos: Position;
  value: T;
};
type QualifiedParameterAST = WithPosition<{
  qualifiers: Array<WithPosition<string>>;
  parameterName: WithPosition<string>;
}>;
type MethodAST = {
  pos: Position;
  name: WithPosition<string> | null | undefined;
  ins: Array<QualifiedParameterAST>;
  outs: Array<QualifiedParameterAST>;
  code: WithPosition<(...args: Array<any>) => any>;
  promiseMask: Array<MaskType>;
};
type ConstraintAST = {
  pos: Position;
  name: WithPosition<string> | null | undefined;
  variableNames: Set<string> | null | undefined;
  methods: Array<MethodAST>;
};
type VariableDeclarationAST = {
  pos: Position;
  name: string;
  isReference: boolean;
  initializer?: WithPosition<(...args: Array<any>) => any> | null | undefined;
};
type ComponentAST = {
  parent: ComponentAST | null | undefined;
  pos: Position;
  name: WithPosition<string>;
  variableDeclarations: Map<string, VariableDeclarationAST>;
  constraints: Array<ConstraintAST>;
  components: Array<ComponentAST>;
};

export function withPos<T>(p: Parser<T>): Parser<WithPosition<T>>;

interface ScopeI<Key, Value> {
  get(k: Key): Value | null | undefined;

  has(k: Key): boolean;
}

declare class ComponentScope implements ScopeI<string, VariableDeclarationAST> {
  private _component: ComponentAST;

  constructor(cmp: ComponentAST);

  get(key: string): VariableDeclarationAST | null | undefined;

  has(key: string): boolean;
}

declare class SetScope<K> implements ScopeI<K, K> {
  private _set: Set<K>;

  constructor(s: Set<K>);

  get(k: K): K | null | undefined;

  has(k: K): boolean;
}

export declare class TypeError extends Error {
  private _msg: string;
  private _pos: Position;

  constructor(m: string, p: Position);

  get message(): string;
  set message(s: string);
}

export function component(
  strs: Array<string> | TemplateStringsArray,
  ...splices: Array<any>
): Component;


//////////////////////////////////////////////////////////////
//
// File ./constraint-system/variable.d.ts
//
//////////////////////////////////////////////////////////////



export default class Variable<T> {
  private _index: number;
  private _activation: VariableActivation;
  private _subject: Subject<Event<T>>;
  private _inError: boolean;
  private _value: T | null | undefined;
  private _error: any;
  private _pending: boolean;
  private _owner: VariableReference<T>;
  static ConstraintSystem: any;
  static component: any;

  constructor(owner: VariableReference<T>, v?: T | undefined);

  get owner(): VariableReference<T>;

  get value(): T | null | undefined;

  get error(): any;

  get pending(): boolean;

  get stale(): boolean;

  get system(): ConstraintSystem | null | undefined;

  get name(): string;

  get currentPromise(): Promise<T>;

  subscribe(o: any): Subscription;

  subscribeValue(o: any): Subscription;

  subscribePending(o: any): Subscription;

  subscribeError(o: any): Subscription;

  pushNewActivation(): VariableActivation;

  set(v: T): Variable<T>;

  fail(e: any): Variable<T>;

  assign(v: T): void;

  touch(): Variable<T>;

  private _assign(): VariableActivation;

  private _touchPlanSolve(): VariableActivation;
}


//////////////////////////////////////////////////////////////
//
// File ./constraint-system/constraint.d.ts
//
//////////////////////////////////////////////////////////////



export default class Constraint {
  private _cspec: ConstraintSpec;
  private _vars: Array<Variable<any>>;
  private _used: Array<boolean>;
  private _varRefs: Array<VariableReference<any>>;
  private _danglingCount: number;
  private _indices: Map<Variable<any>, number>;
  private _optional: boolean;
  private _viableMethods: Set<Method>;
  private _outCounts: Array<number>;
  private _forcedVariables: Set<number>;
  private _owner: Component;
  private _selectedMethod: Method | null | undefined;

  constructor(
    owner: Component,
    cspec: ConstraintSpec,
    vrefs: Iterable<VariableReference<any>>,
    optional?: boolean
  );

  get owner(): Component;

  get selectedMethod(): Method | null | undefined;

  set selectedMethod(m: Method | null | undefined);

  get name(): string;

  get nvars(): number;

  get system(): ConstraintSystem | null | undefined;

  prettyPrint(): string;

  substitute(vrs: Iterable<VariableReference<any>>): Constraint;

  equals(c: Constraint): boolean;

  i2v(i: number): Variable<any>;

  v2i(v: Variable<any>): number;

  variables(): Iterable<Variable<any>>;

  outs(m: Method): Iterable<Variable<any>>;

  ins(m: Method): Iterable<Variable<any>>;

  nonOuts(m: Method): Iterable<Variable<any>>;

  methods(): Iterable<Method>;

  hasMethod(m: Method): boolean;

  viableMethods(): Iterable<Method>;

  clearSelectedMethod(): void;

  isEnforced(): boolean;

  isOutputVariable(v: Variable<any>): boolean;

  isInputVariable(v: Variable<any>): boolean;

  isNonOutputVariable(v: Variable<any>): boolean;

  downstreamVariables(): Iterable<Variable<any>>;

  downstreamAndUndetermined(): Iterable<Variable<any>>;

  upstreamVariables(): Iterable<Variable<any>>;

  upstreamAndUndetermined(): Iterable<Variable<any>>;

  private _initPruningData(): void;

  private _makeMethodViable(m: Method): Iterable<number>;

  private _makeMethodNonviable(m: Method): Iterable<number>;

  private _makeMethodsNonviableByVariable(
    v: Variable<any>
  ): Iterable<Variable<any>>;
}


//////////////////////////////////////////////////////////////
//
// File ./constraint-system/method.d.ts
//
//////////////////////////////////////////////////////////////



export default class Method {
  code: (...args: Array<any>) => any;
  private _ins: Set<number>;
  private _outs: Set<number>;
  private _nonOuts: Set<number>;
  private _promiseMask: Array<MaskType>;

  private _name: string;

  constructor(
    nvars: number,
    ins: Iterable<number>,
    outs: Iterable<number>,
    promiseMask: Iterable<MaskType>,
    code: Function,
    name?: string
  );

  get name(): string;

  get nvars(): number;

  validIndex(i: number): boolean;

  ins(): Iterable<number>;

  outs(): Iterable<number>;

  nonOuts(): Iterable<number>;

  vIns<T>(vs: Array<T>): Iterable<T>;

  vOuts<T>(vs: Array<T>): Iterable<T>;

  vNonOuts<T>(vs: Array<T>): Iterable<T>;

  nIns(): number;

  nOuts(): number;

  nNonOuts(): number;

  isIn(i: number): boolean;

  isOut(i: number): boolean;

  isNonOut(i: number): boolean;

  prettyPrint(vrefs: Array<VariableReference<any>>): string;
}


//////////////////////////////////////////////////////////////
//
// File ./constraint-system/constraint-system.d.ts
//
//////////////////////////////////////////////////////////////


  DownstreamSolutionGraph,
  UpstreamSolutionGraph,
} from "./solution-graph";

export default class ConstraintSystem {
  private _musts: Set<Constraint>;
  private _optionals: PriorityList<Constraint>;
  private _dirty: Set<Constraint>;
  private _v2cs: OneToManyMap<Variable<any>, Constraint>;
  private _usg: UpstreamSolutionGraph;
  private _dsg: DownstreamSolutionGraph;

  allConstraints(): Iterable<Constraint>;

  addComponent(c: Component): boolean;

  removeComponent(c: Component): boolean;

  prettyPrint(): string;

  update(): void;

  variables(): Iterable<Variable<any>>;

  constraints(v: Variable<any>): Iterable<Constraint>;

  allConstraints(): Iterable<Constraint>;

  isMust(c: Constraint): boolean;

  isOptional(c: Constraint): boolean;

  addConstraint(c: Constraint): void;

  removeConstraint(c: Constraint): void;

  setDirty(c: Constraint): void;

  gatherUpstreamConstraints(
    vs: Iterable<sg_vertex_descriptor>
  ): Iterable<Constraint>;

  gatherDownstreamConstraints(
    vs: Iterable<sg_vertex_descriptor>
  ): Iterable<Constraint>;

  gatherDownstreamVariables(
    vs: Iterable<sg_vertex_descriptor>
  ): Iterable<Variable<any>>;

  promoteVariable(v: Variable<any>): void;

  promoteConstraint(c: Constraint): void;

  demoteConstraint(c: Constraint): void;

  strength(c: Constraint): number;

  getStay(v: Variable<any>): Constraint;

  planDirty(): Iterable<Constraint>;

  updateDirty(): void;

  plan(toEnforce: Iterable<Constraint>): Iterable<Constraint>;

  solveFromConstraints(cs: Iterable<Constraint>): void;

  solve(vs: Iterable<Variable<any>>): void;

  executeDirty(): void;

  getSourceConstraint(v: Variable<any>): Constraint | null | undefined;

  scheduleConstraint(c: Constraint): void;

  scheduleCommand(
    ins: Iterable<Variable<any>>,
    outs: Iterable<Variable<any>>,
    f: (...args: Array<any>) => any
  ): void;

  private _prune(
    c: Constraint,
    constraintsOfInterest: Set<Constraint>,
    forcedSet: Set<Variable<any>>
  ): void;
}


//////////////////////////////////////////////////////////////
//
// File ./constraint-system/component.d.ts
//
//////////////////////////////////////////////////////////////



export default class Component {
  private _owner: Component | null | undefined;
  private _vars: Set<Variable<any>>;
  private _varRefs: Map<string, VariableReference<any>>;
  private _varRefNames: Map<VariableReference<any>, string>;
  private _constraints: Map<string, Constraint>;
  private _constraintNames: Map<Constraint, string>;
  private _nextFreshCIndex: number;
  private _system: ConstraintSystem | null | undefined;
  private _name: string;
  private _components: Map<string, Component>;

  constructor(name: string);

  get system(): ConstraintSystem | null | undefined;

  get name(): string;

  get components(): { [key: string]: Component | undefined };

  get vs(): { [key: string]: VariableReference<any> | undefined };

  get cs(): { [key: string]: Constraint | undefined };

  clone(name?: string): Component;

  connectSystem(system: ConstraintSystem): boolean;

  disconnectSystem(): boolean;

  addComponent(c: Component): void;

  emplaceVariable<T>(
    n: string,
    v: T | null | undefined
  ): VariableReference<any>;

  emplaceVariableReference(n: string): VariableReference<any>;

  emplaceConstraint(
    n: string | null | undefined,
    cspec: ConstraintSpec,
    vrefs: Iterable<VariableReference<any>>,
    optional: boolean
  ): Constraint;

  variableReferenceName(r: VariableReference<any>): string;

  constraintName(c: Constraint): string | null | undefined;

  getVariableReference(n: string): VariableReference<any> | null | undefined;

  private _nextFreshConstraintName(): string;

  private _connectSystem(system: ConstraintSystem): void;

  private _disconnectSystem(): void;
}


//////////////////////////////////////////////////////////////
//
// File ./constraint-system/simple-planner.d.ts
//
//////////////////////////////////////////////////////////////



export default class SimplePlanner {
  private _v2cs: OneToManyMap<Variable<any>, Constraint>;
  private _freeVars: Set<Variable<any>>;
  private _forcedByPlan: Map<Variable<any>, Method>;
  private _changeList: Array<[Constraint, Method]>;

  addConstraint(c: Constraint): void;

  removeConstraint(c: Constraint): void;

  clear(): void;

  plan(): boolean;

  undoChangesAfterFailedPlan(): void;

  extendPlanIfPossible(
    c: Constraint,
    forcedSet: Set<Variable<any>>
  ): boolean | null | undefined;

  freeMethods(): Iterable<[Constraint, Method]>;

  firstFreeMethod(): [Constraint, Method] | null | undefined;

  constraints(): Iterable<Constraint>;
}


//////////////////////////////////////////////////////////////
//
// File ./constraint-system/constraint-spec.d.ts
//
//////////////////////////////////////////////////////////////


// @flow


export default class ConstraintSpec {
  private _methods: Set<Method>;
  private _v2ins: Array<Array<Method>>;
  private _nvars: number;
  get nvars(): number;

  constructor(methods: Iterable<Method>);

  ins(vIndex: number): Iterable<Method>;

  insSize(vIndex: number): number;

  methods(): Iterable<Method>;

  hasMethod(m: Method): boolean;

  prettyPrint(prefix: string, vrefs: Array<VariableReference<any>>): string;
}


//////////////////////////////////////////////////////////////
//
// File ./constraint-system/variable-reference.d.ts
//
//////////////////////////////////////////////////////////////



export default class VariableReference<T> extends ObservableReference<
  Variable<T>
> {
  private _owner: Component;

  constructor(owner: Component);

  get system(): ConstraintSystem | null | undefined;

  get name(): string;

  isOwningReference(): boolean;

  prettyPrint(): string;
}


//////////////////////////////////////////////////////////////
//
// File ./constraint-system/constraint-system-util.d.ts
//
//////////////////////////////////////////////////////////////



export type MaskType = 0 | 1 | 2 | 3;
export const maskNone: MaskType;
export const maskPromise: MaskType;
export const maskUpdate: MaskType;
export const maskPromiseUpdate: MaskType;

export function mkVariable<T>(
  owner: Component,
  v: T | null | undefined
): VariableReference<T>;

type Event<T> = {
  value?: T | null | undefined;
  error?: any;
  pending?: boolean;
  inError?: boolean;
};

export const freshComponentName: () => string;

export function isOwnerOf(c1: Component, c2: Component): boolean;

export type sg_vertex_descriptor = Variable<any> | Constraint;

export type sg_edge_descriptor = [sg_vertex_descriptor, sg_vertex_descriptor];

export function enforceStayMethod(stay: Constraint): void;

export function isStay(c: Constraint): boolean;

export function stayConstraintSpec(): ConstraintSpec;


//////////////////////////////////////////////////////////////
//
// File ./constraint-system/solution-graph.d.ts
//
//////////////////////////////////////////////////////////////



export declare class DownstreamSolutionGraph
  implements AdjacencyIteration<sg_vertex_descriptor>
{
  private _system: ConstraintSystem;

  constructor(system: ConstraintSystem);

  adjacentOutVertices(v: sg_vertex_descriptor): Iterable<sg_vertex_descriptor>;

  outDegree(v: sg_vertex_descriptor): number;
}

export declare class UpstreamSolutionGraph
  implements AdjacencyIteration<sg_vertex_descriptor>
{
  private _system: ConstraintSystem;

  constructor(system: ConstraintSystem);

  adjacentOutVertices(v: sg_vertex_descriptor): Iterable<sg_vertex_descriptor>;

  outDegree(v: sg_vertex_descriptor): number;
}


//////////////////////////////////////////////////////////////
//
// File ./graph-algorithms.d.ts
//
//////////////////////////////////////////////////////////////



export interface DfsAdjacencyVisitor<VertexDescriptor> {
  discoverVertex(v: VertexDescriptor): void;

  finishVertex(v: VertexDescriptor): void;
}

export function dfsVisit<VertexDescriptor>(
  g: AdjacencyIteration<VertexDescriptor>,
  vs: Iterable<VertexDescriptor>,
  visitor: DfsAdjacencyVisitor<VertexDescriptor>,
  visited?: Set<VertexDescriptor>
): void;

export function reverseTopoSort<VertexDescriptor>(
  g: AdjacencyIteration<VertexDescriptor> &
    VertexListIteration<VertexDescriptor>
): Iterable<VertexDescriptor>;

declare class TopoVisitor<VertexDescriptor> {
  result: Array<VertexDescriptor>;

  discoverVertex(v: VertexDescriptor): void;

  finishVertex(v: VertexDescriptor): void;
}

export function reverseTopoSortFrom<VertexDescriptor>(
  g: AdjacencyIteration<VertexDescriptor>,
  vs: Iterable<VertexDescriptor>
): Iterable<VertexDescriptor>;


//////////////////////////////////////////////////////////////
//
// File ./hdconsole.d.ts
//
//////////////////////////////////////////////////////////////


/**
 * The HdConsole class replicates basic functionality of Console, and adds methods to turn logging on and off.
 */
export class HdConsole {
  log: (...args: Array<any>) => any;
  warn: (...args: Array<any>) => any;
  error: (...args: Array<any>) => any;
  assert: (...args: Array<any>) => any;
  private _name: string;

  /**
   * @param name Name of the console
   */
  constructor(name: string);

  /**
   * Disable all logging with this console
   */
  off(): void;

  /**
   * Only log errors and asserts
   */
  errorsOnly(): void;

  /**
   * Enable all logging
   */
  on(): void;
}

/**
 * Default console used for logging by hotdrink.
 *
 * @type {HdConsole}
 */
export const hdconsole: HdConsole;

export class HdError extends Error {}


//////////////////////////////////////////////////////////////
//
// File ./hotdrink.d.ts
//
//////////////////////////////////////////////////////////////





export const defaultConstraintSystem: ConstraintSystem;

export function constraintSystemInVisNodesAndEdges(
  cs: ConstraintSystem
): [any, any];

export function constraintSystemInVisAllNodesAndEdges(
  cs: ConstraintSystem
): [any, any];


//////////////////////////////////////////////////////////////
//
// File ./lexing-tools.d.ts
//
//////////////////////////////////////////////////////////////


export declare class Position {
  private _pos: number;
  private _row: number;
  private _col: number;
  private _source: string | null | undefined;

  constructor(pos: number, row: number, col: number, source?: string);

  get pos(): number;

  get row(): number;

  get col(): number;

  get source(): string;

  toString(): string;

  advance(str: string): void;

  clone(): Position;
}

export function isWhitespace(c: string): boolean;

export function isDigit(c: string): boolean;

export function isAlpha(c: string): boolean;

export function isAlphaPlus(c: string): boolean;

export function isAlphaNum(c: string): boolean;


//////////////////////////////////////////////////////////////
//
// File ./observable.d.ts
//
//////////////////////////////////////////////////////////////


export interface Observer<T> {
  readonly start?: (subscription: Subscription) => void;
  readonly next?: (value: T) => void;
  readonly error?: (errorValue: any) => void;
  readonly complete?: () => void;
}

export interface Subscription {
  readonly closed: boolean;

  unsubscribe(): void;
}

export type SubscriberFunction<T> = (
  arg0: SubscriptionObserver<T>
) => ((arg0: void) => void) | Subscription;

export function mkObserver<T>(
  obs: Observer<T> | ((arg0: T) => void),
  err?: (arg0: any) => void,
  complete?: () => void
): Observer<T>;

export declare class Observable<T> {
  private _subscriber: (...args: Array<any>) => any;

  constructor(subscriber: Function);

  subscribe(
    obs: Observer<T> | ((arg0: T) => void),
    err?: (arg0: any) => void,
    complete?: () => void
  ): Subscription;

  filter(p: (arg0: T) => boolean): Observable<T>;

  map<U>(f: (arg0: T) => U): Observable<U>;
}

export declare class HdSubscription<T> implements Subscription {
  private _observer: Observer<T> | null | undefined;
  private _cleanup: any;

  constructor(observer: Observer<T>);

  get closed(): boolean;

  unsubscribe(): void;

  cleanup(): void;
}

export declare class SubscriptionObserver<T> {
  private _subscription: HdSubscription<T>;

  constructor(s: HdSubscription<T>);

  get closed(): boolean;

  next(value: T): void;

  error(errorValue: any): void;

  complete(): void;
}

export declare class Subject<T> extends Observable<T> {
  private _subjectState: {
    observers: Set<SubscriptionObserver<T>>;
    done: boolean;
  };

  constructor(f?: Function);

  get nObservers(): number;

  sendNext(v: T): void;

  sendError(e: any): void;

  sendComplete(): void;
}

export declare class ReplaySubject<T> extends Subject<T> {
  private _replaySubjectState: {
    past: Array<T>;
    pastLimit: number;
    isCompleted: boolean;
    isError: boolean;
    error?: any;
  };

  constructor(limit?: number);

  sendNext(v: T): void;

  sendError(e: T): void;

  sendComplete(): void;
}

export declare class BehaviorSubject<T> extends ReplaySubject<T> {
  constructor(v: T);
}


//////////////////////////////////////////////////////////////
//
// File ./parsing.d.ts
//
//////////////////////////////////////////////////////////////



export declare class ParseState {
  pos: Position;
  private _input: PeekIterator<string, Position>;
  private _context: Array<[string, Position]>;
  private _splices: Array<any>;

  constructor(input: Iterator<string>, splices?: Array<any>, pos?: Position);

  pushContext(str: string): void;

  popContext(): void;

  checkpoint(): void;

  forgetCheckpoint(): void;

  resetCheckpoint(): void;

  peek(): string | null | undefined;

  advance(): string | null | undefined;

  getSplice(i: number): any;

  parseErrorF(expF: () => Array<string>, msg?: string): ParseError;

  parseError(exp: Array<string>, msg?: string): ParseError;
}

export function mkParseState(s: string, splices: Array<string>): ParseState;

export type ParseSuccess<T> = {
  readonly success: true;
  value: T;
  consumed: boolean;
  expecting?: () => Array<string>;
};
export type ParseFailure = {
  readonly success: false;
  expecting: () => Array<string>;
  consumed: boolean;
};
export type ParseResult<T> = ParseSuccess<T> | ParseFailure;
export type Parser<T> = (arg0: ParseState) => ParseResult<T>;
export type SuccessParser<T> = (arg0: ParseState) => ParseSuccess<T>;
export type FailureParser<T> = (arg0: ParseState) => ParseFailure;
export type NamedParser<T> = ((arg0: ParseState) => ParseResult<T>) & {
  parserName: string;
};

export function ok<T>(t: T, c: boolean): ParseSuccess<T>;

export function fail(es: Array<string>, c: boolean): ParseFailure;

export function failF(ef: () => Array<string>, c: boolean): ParseFailure;

export declare class ParseError extends Error {
  private _pos: Position;
  private _unexpected: string | null | undefined;
  private _ctxName: string | null | undefined;
  private _ctxPos: Position | null | undefined;
  private _msg: string | null | undefined;
  private _message: string;
  private _expecting: () => Array<string>;

  constructor(
    pos: Position,
    expF: () => Array<string>,
    unexp: string | null | undefined,
    ctxName?: string,
    ctxPos?: Position,
    msg?: string
  );

  get message(): string;

  set message(s: string);

  get name(): string;

  set name(s: string);

  private _formatExpecting(): string;
}

export function item(ps: ParseState): ParseResult<string>;

export function peekItem(ps: ParseState): ParseResult<string>;

export function failure(ps: ParseState): ParseFailure;

export function ret<T>(v: T, consumed: boolean): SuccessParser<T>;

export function eof(ps: ParseState): ParseResult<null>;

export function sat(
  predicate: (arg0: string) => boolean,
  name?: string
): NamedParser<string>;

export function pChar(c: string): NamedParser<string>;

export function pChars(cs: string): NamedParser<string>;

export function many<T>(p: Parser<T>): Parser<Array<T>>;

export function many1<T>(p: Parser<T>): Parser<Array<T>>;

export function exactString(s: string): NamedParser<string>;

export const alphaPlus: NamedParser<string>;
export const alphaNum: NamedParser<string>;
export const digit: NamedParser<string>;
export const lineComment: Parser<string>;
export const blockComment: Parser<string>;
export const onews: Parser<string>;
export const manyws: Parser<string>;

export function pBind<T, U>(p: Parser<T>, f: (arg0: T) => Parser<U>): Parser<U>;

export function pBind_<T, U>(p: Parser<T>, q: Parser<U>): Parser<U>;

export function opt<T, U>(p: Parser<T>, v: U): SuccessParser<T | U>;

type ignoreTag = {};

export function ignore<T>(p: Parser<T>): Parser<ignoreTag>;

export function lift<T>(
  f: (...vs: any) => T,
  ...parsers: Array<Parser<any>>
): Parser<T>;

export function lift2<T1, T2, U>(
  f: (arg0: T1, arg1: T2) => U
): (arg0: Parser<T1>, arg1: Parser<T2>) => Parser<U>;

export function lift3<T1, T2, T3, U>(
  f: (arg0: T1, arg1: T2, arg2: T3) => U
): (arg0: Parser<T1>, arg1: Parser<T2>, arg2: Parser<T3>) => Parser<U>;

export function lift4<T1, T2, T3, T4, U>(
  f: (arg0: T1, arg1: T2, arg2: T3, arg3: T4) => U
): (
  arg0: Parser<T1>,
  arg1: Parser<T2>,
  arg2: Parser<T3>,
  arg3: Parser<T4>
) => Parser<U>;

export function lift5<T1, T2, T3, T4, T5, U>(
  f: (arg0: T1, arg1: T2, arg2: T3, arg3: T4, arg4: T5) => U
): (
  arg0: Parser<T1>,
  arg1: Parser<T2>,
  arg2: Parser<T3>,
  arg3: Parser<T4>,
  arg4: Parser<T5>
) => Parser<U>;

export function go<T>(pg: Generator<Parser<any>, T, any>): Parser<T>;

export function inBetween<T, U, V>(
  p: Parser<T>,
  open: Parser<U>,
  close: Parser<V>
): Parser<T>;

export function parens<T>(p: Parser<T>): Parser<T>;

export function oneOf<T>(...qs: Array<Parser<T>>): Parser<T>;

export function pNot<T>(p: NamedParser<T>): Parser<null>;

export function until<T>(p: NamedParser<T>): Parser<string>;

export function notFollowedBy<T, U>(
  q1: NamedParser<T>,
  q2: NamedParser<U>
): Parser<T>;

export function pTry<T>(q: NamedParser<T>): Parser<T>;

export function must<T>(p: Parser<T>, msg?: string): SuccessParser<T>;

export function named<T>(p: Parser<T>, name: string): NamedParser<T>;

export function token<T>(q: Parser<T>): Parser<T>;

export function word(s: string): Parser<string>;

export function identifier(ps: ParseState): ParseResult<string>;

export let nat: Parser<number>;

export function sepList<Element, Sep>(
  element: Parser<Element>,
  sep: Parser<Sep>
): Parser<Array<Element>>;

export const currentPos: SuccessParser<Position>;

export function context<T>(str: string, p: Parser<T>): Parser<T>;

export function hdl(strs: Array<string>, ...splices: Array<any>): ParseState;

export const pSplice: Parser<any>;


//////////////////////////////////////////////////////////////
//
// File ./peek-iterator.d.ts
//
//////////////////////////////////////////////////////////////


export default class PeekIterator<T, CheckpointData> {
  private _iter: Iterator<T>;
  private _currentIndex: number;
  private _firstIndex: number;
  private _buffer: Array<T>;
  private _checkpoints: Array<{
    index: number;
    value: CheckpointData;
  }>;

  next(): IteratorResult<T, any>;

  checkpoint(d: CheckpointData): void;

  forgetCheckpoint(): void;

  reset(): CheckpointData;

  peek(): T | null | undefined;

  peekMany(n: number): Array<T>;

  private _ind2buf(i: number): number;

  private _at(i: number): T | null | undefined;

  private _fetch(n: number): number;

  private _collect(): void;
}
