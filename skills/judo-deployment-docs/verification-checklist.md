# Verification Checklist

This checklist provides the pre-deployment verification steps to ensure a JUDO application is ready for release.

## Build Verification

- [ ] `./judo.sh clean build` completes without errors
- [ ] No warnings in model transformation output
- [ ] All custom operations compile successfully
- [ ] Frontend bundle builds without errors
- [ ] Build artifacts are the expected size (no missing components)

## Model Verification

- [ ] Model validates without errors (`model_cli --load transform --validate`)
- [ ] All entity types have appropriate constraints
- [ ] Transfer objects map correctly to entity types
- [ ] Access points expose the correct operations for each actor type
- [ ] Enumerations have all required members
- [ ] No orphaned model elements (unused types, unreferenced TOs)

## Backend Verification

- [ ] Integration tests pass (`./judo.sh test`)
- [ ] All custom operations have corresponding test coverage
- [ ] Interceptors are registered and functioning
- [ ] Error handling returns structured error responses
- [ ] Authentication works for all actor types
- [ ] Authorization rules enforce correct access restrictions
- [ ] Database migrations apply cleanly to the target schema

## Frontend Verification

- [ ] Frontend renders correctly for all actor types
- [ ] Custom component overrides display properly
- [ ] Theme is applied consistently
- [ ] Form validation matches model constraints
- [ ] Navigation and breadcrumbs work correctly
- [ ] Responsive layout works on target screen sizes

## E2E Verification

- [ ] E2e test suite passes (`npx playwright test`)
- [ ] Critical user flows are covered (create, edit, view, delete)
- [ ] Custom operation UI flows work correctly
- [ ] Authentication and authorization flows are tested

## Deployment Verification

- [ ] Environment variables are configured for the target environment
- [ ] Database connection is verified
- [ ] JWT secret is set (not using the default)
- [ ] Log level is appropriate for the environment
- [ ] Health endpoint responds correctly after startup
- [ ] Schema migration runs successfully against the target database

## Performance Verification

- [ ] Application starts within acceptable time
- [ ] Page load times are acceptable
- [ ] Data grid performance is acceptable with realistic data volumes
- [ ] No N+1 query patterns in custom operations

## Rollback Plan

- [ ] Previous version artifact is available for rollback
- [ ] Database rollback procedure is documented (if schema changed)
- [ ] Rollback has been tested in staging environment
