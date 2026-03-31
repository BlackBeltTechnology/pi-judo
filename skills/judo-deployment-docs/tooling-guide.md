# Tooling Guide

This guide provides an overview of the custom tools available in this project for working with the JUDO models. These tools are designed to help with documentation and visualization.

## Table of Contents

- [Diagram Generator Tool](#diagram-generator-tool)
  - [Overview](#overview)
  - [How to Use](#how-to-use)

---

## Diagram Generator Tool

### Overview

The `diagram_generator.py` script can be used to generate visual diagrams of the ESM model, which is useful for documentation and architectural reviews.

**Functionality:**

-   **Parses Model Files**: Reads the `.aird` (diagram definitions) and `.model` (ESM structure) files.
-   **Generates Diagrams**: Creates a Markdown file with class diagrams for each entity diagram found.
-   **Multiple Formats**: Supports both `PlantUML` (default) and `Mermaid` diagram formats.

### How to Use

1.  Navigate to the root directory of the project.
2.  Run the script with the following command, providing the paths to the diagram definition file, the ESM model file, and the desired output file.

    ```bash
    python agent-docs/domain/diagram_generator.py \
      representations.aird \
      application/model/target/generated-resources/model/northwind-esm.model \
      agent-docs/domain/generated-diagrams.md
    ```

3.  To specify the output format, use the `--format` flag:

    ```bash
    # To generate Mermaid diagrams
    python agent-docs/domain/diagram_generator.py \
      representations.aird \
      application/model/target/generated-resources/model/northwind-esm.model \
      agent-docs/domain/generated-diagrams.md \
      --format mermaid
    ```

The generated file, `generated-diagrams.md`, will be placed in the specified output path.

---

## See Also

- Domain Model Guide (see `judo-domain-docs` skill) - For an overview of the application's domain model.
- Model Development Guide (see `judo-model-docs` skill) - For information on editing the ESM model.