# Technical Decisions

This document explains the deliberate technical choices behind the chat application. It is intended to help a reviewer understand the solution quickly and to give contributors—including AI-assisted contributors—a single source of project conventions.

## Product decisions

### Cookie-backed display name defines message ownership

**Decision:** Ask a visitor for a display name on first use and store it in a first-party cookie.

**Why:** The API accepts any placeholder Bearer header and has no authenticated user identity. The message `author` field is therefore the only useful value for distinguishing the current user's messages from other participants'. A cookie makes the chosen display name available to both server-rendered and client-side code.

**Outcome:** Messages whose author matches the cookie value use the "mine" bubble style; all other messages use the participant style. The transport header is configurable but never treated as user identity. The cookie is a non-sensitive preference, scoped to the application, and uses an appropriate `SameSite` setting.

### Fixed demo access token satisfies the API contract

**Decision:** Store the backend's documented demo token, `super-secret-doodle-token`, in a first-party cookie named `access_token` when a visitor joins the chat.

**Why:** The messages API requires a Bearer header and documents this token for local development. Persisting it in a cookie lets the server and client use the same transport value for API requests.

**Outcome:** The API client reads `access_token` and sends `Authorization: Bearer super-secret-doodle-token` with every message request. This token is a development transport value only: it does not authenticate a user, grant permissions, or determine message ownership.

### Load older history on demand

**Decision:** Fetch older messages using the API's `before` timestamp cursor when the user reaches the top of the feed.

**Why:** Cursor pagination matches the API and scales better than an offset-based approach as the message collection changes.

**Outcome:** Initial load remains fast and the conversation can grow without a large upfront request.

### Refresh newer messages when returning to the bottom

**Decision:** Immediately request messages using the API's `after` timestamp cursor when a user scrolls away from the bottom of the feed and returns to it.

**Why:** The `before` cursor only expands older history. An `after` cursor retrieves messages that arrived since the newest message already displayed, without refetching the full conversation.

**Outcome:** React Query merges the incremental response into the cached feed and deduplicates messages. The feed makes one request each time the user returns to the bottom, shows loading and retry feedback there, and preserves the user's position while older history is loaded.

## Technology decisions

| Decision | Why it was selected | How it is used |
| --- | --- | --- |
| Next.js (App Router) | Provides a familiar production React structure, sensible routing, and a path to server rendering for a fast initial experience. | Hosts the application shell and isolates client-side chat interactions in focused components. |
| React + TypeScript | Required by the challenge; TypeScript makes message contracts and UI states explicit. | Types are shared across the API client, query hooks, and components. |
| Tailwind CSS | Enables consistent responsive spacing, colours, and states without fragmented stylesheet conventions. | Design tokens and responsive utilities reproduce the supplied desktop and mobile references. |
| shadcn/ui | Provides accessible, composable UI primitives that remain fully owned by the repository. | Used selectively for controls such as inputs, buttons, dialogs, and scroll behaviour; components are styled to the supplied design rather than left at defaults. |
| TanStack React Query | Solves server-state caching, request lifecycle, retries, and mutations cleanly. | Owns message queries, cursor pagination, optimistic sending, and rollback on send failure. |
| `@tanstack/react-virtual` | Keeps rendering efficient as chat history grows, especially on mobile devices. | Limits rendered message rows while preserving scrolling and older-message loading. |
| Vitest | Fast unit and component test feedback in a TypeScript frontend. | Covers formatting helpers, message ownership variants, and data-layer behaviour. |
| Playwright | Exercises the user-visible flow in real browsers and at responsive viewports. | Covers loading a conversation, sending a message, and loading both older (`before`) and newer (`after`) messages on desktop and mobile. |

## Architecture decisions

### Keep API access in one typed boundary

**Decision:** Put message types and all HTTP calls in a single `lib/api` module.

**Why:** Components should describe UI, not duplicate endpoints, headers, serialisation, or error handling.

**Outcome:** The API base URL comes from local environment configuration; each request receives its generated `access_token` Bearer value through this boundary. A backend change has one clear integration point.

### Separate server state from UI state

**Decision:** Use React Query for messages, a cookie for the display name, and React state for transient interface state.

**Why:** Remote data has different concerns—caching, invalidation, pagination, and retries—from local UI preferences.

**Outcome:** Components stay small and predictable, with no ad-hoc global state layer.

### Optimistic sending with recovery

**Decision:** Add a submitted message to the feed immediately, then replace or roll it back according to the POST result.

**Why:** Chat should feel immediate, but failures must stay visible and recoverable.

**Outcome:** The sender gets fast feedback, and a clear inline error is shown if delivery fails.

## Experience decisions

### Treat accessibility as a core requirement

**Decision:** Build semantic landmarks, labelled controls, keyboard-operable interactions, visible focus states, and an announcement region for incoming messages.

**Why:** Accessibility is an explicit evaluation criterion and is essential for a chat interface.

**Outcome:** The feed, composer, loading/error feedback, and identity prompt work with keyboard and assistive technology.

### Design for the supplied breakpoints first

**Decision:** Use the desktop and mobile design assets as the source of truth for layout, bubbles, spacing, and the fixed composer.

**Why:** This gives the implementation a clear visual target while allowing responsive behaviour between the references.

**Outcome:** The message feed fills the available height, the patterned background remains behind it, and the composer stays reachable at the bottom on narrow and wide screens.

## Project AI guidance

### Make project context available to any contributor

**Decision:** Maintain `agent.md` at the repository root as a tool-agnostic contributor guide.

**Why:** The project supports AI-assisted development, but its instructions should not depend on one vendor or agent. A human or any AI tool can read the same file before adding a feature.

**Outcome:** `agent.md` will document setup commands, architecture boundaries, naming and testing conventions, and links to this decision record. Repeatable workflows—adding API calls, query hooks, UI primitives, and tests—will be described there in plain Markdown. We will not make a vendor-specific directory such as `.claude/skills/` the source of truth; if a tool later needs its own adapter file, it must point back to the repository guidance rather than duplicate it.

### Keep AI-assisted changes reviewable

**Decision:** Use small, focused commits with descriptive messages and require the same tests and quality checks for all changes.

**Why:** The challenge assesses code quality and commit history; clear provenance is more valuable than the tool that produced a change.

**Outcome:** Each change remains easy to inspect, test, and revise.

## Future improvements

- Add real-time message delivery using WebSockets or Server-Sent Events.
- Add Sentry for client and server error tracking, performance monitoring, and source-map reporting.
