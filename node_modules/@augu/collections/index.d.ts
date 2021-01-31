declare module '@augu/collections' {
  namespace collections {
    /** Returns the version of this library */
    export const version: string;

    type Predicate<ThisArg, Value, Index, Key, ReturnAs>
      = (this: ThisArg, value: Value, index: Index, key: Key) => ReturnAs;

    type ReducePredicate<ThisArg, Current, Acc, ReturnAs> = (this: ThisArg, acc: Acc, current: Current) => ReturnAs;
    type UndetailedPredicate<Value, Index, Key, ReturnAs> = (value: Value, index: Index, key: Key) => ReturnAs;
    type MinimalPredicate<ThisArg, Value, ReturnAs> = (this: ThisArg, value: Value) => ReturnAs;
    type UndetailedMinimalPredicate<Value, ReturnAs> = (value: Value) => ReturnAs;

    /**
     * Represents a class to hold key-value pairs using [[Collection]]. This is a extension
     * of [Map] to add Array-like functions and a update builder.
     *
     * @template K The key structure for this [[Collection]]
     * @template V The value structure for this [[Collection]]
     */
    export class Collection<K, V = unknown> extends Map<K, V> {
      public ['constructor']: typeof Collection;

      /** Returns if this [[`Collection`]] is empty or not */
      public get empty(): boolean;

      /**
       * Use a predicate function to filter out anything and return a new Array
       * @param predicate The predicate function to filter out
       * @param thisArg An additional `this` context if needed
       * @returns A new Array of the values that returned `true` in the predicate function
       */
      filter<ThisArg = Collection<K, V>>(predicate: Predicate<ThisArg, V, number, K, boolean>, thisArg?: ThisArg): V[];

      /**
       * Use a predicate function to map anything into a new array
       * @param predicate The predicate function to map out and return a new array
       * @param thisArg An additional `this` context if needed
       * @returns A new Array of the values from that function
       */
      map<S, ThisArg = Collection<K, V>>(
        predicate: Predicate<ThisArg, V, number, K, S>,
        thisArg?: ThisArg
      ): S[];

      /**
       * Returns a random value from the collection
       * @returns A random value or `null` if the collection is empty
       */
      random(): V | null;

      /**
       * Reduce the collection and return a new initial value
       * @param predicate The predicate function
       * @param initialValue The initial value
       */
      reduce<S>(
        predicate: ReducePredicate<Collection<K, V>, V, S, S>,
        initialValue?: S
      ): S;

      /**
       * Returns the first element in the collection
       */
      first(): V | undefined;

      /**
       * Returns an Array of the values from the correspondant `amount`
       * @param amount The amount to fetch from
       */
      first(amount: number): V[];

      /**
       * Returns the last element in the collection
       */
      last(): V | undefined;

      /**
       * Returns an Array of the values from the correspondant `amount`
       * @param amount The amount to fetch from
       */
      last(amount: number): V[];

      /**
       * Returns the last element in the collection
       */
      lastKey(): K | undefined;

      /**
       * Returns an Array of the values from the correspondant `amount`
       * @param amount The amount to fetch from
       */
      lastKey(amount: number): K[];

      /**
       * Returns the first key in the collection
       */
      firstKey(): K | undefined;

      /**
       * Returns an Array of the keys from the correspondant `amount`
       * @param amount The amount to fetch from
       */
      firstKey(amount: number): K[];

      /**
       * Returns all of the values as an Array
       */
      toArray(): V[];

      /**
       * Returns all of the keys as an Array
       */
      toKeyArray(): K[];

      /**
       * Gets the first item in the collection and removes it (if provided)
       * @param remove If we should remove it or not
       */
      shift(remove?: boolean): V | undefined;

      /**
       * Gets the last item in the collection and removes it(if provided)
       * @param remove If we should remove it or not
       */
      unshift(remove: boolean): V | undefined;

      /**
       * Find a value in the collection from it's predicate function
       * @param predicate The predicate function
       * @param thisArg An additional `this` context if needed
       * @returns The value found or `null` if not found
       */
      find<ThisArg = Collection<K, V>>(
        predicate: MinimalPredicate<ThisArg, V, boolean>,
        thisArg?: ThisArg
      ): V | null;

      /**
       * Computes a value if it's absent in this Collection
       * @param key The key to find
       * @param insert Item to add when it doesn't exist
       */
      emplace(key: K, insert: V | (() => V)): V;

      /**
       * Similar to [Array.sort], which basically sorts the values of this Collection
       * to return a value
       *
       * @param compareFn The compare function
       * @returns The value
       */
      sort(compareFn: (a: V, b: V) => number): V[];

      /**
       * Similar to [Array.sort], which basically sorts the values of this Collection
       * to return a value
       *
       * @param compareFn The compare function
       * @returns The value
       */
      sortKeys(compareFn: (a: K, b: K) => number): K[];

      /**
       * Similar to [Array.some], this function tests whether atleast 1 item
       * in the predicate function passes the test in the values cache.
       *
       * @param func The function to use to filter out
       * @returns A boolean value if 1 item of the cache is truthy
       */
      some(func: (item: V) => boolean): boolean;

      /**
       * Similar to [Array.some], this functions tests whether atleast 1 key
       * in the predicate function passes the test in the key cache.
       *
       * @param func The function to use to filter out
       * @returns A boolean value if 1 item of the cache is truthy
       */
      someKeys(func: (item: K) => boolean): boolean;

      /**
       * Bulk add items into this [[`Collection`]] using an object
       * @param obj The object to bulk-add to this [[`Collection`]]
       */
      bulkAdd(obj: {
        [x: string]: V
        [x: number]: V
      }): void;
    }

    /**
     * Represents a [[Queue]] class, which handles queue-based systems in a simple class.
     * @template T The structure of this [[Queue]] instance
     */
    export class Queue<T = unknown> {
      private items: T[];

      /**
       * Inserts a new element at the start of the callstack
       * @notice This is for backwards compatibility for Queue.add from 0.x
       * @param item The item to push
       * @returns The size of this [[Queue]]
       */
      public addFirst: (item: T) => number;

      /**
       * Pushes a new item at the end of the callstack
       * @deprecated This is for backwards compatibility for Queue.add from 0.x
       * @param item The item to push
       * @returns The size of this [[Queue]]
       */
      public add: (item: T) => number;

      /**
       * Represents a [[Queue]] class, which handles queue-based systems in a simple class.
       * @param items The items to inject when creating a new instance
       */
      constructor(items?: T[]);

      /** Returns if this [[`Queue`]] is empty or not */
      public get empty(): boolean;

      /**
       * Returns the size of the Queue
       * @returns The size of this [[Queue]]
       */
      public size(): number;

      /**
       * Pushes a new item at the end of the callstack
       * @param item The item to push
       * @returns The size of this [[Queue]]
       */
      push(item: T): number;

      /**
       * Inserts a new element at the start of the callstack
       * @param item The item to push
       * @returns The size of this [[Queue]]
       */
      unshift(item: T): number;

      /**
       * Returns the first item in the cache and removes it from the cache
       */
      shift(): T | undefined;

      /**
       * Returns the last item in the cache and removes it from the cache
       */
      pop(): T | undefined;

      /**
       * Finds an item in the cache or returns `undefined` if not found
       * @param predicate The predicate function
       */
      find(predicate: (item: T) => boolean): T | undefined;

      /**
       * Returns the the queued items as an Array
       */
      toArray(): T[];

      /**
       * Returns the last value of the cache
       */
      last(): T | undefined;

      /**
       * Returns the value or `null` if not found
       * @param index The index to peek at
       * @returns A value if it didn't return null
       */
      get(index: number): T | null;

      /**
       * Removes the item from the queue
       *
       * @warning Use `Queue#tick` to remove all items!
       * @param item The item to remove
       */
      remove(item: T | number): this;

      /**
       * Checks if the key is included in the cache
       * @param key The key to find
       */
      includes(key: T): boolean;

      /**
       * Clones a new [[Queue]] instance with the items available
       */
      clone(): this;

      [Symbol.iterator](): IteratorResult<T>;
    }
  }

  export = collections;
}
