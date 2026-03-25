---
name: research
description: Research JUDO codebase — select domains, parallel investigate, summarize
max_concurrent: 3
---

## fork: domains
question: Which domains should be researched?
options: model, backend, frontend
multiSelect: true
branches:
  model: judo-model-researcher
  backend: judo-backend-researcher
  frontend: judo-frontend-researcher

## judo-model-researcher
agent: judo-model-researcher

## judo-backend-researcher
agent: judo-backend-researcher
blockedBy: judo-model-researcher
inputs:
  model_context: "{result.judo-model-researcher.summary}"

## judo-frontend-researcher
agent: judo-frontend-researcher
blockedBy: judo-model-researcher
inputs:
  model_context: "{result.judo-model-researcher.summary}"

## judo-summarizer
agent: judo-summarizer
blockedBy: judo-model-researcher, judo-backend-researcher, judo-frontend-researcher
task: >
  Synthesize domain research into a unified summary.
  Write to judospec/research/summary.md
inputs:
  model: "{result.judo-model-researcher.summary}"
  backend: "{result.judo-backend-researcher.summary}"
  frontend: "{result.judo-frontend-researcher.summary}"
