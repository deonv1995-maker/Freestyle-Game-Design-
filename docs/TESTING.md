# Testing Workflow

Freestyle Game Design uses a short build-test-iterate loop.

## Before implementation

Confirm the current repository state and identify which existing systems the change touches.

For structural changes, identify the authoritative owner of the behavior before editing.

## Before handing a build back for testing

Perform every verification that is available in the repository, including as applicable:

- dependency installation or lockfile integrity;
- compile/build;
- linting or static checks;
- automated regression tests;
- asset/import resolution;
- startup/boot;
- the directly affected gameplay flow.

## Device testing

Repository verification cannot replace hands-on gameplay testing.

When a playable build is available, test the exact behavior that changed and report what is visible, what input was used, and what happened immediately before the problem or successful result.

Screenshots or short recordings are especially useful for rendering, camera, animation, collision, UI, and timing problems.

## Iteration rule

Observed device behavior wins over assumptions.

When test feedback exposes a regression:

1. inspect the current implementation and recent changes;
2. reproduce or narrow the failure from evidence;
3. fix the root cause at the correct system boundary;
4. add a regression check when practical;
5. verify again before treating the issue as complete.

## Stable build rule

Once a playable baseline exists, do not knowingly leave `main` in a broken state merely to preserve an experiment.
