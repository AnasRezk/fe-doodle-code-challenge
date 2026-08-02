# Group Chat Auth Flow

```mermaid
flowchart TD
    A["Visit /group-chat"] --> B{"Authenticated?"}
    B -->|Yes| C["Group Chat page"]
    B -->|No| D["Login page"]
    D -->|Submit username| C
```
