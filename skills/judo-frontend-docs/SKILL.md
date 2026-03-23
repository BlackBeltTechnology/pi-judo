---
name: judo-frontend-docs
description: JUDO frontend development documentation. Covers React hook customizations, component overrides, theme configuration, state management, and testing. Use when implementing or modifying frontend behavior in a JUDO application.
---

# JUDO Frontend Development

This skill provides reference documentation for frontend development in the JUDO framework. JUDO generates a complete React-based frontend from the model, with a structured customization system that allows developers to extend and override generated behavior without modifying generated code.

## Architecture Overview

The generated frontend is a React application using Material UI (MUI) components. It follows a pages-and-panels architecture where each view defined in the model produces a generated page component with corresponding data-fetching hooks, action handlers, and form logic.

**Hooks and Customizations** are the primary frontend extension mechanism. Similar to the backend's `.default` pattern, the frontend provides hook interfaces for each page. Developers register custom hook implementations that override default behavior for actions, validations, visibility, and data loading.

**Component Overrides** allow replacing entire generated components or injecting custom components into generated layouts. The override registry maps component identifiers to custom React components.

**Theme Customization** uses MUI's theming system. JUDO provides a theme configuration file where colors, typography, spacing, and component-level style overrides can be defined.

**State Management** follows React patterns with generated hooks managing server state through the JUDO API client. Local state is managed within page components and passed through React context where needed.

**Testing** the frontend involves testing custom hooks in isolation, testing component overrides with React Testing Library, and end-to-end testing with Playwright (covered in the judo-e2e-docs skill).

## Available Reference Files

- `hooks-and-customizations.md` -- Hook types, registration patterns, and customizer interfaces for overriding generated page behavior
- `component-overrides.md` -- How to override generated React components and inject custom UI elements
- `theme-customization.md` -- Theme configuration, MUI theme overrides, and styling patterns
- `state-management.md` -- Frontend state patterns, data flow, API client usage, and caching
- `testing-guide.md` -- Frontend unit and component testing approaches
