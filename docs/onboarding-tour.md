# Dashboard Onboarding Tour

This tour introduces new users to key areas of the Dashboard.

## Editing Steps

Steps are defined in `client/src/tourSteps.ts`. Each step includes a `target` selector and short text. Update selectors to match elements in the Dashboard and adjust copy as needed.

## Restarting the Tour

A "Take a tour" link is rendered on the Dashboard footer. Clicking it calls `startTour()` from `useDashboardTour` to replay the tour.
