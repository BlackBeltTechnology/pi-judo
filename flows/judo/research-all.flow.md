---
name: research-all
description: Full project research — all domains in parallel, then summarize
max_concurrent: 4
---

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
task: Read all researcher outputs and create a unified summary at judospec/research/summary.md
inputs:
  model_research: {result.judo-model-researcher}
  backend_research: {result.judo-backend-researcher}
  frontend_research: {result.judo-frontend-researcher}
