
/**
 * Client
**/

import * as runtime from './runtime/library.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model Product
 * 
 */
export type Product = $Result.DefaultSelection<Prisma.$ProductPayload>
/**
 * Model CurrentAccount
 * 
 */
export type CurrentAccount = $Result.DefaultSelection<Prisma.$CurrentAccountPayload>
/**
 * Model CategoryDetail
 * 
 */
export type CategoryDetail = $Result.DefaultSelection<Prisma.$CategoryDetailPayload>

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more Products
 * const products = await prisma.product.findMany()
 * ```
 *
 *
 * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  const U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   *
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient()
   * // Fetch zero or more Products
   * const products = await prisma.product.findMany()
   * ```
   *
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): PrismaClient;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/concepts/components/prisma-client/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>


  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb<ClientOptions>, ExtArgs, $Utils.Call<Prisma.TypeMapCb<ClientOptions>, {
    extArgs: ExtArgs
  }>>

      /**
   * `prisma.product`: Exposes CRUD operations for the **Product** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Products
    * const products = await prisma.product.findMany()
    * ```
    */
  get product(): Prisma.ProductDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.currentAccount`: Exposes CRUD operations for the **CurrentAccount** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more CurrentAccounts
    * const currentAccounts = await prisma.currentAccount.findMany()
    * ```
    */
  get currentAccount(): Prisma.CurrentAccountDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.categoryDetail`: Exposes CRUD operations for the **CategoryDetail** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more CategoryDetails
    * const categoryDetails = await prisma.categoryDetail.findMany()
    * ```
    */
  get categoryDetail(): Prisma.CategoryDetailDelegate<ExtArgs, ClientOptions>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
   * Metrics
   */
  export type Metrics = runtime.Metrics
  export type Metric<T> = runtime.Metric<T>
  export type MetricHistogram = runtime.MetricHistogram
  export type MetricHistogramBucket = runtime.MetricHistogramBucket

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 6.19.3
   * Query Engine version: c2990dca591cba766e3b7ef5d9e8a84796e47ab7
   */
  export type PrismaVersion = {
    client: string
  }

  export const prismaVersion: PrismaVersion

  /**
   * Utility Types
   */


  export import Bytes = runtime.Bytes
  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? P : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    Product: 'Product',
    CurrentAccount: 'CurrentAccount',
    CategoryDetail: 'CategoryDetail'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]


  export type Datasources = {
    db?: Datasource
  }

  interface TypeMapCb<ClientOptions = {}> extends $Utils.Fn<{extArgs: $Extensions.InternalArgs }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], ClientOptions extends { omit: infer OmitOptions } ? OmitOptions : {}>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> = {
    globalOmitOptions: {
      omit: GlobalOmitOptions
    }
    meta: {
      modelProps: "product" | "currentAccount" | "categoryDetail"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      Product: {
        payload: Prisma.$ProductPayload<ExtArgs>
        fields: Prisma.ProductFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ProductFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProductPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ProductFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProductPayload>
          }
          findFirst: {
            args: Prisma.ProductFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProductPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ProductFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProductPayload>
          }
          findMany: {
            args: Prisma.ProductFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProductPayload>[]
          }
          create: {
            args: Prisma.ProductCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProductPayload>
          }
          createMany: {
            args: Prisma.ProductCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ProductCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProductPayload>[]
          }
          delete: {
            args: Prisma.ProductDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProductPayload>
          }
          update: {
            args: Prisma.ProductUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProductPayload>
          }
          deleteMany: {
            args: Prisma.ProductDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ProductUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.ProductUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProductPayload>[]
          }
          upsert: {
            args: Prisma.ProductUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProductPayload>
          }
          aggregate: {
            args: Prisma.ProductAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateProduct>
          }
          groupBy: {
            args: Prisma.ProductGroupByArgs<ExtArgs>
            result: $Utils.Optional<ProductGroupByOutputType>[]
          }
          count: {
            args: Prisma.ProductCountArgs<ExtArgs>
            result: $Utils.Optional<ProductCountAggregateOutputType> | number
          }
        }
      }
      CurrentAccount: {
        payload: Prisma.$CurrentAccountPayload<ExtArgs>
        fields: Prisma.CurrentAccountFieldRefs
        operations: {
          findUnique: {
            args: Prisma.CurrentAccountFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CurrentAccountPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.CurrentAccountFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CurrentAccountPayload>
          }
          findFirst: {
            args: Prisma.CurrentAccountFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CurrentAccountPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.CurrentAccountFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CurrentAccountPayload>
          }
          findMany: {
            args: Prisma.CurrentAccountFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CurrentAccountPayload>[]
          }
          create: {
            args: Prisma.CurrentAccountCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CurrentAccountPayload>
          }
          createMany: {
            args: Prisma.CurrentAccountCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.CurrentAccountCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CurrentAccountPayload>[]
          }
          delete: {
            args: Prisma.CurrentAccountDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CurrentAccountPayload>
          }
          update: {
            args: Prisma.CurrentAccountUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CurrentAccountPayload>
          }
          deleteMany: {
            args: Prisma.CurrentAccountDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.CurrentAccountUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.CurrentAccountUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CurrentAccountPayload>[]
          }
          upsert: {
            args: Prisma.CurrentAccountUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CurrentAccountPayload>
          }
          aggregate: {
            args: Prisma.CurrentAccountAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateCurrentAccount>
          }
          groupBy: {
            args: Prisma.CurrentAccountGroupByArgs<ExtArgs>
            result: $Utils.Optional<CurrentAccountGroupByOutputType>[]
          }
          count: {
            args: Prisma.CurrentAccountCountArgs<ExtArgs>
            result: $Utils.Optional<CurrentAccountCountAggregateOutputType> | number
          }
        }
      }
      CategoryDetail: {
        payload: Prisma.$CategoryDetailPayload<ExtArgs>
        fields: Prisma.CategoryDetailFieldRefs
        operations: {
          findUnique: {
            args: Prisma.CategoryDetailFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CategoryDetailPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.CategoryDetailFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CategoryDetailPayload>
          }
          findFirst: {
            args: Prisma.CategoryDetailFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CategoryDetailPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.CategoryDetailFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CategoryDetailPayload>
          }
          findMany: {
            args: Prisma.CategoryDetailFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CategoryDetailPayload>[]
          }
          create: {
            args: Prisma.CategoryDetailCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CategoryDetailPayload>
          }
          createMany: {
            args: Prisma.CategoryDetailCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.CategoryDetailCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CategoryDetailPayload>[]
          }
          delete: {
            args: Prisma.CategoryDetailDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CategoryDetailPayload>
          }
          update: {
            args: Prisma.CategoryDetailUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CategoryDetailPayload>
          }
          deleteMany: {
            args: Prisma.CategoryDetailDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.CategoryDetailUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.CategoryDetailUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CategoryDetailPayload>[]
          }
          upsert: {
            args: Prisma.CategoryDetailUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CategoryDetailPayload>
          }
          aggregate: {
            args: Prisma.CategoryDetailAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateCategoryDetail>
          }
          groupBy: {
            args: Prisma.CategoryDetailGroupByArgs<ExtArgs>
            result: $Utils.Optional<CategoryDetailGroupByOutputType>[]
          }
          count: {
            args: Prisma.CategoryDetailCountArgs<ExtArgs>
            result: $Utils.Optional<CategoryDetailCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasources?: Datasources
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasourceUrl?: string
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Shorthand for `emit: 'stdout'`
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events only
     * log: [
     *   { emit: 'event', level: 'query' },
     *   { emit: 'event', level: 'info' },
     *   { emit: 'event', level: 'warn' }
     *   { emit: 'event', level: 'error' }
     * ]
     * 
     * / Emit as events and log to stdout
     * og: [
     *  { emit: 'stdout', level: 'query' },
     *  { emit: 'stdout', level: 'info' },
     *  { emit: 'stdout', level: 'warn' }
     *  { emit: 'stdout', level: 'error' }
     * 
     * ```
     * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/logging#the-log-option).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
    /**
     * Instance of a Driver Adapter, e.g., like one provided by `@prisma/adapter-planetscale`
     */
    adapter?: runtime.SqlDriverAdapterFactory | null
    /**
     * Global configuration for omitting model fields by default.
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   omit: {
     *     user: {
     *       password: true
     *     }
     *   }
     * })
     * ```
     */
    omit?: Prisma.GlobalOmitConfig
  }
  export type GlobalOmitConfig = {
    product?: ProductOmit
    currentAccount?: CurrentAccountOmit
    categoryDetail?: CategoryDetailOmit
  }

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type CheckIsLogLevel<T> = T extends LogLevel ? T : never;

  export type GetLogType<T> = CheckIsLogLevel<
    T extends LogDefinition ? T['level'] : T
  >;

  export type GetEvents<T extends any[]> = T extends Array<LogLevel | LogDefinition>
    ? GetLogType<T[number]>
    : never;

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'updateManyAndReturn'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */



  /**
   * Models
   */

  /**
   * Model Product
   */

  export type AggregateProduct = {
    _count: ProductCountAggregateOutputType | null
    _avg: ProductAvgAggregateOutputType | null
    _sum: ProductSumAggregateOutputType | null
    _min: ProductMinAggregateOutputType | null
    _max: ProductMaxAggregateOutputType | null
  }

  export type ProductAvgAggregateOutputType = {
    stock: number | null
    criticalLimit: number | null
    price: Decimal | null
    oldPrice: Decimal | null
    list_price: Decimal | null
    sale_price: Decimal | null
    stock_quantity: number | null
    cartDiscountRate: number | null
    cost: Decimal | null
    rating: number | null
    reviews: number | null
    version: number | null
    b2b_base_price: Decimal | null
    salesCount: number | null
  }

  export type ProductSumAggregateOutputType = {
    stock: number | null
    criticalLimit: number | null
    price: Decimal | null
    oldPrice: Decimal | null
    list_price: Decimal | null
    sale_price: Decimal | null
    stock_quantity: number | null
    cartDiscountRate: number | null
    cost: Decimal | null
    rating: number | null
    reviews: number | null
    version: number | null
    b2b_base_price: Decimal | null
    salesCount: number | null
  }

  export type ProductMinAggregateOutputType = {
    id: string | null
    name: string | null
    sku: string | null
    category: string | null
    subCategory: string | null
    stock: number | null
    criticalLimit: number | null
    price: Decimal | null
    oldPrice: Decimal | null
    list_price: Decimal | null
    sale_price: Decimal | null
    discount_start_date: Date | null
    discount_end_date: Date | null
    stock_quantity: number | null
    isCampaignActive: boolean | null
    cartDiscountRate: number | null
    cost: Decimal | null
    image: string | null
    images: string | null
    desc: string | null
    seoTitle: string | null
    seoDesc: string | null
    seoKeywords: string | null
    videoUrl: string | null
    attributes: string | null
    isRawMaterial: boolean | null
    rating: number | null
    reviews: number | null
    isDeleted: boolean | null
    version: number | null
    createdAt: Date | null
    updatedAt: Date | null
    companyId: string | null
    b2b_base_price: Decimal | null
    isDeal: boolean | null
    salesCount: number | null
  }

  export type ProductMaxAggregateOutputType = {
    id: string | null
    name: string | null
    sku: string | null
    category: string | null
    subCategory: string | null
    stock: number | null
    criticalLimit: number | null
    price: Decimal | null
    oldPrice: Decimal | null
    list_price: Decimal | null
    sale_price: Decimal | null
    discount_start_date: Date | null
    discount_end_date: Date | null
    stock_quantity: number | null
    isCampaignActive: boolean | null
    cartDiscountRate: number | null
    cost: Decimal | null
    image: string | null
    images: string | null
    desc: string | null
    seoTitle: string | null
    seoDesc: string | null
    seoKeywords: string | null
    videoUrl: string | null
    attributes: string | null
    isRawMaterial: boolean | null
    rating: number | null
    reviews: number | null
    isDeleted: boolean | null
    version: number | null
    createdAt: Date | null
    updatedAt: Date | null
    companyId: string | null
    b2b_base_price: Decimal | null
    isDeal: boolean | null
    salesCount: number | null
  }

  export type ProductCountAggregateOutputType = {
    id: number
    name: number
    sku: number
    category: number
    subCategory: number
    stock: number
    criticalLimit: number
    price: number
    oldPrice: number
    list_price: number
    sale_price: number
    discount_start_date: number
    discount_end_date: number
    stock_quantity: number
    isCampaignActive: number
    cartDiscountRate: number
    cost: number
    image: number
    images: number
    desc: number
    seoTitle: number
    seoDesc: number
    seoKeywords: number
    videoUrl: number
    attributes: number
    isRawMaterial: number
    rating: number
    reviews: number
    isDeleted: number
    version: number
    createdAt: number
    updatedAt: number
    companyId: number
    b2b_base_price: number
    isDeal: number
    salesCount: number
    _all: number
  }


  export type ProductAvgAggregateInputType = {
    stock?: true
    criticalLimit?: true
    price?: true
    oldPrice?: true
    list_price?: true
    sale_price?: true
    stock_quantity?: true
    cartDiscountRate?: true
    cost?: true
    rating?: true
    reviews?: true
    version?: true
    b2b_base_price?: true
    salesCount?: true
  }

  export type ProductSumAggregateInputType = {
    stock?: true
    criticalLimit?: true
    price?: true
    oldPrice?: true
    list_price?: true
    sale_price?: true
    stock_quantity?: true
    cartDiscountRate?: true
    cost?: true
    rating?: true
    reviews?: true
    version?: true
    b2b_base_price?: true
    salesCount?: true
  }

  export type ProductMinAggregateInputType = {
    id?: true
    name?: true
    sku?: true
    category?: true
    subCategory?: true
    stock?: true
    criticalLimit?: true
    price?: true
    oldPrice?: true
    list_price?: true
    sale_price?: true
    discount_start_date?: true
    discount_end_date?: true
    stock_quantity?: true
    isCampaignActive?: true
    cartDiscountRate?: true
    cost?: true
    image?: true
    images?: true
    desc?: true
    seoTitle?: true
    seoDesc?: true
    seoKeywords?: true
    videoUrl?: true
    attributes?: true
    isRawMaterial?: true
    rating?: true
    reviews?: true
    isDeleted?: true
    version?: true
    createdAt?: true
    updatedAt?: true
    companyId?: true
    b2b_base_price?: true
    isDeal?: true
    salesCount?: true
  }

  export type ProductMaxAggregateInputType = {
    id?: true
    name?: true
    sku?: true
    category?: true
    subCategory?: true
    stock?: true
    criticalLimit?: true
    price?: true
    oldPrice?: true
    list_price?: true
    sale_price?: true
    discount_start_date?: true
    discount_end_date?: true
    stock_quantity?: true
    isCampaignActive?: true
    cartDiscountRate?: true
    cost?: true
    image?: true
    images?: true
    desc?: true
    seoTitle?: true
    seoDesc?: true
    seoKeywords?: true
    videoUrl?: true
    attributes?: true
    isRawMaterial?: true
    rating?: true
    reviews?: true
    isDeleted?: true
    version?: true
    createdAt?: true
    updatedAt?: true
    companyId?: true
    b2b_base_price?: true
    isDeal?: true
    salesCount?: true
  }

  export type ProductCountAggregateInputType = {
    id?: true
    name?: true
    sku?: true
    category?: true
    subCategory?: true
    stock?: true
    criticalLimit?: true
    price?: true
    oldPrice?: true
    list_price?: true
    sale_price?: true
    discount_start_date?: true
    discount_end_date?: true
    stock_quantity?: true
    isCampaignActive?: true
    cartDiscountRate?: true
    cost?: true
    image?: true
    images?: true
    desc?: true
    seoTitle?: true
    seoDesc?: true
    seoKeywords?: true
    videoUrl?: true
    attributes?: true
    isRawMaterial?: true
    rating?: true
    reviews?: true
    isDeleted?: true
    version?: true
    createdAt?: true
    updatedAt?: true
    companyId?: true
    b2b_base_price?: true
    isDeal?: true
    salesCount?: true
    _all?: true
  }

  export type ProductAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Product to aggregate.
     */
    where?: ProductWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Products to fetch.
     */
    orderBy?: ProductOrderByWithRelationInput | ProductOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ProductWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Products from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Products.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Products
    **/
    _count?: true | ProductCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: ProductAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: ProductSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ProductMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ProductMaxAggregateInputType
  }

  export type GetProductAggregateType<T extends ProductAggregateArgs> = {
        [P in keyof T & keyof AggregateProduct]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateProduct[P]>
      : GetScalarType<T[P], AggregateProduct[P]>
  }




  export type ProductGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ProductWhereInput
    orderBy?: ProductOrderByWithAggregationInput | ProductOrderByWithAggregationInput[]
    by: ProductScalarFieldEnum[] | ProductScalarFieldEnum
    having?: ProductScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ProductCountAggregateInputType | true
    _avg?: ProductAvgAggregateInputType
    _sum?: ProductSumAggregateInputType
    _min?: ProductMinAggregateInputType
    _max?: ProductMaxAggregateInputType
  }

  export type ProductGroupByOutputType = {
    id: string
    name: string
    sku: string
    category: string
    subCategory: string | null
    stock: number
    criticalLimit: number
    price: Decimal
    oldPrice: Decimal | null
    list_price: Decimal | null
    sale_price: Decimal | null
    discount_start_date: Date | null
    discount_end_date: Date | null
    stock_quantity: number
    isCampaignActive: boolean
    cartDiscountRate: number
    cost: Decimal
    image: string
    images: string | null
    desc: string
    seoTitle: string | null
    seoDesc: string | null
    seoKeywords: string | null
    videoUrl: string | null
    attributes: string | null
    isRawMaterial: boolean
    rating: number
    reviews: number
    isDeleted: boolean
    version: number
    createdAt: Date
    updatedAt: Date
    companyId: string | null
    b2b_base_price: Decimal | null
    isDeal: boolean
    salesCount: number
    _count: ProductCountAggregateOutputType | null
    _avg: ProductAvgAggregateOutputType | null
    _sum: ProductSumAggregateOutputType | null
    _min: ProductMinAggregateOutputType | null
    _max: ProductMaxAggregateOutputType | null
  }

  type GetProductGroupByPayload<T extends ProductGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ProductGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ProductGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ProductGroupByOutputType[P]>
            : GetScalarType<T[P], ProductGroupByOutputType[P]>
        }
      >
    >


  export type ProductSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    sku?: boolean
    category?: boolean
    subCategory?: boolean
    stock?: boolean
    criticalLimit?: boolean
    price?: boolean
    oldPrice?: boolean
    list_price?: boolean
    sale_price?: boolean
    discount_start_date?: boolean
    discount_end_date?: boolean
    stock_quantity?: boolean
    isCampaignActive?: boolean
    cartDiscountRate?: boolean
    cost?: boolean
    image?: boolean
    images?: boolean
    desc?: boolean
    seoTitle?: boolean
    seoDesc?: boolean
    seoKeywords?: boolean
    videoUrl?: boolean
    attributes?: boolean
    isRawMaterial?: boolean
    rating?: boolean
    reviews?: boolean
    isDeleted?: boolean
    version?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    companyId?: boolean
    b2b_base_price?: boolean
    isDeal?: boolean
    salesCount?: boolean
  }, ExtArgs["result"]["product"]>

  export type ProductSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    sku?: boolean
    category?: boolean
    subCategory?: boolean
    stock?: boolean
    criticalLimit?: boolean
    price?: boolean
    oldPrice?: boolean
    list_price?: boolean
    sale_price?: boolean
    discount_start_date?: boolean
    discount_end_date?: boolean
    stock_quantity?: boolean
    isCampaignActive?: boolean
    cartDiscountRate?: boolean
    cost?: boolean
    image?: boolean
    images?: boolean
    desc?: boolean
    seoTitle?: boolean
    seoDesc?: boolean
    seoKeywords?: boolean
    videoUrl?: boolean
    attributes?: boolean
    isRawMaterial?: boolean
    rating?: boolean
    reviews?: boolean
    isDeleted?: boolean
    version?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    companyId?: boolean
    b2b_base_price?: boolean
    isDeal?: boolean
    salesCount?: boolean
  }, ExtArgs["result"]["product"]>

  export type ProductSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    sku?: boolean
    category?: boolean
    subCategory?: boolean
    stock?: boolean
    criticalLimit?: boolean
    price?: boolean
    oldPrice?: boolean
    list_price?: boolean
    sale_price?: boolean
    discount_start_date?: boolean
    discount_end_date?: boolean
    stock_quantity?: boolean
    isCampaignActive?: boolean
    cartDiscountRate?: boolean
    cost?: boolean
    image?: boolean
    images?: boolean
    desc?: boolean
    seoTitle?: boolean
    seoDesc?: boolean
    seoKeywords?: boolean
    videoUrl?: boolean
    attributes?: boolean
    isRawMaterial?: boolean
    rating?: boolean
    reviews?: boolean
    isDeleted?: boolean
    version?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    companyId?: boolean
    b2b_base_price?: boolean
    isDeal?: boolean
    salesCount?: boolean
  }, ExtArgs["result"]["product"]>

  export type ProductSelectScalar = {
    id?: boolean
    name?: boolean
    sku?: boolean
    category?: boolean
    subCategory?: boolean
    stock?: boolean
    criticalLimit?: boolean
    price?: boolean
    oldPrice?: boolean
    list_price?: boolean
    sale_price?: boolean
    discount_start_date?: boolean
    discount_end_date?: boolean
    stock_quantity?: boolean
    isCampaignActive?: boolean
    cartDiscountRate?: boolean
    cost?: boolean
    image?: boolean
    images?: boolean
    desc?: boolean
    seoTitle?: boolean
    seoDesc?: boolean
    seoKeywords?: boolean
    videoUrl?: boolean
    attributes?: boolean
    isRawMaterial?: boolean
    rating?: boolean
    reviews?: boolean
    isDeleted?: boolean
    version?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    companyId?: boolean
    b2b_base_price?: boolean
    isDeal?: boolean
    salesCount?: boolean
  }

  export type ProductOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "name" | "sku" | "category" | "subCategory" | "stock" | "criticalLimit" | "price" | "oldPrice" | "list_price" | "sale_price" | "discount_start_date" | "discount_end_date" | "stock_quantity" | "isCampaignActive" | "cartDiscountRate" | "cost" | "image" | "images" | "desc" | "seoTitle" | "seoDesc" | "seoKeywords" | "videoUrl" | "attributes" | "isRawMaterial" | "rating" | "reviews" | "isDeleted" | "version" | "createdAt" | "updatedAt" | "companyId" | "b2b_base_price" | "isDeal" | "salesCount", ExtArgs["result"]["product"]>

  export type $ProductPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Product"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      name: string
      sku: string
      category: string
      subCategory: string | null
      stock: number
      criticalLimit: number
      price: Prisma.Decimal
      oldPrice: Prisma.Decimal | null
      list_price: Prisma.Decimal | null
      sale_price: Prisma.Decimal | null
      discount_start_date: Date | null
      discount_end_date: Date | null
      stock_quantity: number
      isCampaignActive: boolean
      cartDiscountRate: number
      cost: Prisma.Decimal
      image: string
      images: string | null
      desc: string
      seoTitle: string | null
      seoDesc: string | null
      seoKeywords: string | null
      videoUrl: string | null
      attributes: string | null
      isRawMaterial: boolean
      rating: number
      reviews: number
      isDeleted: boolean
      version: number
      createdAt: Date
      updatedAt: Date
      companyId: string | null
      b2b_base_price: Prisma.Decimal | null
      isDeal: boolean
      salesCount: number
    }, ExtArgs["result"]["product"]>
    composites: {}
  }

  type ProductGetPayload<S extends boolean | null | undefined | ProductDefaultArgs> = $Result.GetResult<Prisma.$ProductPayload, S>

  type ProductCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<ProductFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: ProductCountAggregateInputType | true
    }

  export interface ProductDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Product'], meta: { name: 'Product' } }
    /**
     * Find zero or one Product that matches the filter.
     * @param {ProductFindUniqueArgs} args - Arguments to find a Product
     * @example
     * // Get one Product
     * const product = await prisma.product.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ProductFindUniqueArgs>(args: SelectSubset<T, ProductFindUniqueArgs<ExtArgs>>): Prisma__ProductClient<$Result.GetResult<Prisma.$ProductPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Product that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ProductFindUniqueOrThrowArgs} args - Arguments to find a Product
     * @example
     * // Get one Product
     * const product = await prisma.product.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ProductFindUniqueOrThrowArgs>(args: SelectSubset<T, ProductFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ProductClient<$Result.GetResult<Prisma.$ProductPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Product that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProductFindFirstArgs} args - Arguments to find a Product
     * @example
     * // Get one Product
     * const product = await prisma.product.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ProductFindFirstArgs>(args?: SelectSubset<T, ProductFindFirstArgs<ExtArgs>>): Prisma__ProductClient<$Result.GetResult<Prisma.$ProductPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Product that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProductFindFirstOrThrowArgs} args - Arguments to find a Product
     * @example
     * // Get one Product
     * const product = await prisma.product.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ProductFindFirstOrThrowArgs>(args?: SelectSubset<T, ProductFindFirstOrThrowArgs<ExtArgs>>): Prisma__ProductClient<$Result.GetResult<Prisma.$ProductPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Products that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProductFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Products
     * const products = await prisma.product.findMany()
     * 
     * // Get first 10 Products
     * const products = await prisma.product.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const productWithIdOnly = await prisma.product.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ProductFindManyArgs>(args?: SelectSubset<T, ProductFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ProductPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Product.
     * @param {ProductCreateArgs} args - Arguments to create a Product.
     * @example
     * // Create one Product
     * const Product = await prisma.product.create({
     *   data: {
     *     // ... data to create a Product
     *   }
     * })
     * 
     */
    create<T extends ProductCreateArgs>(args: SelectSubset<T, ProductCreateArgs<ExtArgs>>): Prisma__ProductClient<$Result.GetResult<Prisma.$ProductPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Products.
     * @param {ProductCreateManyArgs} args - Arguments to create many Products.
     * @example
     * // Create many Products
     * const product = await prisma.product.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ProductCreateManyArgs>(args?: SelectSubset<T, ProductCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Products and returns the data saved in the database.
     * @param {ProductCreateManyAndReturnArgs} args - Arguments to create many Products.
     * @example
     * // Create many Products
     * const product = await prisma.product.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Products and only return the `id`
     * const productWithIdOnly = await prisma.product.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ProductCreateManyAndReturnArgs>(args?: SelectSubset<T, ProductCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ProductPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Product.
     * @param {ProductDeleteArgs} args - Arguments to delete one Product.
     * @example
     * // Delete one Product
     * const Product = await prisma.product.delete({
     *   where: {
     *     // ... filter to delete one Product
     *   }
     * })
     * 
     */
    delete<T extends ProductDeleteArgs>(args: SelectSubset<T, ProductDeleteArgs<ExtArgs>>): Prisma__ProductClient<$Result.GetResult<Prisma.$ProductPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Product.
     * @param {ProductUpdateArgs} args - Arguments to update one Product.
     * @example
     * // Update one Product
     * const product = await prisma.product.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ProductUpdateArgs>(args: SelectSubset<T, ProductUpdateArgs<ExtArgs>>): Prisma__ProductClient<$Result.GetResult<Prisma.$ProductPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Products.
     * @param {ProductDeleteManyArgs} args - Arguments to filter Products to delete.
     * @example
     * // Delete a few Products
     * const { count } = await prisma.product.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ProductDeleteManyArgs>(args?: SelectSubset<T, ProductDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Products.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProductUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Products
     * const product = await prisma.product.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ProductUpdateManyArgs>(args: SelectSubset<T, ProductUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Products and returns the data updated in the database.
     * @param {ProductUpdateManyAndReturnArgs} args - Arguments to update many Products.
     * @example
     * // Update many Products
     * const product = await prisma.product.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Products and only return the `id`
     * const productWithIdOnly = await prisma.product.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends ProductUpdateManyAndReturnArgs>(args: SelectSubset<T, ProductUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ProductPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Product.
     * @param {ProductUpsertArgs} args - Arguments to update or create a Product.
     * @example
     * // Update or create a Product
     * const product = await prisma.product.upsert({
     *   create: {
     *     // ... data to create a Product
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Product we want to update
     *   }
     * })
     */
    upsert<T extends ProductUpsertArgs>(args: SelectSubset<T, ProductUpsertArgs<ExtArgs>>): Prisma__ProductClient<$Result.GetResult<Prisma.$ProductPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Products.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProductCountArgs} args - Arguments to filter Products to count.
     * @example
     * // Count the number of Products
     * const count = await prisma.product.count({
     *   where: {
     *     // ... the filter for the Products we want to count
     *   }
     * })
    **/
    count<T extends ProductCountArgs>(
      args?: Subset<T, ProductCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ProductCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Product.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProductAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ProductAggregateArgs>(args: Subset<T, ProductAggregateArgs>): Prisma.PrismaPromise<GetProductAggregateType<T>>

    /**
     * Group by Product.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProductGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ProductGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ProductGroupByArgs['orderBy'] }
        : { orderBy?: ProductGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ProductGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetProductGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Product model
   */
  readonly fields: ProductFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Product.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ProductClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Product model
   */
  interface ProductFieldRefs {
    readonly id: FieldRef<"Product", 'String'>
    readonly name: FieldRef<"Product", 'String'>
    readonly sku: FieldRef<"Product", 'String'>
    readonly category: FieldRef<"Product", 'String'>
    readonly subCategory: FieldRef<"Product", 'String'>
    readonly stock: FieldRef<"Product", 'Int'>
    readonly criticalLimit: FieldRef<"Product", 'Int'>
    readonly price: FieldRef<"Product", 'Decimal'>
    readonly oldPrice: FieldRef<"Product", 'Decimal'>
    readonly list_price: FieldRef<"Product", 'Decimal'>
    readonly sale_price: FieldRef<"Product", 'Decimal'>
    readonly discount_start_date: FieldRef<"Product", 'DateTime'>
    readonly discount_end_date: FieldRef<"Product", 'DateTime'>
    readonly stock_quantity: FieldRef<"Product", 'Int'>
    readonly isCampaignActive: FieldRef<"Product", 'Boolean'>
    readonly cartDiscountRate: FieldRef<"Product", 'Float'>
    readonly cost: FieldRef<"Product", 'Decimal'>
    readonly image: FieldRef<"Product", 'String'>
    readonly images: FieldRef<"Product", 'String'>
    readonly desc: FieldRef<"Product", 'String'>
    readonly seoTitle: FieldRef<"Product", 'String'>
    readonly seoDesc: FieldRef<"Product", 'String'>
    readonly seoKeywords: FieldRef<"Product", 'String'>
    readonly videoUrl: FieldRef<"Product", 'String'>
    readonly attributes: FieldRef<"Product", 'String'>
    readonly isRawMaterial: FieldRef<"Product", 'Boolean'>
    readonly rating: FieldRef<"Product", 'Float'>
    readonly reviews: FieldRef<"Product", 'Int'>
    readonly isDeleted: FieldRef<"Product", 'Boolean'>
    readonly version: FieldRef<"Product", 'Int'>
    readonly createdAt: FieldRef<"Product", 'DateTime'>
    readonly updatedAt: FieldRef<"Product", 'DateTime'>
    readonly companyId: FieldRef<"Product", 'String'>
    readonly b2b_base_price: FieldRef<"Product", 'Decimal'>
    readonly isDeal: FieldRef<"Product", 'Boolean'>
    readonly salesCount: FieldRef<"Product", 'Int'>
  }
    

  // Custom InputTypes
  /**
   * Product findUnique
   */
  export type ProductFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Product
     */
    select?: ProductSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Product
     */
    omit?: ProductOmit<ExtArgs> | null
    /**
     * Filter, which Product to fetch.
     */
    where: ProductWhereUniqueInput
  }

  /**
   * Product findUniqueOrThrow
   */
  export type ProductFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Product
     */
    select?: ProductSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Product
     */
    omit?: ProductOmit<ExtArgs> | null
    /**
     * Filter, which Product to fetch.
     */
    where: ProductWhereUniqueInput
  }

  /**
   * Product findFirst
   */
  export type ProductFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Product
     */
    select?: ProductSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Product
     */
    omit?: ProductOmit<ExtArgs> | null
    /**
     * Filter, which Product to fetch.
     */
    where?: ProductWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Products to fetch.
     */
    orderBy?: ProductOrderByWithRelationInput | ProductOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Products.
     */
    cursor?: ProductWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Products from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Products.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Products.
     */
    distinct?: ProductScalarFieldEnum | ProductScalarFieldEnum[]
  }

  /**
   * Product findFirstOrThrow
   */
  export type ProductFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Product
     */
    select?: ProductSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Product
     */
    omit?: ProductOmit<ExtArgs> | null
    /**
     * Filter, which Product to fetch.
     */
    where?: ProductWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Products to fetch.
     */
    orderBy?: ProductOrderByWithRelationInput | ProductOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Products.
     */
    cursor?: ProductWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Products from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Products.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Products.
     */
    distinct?: ProductScalarFieldEnum | ProductScalarFieldEnum[]
  }

  /**
   * Product findMany
   */
  export type ProductFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Product
     */
    select?: ProductSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Product
     */
    omit?: ProductOmit<ExtArgs> | null
    /**
     * Filter, which Products to fetch.
     */
    where?: ProductWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Products to fetch.
     */
    orderBy?: ProductOrderByWithRelationInput | ProductOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Products.
     */
    cursor?: ProductWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Products from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Products.
     */
    skip?: number
    distinct?: ProductScalarFieldEnum | ProductScalarFieldEnum[]
  }

  /**
   * Product create
   */
  export type ProductCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Product
     */
    select?: ProductSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Product
     */
    omit?: ProductOmit<ExtArgs> | null
    /**
     * The data needed to create a Product.
     */
    data: XOR<ProductCreateInput, ProductUncheckedCreateInput>
  }

  /**
   * Product createMany
   */
  export type ProductCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Products.
     */
    data: ProductCreateManyInput | ProductCreateManyInput[]
  }

  /**
   * Product createManyAndReturn
   */
  export type ProductCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Product
     */
    select?: ProductSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Product
     */
    omit?: ProductOmit<ExtArgs> | null
    /**
     * The data used to create many Products.
     */
    data: ProductCreateManyInput | ProductCreateManyInput[]
  }

  /**
   * Product update
   */
  export type ProductUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Product
     */
    select?: ProductSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Product
     */
    omit?: ProductOmit<ExtArgs> | null
    /**
     * The data needed to update a Product.
     */
    data: XOR<ProductUpdateInput, ProductUncheckedUpdateInput>
    /**
     * Choose, which Product to update.
     */
    where: ProductWhereUniqueInput
  }

  /**
   * Product updateMany
   */
  export type ProductUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Products.
     */
    data: XOR<ProductUpdateManyMutationInput, ProductUncheckedUpdateManyInput>
    /**
     * Filter which Products to update
     */
    where?: ProductWhereInput
    /**
     * Limit how many Products to update.
     */
    limit?: number
  }

  /**
   * Product updateManyAndReturn
   */
  export type ProductUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Product
     */
    select?: ProductSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Product
     */
    omit?: ProductOmit<ExtArgs> | null
    /**
     * The data used to update Products.
     */
    data: XOR<ProductUpdateManyMutationInput, ProductUncheckedUpdateManyInput>
    /**
     * Filter which Products to update
     */
    where?: ProductWhereInput
    /**
     * Limit how many Products to update.
     */
    limit?: number
  }

  /**
   * Product upsert
   */
  export type ProductUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Product
     */
    select?: ProductSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Product
     */
    omit?: ProductOmit<ExtArgs> | null
    /**
     * The filter to search for the Product to update in case it exists.
     */
    where: ProductWhereUniqueInput
    /**
     * In case the Product found by the `where` argument doesn't exist, create a new Product with this data.
     */
    create: XOR<ProductCreateInput, ProductUncheckedCreateInput>
    /**
     * In case the Product was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ProductUpdateInput, ProductUncheckedUpdateInput>
  }

  /**
   * Product delete
   */
  export type ProductDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Product
     */
    select?: ProductSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Product
     */
    omit?: ProductOmit<ExtArgs> | null
    /**
     * Filter which Product to delete.
     */
    where: ProductWhereUniqueInput
  }

  /**
   * Product deleteMany
   */
  export type ProductDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Products to delete
     */
    where?: ProductWhereInput
    /**
     * Limit how many Products to delete.
     */
    limit?: number
  }

  /**
   * Product without action
   */
  export type ProductDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Product
     */
    select?: ProductSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Product
     */
    omit?: ProductOmit<ExtArgs> | null
  }


  /**
   * Model CurrentAccount
   */

  export type AggregateCurrentAccount = {
    _count: CurrentAccountCountAggregateOutputType | null
    _avg: CurrentAccountAvgAggregateOutputType | null
    _sum: CurrentAccountSumAggregateOutputType | null
    _min: CurrentAccountMinAggregateOutputType | null
    _max: CurrentAccountMaxAggregateOutputType | null
  }

  export type CurrentAccountAvgAggregateOutputType = {
    balance: Decimal | null
    riskLimit: Decimal | null
  }

  export type CurrentAccountSumAggregateOutputType = {
    balance: Decimal | null
    riskLimit: Decimal | null
  }

  export type CurrentAccountMinAggregateOutputType = {
    id: string | null
    name: string | null
    type: string | null
    taxId: string | null
    taxOffice: string | null
    phone: string | null
    email: string | null
    address: string | null
    balance: Decimal | null
    dealerGroup: string | null
    priceGroup: string | null
    riskLimit: Decimal | null
    notes: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type CurrentAccountMaxAggregateOutputType = {
    id: string | null
    name: string | null
    type: string | null
    taxId: string | null
    taxOffice: string | null
    phone: string | null
    email: string | null
    address: string | null
    balance: Decimal | null
    dealerGroup: string | null
    priceGroup: string | null
    riskLimit: Decimal | null
    notes: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type CurrentAccountCountAggregateOutputType = {
    id: number
    name: number
    type: number
    taxId: number
    taxOffice: number
    phone: number
    email: number
    address: number
    balance: number
    dealerGroup: number
    priceGroup: number
    riskLimit: number
    notes: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type CurrentAccountAvgAggregateInputType = {
    balance?: true
    riskLimit?: true
  }

  export type CurrentAccountSumAggregateInputType = {
    balance?: true
    riskLimit?: true
  }

  export type CurrentAccountMinAggregateInputType = {
    id?: true
    name?: true
    type?: true
    taxId?: true
    taxOffice?: true
    phone?: true
    email?: true
    address?: true
    balance?: true
    dealerGroup?: true
    priceGroup?: true
    riskLimit?: true
    notes?: true
    createdAt?: true
    updatedAt?: true
  }

  export type CurrentAccountMaxAggregateInputType = {
    id?: true
    name?: true
    type?: true
    taxId?: true
    taxOffice?: true
    phone?: true
    email?: true
    address?: true
    balance?: true
    dealerGroup?: true
    priceGroup?: true
    riskLimit?: true
    notes?: true
    createdAt?: true
    updatedAt?: true
  }

  export type CurrentAccountCountAggregateInputType = {
    id?: true
    name?: true
    type?: true
    taxId?: true
    taxOffice?: true
    phone?: true
    email?: true
    address?: true
    balance?: true
    dealerGroup?: true
    priceGroup?: true
    riskLimit?: true
    notes?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type CurrentAccountAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which CurrentAccount to aggregate.
     */
    where?: CurrentAccountWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CurrentAccounts to fetch.
     */
    orderBy?: CurrentAccountOrderByWithRelationInput | CurrentAccountOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: CurrentAccountWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CurrentAccounts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CurrentAccounts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned CurrentAccounts
    **/
    _count?: true | CurrentAccountCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: CurrentAccountAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: CurrentAccountSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: CurrentAccountMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: CurrentAccountMaxAggregateInputType
  }

  export type GetCurrentAccountAggregateType<T extends CurrentAccountAggregateArgs> = {
        [P in keyof T & keyof AggregateCurrentAccount]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateCurrentAccount[P]>
      : GetScalarType<T[P], AggregateCurrentAccount[P]>
  }




  export type CurrentAccountGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CurrentAccountWhereInput
    orderBy?: CurrentAccountOrderByWithAggregationInput | CurrentAccountOrderByWithAggregationInput[]
    by: CurrentAccountScalarFieldEnum[] | CurrentAccountScalarFieldEnum
    having?: CurrentAccountScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: CurrentAccountCountAggregateInputType | true
    _avg?: CurrentAccountAvgAggregateInputType
    _sum?: CurrentAccountSumAggregateInputType
    _min?: CurrentAccountMinAggregateInputType
    _max?: CurrentAccountMaxAggregateInputType
  }

  export type CurrentAccountGroupByOutputType = {
    id: string
    name: string
    type: string
    taxId: string | null
    taxOffice: string | null
    phone: string | null
    email: string | null
    address: string | null
    balance: Decimal
    dealerGroup: string | null
    priceGroup: string | null
    riskLimit: Decimal | null
    notes: string | null
    createdAt: Date
    updatedAt: Date
    _count: CurrentAccountCountAggregateOutputType | null
    _avg: CurrentAccountAvgAggregateOutputType | null
    _sum: CurrentAccountSumAggregateOutputType | null
    _min: CurrentAccountMinAggregateOutputType | null
    _max: CurrentAccountMaxAggregateOutputType | null
  }

  type GetCurrentAccountGroupByPayload<T extends CurrentAccountGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<CurrentAccountGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof CurrentAccountGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], CurrentAccountGroupByOutputType[P]>
            : GetScalarType<T[P], CurrentAccountGroupByOutputType[P]>
        }
      >
    >


  export type CurrentAccountSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    type?: boolean
    taxId?: boolean
    taxOffice?: boolean
    phone?: boolean
    email?: boolean
    address?: boolean
    balance?: boolean
    dealerGroup?: boolean
    priceGroup?: boolean
    riskLimit?: boolean
    notes?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["currentAccount"]>

  export type CurrentAccountSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    type?: boolean
    taxId?: boolean
    taxOffice?: boolean
    phone?: boolean
    email?: boolean
    address?: boolean
    balance?: boolean
    dealerGroup?: boolean
    priceGroup?: boolean
    riskLimit?: boolean
    notes?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["currentAccount"]>

  export type CurrentAccountSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    type?: boolean
    taxId?: boolean
    taxOffice?: boolean
    phone?: boolean
    email?: boolean
    address?: boolean
    balance?: boolean
    dealerGroup?: boolean
    priceGroup?: boolean
    riskLimit?: boolean
    notes?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["currentAccount"]>

  export type CurrentAccountSelectScalar = {
    id?: boolean
    name?: boolean
    type?: boolean
    taxId?: boolean
    taxOffice?: boolean
    phone?: boolean
    email?: boolean
    address?: boolean
    balance?: boolean
    dealerGroup?: boolean
    priceGroup?: boolean
    riskLimit?: boolean
    notes?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type CurrentAccountOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "name" | "type" | "taxId" | "taxOffice" | "phone" | "email" | "address" | "balance" | "dealerGroup" | "priceGroup" | "riskLimit" | "notes" | "createdAt" | "updatedAt", ExtArgs["result"]["currentAccount"]>

  export type $CurrentAccountPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "CurrentAccount"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      name: string
      type: string
      taxId: string | null
      taxOffice: string | null
      phone: string | null
      email: string | null
      address: string | null
      balance: Prisma.Decimal
      dealerGroup: string | null
      priceGroup: string | null
      riskLimit: Prisma.Decimal | null
      notes: string | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["currentAccount"]>
    composites: {}
  }

  type CurrentAccountGetPayload<S extends boolean | null | undefined | CurrentAccountDefaultArgs> = $Result.GetResult<Prisma.$CurrentAccountPayload, S>

  type CurrentAccountCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<CurrentAccountFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: CurrentAccountCountAggregateInputType | true
    }

  export interface CurrentAccountDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['CurrentAccount'], meta: { name: 'CurrentAccount' } }
    /**
     * Find zero or one CurrentAccount that matches the filter.
     * @param {CurrentAccountFindUniqueArgs} args - Arguments to find a CurrentAccount
     * @example
     * // Get one CurrentAccount
     * const currentAccount = await prisma.currentAccount.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends CurrentAccountFindUniqueArgs>(args: SelectSubset<T, CurrentAccountFindUniqueArgs<ExtArgs>>): Prisma__CurrentAccountClient<$Result.GetResult<Prisma.$CurrentAccountPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one CurrentAccount that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {CurrentAccountFindUniqueOrThrowArgs} args - Arguments to find a CurrentAccount
     * @example
     * // Get one CurrentAccount
     * const currentAccount = await prisma.currentAccount.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends CurrentAccountFindUniqueOrThrowArgs>(args: SelectSubset<T, CurrentAccountFindUniqueOrThrowArgs<ExtArgs>>): Prisma__CurrentAccountClient<$Result.GetResult<Prisma.$CurrentAccountPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first CurrentAccount that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CurrentAccountFindFirstArgs} args - Arguments to find a CurrentAccount
     * @example
     * // Get one CurrentAccount
     * const currentAccount = await prisma.currentAccount.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends CurrentAccountFindFirstArgs>(args?: SelectSubset<T, CurrentAccountFindFirstArgs<ExtArgs>>): Prisma__CurrentAccountClient<$Result.GetResult<Prisma.$CurrentAccountPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first CurrentAccount that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CurrentAccountFindFirstOrThrowArgs} args - Arguments to find a CurrentAccount
     * @example
     * // Get one CurrentAccount
     * const currentAccount = await prisma.currentAccount.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends CurrentAccountFindFirstOrThrowArgs>(args?: SelectSubset<T, CurrentAccountFindFirstOrThrowArgs<ExtArgs>>): Prisma__CurrentAccountClient<$Result.GetResult<Prisma.$CurrentAccountPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more CurrentAccounts that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CurrentAccountFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all CurrentAccounts
     * const currentAccounts = await prisma.currentAccount.findMany()
     * 
     * // Get first 10 CurrentAccounts
     * const currentAccounts = await prisma.currentAccount.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const currentAccountWithIdOnly = await prisma.currentAccount.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends CurrentAccountFindManyArgs>(args?: SelectSubset<T, CurrentAccountFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CurrentAccountPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a CurrentAccount.
     * @param {CurrentAccountCreateArgs} args - Arguments to create a CurrentAccount.
     * @example
     * // Create one CurrentAccount
     * const CurrentAccount = await prisma.currentAccount.create({
     *   data: {
     *     // ... data to create a CurrentAccount
     *   }
     * })
     * 
     */
    create<T extends CurrentAccountCreateArgs>(args: SelectSubset<T, CurrentAccountCreateArgs<ExtArgs>>): Prisma__CurrentAccountClient<$Result.GetResult<Prisma.$CurrentAccountPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many CurrentAccounts.
     * @param {CurrentAccountCreateManyArgs} args - Arguments to create many CurrentAccounts.
     * @example
     * // Create many CurrentAccounts
     * const currentAccount = await prisma.currentAccount.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends CurrentAccountCreateManyArgs>(args?: SelectSubset<T, CurrentAccountCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many CurrentAccounts and returns the data saved in the database.
     * @param {CurrentAccountCreateManyAndReturnArgs} args - Arguments to create many CurrentAccounts.
     * @example
     * // Create many CurrentAccounts
     * const currentAccount = await prisma.currentAccount.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many CurrentAccounts and only return the `id`
     * const currentAccountWithIdOnly = await prisma.currentAccount.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends CurrentAccountCreateManyAndReturnArgs>(args?: SelectSubset<T, CurrentAccountCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CurrentAccountPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a CurrentAccount.
     * @param {CurrentAccountDeleteArgs} args - Arguments to delete one CurrentAccount.
     * @example
     * // Delete one CurrentAccount
     * const CurrentAccount = await prisma.currentAccount.delete({
     *   where: {
     *     // ... filter to delete one CurrentAccount
     *   }
     * })
     * 
     */
    delete<T extends CurrentAccountDeleteArgs>(args: SelectSubset<T, CurrentAccountDeleteArgs<ExtArgs>>): Prisma__CurrentAccountClient<$Result.GetResult<Prisma.$CurrentAccountPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one CurrentAccount.
     * @param {CurrentAccountUpdateArgs} args - Arguments to update one CurrentAccount.
     * @example
     * // Update one CurrentAccount
     * const currentAccount = await prisma.currentAccount.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends CurrentAccountUpdateArgs>(args: SelectSubset<T, CurrentAccountUpdateArgs<ExtArgs>>): Prisma__CurrentAccountClient<$Result.GetResult<Prisma.$CurrentAccountPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more CurrentAccounts.
     * @param {CurrentAccountDeleteManyArgs} args - Arguments to filter CurrentAccounts to delete.
     * @example
     * // Delete a few CurrentAccounts
     * const { count } = await prisma.currentAccount.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends CurrentAccountDeleteManyArgs>(args?: SelectSubset<T, CurrentAccountDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more CurrentAccounts.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CurrentAccountUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many CurrentAccounts
     * const currentAccount = await prisma.currentAccount.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends CurrentAccountUpdateManyArgs>(args: SelectSubset<T, CurrentAccountUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more CurrentAccounts and returns the data updated in the database.
     * @param {CurrentAccountUpdateManyAndReturnArgs} args - Arguments to update many CurrentAccounts.
     * @example
     * // Update many CurrentAccounts
     * const currentAccount = await prisma.currentAccount.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more CurrentAccounts and only return the `id`
     * const currentAccountWithIdOnly = await prisma.currentAccount.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends CurrentAccountUpdateManyAndReturnArgs>(args: SelectSubset<T, CurrentAccountUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CurrentAccountPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one CurrentAccount.
     * @param {CurrentAccountUpsertArgs} args - Arguments to update or create a CurrentAccount.
     * @example
     * // Update or create a CurrentAccount
     * const currentAccount = await prisma.currentAccount.upsert({
     *   create: {
     *     // ... data to create a CurrentAccount
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the CurrentAccount we want to update
     *   }
     * })
     */
    upsert<T extends CurrentAccountUpsertArgs>(args: SelectSubset<T, CurrentAccountUpsertArgs<ExtArgs>>): Prisma__CurrentAccountClient<$Result.GetResult<Prisma.$CurrentAccountPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of CurrentAccounts.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CurrentAccountCountArgs} args - Arguments to filter CurrentAccounts to count.
     * @example
     * // Count the number of CurrentAccounts
     * const count = await prisma.currentAccount.count({
     *   where: {
     *     // ... the filter for the CurrentAccounts we want to count
     *   }
     * })
    **/
    count<T extends CurrentAccountCountArgs>(
      args?: Subset<T, CurrentAccountCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], CurrentAccountCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a CurrentAccount.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CurrentAccountAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends CurrentAccountAggregateArgs>(args: Subset<T, CurrentAccountAggregateArgs>): Prisma.PrismaPromise<GetCurrentAccountAggregateType<T>>

    /**
     * Group by CurrentAccount.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CurrentAccountGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends CurrentAccountGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: CurrentAccountGroupByArgs['orderBy'] }
        : { orderBy?: CurrentAccountGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, CurrentAccountGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetCurrentAccountGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the CurrentAccount model
   */
  readonly fields: CurrentAccountFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for CurrentAccount.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__CurrentAccountClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the CurrentAccount model
   */
  interface CurrentAccountFieldRefs {
    readonly id: FieldRef<"CurrentAccount", 'String'>
    readonly name: FieldRef<"CurrentAccount", 'String'>
    readonly type: FieldRef<"CurrentAccount", 'String'>
    readonly taxId: FieldRef<"CurrentAccount", 'String'>
    readonly taxOffice: FieldRef<"CurrentAccount", 'String'>
    readonly phone: FieldRef<"CurrentAccount", 'String'>
    readonly email: FieldRef<"CurrentAccount", 'String'>
    readonly address: FieldRef<"CurrentAccount", 'String'>
    readonly balance: FieldRef<"CurrentAccount", 'Decimal'>
    readonly dealerGroup: FieldRef<"CurrentAccount", 'String'>
    readonly priceGroup: FieldRef<"CurrentAccount", 'String'>
    readonly riskLimit: FieldRef<"CurrentAccount", 'Decimal'>
    readonly notes: FieldRef<"CurrentAccount", 'String'>
    readonly createdAt: FieldRef<"CurrentAccount", 'DateTime'>
    readonly updatedAt: FieldRef<"CurrentAccount", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * CurrentAccount findUnique
   */
  export type CurrentAccountFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CurrentAccount
     */
    select?: CurrentAccountSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CurrentAccount
     */
    omit?: CurrentAccountOmit<ExtArgs> | null
    /**
     * Filter, which CurrentAccount to fetch.
     */
    where: CurrentAccountWhereUniqueInput
  }

  /**
   * CurrentAccount findUniqueOrThrow
   */
  export type CurrentAccountFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CurrentAccount
     */
    select?: CurrentAccountSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CurrentAccount
     */
    omit?: CurrentAccountOmit<ExtArgs> | null
    /**
     * Filter, which CurrentAccount to fetch.
     */
    where: CurrentAccountWhereUniqueInput
  }

  /**
   * CurrentAccount findFirst
   */
  export type CurrentAccountFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CurrentAccount
     */
    select?: CurrentAccountSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CurrentAccount
     */
    omit?: CurrentAccountOmit<ExtArgs> | null
    /**
     * Filter, which CurrentAccount to fetch.
     */
    where?: CurrentAccountWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CurrentAccounts to fetch.
     */
    orderBy?: CurrentAccountOrderByWithRelationInput | CurrentAccountOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for CurrentAccounts.
     */
    cursor?: CurrentAccountWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CurrentAccounts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CurrentAccounts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of CurrentAccounts.
     */
    distinct?: CurrentAccountScalarFieldEnum | CurrentAccountScalarFieldEnum[]
  }

  /**
   * CurrentAccount findFirstOrThrow
   */
  export type CurrentAccountFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CurrentAccount
     */
    select?: CurrentAccountSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CurrentAccount
     */
    omit?: CurrentAccountOmit<ExtArgs> | null
    /**
     * Filter, which CurrentAccount to fetch.
     */
    where?: CurrentAccountWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CurrentAccounts to fetch.
     */
    orderBy?: CurrentAccountOrderByWithRelationInput | CurrentAccountOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for CurrentAccounts.
     */
    cursor?: CurrentAccountWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CurrentAccounts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CurrentAccounts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of CurrentAccounts.
     */
    distinct?: CurrentAccountScalarFieldEnum | CurrentAccountScalarFieldEnum[]
  }

  /**
   * CurrentAccount findMany
   */
  export type CurrentAccountFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CurrentAccount
     */
    select?: CurrentAccountSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CurrentAccount
     */
    omit?: CurrentAccountOmit<ExtArgs> | null
    /**
     * Filter, which CurrentAccounts to fetch.
     */
    where?: CurrentAccountWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CurrentAccounts to fetch.
     */
    orderBy?: CurrentAccountOrderByWithRelationInput | CurrentAccountOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing CurrentAccounts.
     */
    cursor?: CurrentAccountWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CurrentAccounts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CurrentAccounts.
     */
    skip?: number
    distinct?: CurrentAccountScalarFieldEnum | CurrentAccountScalarFieldEnum[]
  }

  /**
   * CurrentAccount create
   */
  export type CurrentAccountCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CurrentAccount
     */
    select?: CurrentAccountSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CurrentAccount
     */
    omit?: CurrentAccountOmit<ExtArgs> | null
    /**
     * The data needed to create a CurrentAccount.
     */
    data: XOR<CurrentAccountCreateInput, CurrentAccountUncheckedCreateInput>
  }

  /**
   * CurrentAccount createMany
   */
  export type CurrentAccountCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many CurrentAccounts.
     */
    data: CurrentAccountCreateManyInput | CurrentAccountCreateManyInput[]
  }

  /**
   * CurrentAccount createManyAndReturn
   */
  export type CurrentAccountCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CurrentAccount
     */
    select?: CurrentAccountSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the CurrentAccount
     */
    omit?: CurrentAccountOmit<ExtArgs> | null
    /**
     * The data used to create many CurrentAccounts.
     */
    data: CurrentAccountCreateManyInput | CurrentAccountCreateManyInput[]
  }

  /**
   * CurrentAccount update
   */
  export type CurrentAccountUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CurrentAccount
     */
    select?: CurrentAccountSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CurrentAccount
     */
    omit?: CurrentAccountOmit<ExtArgs> | null
    /**
     * The data needed to update a CurrentAccount.
     */
    data: XOR<CurrentAccountUpdateInput, CurrentAccountUncheckedUpdateInput>
    /**
     * Choose, which CurrentAccount to update.
     */
    where: CurrentAccountWhereUniqueInput
  }

  /**
   * CurrentAccount updateMany
   */
  export type CurrentAccountUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update CurrentAccounts.
     */
    data: XOR<CurrentAccountUpdateManyMutationInput, CurrentAccountUncheckedUpdateManyInput>
    /**
     * Filter which CurrentAccounts to update
     */
    where?: CurrentAccountWhereInput
    /**
     * Limit how many CurrentAccounts to update.
     */
    limit?: number
  }

  /**
   * CurrentAccount updateManyAndReturn
   */
  export type CurrentAccountUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CurrentAccount
     */
    select?: CurrentAccountSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the CurrentAccount
     */
    omit?: CurrentAccountOmit<ExtArgs> | null
    /**
     * The data used to update CurrentAccounts.
     */
    data: XOR<CurrentAccountUpdateManyMutationInput, CurrentAccountUncheckedUpdateManyInput>
    /**
     * Filter which CurrentAccounts to update
     */
    where?: CurrentAccountWhereInput
    /**
     * Limit how many CurrentAccounts to update.
     */
    limit?: number
  }

  /**
   * CurrentAccount upsert
   */
  export type CurrentAccountUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CurrentAccount
     */
    select?: CurrentAccountSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CurrentAccount
     */
    omit?: CurrentAccountOmit<ExtArgs> | null
    /**
     * The filter to search for the CurrentAccount to update in case it exists.
     */
    where: CurrentAccountWhereUniqueInput
    /**
     * In case the CurrentAccount found by the `where` argument doesn't exist, create a new CurrentAccount with this data.
     */
    create: XOR<CurrentAccountCreateInput, CurrentAccountUncheckedCreateInput>
    /**
     * In case the CurrentAccount was found with the provided `where` argument, update it with this data.
     */
    update: XOR<CurrentAccountUpdateInput, CurrentAccountUncheckedUpdateInput>
  }

  /**
   * CurrentAccount delete
   */
  export type CurrentAccountDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CurrentAccount
     */
    select?: CurrentAccountSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CurrentAccount
     */
    omit?: CurrentAccountOmit<ExtArgs> | null
    /**
     * Filter which CurrentAccount to delete.
     */
    where: CurrentAccountWhereUniqueInput
  }

  /**
   * CurrentAccount deleteMany
   */
  export type CurrentAccountDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which CurrentAccounts to delete
     */
    where?: CurrentAccountWhereInput
    /**
     * Limit how many CurrentAccounts to delete.
     */
    limit?: number
  }

  /**
   * CurrentAccount without action
   */
  export type CurrentAccountDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CurrentAccount
     */
    select?: CurrentAccountSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CurrentAccount
     */
    omit?: CurrentAccountOmit<ExtArgs> | null
  }


  /**
   * Model CategoryDetail
   */

  export type AggregateCategoryDetail = {
    _count: CategoryDetailCountAggregateOutputType | null
    _min: CategoryDetailMinAggregateOutputType | null
    _max: CategoryDetailMaxAggregateOutputType | null
  }

  export type CategoryDetailMinAggregateOutputType = {
    id: string | null
    name: string | null
    attributes: string | null
    variants: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type CategoryDetailMaxAggregateOutputType = {
    id: string | null
    name: string | null
    attributes: string | null
    variants: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type CategoryDetailCountAggregateOutputType = {
    id: number
    name: number
    attributes: number
    variants: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type CategoryDetailMinAggregateInputType = {
    id?: true
    name?: true
    attributes?: true
    variants?: true
    createdAt?: true
    updatedAt?: true
  }

  export type CategoryDetailMaxAggregateInputType = {
    id?: true
    name?: true
    attributes?: true
    variants?: true
    createdAt?: true
    updatedAt?: true
  }

  export type CategoryDetailCountAggregateInputType = {
    id?: true
    name?: true
    attributes?: true
    variants?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type CategoryDetailAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which CategoryDetail to aggregate.
     */
    where?: CategoryDetailWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CategoryDetails to fetch.
     */
    orderBy?: CategoryDetailOrderByWithRelationInput | CategoryDetailOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: CategoryDetailWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CategoryDetails from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CategoryDetails.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned CategoryDetails
    **/
    _count?: true | CategoryDetailCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: CategoryDetailMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: CategoryDetailMaxAggregateInputType
  }

  export type GetCategoryDetailAggregateType<T extends CategoryDetailAggregateArgs> = {
        [P in keyof T & keyof AggregateCategoryDetail]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateCategoryDetail[P]>
      : GetScalarType<T[P], AggregateCategoryDetail[P]>
  }




  export type CategoryDetailGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CategoryDetailWhereInput
    orderBy?: CategoryDetailOrderByWithAggregationInput | CategoryDetailOrderByWithAggregationInput[]
    by: CategoryDetailScalarFieldEnum[] | CategoryDetailScalarFieldEnum
    having?: CategoryDetailScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: CategoryDetailCountAggregateInputType | true
    _min?: CategoryDetailMinAggregateInputType
    _max?: CategoryDetailMaxAggregateInputType
  }

  export type CategoryDetailGroupByOutputType = {
    id: string
    name: string
    attributes: string | null
    variants: string | null
    createdAt: Date
    updatedAt: Date
    _count: CategoryDetailCountAggregateOutputType | null
    _min: CategoryDetailMinAggregateOutputType | null
    _max: CategoryDetailMaxAggregateOutputType | null
  }

  type GetCategoryDetailGroupByPayload<T extends CategoryDetailGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<CategoryDetailGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof CategoryDetailGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], CategoryDetailGroupByOutputType[P]>
            : GetScalarType<T[P], CategoryDetailGroupByOutputType[P]>
        }
      >
    >


  export type CategoryDetailSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    attributes?: boolean
    variants?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["categoryDetail"]>

  export type CategoryDetailSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    attributes?: boolean
    variants?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["categoryDetail"]>

  export type CategoryDetailSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    attributes?: boolean
    variants?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["categoryDetail"]>

  export type CategoryDetailSelectScalar = {
    id?: boolean
    name?: boolean
    attributes?: boolean
    variants?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type CategoryDetailOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "name" | "attributes" | "variants" | "createdAt" | "updatedAt", ExtArgs["result"]["categoryDetail"]>

  export type $CategoryDetailPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "CategoryDetail"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      name: string
      attributes: string | null
      variants: string | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["categoryDetail"]>
    composites: {}
  }

  type CategoryDetailGetPayload<S extends boolean | null | undefined | CategoryDetailDefaultArgs> = $Result.GetResult<Prisma.$CategoryDetailPayload, S>

  type CategoryDetailCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<CategoryDetailFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: CategoryDetailCountAggregateInputType | true
    }

  export interface CategoryDetailDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['CategoryDetail'], meta: { name: 'CategoryDetail' } }
    /**
     * Find zero or one CategoryDetail that matches the filter.
     * @param {CategoryDetailFindUniqueArgs} args - Arguments to find a CategoryDetail
     * @example
     * // Get one CategoryDetail
     * const categoryDetail = await prisma.categoryDetail.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends CategoryDetailFindUniqueArgs>(args: SelectSubset<T, CategoryDetailFindUniqueArgs<ExtArgs>>): Prisma__CategoryDetailClient<$Result.GetResult<Prisma.$CategoryDetailPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one CategoryDetail that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {CategoryDetailFindUniqueOrThrowArgs} args - Arguments to find a CategoryDetail
     * @example
     * // Get one CategoryDetail
     * const categoryDetail = await prisma.categoryDetail.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends CategoryDetailFindUniqueOrThrowArgs>(args: SelectSubset<T, CategoryDetailFindUniqueOrThrowArgs<ExtArgs>>): Prisma__CategoryDetailClient<$Result.GetResult<Prisma.$CategoryDetailPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first CategoryDetail that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CategoryDetailFindFirstArgs} args - Arguments to find a CategoryDetail
     * @example
     * // Get one CategoryDetail
     * const categoryDetail = await prisma.categoryDetail.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends CategoryDetailFindFirstArgs>(args?: SelectSubset<T, CategoryDetailFindFirstArgs<ExtArgs>>): Prisma__CategoryDetailClient<$Result.GetResult<Prisma.$CategoryDetailPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first CategoryDetail that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CategoryDetailFindFirstOrThrowArgs} args - Arguments to find a CategoryDetail
     * @example
     * // Get one CategoryDetail
     * const categoryDetail = await prisma.categoryDetail.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends CategoryDetailFindFirstOrThrowArgs>(args?: SelectSubset<T, CategoryDetailFindFirstOrThrowArgs<ExtArgs>>): Prisma__CategoryDetailClient<$Result.GetResult<Prisma.$CategoryDetailPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more CategoryDetails that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CategoryDetailFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all CategoryDetails
     * const categoryDetails = await prisma.categoryDetail.findMany()
     * 
     * // Get first 10 CategoryDetails
     * const categoryDetails = await prisma.categoryDetail.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const categoryDetailWithIdOnly = await prisma.categoryDetail.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends CategoryDetailFindManyArgs>(args?: SelectSubset<T, CategoryDetailFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CategoryDetailPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a CategoryDetail.
     * @param {CategoryDetailCreateArgs} args - Arguments to create a CategoryDetail.
     * @example
     * // Create one CategoryDetail
     * const CategoryDetail = await prisma.categoryDetail.create({
     *   data: {
     *     // ... data to create a CategoryDetail
     *   }
     * })
     * 
     */
    create<T extends CategoryDetailCreateArgs>(args: SelectSubset<T, CategoryDetailCreateArgs<ExtArgs>>): Prisma__CategoryDetailClient<$Result.GetResult<Prisma.$CategoryDetailPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many CategoryDetails.
     * @param {CategoryDetailCreateManyArgs} args - Arguments to create many CategoryDetails.
     * @example
     * // Create many CategoryDetails
     * const categoryDetail = await prisma.categoryDetail.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends CategoryDetailCreateManyArgs>(args?: SelectSubset<T, CategoryDetailCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many CategoryDetails and returns the data saved in the database.
     * @param {CategoryDetailCreateManyAndReturnArgs} args - Arguments to create many CategoryDetails.
     * @example
     * // Create many CategoryDetails
     * const categoryDetail = await prisma.categoryDetail.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many CategoryDetails and only return the `id`
     * const categoryDetailWithIdOnly = await prisma.categoryDetail.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends CategoryDetailCreateManyAndReturnArgs>(args?: SelectSubset<T, CategoryDetailCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CategoryDetailPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a CategoryDetail.
     * @param {CategoryDetailDeleteArgs} args - Arguments to delete one CategoryDetail.
     * @example
     * // Delete one CategoryDetail
     * const CategoryDetail = await prisma.categoryDetail.delete({
     *   where: {
     *     // ... filter to delete one CategoryDetail
     *   }
     * })
     * 
     */
    delete<T extends CategoryDetailDeleteArgs>(args: SelectSubset<T, CategoryDetailDeleteArgs<ExtArgs>>): Prisma__CategoryDetailClient<$Result.GetResult<Prisma.$CategoryDetailPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one CategoryDetail.
     * @param {CategoryDetailUpdateArgs} args - Arguments to update one CategoryDetail.
     * @example
     * // Update one CategoryDetail
     * const categoryDetail = await prisma.categoryDetail.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends CategoryDetailUpdateArgs>(args: SelectSubset<T, CategoryDetailUpdateArgs<ExtArgs>>): Prisma__CategoryDetailClient<$Result.GetResult<Prisma.$CategoryDetailPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more CategoryDetails.
     * @param {CategoryDetailDeleteManyArgs} args - Arguments to filter CategoryDetails to delete.
     * @example
     * // Delete a few CategoryDetails
     * const { count } = await prisma.categoryDetail.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends CategoryDetailDeleteManyArgs>(args?: SelectSubset<T, CategoryDetailDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more CategoryDetails.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CategoryDetailUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many CategoryDetails
     * const categoryDetail = await prisma.categoryDetail.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends CategoryDetailUpdateManyArgs>(args: SelectSubset<T, CategoryDetailUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more CategoryDetails and returns the data updated in the database.
     * @param {CategoryDetailUpdateManyAndReturnArgs} args - Arguments to update many CategoryDetails.
     * @example
     * // Update many CategoryDetails
     * const categoryDetail = await prisma.categoryDetail.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more CategoryDetails and only return the `id`
     * const categoryDetailWithIdOnly = await prisma.categoryDetail.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends CategoryDetailUpdateManyAndReturnArgs>(args: SelectSubset<T, CategoryDetailUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CategoryDetailPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one CategoryDetail.
     * @param {CategoryDetailUpsertArgs} args - Arguments to update or create a CategoryDetail.
     * @example
     * // Update or create a CategoryDetail
     * const categoryDetail = await prisma.categoryDetail.upsert({
     *   create: {
     *     // ... data to create a CategoryDetail
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the CategoryDetail we want to update
     *   }
     * })
     */
    upsert<T extends CategoryDetailUpsertArgs>(args: SelectSubset<T, CategoryDetailUpsertArgs<ExtArgs>>): Prisma__CategoryDetailClient<$Result.GetResult<Prisma.$CategoryDetailPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of CategoryDetails.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CategoryDetailCountArgs} args - Arguments to filter CategoryDetails to count.
     * @example
     * // Count the number of CategoryDetails
     * const count = await prisma.categoryDetail.count({
     *   where: {
     *     // ... the filter for the CategoryDetails we want to count
     *   }
     * })
    **/
    count<T extends CategoryDetailCountArgs>(
      args?: Subset<T, CategoryDetailCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], CategoryDetailCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a CategoryDetail.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CategoryDetailAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends CategoryDetailAggregateArgs>(args: Subset<T, CategoryDetailAggregateArgs>): Prisma.PrismaPromise<GetCategoryDetailAggregateType<T>>

    /**
     * Group by CategoryDetail.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CategoryDetailGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends CategoryDetailGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: CategoryDetailGroupByArgs['orderBy'] }
        : { orderBy?: CategoryDetailGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, CategoryDetailGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetCategoryDetailGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the CategoryDetail model
   */
  readonly fields: CategoryDetailFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for CategoryDetail.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__CategoryDetailClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the CategoryDetail model
   */
  interface CategoryDetailFieldRefs {
    readonly id: FieldRef<"CategoryDetail", 'String'>
    readonly name: FieldRef<"CategoryDetail", 'String'>
    readonly attributes: FieldRef<"CategoryDetail", 'String'>
    readonly variants: FieldRef<"CategoryDetail", 'String'>
    readonly createdAt: FieldRef<"CategoryDetail", 'DateTime'>
    readonly updatedAt: FieldRef<"CategoryDetail", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * CategoryDetail findUnique
   */
  export type CategoryDetailFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CategoryDetail
     */
    select?: CategoryDetailSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CategoryDetail
     */
    omit?: CategoryDetailOmit<ExtArgs> | null
    /**
     * Filter, which CategoryDetail to fetch.
     */
    where: CategoryDetailWhereUniqueInput
  }

  /**
   * CategoryDetail findUniqueOrThrow
   */
  export type CategoryDetailFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CategoryDetail
     */
    select?: CategoryDetailSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CategoryDetail
     */
    omit?: CategoryDetailOmit<ExtArgs> | null
    /**
     * Filter, which CategoryDetail to fetch.
     */
    where: CategoryDetailWhereUniqueInput
  }

  /**
   * CategoryDetail findFirst
   */
  export type CategoryDetailFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CategoryDetail
     */
    select?: CategoryDetailSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CategoryDetail
     */
    omit?: CategoryDetailOmit<ExtArgs> | null
    /**
     * Filter, which CategoryDetail to fetch.
     */
    where?: CategoryDetailWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CategoryDetails to fetch.
     */
    orderBy?: CategoryDetailOrderByWithRelationInput | CategoryDetailOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for CategoryDetails.
     */
    cursor?: CategoryDetailWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CategoryDetails from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CategoryDetails.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of CategoryDetails.
     */
    distinct?: CategoryDetailScalarFieldEnum | CategoryDetailScalarFieldEnum[]
  }

  /**
   * CategoryDetail findFirstOrThrow
   */
  export type CategoryDetailFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CategoryDetail
     */
    select?: CategoryDetailSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CategoryDetail
     */
    omit?: CategoryDetailOmit<ExtArgs> | null
    /**
     * Filter, which CategoryDetail to fetch.
     */
    where?: CategoryDetailWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CategoryDetails to fetch.
     */
    orderBy?: CategoryDetailOrderByWithRelationInput | CategoryDetailOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for CategoryDetails.
     */
    cursor?: CategoryDetailWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CategoryDetails from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CategoryDetails.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of CategoryDetails.
     */
    distinct?: CategoryDetailScalarFieldEnum | CategoryDetailScalarFieldEnum[]
  }

  /**
   * CategoryDetail findMany
   */
  export type CategoryDetailFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CategoryDetail
     */
    select?: CategoryDetailSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CategoryDetail
     */
    omit?: CategoryDetailOmit<ExtArgs> | null
    /**
     * Filter, which CategoryDetails to fetch.
     */
    where?: CategoryDetailWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CategoryDetails to fetch.
     */
    orderBy?: CategoryDetailOrderByWithRelationInput | CategoryDetailOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing CategoryDetails.
     */
    cursor?: CategoryDetailWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CategoryDetails from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CategoryDetails.
     */
    skip?: number
    distinct?: CategoryDetailScalarFieldEnum | CategoryDetailScalarFieldEnum[]
  }

  /**
   * CategoryDetail create
   */
  export type CategoryDetailCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CategoryDetail
     */
    select?: CategoryDetailSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CategoryDetail
     */
    omit?: CategoryDetailOmit<ExtArgs> | null
    /**
     * The data needed to create a CategoryDetail.
     */
    data: XOR<CategoryDetailCreateInput, CategoryDetailUncheckedCreateInput>
  }

  /**
   * CategoryDetail createMany
   */
  export type CategoryDetailCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many CategoryDetails.
     */
    data: CategoryDetailCreateManyInput | CategoryDetailCreateManyInput[]
  }

  /**
   * CategoryDetail createManyAndReturn
   */
  export type CategoryDetailCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CategoryDetail
     */
    select?: CategoryDetailSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the CategoryDetail
     */
    omit?: CategoryDetailOmit<ExtArgs> | null
    /**
     * The data used to create many CategoryDetails.
     */
    data: CategoryDetailCreateManyInput | CategoryDetailCreateManyInput[]
  }

  /**
   * CategoryDetail update
   */
  export type CategoryDetailUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CategoryDetail
     */
    select?: CategoryDetailSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CategoryDetail
     */
    omit?: CategoryDetailOmit<ExtArgs> | null
    /**
     * The data needed to update a CategoryDetail.
     */
    data: XOR<CategoryDetailUpdateInput, CategoryDetailUncheckedUpdateInput>
    /**
     * Choose, which CategoryDetail to update.
     */
    where: CategoryDetailWhereUniqueInput
  }

  /**
   * CategoryDetail updateMany
   */
  export type CategoryDetailUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update CategoryDetails.
     */
    data: XOR<CategoryDetailUpdateManyMutationInput, CategoryDetailUncheckedUpdateManyInput>
    /**
     * Filter which CategoryDetails to update
     */
    where?: CategoryDetailWhereInput
    /**
     * Limit how many CategoryDetails to update.
     */
    limit?: number
  }

  /**
   * CategoryDetail updateManyAndReturn
   */
  export type CategoryDetailUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CategoryDetail
     */
    select?: CategoryDetailSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the CategoryDetail
     */
    omit?: CategoryDetailOmit<ExtArgs> | null
    /**
     * The data used to update CategoryDetails.
     */
    data: XOR<CategoryDetailUpdateManyMutationInput, CategoryDetailUncheckedUpdateManyInput>
    /**
     * Filter which CategoryDetails to update
     */
    where?: CategoryDetailWhereInput
    /**
     * Limit how many CategoryDetails to update.
     */
    limit?: number
  }

  /**
   * CategoryDetail upsert
   */
  export type CategoryDetailUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CategoryDetail
     */
    select?: CategoryDetailSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CategoryDetail
     */
    omit?: CategoryDetailOmit<ExtArgs> | null
    /**
     * The filter to search for the CategoryDetail to update in case it exists.
     */
    where: CategoryDetailWhereUniqueInput
    /**
     * In case the CategoryDetail found by the `where` argument doesn't exist, create a new CategoryDetail with this data.
     */
    create: XOR<CategoryDetailCreateInput, CategoryDetailUncheckedCreateInput>
    /**
     * In case the CategoryDetail was found with the provided `where` argument, update it with this data.
     */
    update: XOR<CategoryDetailUpdateInput, CategoryDetailUncheckedUpdateInput>
  }

  /**
   * CategoryDetail delete
   */
  export type CategoryDetailDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CategoryDetail
     */
    select?: CategoryDetailSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CategoryDetail
     */
    omit?: CategoryDetailOmit<ExtArgs> | null
    /**
     * Filter which CategoryDetail to delete.
     */
    where: CategoryDetailWhereUniqueInput
  }

  /**
   * CategoryDetail deleteMany
   */
  export type CategoryDetailDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which CategoryDetails to delete
     */
    where?: CategoryDetailWhereInput
    /**
     * Limit how many CategoryDetails to delete.
     */
    limit?: number
  }

  /**
   * CategoryDetail without action
   */
  export type CategoryDetailDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CategoryDetail
     */
    select?: CategoryDetailSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CategoryDetail
     */
    omit?: CategoryDetailOmit<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const ProductScalarFieldEnum: {
    id: 'id',
    name: 'name',
    sku: 'sku',
    category: 'category',
    subCategory: 'subCategory',
    stock: 'stock',
    criticalLimit: 'criticalLimit',
    price: 'price',
    oldPrice: 'oldPrice',
    list_price: 'list_price',
    sale_price: 'sale_price',
    discount_start_date: 'discount_start_date',
    discount_end_date: 'discount_end_date',
    stock_quantity: 'stock_quantity',
    isCampaignActive: 'isCampaignActive',
    cartDiscountRate: 'cartDiscountRate',
    cost: 'cost',
    image: 'image',
    images: 'images',
    desc: 'desc',
    seoTitle: 'seoTitle',
    seoDesc: 'seoDesc',
    seoKeywords: 'seoKeywords',
    videoUrl: 'videoUrl',
    attributes: 'attributes',
    isRawMaterial: 'isRawMaterial',
    rating: 'rating',
    reviews: 'reviews',
    isDeleted: 'isDeleted',
    version: 'version',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    companyId: 'companyId',
    b2b_base_price: 'b2b_base_price',
    isDeal: 'isDeal',
    salesCount: 'salesCount'
  };

  export type ProductScalarFieldEnum = (typeof ProductScalarFieldEnum)[keyof typeof ProductScalarFieldEnum]


  export const CurrentAccountScalarFieldEnum: {
    id: 'id',
    name: 'name',
    type: 'type',
    taxId: 'taxId',
    taxOffice: 'taxOffice',
    phone: 'phone',
    email: 'email',
    address: 'address',
    balance: 'balance',
    dealerGroup: 'dealerGroup',
    priceGroup: 'priceGroup',
    riskLimit: 'riskLimit',
    notes: 'notes',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type CurrentAccountScalarFieldEnum = (typeof CurrentAccountScalarFieldEnum)[keyof typeof CurrentAccountScalarFieldEnum]


  export const CategoryDetailScalarFieldEnum: {
    id: 'id',
    name: 'name',
    attributes: 'attributes',
    variants: 'variants',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type CategoryDetailScalarFieldEnum = (typeof CategoryDetailScalarFieldEnum)[keyof typeof CategoryDetailScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  /**
   * Field references
   */


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Decimal'
   */
  export type DecimalFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Decimal'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'Boolean'
   */
  export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Boolean'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    
  /**
   * Deep Input Types
   */


  export type ProductWhereInput = {
    AND?: ProductWhereInput | ProductWhereInput[]
    OR?: ProductWhereInput[]
    NOT?: ProductWhereInput | ProductWhereInput[]
    id?: StringFilter<"Product"> | string
    name?: StringFilter<"Product"> | string
    sku?: StringFilter<"Product"> | string
    category?: StringFilter<"Product"> | string
    subCategory?: StringNullableFilter<"Product"> | string | null
    stock?: IntFilter<"Product"> | number
    criticalLimit?: IntFilter<"Product"> | number
    price?: DecimalFilter<"Product"> | Decimal | DecimalJsLike | number | string
    oldPrice?: DecimalNullableFilter<"Product"> | Decimal | DecimalJsLike | number | string | null
    list_price?: DecimalNullableFilter<"Product"> | Decimal | DecimalJsLike | number | string | null
    sale_price?: DecimalNullableFilter<"Product"> | Decimal | DecimalJsLike | number | string | null
    discount_start_date?: DateTimeNullableFilter<"Product"> | Date | string | null
    discount_end_date?: DateTimeNullableFilter<"Product"> | Date | string | null
    stock_quantity?: IntFilter<"Product"> | number
    isCampaignActive?: BoolFilter<"Product"> | boolean
    cartDiscountRate?: FloatFilter<"Product"> | number
    cost?: DecimalFilter<"Product"> | Decimal | DecimalJsLike | number | string
    image?: StringFilter<"Product"> | string
    images?: StringNullableFilter<"Product"> | string | null
    desc?: StringFilter<"Product"> | string
    seoTitle?: StringNullableFilter<"Product"> | string | null
    seoDesc?: StringNullableFilter<"Product"> | string | null
    seoKeywords?: StringNullableFilter<"Product"> | string | null
    videoUrl?: StringNullableFilter<"Product"> | string | null
    attributes?: StringNullableFilter<"Product"> | string | null
    isRawMaterial?: BoolFilter<"Product"> | boolean
    rating?: FloatFilter<"Product"> | number
    reviews?: IntFilter<"Product"> | number
    isDeleted?: BoolFilter<"Product"> | boolean
    version?: IntFilter<"Product"> | number
    createdAt?: DateTimeFilter<"Product"> | Date | string
    updatedAt?: DateTimeFilter<"Product"> | Date | string
    companyId?: StringNullableFilter<"Product"> | string | null
    b2b_base_price?: DecimalNullableFilter<"Product"> | Decimal | DecimalJsLike | number | string | null
    isDeal?: BoolFilter<"Product"> | boolean
    salesCount?: IntFilter<"Product"> | number
  }

  export type ProductOrderByWithRelationInput = {
    id?: SortOrder
    name?: SortOrder
    sku?: SortOrder
    category?: SortOrder
    subCategory?: SortOrderInput | SortOrder
    stock?: SortOrder
    criticalLimit?: SortOrder
    price?: SortOrder
    oldPrice?: SortOrderInput | SortOrder
    list_price?: SortOrderInput | SortOrder
    sale_price?: SortOrderInput | SortOrder
    discount_start_date?: SortOrderInput | SortOrder
    discount_end_date?: SortOrderInput | SortOrder
    stock_quantity?: SortOrder
    isCampaignActive?: SortOrder
    cartDiscountRate?: SortOrder
    cost?: SortOrder
    image?: SortOrder
    images?: SortOrderInput | SortOrder
    desc?: SortOrder
    seoTitle?: SortOrderInput | SortOrder
    seoDesc?: SortOrderInput | SortOrder
    seoKeywords?: SortOrderInput | SortOrder
    videoUrl?: SortOrderInput | SortOrder
    attributes?: SortOrderInput | SortOrder
    isRawMaterial?: SortOrder
    rating?: SortOrder
    reviews?: SortOrder
    isDeleted?: SortOrder
    version?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    companyId?: SortOrderInput | SortOrder
    b2b_base_price?: SortOrderInput | SortOrder
    isDeal?: SortOrder
    salesCount?: SortOrder
  }

  export type ProductWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    sku?: string
    AND?: ProductWhereInput | ProductWhereInput[]
    OR?: ProductWhereInput[]
    NOT?: ProductWhereInput | ProductWhereInput[]
    name?: StringFilter<"Product"> | string
    category?: StringFilter<"Product"> | string
    subCategory?: StringNullableFilter<"Product"> | string | null
    stock?: IntFilter<"Product"> | number
    criticalLimit?: IntFilter<"Product"> | number
    price?: DecimalFilter<"Product"> | Decimal | DecimalJsLike | number | string
    oldPrice?: DecimalNullableFilter<"Product"> | Decimal | DecimalJsLike | number | string | null
    list_price?: DecimalNullableFilter<"Product"> | Decimal | DecimalJsLike | number | string | null
    sale_price?: DecimalNullableFilter<"Product"> | Decimal | DecimalJsLike | number | string | null
    discount_start_date?: DateTimeNullableFilter<"Product"> | Date | string | null
    discount_end_date?: DateTimeNullableFilter<"Product"> | Date | string | null
    stock_quantity?: IntFilter<"Product"> | number
    isCampaignActive?: BoolFilter<"Product"> | boolean
    cartDiscountRate?: FloatFilter<"Product"> | number
    cost?: DecimalFilter<"Product"> | Decimal | DecimalJsLike | number | string
    image?: StringFilter<"Product"> | string
    images?: StringNullableFilter<"Product"> | string | null
    desc?: StringFilter<"Product"> | string
    seoTitle?: StringNullableFilter<"Product"> | string | null
    seoDesc?: StringNullableFilter<"Product"> | string | null
    seoKeywords?: StringNullableFilter<"Product"> | string | null
    videoUrl?: StringNullableFilter<"Product"> | string | null
    attributes?: StringNullableFilter<"Product"> | string | null
    isRawMaterial?: BoolFilter<"Product"> | boolean
    rating?: FloatFilter<"Product"> | number
    reviews?: IntFilter<"Product"> | number
    isDeleted?: BoolFilter<"Product"> | boolean
    version?: IntFilter<"Product"> | number
    createdAt?: DateTimeFilter<"Product"> | Date | string
    updatedAt?: DateTimeFilter<"Product"> | Date | string
    companyId?: StringNullableFilter<"Product"> | string | null
    b2b_base_price?: DecimalNullableFilter<"Product"> | Decimal | DecimalJsLike | number | string | null
    isDeal?: BoolFilter<"Product"> | boolean
    salesCount?: IntFilter<"Product"> | number
  }, "id" | "sku">

  export type ProductOrderByWithAggregationInput = {
    id?: SortOrder
    name?: SortOrder
    sku?: SortOrder
    category?: SortOrder
    subCategory?: SortOrderInput | SortOrder
    stock?: SortOrder
    criticalLimit?: SortOrder
    price?: SortOrder
    oldPrice?: SortOrderInput | SortOrder
    list_price?: SortOrderInput | SortOrder
    sale_price?: SortOrderInput | SortOrder
    discount_start_date?: SortOrderInput | SortOrder
    discount_end_date?: SortOrderInput | SortOrder
    stock_quantity?: SortOrder
    isCampaignActive?: SortOrder
    cartDiscountRate?: SortOrder
    cost?: SortOrder
    image?: SortOrder
    images?: SortOrderInput | SortOrder
    desc?: SortOrder
    seoTitle?: SortOrderInput | SortOrder
    seoDesc?: SortOrderInput | SortOrder
    seoKeywords?: SortOrderInput | SortOrder
    videoUrl?: SortOrderInput | SortOrder
    attributes?: SortOrderInput | SortOrder
    isRawMaterial?: SortOrder
    rating?: SortOrder
    reviews?: SortOrder
    isDeleted?: SortOrder
    version?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    companyId?: SortOrderInput | SortOrder
    b2b_base_price?: SortOrderInput | SortOrder
    isDeal?: SortOrder
    salesCount?: SortOrder
    _count?: ProductCountOrderByAggregateInput
    _avg?: ProductAvgOrderByAggregateInput
    _max?: ProductMaxOrderByAggregateInput
    _min?: ProductMinOrderByAggregateInput
    _sum?: ProductSumOrderByAggregateInput
  }

  export type ProductScalarWhereWithAggregatesInput = {
    AND?: ProductScalarWhereWithAggregatesInput | ProductScalarWhereWithAggregatesInput[]
    OR?: ProductScalarWhereWithAggregatesInput[]
    NOT?: ProductScalarWhereWithAggregatesInput | ProductScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Product"> | string
    name?: StringWithAggregatesFilter<"Product"> | string
    sku?: StringWithAggregatesFilter<"Product"> | string
    category?: StringWithAggregatesFilter<"Product"> | string
    subCategory?: StringNullableWithAggregatesFilter<"Product"> | string | null
    stock?: IntWithAggregatesFilter<"Product"> | number
    criticalLimit?: IntWithAggregatesFilter<"Product"> | number
    price?: DecimalWithAggregatesFilter<"Product"> | Decimal | DecimalJsLike | number | string
    oldPrice?: DecimalNullableWithAggregatesFilter<"Product"> | Decimal | DecimalJsLike | number | string | null
    list_price?: DecimalNullableWithAggregatesFilter<"Product"> | Decimal | DecimalJsLike | number | string | null
    sale_price?: DecimalNullableWithAggregatesFilter<"Product"> | Decimal | DecimalJsLike | number | string | null
    discount_start_date?: DateTimeNullableWithAggregatesFilter<"Product"> | Date | string | null
    discount_end_date?: DateTimeNullableWithAggregatesFilter<"Product"> | Date | string | null
    stock_quantity?: IntWithAggregatesFilter<"Product"> | number
    isCampaignActive?: BoolWithAggregatesFilter<"Product"> | boolean
    cartDiscountRate?: FloatWithAggregatesFilter<"Product"> | number
    cost?: DecimalWithAggregatesFilter<"Product"> | Decimal | DecimalJsLike | number | string
    image?: StringWithAggregatesFilter<"Product"> | string
    images?: StringNullableWithAggregatesFilter<"Product"> | string | null
    desc?: StringWithAggregatesFilter<"Product"> | string
    seoTitle?: StringNullableWithAggregatesFilter<"Product"> | string | null
    seoDesc?: StringNullableWithAggregatesFilter<"Product"> | string | null
    seoKeywords?: StringNullableWithAggregatesFilter<"Product"> | string | null
    videoUrl?: StringNullableWithAggregatesFilter<"Product"> | string | null
    attributes?: StringNullableWithAggregatesFilter<"Product"> | string | null
    isRawMaterial?: BoolWithAggregatesFilter<"Product"> | boolean
    rating?: FloatWithAggregatesFilter<"Product"> | number
    reviews?: IntWithAggregatesFilter<"Product"> | number
    isDeleted?: BoolWithAggregatesFilter<"Product"> | boolean
    version?: IntWithAggregatesFilter<"Product"> | number
    createdAt?: DateTimeWithAggregatesFilter<"Product"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Product"> | Date | string
    companyId?: StringNullableWithAggregatesFilter<"Product"> | string | null
    b2b_base_price?: DecimalNullableWithAggregatesFilter<"Product"> | Decimal | DecimalJsLike | number | string | null
    isDeal?: BoolWithAggregatesFilter<"Product"> | boolean
    salesCount?: IntWithAggregatesFilter<"Product"> | number
  }

  export type CurrentAccountWhereInput = {
    AND?: CurrentAccountWhereInput | CurrentAccountWhereInput[]
    OR?: CurrentAccountWhereInput[]
    NOT?: CurrentAccountWhereInput | CurrentAccountWhereInput[]
    id?: StringFilter<"CurrentAccount"> | string
    name?: StringFilter<"CurrentAccount"> | string
    type?: StringFilter<"CurrentAccount"> | string
    taxId?: StringNullableFilter<"CurrentAccount"> | string | null
    taxOffice?: StringNullableFilter<"CurrentAccount"> | string | null
    phone?: StringNullableFilter<"CurrentAccount"> | string | null
    email?: StringNullableFilter<"CurrentAccount"> | string | null
    address?: StringNullableFilter<"CurrentAccount"> | string | null
    balance?: DecimalFilter<"CurrentAccount"> | Decimal | DecimalJsLike | number | string
    dealerGroup?: StringNullableFilter<"CurrentAccount"> | string | null
    priceGroup?: StringNullableFilter<"CurrentAccount"> | string | null
    riskLimit?: DecimalNullableFilter<"CurrentAccount"> | Decimal | DecimalJsLike | number | string | null
    notes?: StringNullableFilter<"CurrentAccount"> | string | null
    createdAt?: DateTimeFilter<"CurrentAccount"> | Date | string
    updatedAt?: DateTimeFilter<"CurrentAccount"> | Date | string
  }

  export type CurrentAccountOrderByWithRelationInput = {
    id?: SortOrder
    name?: SortOrder
    type?: SortOrder
    taxId?: SortOrderInput | SortOrder
    taxOffice?: SortOrderInput | SortOrder
    phone?: SortOrderInput | SortOrder
    email?: SortOrderInput | SortOrder
    address?: SortOrderInput | SortOrder
    balance?: SortOrder
    dealerGroup?: SortOrderInput | SortOrder
    priceGroup?: SortOrderInput | SortOrder
    riskLimit?: SortOrderInput | SortOrder
    notes?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type CurrentAccountWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    email?: string
    AND?: CurrentAccountWhereInput | CurrentAccountWhereInput[]
    OR?: CurrentAccountWhereInput[]
    NOT?: CurrentAccountWhereInput | CurrentAccountWhereInput[]
    name?: StringFilter<"CurrentAccount"> | string
    type?: StringFilter<"CurrentAccount"> | string
    taxId?: StringNullableFilter<"CurrentAccount"> | string | null
    taxOffice?: StringNullableFilter<"CurrentAccount"> | string | null
    phone?: StringNullableFilter<"CurrentAccount"> | string | null
    address?: StringNullableFilter<"CurrentAccount"> | string | null
    balance?: DecimalFilter<"CurrentAccount"> | Decimal | DecimalJsLike | number | string
    dealerGroup?: StringNullableFilter<"CurrentAccount"> | string | null
    priceGroup?: StringNullableFilter<"CurrentAccount"> | string | null
    riskLimit?: DecimalNullableFilter<"CurrentAccount"> | Decimal | DecimalJsLike | number | string | null
    notes?: StringNullableFilter<"CurrentAccount"> | string | null
    createdAt?: DateTimeFilter<"CurrentAccount"> | Date | string
    updatedAt?: DateTimeFilter<"CurrentAccount"> | Date | string
  }, "id" | "email">

  export type CurrentAccountOrderByWithAggregationInput = {
    id?: SortOrder
    name?: SortOrder
    type?: SortOrder
    taxId?: SortOrderInput | SortOrder
    taxOffice?: SortOrderInput | SortOrder
    phone?: SortOrderInput | SortOrder
    email?: SortOrderInput | SortOrder
    address?: SortOrderInput | SortOrder
    balance?: SortOrder
    dealerGroup?: SortOrderInput | SortOrder
    priceGroup?: SortOrderInput | SortOrder
    riskLimit?: SortOrderInput | SortOrder
    notes?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: CurrentAccountCountOrderByAggregateInput
    _avg?: CurrentAccountAvgOrderByAggregateInput
    _max?: CurrentAccountMaxOrderByAggregateInput
    _min?: CurrentAccountMinOrderByAggregateInput
    _sum?: CurrentAccountSumOrderByAggregateInput
  }

  export type CurrentAccountScalarWhereWithAggregatesInput = {
    AND?: CurrentAccountScalarWhereWithAggregatesInput | CurrentAccountScalarWhereWithAggregatesInput[]
    OR?: CurrentAccountScalarWhereWithAggregatesInput[]
    NOT?: CurrentAccountScalarWhereWithAggregatesInput | CurrentAccountScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"CurrentAccount"> | string
    name?: StringWithAggregatesFilter<"CurrentAccount"> | string
    type?: StringWithAggregatesFilter<"CurrentAccount"> | string
    taxId?: StringNullableWithAggregatesFilter<"CurrentAccount"> | string | null
    taxOffice?: StringNullableWithAggregatesFilter<"CurrentAccount"> | string | null
    phone?: StringNullableWithAggregatesFilter<"CurrentAccount"> | string | null
    email?: StringNullableWithAggregatesFilter<"CurrentAccount"> | string | null
    address?: StringNullableWithAggregatesFilter<"CurrentAccount"> | string | null
    balance?: DecimalWithAggregatesFilter<"CurrentAccount"> | Decimal | DecimalJsLike | number | string
    dealerGroup?: StringNullableWithAggregatesFilter<"CurrentAccount"> | string | null
    priceGroup?: StringNullableWithAggregatesFilter<"CurrentAccount"> | string | null
    riskLimit?: DecimalNullableWithAggregatesFilter<"CurrentAccount"> | Decimal | DecimalJsLike | number | string | null
    notes?: StringNullableWithAggregatesFilter<"CurrentAccount"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"CurrentAccount"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"CurrentAccount"> | Date | string
  }

  export type CategoryDetailWhereInput = {
    AND?: CategoryDetailWhereInput | CategoryDetailWhereInput[]
    OR?: CategoryDetailWhereInput[]
    NOT?: CategoryDetailWhereInput | CategoryDetailWhereInput[]
    id?: StringFilter<"CategoryDetail"> | string
    name?: StringFilter<"CategoryDetail"> | string
    attributes?: StringNullableFilter<"CategoryDetail"> | string | null
    variants?: StringNullableFilter<"CategoryDetail"> | string | null
    createdAt?: DateTimeFilter<"CategoryDetail"> | Date | string
    updatedAt?: DateTimeFilter<"CategoryDetail"> | Date | string
  }

  export type CategoryDetailOrderByWithRelationInput = {
    id?: SortOrder
    name?: SortOrder
    attributes?: SortOrderInput | SortOrder
    variants?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type CategoryDetailWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    name?: string
    AND?: CategoryDetailWhereInput | CategoryDetailWhereInput[]
    OR?: CategoryDetailWhereInput[]
    NOT?: CategoryDetailWhereInput | CategoryDetailWhereInput[]
    attributes?: StringNullableFilter<"CategoryDetail"> | string | null
    variants?: StringNullableFilter<"CategoryDetail"> | string | null
    createdAt?: DateTimeFilter<"CategoryDetail"> | Date | string
    updatedAt?: DateTimeFilter<"CategoryDetail"> | Date | string
  }, "id" | "name">

  export type CategoryDetailOrderByWithAggregationInput = {
    id?: SortOrder
    name?: SortOrder
    attributes?: SortOrderInput | SortOrder
    variants?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: CategoryDetailCountOrderByAggregateInput
    _max?: CategoryDetailMaxOrderByAggregateInput
    _min?: CategoryDetailMinOrderByAggregateInput
  }

  export type CategoryDetailScalarWhereWithAggregatesInput = {
    AND?: CategoryDetailScalarWhereWithAggregatesInput | CategoryDetailScalarWhereWithAggregatesInput[]
    OR?: CategoryDetailScalarWhereWithAggregatesInput[]
    NOT?: CategoryDetailScalarWhereWithAggregatesInput | CategoryDetailScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"CategoryDetail"> | string
    name?: StringWithAggregatesFilter<"CategoryDetail"> | string
    attributes?: StringNullableWithAggregatesFilter<"CategoryDetail"> | string | null
    variants?: StringNullableWithAggregatesFilter<"CategoryDetail"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"CategoryDetail"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"CategoryDetail"> | Date | string
  }

  export type ProductCreateInput = {
    id?: string
    name: string
    sku: string
    category: string
    subCategory?: string | null
    stock?: number
    criticalLimit?: number
    price?: Decimal | DecimalJsLike | number | string
    oldPrice?: Decimal | DecimalJsLike | number | string | null
    list_price?: Decimal | DecimalJsLike | number | string | null
    sale_price?: Decimal | DecimalJsLike | number | string | null
    discount_start_date?: Date | string | null
    discount_end_date?: Date | string | null
    stock_quantity?: number
    isCampaignActive?: boolean
    cartDiscountRate?: number
    cost?: Decimal | DecimalJsLike | number | string
    image: string
    images?: string | null
    desc: string
    seoTitle?: string | null
    seoDesc?: string | null
    seoKeywords?: string | null
    videoUrl?: string | null
    attributes?: string | null
    isRawMaterial?: boolean
    rating?: number
    reviews?: number
    isDeleted?: boolean
    version?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    companyId?: string | null
    b2b_base_price?: Decimal | DecimalJsLike | number | string | null
    isDeal?: boolean
    salesCount?: number
  }

  export type ProductUncheckedCreateInput = {
    id?: string
    name: string
    sku: string
    category: string
    subCategory?: string | null
    stock?: number
    criticalLimit?: number
    price?: Decimal | DecimalJsLike | number | string
    oldPrice?: Decimal | DecimalJsLike | number | string | null
    list_price?: Decimal | DecimalJsLike | number | string | null
    sale_price?: Decimal | DecimalJsLike | number | string | null
    discount_start_date?: Date | string | null
    discount_end_date?: Date | string | null
    stock_quantity?: number
    isCampaignActive?: boolean
    cartDiscountRate?: number
    cost?: Decimal | DecimalJsLike | number | string
    image: string
    images?: string | null
    desc: string
    seoTitle?: string | null
    seoDesc?: string | null
    seoKeywords?: string | null
    videoUrl?: string | null
    attributes?: string | null
    isRawMaterial?: boolean
    rating?: number
    reviews?: number
    isDeleted?: boolean
    version?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    companyId?: string | null
    b2b_base_price?: Decimal | DecimalJsLike | number | string | null
    isDeal?: boolean
    salesCount?: number
  }

  export type ProductUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    sku?: StringFieldUpdateOperationsInput | string
    category?: StringFieldUpdateOperationsInput | string
    subCategory?: NullableStringFieldUpdateOperationsInput | string | null
    stock?: IntFieldUpdateOperationsInput | number
    criticalLimit?: IntFieldUpdateOperationsInput | number
    price?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    oldPrice?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    list_price?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    sale_price?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    discount_start_date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    discount_end_date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    stock_quantity?: IntFieldUpdateOperationsInput | number
    isCampaignActive?: BoolFieldUpdateOperationsInput | boolean
    cartDiscountRate?: FloatFieldUpdateOperationsInput | number
    cost?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    image?: StringFieldUpdateOperationsInput | string
    images?: NullableStringFieldUpdateOperationsInput | string | null
    desc?: StringFieldUpdateOperationsInput | string
    seoTitle?: NullableStringFieldUpdateOperationsInput | string | null
    seoDesc?: NullableStringFieldUpdateOperationsInput | string | null
    seoKeywords?: NullableStringFieldUpdateOperationsInput | string | null
    videoUrl?: NullableStringFieldUpdateOperationsInput | string | null
    attributes?: NullableStringFieldUpdateOperationsInput | string | null
    isRawMaterial?: BoolFieldUpdateOperationsInput | boolean
    rating?: FloatFieldUpdateOperationsInput | number
    reviews?: IntFieldUpdateOperationsInput | number
    isDeleted?: BoolFieldUpdateOperationsInput | boolean
    version?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    companyId?: NullableStringFieldUpdateOperationsInput | string | null
    b2b_base_price?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    isDeal?: BoolFieldUpdateOperationsInput | boolean
    salesCount?: IntFieldUpdateOperationsInput | number
  }

  export type ProductUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    sku?: StringFieldUpdateOperationsInput | string
    category?: StringFieldUpdateOperationsInput | string
    subCategory?: NullableStringFieldUpdateOperationsInput | string | null
    stock?: IntFieldUpdateOperationsInput | number
    criticalLimit?: IntFieldUpdateOperationsInput | number
    price?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    oldPrice?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    list_price?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    sale_price?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    discount_start_date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    discount_end_date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    stock_quantity?: IntFieldUpdateOperationsInput | number
    isCampaignActive?: BoolFieldUpdateOperationsInput | boolean
    cartDiscountRate?: FloatFieldUpdateOperationsInput | number
    cost?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    image?: StringFieldUpdateOperationsInput | string
    images?: NullableStringFieldUpdateOperationsInput | string | null
    desc?: StringFieldUpdateOperationsInput | string
    seoTitle?: NullableStringFieldUpdateOperationsInput | string | null
    seoDesc?: NullableStringFieldUpdateOperationsInput | string | null
    seoKeywords?: NullableStringFieldUpdateOperationsInput | string | null
    videoUrl?: NullableStringFieldUpdateOperationsInput | string | null
    attributes?: NullableStringFieldUpdateOperationsInput | string | null
    isRawMaterial?: BoolFieldUpdateOperationsInput | boolean
    rating?: FloatFieldUpdateOperationsInput | number
    reviews?: IntFieldUpdateOperationsInput | number
    isDeleted?: BoolFieldUpdateOperationsInput | boolean
    version?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    companyId?: NullableStringFieldUpdateOperationsInput | string | null
    b2b_base_price?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    isDeal?: BoolFieldUpdateOperationsInput | boolean
    salesCount?: IntFieldUpdateOperationsInput | number
  }

  export type ProductCreateManyInput = {
    id?: string
    name: string
    sku: string
    category: string
    subCategory?: string | null
    stock?: number
    criticalLimit?: number
    price?: Decimal | DecimalJsLike | number | string
    oldPrice?: Decimal | DecimalJsLike | number | string | null
    list_price?: Decimal | DecimalJsLike | number | string | null
    sale_price?: Decimal | DecimalJsLike | number | string | null
    discount_start_date?: Date | string | null
    discount_end_date?: Date | string | null
    stock_quantity?: number
    isCampaignActive?: boolean
    cartDiscountRate?: number
    cost?: Decimal | DecimalJsLike | number | string
    image: string
    images?: string | null
    desc: string
    seoTitle?: string | null
    seoDesc?: string | null
    seoKeywords?: string | null
    videoUrl?: string | null
    attributes?: string | null
    isRawMaterial?: boolean
    rating?: number
    reviews?: number
    isDeleted?: boolean
    version?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    companyId?: string | null
    b2b_base_price?: Decimal | DecimalJsLike | number | string | null
    isDeal?: boolean
    salesCount?: number
  }

  export type ProductUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    sku?: StringFieldUpdateOperationsInput | string
    category?: StringFieldUpdateOperationsInput | string
    subCategory?: NullableStringFieldUpdateOperationsInput | string | null
    stock?: IntFieldUpdateOperationsInput | number
    criticalLimit?: IntFieldUpdateOperationsInput | number
    price?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    oldPrice?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    list_price?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    sale_price?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    discount_start_date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    discount_end_date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    stock_quantity?: IntFieldUpdateOperationsInput | number
    isCampaignActive?: BoolFieldUpdateOperationsInput | boolean
    cartDiscountRate?: FloatFieldUpdateOperationsInput | number
    cost?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    image?: StringFieldUpdateOperationsInput | string
    images?: NullableStringFieldUpdateOperationsInput | string | null
    desc?: StringFieldUpdateOperationsInput | string
    seoTitle?: NullableStringFieldUpdateOperationsInput | string | null
    seoDesc?: NullableStringFieldUpdateOperationsInput | string | null
    seoKeywords?: NullableStringFieldUpdateOperationsInput | string | null
    videoUrl?: NullableStringFieldUpdateOperationsInput | string | null
    attributes?: NullableStringFieldUpdateOperationsInput | string | null
    isRawMaterial?: BoolFieldUpdateOperationsInput | boolean
    rating?: FloatFieldUpdateOperationsInput | number
    reviews?: IntFieldUpdateOperationsInput | number
    isDeleted?: BoolFieldUpdateOperationsInput | boolean
    version?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    companyId?: NullableStringFieldUpdateOperationsInput | string | null
    b2b_base_price?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    isDeal?: BoolFieldUpdateOperationsInput | boolean
    salesCount?: IntFieldUpdateOperationsInput | number
  }

  export type ProductUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    sku?: StringFieldUpdateOperationsInput | string
    category?: StringFieldUpdateOperationsInput | string
    subCategory?: NullableStringFieldUpdateOperationsInput | string | null
    stock?: IntFieldUpdateOperationsInput | number
    criticalLimit?: IntFieldUpdateOperationsInput | number
    price?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    oldPrice?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    list_price?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    sale_price?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    discount_start_date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    discount_end_date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    stock_quantity?: IntFieldUpdateOperationsInput | number
    isCampaignActive?: BoolFieldUpdateOperationsInput | boolean
    cartDiscountRate?: FloatFieldUpdateOperationsInput | number
    cost?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    image?: StringFieldUpdateOperationsInput | string
    images?: NullableStringFieldUpdateOperationsInput | string | null
    desc?: StringFieldUpdateOperationsInput | string
    seoTitle?: NullableStringFieldUpdateOperationsInput | string | null
    seoDesc?: NullableStringFieldUpdateOperationsInput | string | null
    seoKeywords?: NullableStringFieldUpdateOperationsInput | string | null
    videoUrl?: NullableStringFieldUpdateOperationsInput | string | null
    attributes?: NullableStringFieldUpdateOperationsInput | string | null
    isRawMaterial?: BoolFieldUpdateOperationsInput | boolean
    rating?: FloatFieldUpdateOperationsInput | number
    reviews?: IntFieldUpdateOperationsInput | number
    isDeleted?: BoolFieldUpdateOperationsInput | boolean
    version?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    companyId?: NullableStringFieldUpdateOperationsInput | string | null
    b2b_base_price?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    isDeal?: BoolFieldUpdateOperationsInput | boolean
    salesCount?: IntFieldUpdateOperationsInput | number
  }

  export type CurrentAccountCreateInput = {
    id?: string
    name: string
    type?: string
    taxId?: string | null
    taxOffice?: string | null
    phone?: string | null
    email?: string | null
    address?: string | null
    balance?: Decimal | DecimalJsLike | number | string
    dealerGroup?: string | null
    priceGroup?: string | null
    riskLimit?: Decimal | DecimalJsLike | number | string | null
    notes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type CurrentAccountUncheckedCreateInput = {
    id?: string
    name: string
    type?: string
    taxId?: string | null
    taxOffice?: string | null
    phone?: string | null
    email?: string | null
    address?: string | null
    balance?: Decimal | DecimalJsLike | number | string
    dealerGroup?: string | null
    priceGroup?: string | null
    riskLimit?: Decimal | DecimalJsLike | number | string | null
    notes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type CurrentAccountUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    taxId?: NullableStringFieldUpdateOperationsInput | string | null
    taxOffice?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    address?: NullableStringFieldUpdateOperationsInput | string | null
    balance?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    dealerGroup?: NullableStringFieldUpdateOperationsInput | string | null
    priceGroup?: NullableStringFieldUpdateOperationsInput | string | null
    riskLimit?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CurrentAccountUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    taxId?: NullableStringFieldUpdateOperationsInput | string | null
    taxOffice?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    address?: NullableStringFieldUpdateOperationsInput | string | null
    balance?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    dealerGroup?: NullableStringFieldUpdateOperationsInput | string | null
    priceGroup?: NullableStringFieldUpdateOperationsInput | string | null
    riskLimit?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CurrentAccountCreateManyInput = {
    id?: string
    name: string
    type?: string
    taxId?: string | null
    taxOffice?: string | null
    phone?: string | null
    email?: string | null
    address?: string | null
    balance?: Decimal | DecimalJsLike | number | string
    dealerGroup?: string | null
    priceGroup?: string | null
    riskLimit?: Decimal | DecimalJsLike | number | string | null
    notes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type CurrentAccountUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    taxId?: NullableStringFieldUpdateOperationsInput | string | null
    taxOffice?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    address?: NullableStringFieldUpdateOperationsInput | string | null
    balance?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    dealerGroup?: NullableStringFieldUpdateOperationsInput | string | null
    priceGroup?: NullableStringFieldUpdateOperationsInput | string | null
    riskLimit?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CurrentAccountUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    taxId?: NullableStringFieldUpdateOperationsInput | string | null
    taxOffice?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    address?: NullableStringFieldUpdateOperationsInput | string | null
    balance?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    dealerGroup?: NullableStringFieldUpdateOperationsInput | string | null
    priceGroup?: NullableStringFieldUpdateOperationsInput | string | null
    riskLimit?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CategoryDetailCreateInput = {
    id?: string
    name: string
    attributes?: string | null
    variants?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type CategoryDetailUncheckedCreateInput = {
    id?: string
    name: string
    attributes?: string | null
    variants?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type CategoryDetailUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    attributes?: NullableStringFieldUpdateOperationsInput | string | null
    variants?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CategoryDetailUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    attributes?: NullableStringFieldUpdateOperationsInput | string | null
    variants?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CategoryDetailCreateManyInput = {
    id?: string
    name: string
    attributes?: string | null
    variants?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type CategoryDetailUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    attributes?: NullableStringFieldUpdateOperationsInput | string | null
    variants?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CategoryDetailUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    attributes?: NullableStringFieldUpdateOperationsInput | string | null
    variants?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type IntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type DecimalFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    in?: Decimal[] | DecimalJsLike[] | number[] | string[]
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[]
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string
  }

  export type DecimalNullableFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel> | null
    in?: Decimal[] | DecimalJsLike[] | number[] | string[] | null
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[] | null
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalNullableFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string | null
  }

  export type DateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | null
    notIn?: Date[] | string[] | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type BoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type FloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type ProductCountOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    sku?: SortOrder
    category?: SortOrder
    subCategory?: SortOrder
    stock?: SortOrder
    criticalLimit?: SortOrder
    price?: SortOrder
    oldPrice?: SortOrder
    list_price?: SortOrder
    sale_price?: SortOrder
    discount_start_date?: SortOrder
    discount_end_date?: SortOrder
    stock_quantity?: SortOrder
    isCampaignActive?: SortOrder
    cartDiscountRate?: SortOrder
    cost?: SortOrder
    image?: SortOrder
    images?: SortOrder
    desc?: SortOrder
    seoTitle?: SortOrder
    seoDesc?: SortOrder
    seoKeywords?: SortOrder
    videoUrl?: SortOrder
    attributes?: SortOrder
    isRawMaterial?: SortOrder
    rating?: SortOrder
    reviews?: SortOrder
    isDeleted?: SortOrder
    version?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    companyId?: SortOrder
    b2b_base_price?: SortOrder
    isDeal?: SortOrder
    salesCount?: SortOrder
  }

  export type ProductAvgOrderByAggregateInput = {
    stock?: SortOrder
    criticalLimit?: SortOrder
    price?: SortOrder
    oldPrice?: SortOrder
    list_price?: SortOrder
    sale_price?: SortOrder
    stock_quantity?: SortOrder
    cartDiscountRate?: SortOrder
    cost?: SortOrder
    rating?: SortOrder
    reviews?: SortOrder
    version?: SortOrder
    b2b_base_price?: SortOrder
    salesCount?: SortOrder
  }

  export type ProductMaxOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    sku?: SortOrder
    category?: SortOrder
    subCategory?: SortOrder
    stock?: SortOrder
    criticalLimit?: SortOrder
    price?: SortOrder
    oldPrice?: SortOrder
    list_price?: SortOrder
    sale_price?: SortOrder
    discount_start_date?: SortOrder
    discount_end_date?: SortOrder
    stock_quantity?: SortOrder
    isCampaignActive?: SortOrder
    cartDiscountRate?: SortOrder
    cost?: SortOrder
    image?: SortOrder
    images?: SortOrder
    desc?: SortOrder
    seoTitle?: SortOrder
    seoDesc?: SortOrder
    seoKeywords?: SortOrder
    videoUrl?: SortOrder
    attributes?: SortOrder
    isRawMaterial?: SortOrder
    rating?: SortOrder
    reviews?: SortOrder
    isDeleted?: SortOrder
    version?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    companyId?: SortOrder
    b2b_base_price?: SortOrder
    isDeal?: SortOrder
    salesCount?: SortOrder
  }

  export type ProductMinOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    sku?: SortOrder
    category?: SortOrder
    subCategory?: SortOrder
    stock?: SortOrder
    criticalLimit?: SortOrder
    price?: SortOrder
    oldPrice?: SortOrder
    list_price?: SortOrder
    sale_price?: SortOrder
    discount_start_date?: SortOrder
    discount_end_date?: SortOrder
    stock_quantity?: SortOrder
    isCampaignActive?: SortOrder
    cartDiscountRate?: SortOrder
    cost?: SortOrder
    image?: SortOrder
    images?: SortOrder
    desc?: SortOrder
    seoTitle?: SortOrder
    seoDesc?: SortOrder
    seoKeywords?: SortOrder
    videoUrl?: SortOrder
    attributes?: SortOrder
    isRawMaterial?: SortOrder
    rating?: SortOrder
    reviews?: SortOrder
    isDeleted?: SortOrder
    version?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    companyId?: SortOrder
    b2b_base_price?: SortOrder
    isDeal?: SortOrder
    salesCount?: SortOrder
  }

  export type ProductSumOrderByAggregateInput = {
    stock?: SortOrder
    criticalLimit?: SortOrder
    price?: SortOrder
    oldPrice?: SortOrder
    list_price?: SortOrder
    sale_price?: SortOrder
    stock_quantity?: SortOrder
    cartDiscountRate?: SortOrder
    cost?: SortOrder
    rating?: SortOrder
    reviews?: SortOrder
    version?: SortOrder
    b2b_base_price?: SortOrder
    salesCount?: SortOrder
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type IntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type DecimalWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    in?: Decimal[] | DecimalJsLike[] | number[] | string[]
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[]
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalWithAggregatesFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedDecimalFilter<$PrismaModel>
    _sum?: NestedDecimalFilter<$PrismaModel>
    _min?: NestedDecimalFilter<$PrismaModel>
    _max?: NestedDecimalFilter<$PrismaModel>
  }

  export type DecimalNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel> | null
    in?: Decimal[] | DecimalJsLike[] | number[] | string[] | null
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[] | null
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalNullableWithAggregatesFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedDecimalNullableFilter<$PrismaModel>
    _sum?: NestedDecimalNullableFilter<$PrismaModel>
    _min?: NestedDecimalNullableFilter<$PrismaModel>
    _max?: NestedDecimalNullableFilter<$PrismaModel>
  }

  export type DateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | null
    notIn?: Date[] | string[] | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type BoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type FloatWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedFloatFilter<$PrismaModel>
    _min?: NestedFloatFilter<$PrismaModel>
    _max?: NestedFloatFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type CurrentAccountCountOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    type?: SortOrder
    taxId?: SortOrder
    taxOffice?: SortOrder
    phone?: SortOrder
    email?: SortOrder
    address?: SortOrder
    balance?: SortOrder
    dealerGroup?: SortOrder
    priceGroup?: SortOrder
    riskLimit?: SortOrder
    notes?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type CurrentAccountAvgOrderByAggregateInput = {
    balance?: SortOrder
    riskLimit?: SortOrder
  }

  export type CurrentAccountMaxOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    type?: SortOrder
    taxId?: SortOrder
    taxOffice?: SortOrder
    phone?: SortOrder
    email?: SortOrder
    address?: SortOrder
    balance?: SortOrder
    dealerGroup?: SortOrder
    priceGroup?: SortOrder
    riskLimit?: SortOrder
    notes?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type CurrentAccountMinOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    type?: SortOrder
    taxId?: SortOrder
    taxOffice?: SortOrder
    phone?: SortOrder
    email?: SortOrder
    address?: SortOrder
    balance?: SortOrder
    dealerGroup?: SortOrder
    priceGroup?: SortOrder
    riskLimit?: SortOrder
    notes?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type CurrentAccountSumOrderByAggregateInput = {
    balance?: SortOrder
    riskLimit?: SortOrder
  }

  export type CategoryDetailCountOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    attributes?: SortOrder
    variants?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type CategoryDetailMaxOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    attributes?: SortOrder
    variants?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type CategoryDetailMinOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    attributes?: SortOrder
    variants?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type DecimalFieldUpdateOperationsInput = {
    set?: Decimal | DecimalJsLike | number | string
    increment?: Decimal | DecimalJsLike | number | string
    decrement?: Decimal | DecimalJsLike | number | string
    multiply?: Decimal | DecimalJsLike | number | string
    divide?: Decimal | DecimalJsLike | number | string
  }

  export type NullableDecimalFieldUpdateOperationsInput = {
    set?: Decimal | DecimalJsLike | number | string | null
    increment?: Decimal | DecimalJsLike | number | string
    decrement?: Decimal | DecimalJsLike | number | string
    multiply?: Decimal | DecimalJsLike | number | string
    divide?: Decimal | DecimalJsLike | number | string
  }

  export type NullableDateTimeFieldUpdateOperationsInput = {
    set?: Date | string | null
  }

  export type BoolFieldUpdateOperationsInput = {
    set?: boolean
  }

  export type FloatFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedDecimalFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    in?: Decimal[] | DecimalJsLike[] | number[] | string[]
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[]
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string
  }

  export type NestedDecimalNullableFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel> | null
    in?: Decimal[] | DecimalJsLike[] | number[] | string[] | null
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[] | null
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalNullableFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string | null
  }

  export type NestedDateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | null
    notIn?: Date[] | string[] | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type NestedBoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | null
    notIn?: number[] | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type NestedIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type NestedDecimalWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    in?: Decimal[] | DecimalJsLike[] | number[] | string[]
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[]
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalWithAggregatesFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedDecimalFilter<$PrismaModel>
    _sum?: NestedDecimalFilter<$PrismaModel>
    _min?: NestedDecimalFilter<$PrismaModel>
    _max?: NestedDecimalFilter<$PrismaModel>
  }

  export type NestedDecimalNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel> | null
    in?: Decimal[] | DecimalJsLike[] | number[] | string[] | null
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[] | null
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalNullableWithAggregatesFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedDecimalNullableFilter<$PrismaModel>
    _sum?: NestedDecimalNullableFilter<$PrismaModel>
    _min?: NestedDecimalNullableFilter<$PrismaModel>
    _max?: NestedDecimalNullableFilter<$PrismaModel>
  }

  export type NestedDateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | null
    notIn?: Date[] | string[] | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type NestedBoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type NestedFloatWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedFloatFilter<$PrismaModel>
    _min?: NestedFloatFilter<$PrismaModel>
    _max?: NestedFloatFilter<$PrismaModel>
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }



  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}