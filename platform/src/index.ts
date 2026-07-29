// Contour 1, the platform-bound half: adapters over adopted technology, and the
// machinery those adapters share.
//
// No @nestjs dependency, by construction — anything here enters the framework as
// a value through `useFactory`, never as a class Nest instantiates. See ADR 0005.

export { MIGRATIONS_FOLDER, MIGRATIONS_SCHEMA } from './database/migrations-config';
