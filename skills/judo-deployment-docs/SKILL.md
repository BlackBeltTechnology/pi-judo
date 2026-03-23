---
name: judo-deployment-docs
description: JUDO deployment and build documentation. Covers the judo.sh build system, Maven setup, deployment configurations, verification checklists, and troubleshooting. Use when building, deploying, or diagnosing build issues in a JUDO application.
---

# JUDO Deployment and Build

This skill provides reference documentation for building and deploying JUDO applications. It covers the build system, deployment configurations, pre-deployment verification, and common troubleshooting scenarios.

## Overview

A JUDO application's build and deployment pipeline involves:

1. **Model Transformation** -- The ESM is transformed through PSM to ASM, generating the runtime model artifacts
2. **Code Generation** -- Backend (Java) and frontend (React) code are generated from the model
3. **Custom Code Merge** -- Custom operations, interceptors, and frontend customizations are merged with generated code
4. **Compilation** -- Java compilation (Maven) and frontend bundling (npm/webpack)
5. **Packaging** -- Application is packaged as a deployable artifact (WAR, Docker image, etc.)
6. **Deployment** -- Artifact is deployed to the target environment

## The Build System

The `judo.sh` script is the primary entry point for building JUDO applications. It orchestrates Maven, the model transformation, code generation, and frontend bundling into a single command.

## Key Build Artifacts

- **ASM files** -- The transformed model in `target/` directories
- **Generated Java sources** -- Backend code in `target/generated-sources/`
- **Generated frontend** -- React application in the frontend module
- **Application JAR/WAR** -- The deployable backend artifact
- **Frontend bundle** -- The static frontend assets for deployment

## Environment Requirements

- **Java 17+** -- Required for the JUDO runtime and code generation
- **Maven 3.8+** -- Build orchestration
- **Node.js 18+** -- Frontend bundling (managed by the build system)
- **Docker** (optional) -- For containerized deployments

## Available Reference Files

- `build-system.md` -- judo.sh build commands, Maven setup, and artifact management
- `deployment-guide.md` -- Deployment configurations, environments, and runtime settings
- `verification-checklist.md` -- Pre-deployment verification steps and quality gates
- `troubleshooting.md` -- Common build and deployment issues with solutions
