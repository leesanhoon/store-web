# Multi-Agent Task Queue Protocol

This project uses a **file-based task queue** (`tasks/` directory) to coordinate
between a **Lead** (planner/reviewer) and **Worker** (executor) role via
**Claude Code Desktop**.

## Directory Structure

```
tasks/
├── <task-id>/                    # kebab-case, e.g. "add-auth-middleware"
│   ├── plan.md                   # [Lead] Architecture plan + subtask breakdown
│   ├── context.md                # [Lead] Optional shared background/references
│   ├── review.md                 # [Lead] Final review across subtasks
│   ├── done.md                   # [Lead] Final approval
│   ├── 01-<subtask-id>/          # [Lead] Independently assignable subtask
│   │   ├── task.md               # [Lead] Executable task for one Worker
│   │   ├── result.md             # [Worker] Execution results
│   │   └── blocked.md            # [Worker] Blocked — needs clarification
│   └── 02-<subtask-id>/
│       ├── task.md
│       ├── result.md
│       └── blocked.md
```

## Roles

### Lead 🧠

- Reads requirements, writes `plan.md`, breaks into subtasks
- Creates `tasks/<id>/<subtask>/task.md` for each Worker subtask
- Reviews `result.md` → writes `review.md` (APPROVED or CHANGES_REQUIRED)
- Writes `done.md` when all subtasks pass
- Invoke with `@lead` in Claude Code Desktop

### Worker ⚙️

- **MUST follow these rules:**
  - NO extra features, refactors, or deviations from `task.md`
  - NO modifying `plan.md`, `review.md`, or `done.md`
  - If blocked, write `blocked.md` — never guess
  - Write `result.md` with changes + verification evidence
- Invoke with `@worker` in Claude Code Desktop

## Workflow

```
Lead                                    Worker
 │                                        │
 ├── Writes plan.md                       │
 ├── Breaks into subtasks                 │
 ├── Creates 01-*/task.md, 02-*/task.md   │
 │                                        │
 │                              ┌──────── worker reads 01-*/task.md
 │                              │         executes precisely
 │                              ├──────── writes 01-*/result.md
 │                              │
 │                              ┌──────── worker reads 02-*/task.md
 │                              │         executes precisely
 │                              ├──────── writes 02-*/result.md
 │                              │
 ├── Reads all result.md ◄──────┘
 ├── Reviews against plan.md + task.md
 ├── Writes review.md
 │                              ┌──────── workers fix issues
 │                              ├──────── update result.md
 │
 ├── If all resolved → done.md
 └── Done!
```

## Rules for Both Agents

1. **Lead: every plan must include a `## Subtasks` table** and one `task.md` per subtask, unless the user explicitly asks for a single-task plan
2. **Never modify files outside the task directory** unless the task explicitly says so
3. **Worker: never modify parent `plan.md`, `review.md`, or `done.md`** — only Lead writes these
4. **Always read the full task before starting**
5. **Worker: if unsure, write `blocked.md` — never guess**
6. **Lead: always review code against plan.md AND task.md — not just "does it run" but "does it match the architecture"**
7. **Commit messages: Lead decides when and what to commit**

## Task File Formats

### plan.md

```markdown
# Plan: <Title>

## Architecture

- Key decisions & rationale
- Component breakdown

## Subtasks

| ID  | Owner | Parallelizable | Dependencies | Allowed files | Output |
| --- | ----- | -------------- | ------------ | ------------- | ------ |

## Implementation

- File list with responsibilities
- Data flow

## Testing Strategy

## Edge Cases & Error Handling
```

### task.md

```markdown
# Task: <Title>

## Objective

One-line summary.

## Instructions (numbered, precise)

1. Create/modify path/to/file.ext
2. Add function `fnName(params) -> returnType`

## Acceptance Criteria

- [ ] Criterion 1

## Files to Touch

- path/to/file.ext — what to do
```

### result.md

```markdown
# Result: <Title>

## Changes Made

- path/to/file.ext — description

## Verification

- Test output: ...
- Lint: ...

## Notes
```

### review.md

```markdown
# Review: <Title>

## Verdict: [APPROVED | CHANGES_REQUIRED]

## Issues (if CHANGES_REQUIRED)

1. [path/to/file:line] Description

## Overall Assessment
```

### blocked.md

```markdown
# Blocked: <Title>

## Blocking Issue

What is unclear or impossible.

## Missing Information

What I need from Lead.
```
