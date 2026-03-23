---
name: research
description: Research workflow — domain selection fork, parallel researchers, and summary
max_concurrent: 4
---

## fork: domain-selection
question: Which domains to investigate?
options: model, backend, frontend
multiSelect: true
branches:
  model: judo-model-researcher
  backend: judo-backend-researcher
  frontend: judo-frontend-researcher

## judo-model-researcher

## judo-backend-researcher
blockedBy: judo-model-researcher
inputs:
  model_context: {result.judo-model-researcher}

## judo-frontend-researcher
blockedBy: judo-model-researcher
inputs:
  model_context: {result.judo-model-researcher}

## judo-summarizer
blockedBy: judo-model-researcher, judo-backend-researcher, judo-frontend-researcher
task: Read all domain research files and create a unified summary at judospec/research/summary.md
inputs:
  model_research: {result.judo-model-researcher}
  backend_research: {result.judo-backend-researcher}
  frontend_research: {result.judo-frontend-researcher}
