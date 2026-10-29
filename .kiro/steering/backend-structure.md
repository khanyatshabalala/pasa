---
inclusion: always
---

# Backend package structure: package-by-feature (pragmatic)

The Spring Boot backend (`backend/src/main/java/com/pasa/backend`) is organized
**package-by-feature**, not package-by-layer. When adding or changing backend code,
follow this convention. Do not create or add to the old layer folders
(`controller/`, `service/`, `repository/`, `dto/`, `mapper/`, `domain/entity/`) for
feature-specific classes.

## The rule

Each feature gets its own package containing all of its layers together:

```
com.pasa.backend.<feature>/
    <Feature>Controller.java
    <Feature>Service.java
    <Feature>Repository.java
    <Feature>.java            (JPA entity, if the feature owns it)
    <Feature>Request.java     (request DTOs)
    <Feature>Response.java    (response DTOs)
    <Feature>Mapper.java
```

Already migrated to this shape: `subscription/`, `reportcard/`.

## Shared packages (stay as-is — do NOT dissolve into features)

These hold cross-cutting or cross-feature code and are intentionally shared:

- `domain/` — entities used by many features (`Learner`, `School`, `Profile`) and `domain/enums`.
  A **shared** entity stays here; a **feature-owned** entity lives in its feature package
  (e.g. `ReportCard` → `reportcard/`, `ParentSubscription` → `subscription/`).
- `security/` — auth/JWT infrastructure, `LearnerAccessGuard`, etc.
- `storage/` — S3/object-storage abstraction.
- `config/` — Spring configuration.
- `exception/` (or `common/`) — global exception handling and shared base types.

## Deciding where a class goes

- Owned by exactly one feature (its controller, service, repo, DTOs, mapper, and an entity
  only that feature touches) → the feature package.
- Referenced by two or more features (like `Learner`, `School`) → keep in `domain/` (shared).
  Cross-feature use is allowed: a feature simply imports the shared class or another
  feature's public class. We are **pragmatic**, not strict — no enforced module boundaries
  or published-API interfaces (that would be a Spring Modulith move we have not adopted).

## When moving an existing class into a feature package

1. Move the file into `com.pasa.backend.<feature>/`.
2. Update its `package` declaration.
3. Remove now-redundant imports of classes in the same (new) package.
4. Repoint imports in every external consumer to the new package.
5. Compile (`mvnw -o clean compile`) and run `mvnw clean verify` (the startup smoke test
   confirms the Spring context still wires — entity scanning and component scanning both
   live under `com.pasa.backend`, so staying under that root keeps them working).
6. Commit per feature so git records clean renames and each slice is reviewable.
