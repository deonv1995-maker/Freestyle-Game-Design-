# Development Rules

## Stable baseline

Once the repository contains a playable build, `main` is the stable baseline and should remain playable.

Do not combine unrelated high-risk changes in one step unless there is a strong technical reason.

## Inspect before editing

Before modifying an existing system, inspect the current implementation, relevant dependencies, tests, and project documentation.

The repository is the source of truth. Do not assume an older chat description still matches the current code.

## Small playable slices

Build experiments as small end-to-end slices that can actually be tested.

A useful experiment should answer a gameplay or technical question rather than create a large amount of disconnected scaffolding.

## Root-cause fixes

When something breaks, correct the underlying ownership, state, lifecycle, rendering, collision, or data problem where practical.

Avoid accumulating compatibility patches, duplicated logic, or special-case behavior around a broken core assumption.

## One source of truth

Shared configuration, gameplay values, item definitions, state, asset paths, control bindings, world rules, and progression data should have one canonical owner.

Do not create parallel systems for the same responsibility.

## System boundaries

Keep gameplay, UI, rendering, input, assets, persistence, audio, networking, and deployment independently changeable where practical.

A presentation failure should not unnecessarily stop the game simulation from booting.

## Preserve working behavior

Do not redesign stable systems simply because a different implementation is possible.

An experiment may replace a working system when the experiment specifically requires it, but the scope and reason should be explicit.

## Engine and dependency discipline

Do not lock the project to an engine, framework, renderer, or major dependency until the first actual prototype provides enough requirements to justify that choice.

After the stack is chosen:

- pin important dependencies;
- keep startup reproducible;
- isolate upgrades;
- avoid hidden runtime dependency rewrites;
- verify asset/import paths;
- keep build and deployment configuration in version control.

## Performance

Performance constraints should match the intended target platform.

If mobile becomes a target, memory pressure, draw calls, touch controls, loading cost, visibility, and battery-sensitive work become first-class constraints from the start.

## Verification

Before treating a repository change as complete, verify the relevant checks:

- dependencies/imports resolve;
- the project builds;
- startup succeeds;
- the affected gameplay or interaction path works;
- existing critical behavior still works;
- automated checks pass when present.

Do not claim a change is fixed or live until the repository change actually exists and the available verification has succeeded.

## Documentation as project memory

Material architecture or game-design decisions belong in repository documentation.

Update `DECISIONS.md` whenever a decision would otherwise need to be reconstructed from old conversations.
