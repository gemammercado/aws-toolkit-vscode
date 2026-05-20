# VS Code Client — Hooks Feature Implementation Plan

## Overview

Add a "Hooks" node to the CloudFormation explorer tree in `packages/core/src/awsService/cloudformation/`, following the existing `StacksNode` / `ResourcesNode` patterns.

## Architecture

```
CloudFormationExplorer.getRootChildren()
├── RegionSelectorNode
├── CfnEnvironmentsNode
├── StacksNode          ← existing
├── ResourcesNode       ← existing
└── HooksNode           ← NEW
    ├── HookNode ("Private::Guard::S3Check")
    │   └── [expandable: targets, invocation history]
    ├── HookNode ("Private::Guard::IAMPolicyCheck")
    └── [Load More...]
```

## Files to Create

### 1. `hooks/hooksManager.ts` — Client-side LSP manager

Follows `stacks/stacksManager.ts` pattern:
- Sends `aws/cfn/hooks/list` and `aws/cfn/hooks/describe` LSP requests via `LanguageClient`
- Maintains local cache of `HookSummary[]`
- Supports `ensureLoaded()`, `get()`, `hasMore()`, `loadMore()`, `refresh()`, `clear()`
- Implements `Disposable`

```typescript
// Key types (mirror server-side HooksRequestType)
const ListHooksRequest = new RequestType<ListHooksParams, ListHooksResult, void>('aws/cfn/hooks/list')
const DescribeHookRequest = new RequestType<DescribeHookParams, DescribeHookResult, void>('aws/cfn/hooks/describe')
const ConfigureHookRequest = new RequestType<ConfigureHookParams, ConfigureHookResult, void>('aws/cfn/hooks/configure')
```

### 2. `hooks/hooksRequestTypes.ts` — LSP type definitions (client-side mirror)

Duplicates the LSP types from the server for client consumption:
- `ListHooksParams`, `ListHooksResult`, `HookSummary`
- `DescribeHookParams`, `DescribeHookResult`, `HookTargetInfo`
- `ConfigureHookParams`, `ConfigureHookResult`

### 3. `explorer/nodes/hooksNode.ts` — Top-level "Hooks" tree node

Follows `stacksNode.ts` pattern:
- Shows "Hooks" label with count in description: `(4)` or `(4+)`
- `getChildren()` returns `HookNode[]` + optional `LoadMoreHooksNode`
- Supports refresh and load-more commands

### 4. `explorer/nodes/hookNode.ts` — Individual hook tree node

Follows `stackNode.ts` pattern:
- Shows hook type name as label
- Description shows failure mode (`FAIL` / `WARN`)
- Expandable to show targets (via `DescribeHook` LSP call)
- Context value for right-click menu actions

### 5. `explorer/nodes/hookTargetNode.ts` — Hook target child node

Leaf node showing:
- Target resource type (e.g., `AWS::S3::Bucket`)
- Invocation point (e.g., `CREATE_PRE_PROVISION`)

### 6. `commands/hookCommands.ts` — Hook-related commands

Register VS Code commands:
- `aws.cloudformation.hooks.refresh` — Refresh hooks list
- `aws.cloudformation.hooks.describe` — Show hook details (opens webview or output)
- `aws.cloudformation.hooks.configure` — Change hook configuration (failure mode toggle)
- `aws.cloudformation.hooks.viewResults` — Show invocation results

## Files to Modify

### 7. `explorer/explorer.ts` — Add HooksNode to tree

```diff
+ import { HooksNode } from './nodes/hooksNode'
+ import { HooksManager } from '../hooks/hooksManager'

  export class CloudFormationExplorer {
      constructor(
          private readonly stacksManager: StacksManager,
          private readonly resourcesManager: ResourcesManager,
+         private readonly hooksManager: HooksManager,
          ...
      )

      private getRootChildren(): AWSTreeNodeBase[] {
          return [
              new RegionSelectorNode(this.regionManager),
              new CfnEnvironmentsNode(this.environmentManager),
              new StacksNode(this.stacksManager, this.changeSetsManager),
              new ResourcesNode(this.resourcesManager),
+             new HooksNode(this.hooksManager),
          ]
      }
  }
```

### 8. `extension.ts` — Instantiate HooksManager

Where `StacksManager` and `ResourcesManager` are created with the `LanguageClient`, add:
```typescript
const hooksManager = new HooksManager(client)
```

Pass it to `CloudFormationExplorer` constructor.

### 9. `package.json` (toolkit package) — Register commands & views

Add to `contributes.commands`:
```json
{ "command": "aws.cloudformation.hooks.refresh", "title": "Refresh Hooks" }
{ "command": "aws.cloudformation.hooks.configure", "title": "Configure Hook" }
```

Add context menu items for hook nodes via `contributes.menus.view/item/context`.

## Implementation Order

```
1. hooksRequestTypes.ts        ← type definitions (no deps)          ✅ DONE
2. hooksManager.ts             ← LSP communication layer             ✅ DONE
3. hooksNode.ts + hookNode.ts  ← tree nodes                         ✅ DONE
4. hookTargetNode.ts           ← child nodes (deferred - needs describe call)
5. explorer.ts modification    ← wire into tree                      ✅ DONE
6. extension.ts modification   ← instantiate manager                 ✅ DONE
7. hookCommands.ts             ← user actions                        ✅ DONE
8. package.json                ← command registration                ✅ DONE
```

## Verification

- ✅ `tsc --noEmit` — 0 errors (packages/core/tsconfig.json)
- ✅ `package.json` — valid JSON
- ✅ Test files created: `hooksManager.test.ts`, `hooksNode.test.ts`
- Tests require VS Code extension host to run (standard for this project)

## Commands Registered

| Command ID | Title | Context |
|-----------|-------|---------|
| `aws.cloudformation.hooks.refresh` | Refresh Hooks | hookSection inline |
| `aws.cloudformation.api.loadMoreHooks` | Load More Hooks | hookSectionWithMore inline |
| `aws.cloudformation.hooks.configure` | Configure Hook | hookNode inline |

## Stack Events Enhancement ✅

- [x] Surface hook failure info on collapsed parent rows in events table
- [x] Right-click hook name to copy to clipboard (with "Copied!" feedback)
- [x] Dotted underline + context-menu cursor on hook names for discoverability

## Testing Strategy

- **Unit tests** (`src/test/`): Mock `LanguageClient.sendRequest`, verify `HooksManager` caching/pagination logic
- **Integration tests** (`src/testInteg/`): Not needed initially (requires running LSP server)
- Follow existing test patterns in `src/test/awsService/cloudformation/stacks/`

## Key Patterns to Follow

| Pattern | Reference File |
|---------|---------------|
| LSP request manager | `stacks/stacksManager.ts` |
| Tree node with children | `explorer/nodes/stacksNode.ts` |
| Individual item node | `explorer/nodes/stackNode.ts` |
| Load More pagination | `LoadMoreStacksNode` in `stacksNode.ts` |
| Command registration | `commands/cfnCommands.ts` |
| Error handling | `utils/onlineErrorHandler.ts` |
| Context values | `explorer/contextValue.ts` |

## Estimated Effort

| Task | Effort |
|------|--------|
| Type definitions | 30 min |
| HooksManager | 1.5 hours |
| Tree nodes (3 files) | 2 hours |
| Explorer + extension wiring | 1 hour |
| Commands | 1.5 hours |
| package.json registration | 30 min |
| Unit tests | 2 hours |
| **Total** | **~9 hours** |
