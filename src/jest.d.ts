// Pulls @types/jest ambient globals (describe/it/expect) into the typecheck.
// Kept as an explicit reference so we don't need a `types` array in tsconfig
// (which would drop the other auto-included @types/* packages).
/// <reference types="jest" />
