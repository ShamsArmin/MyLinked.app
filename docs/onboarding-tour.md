# Dashboard Onboarding Tour

This guide explains how to update the dashboard onboarding tour.

## Editing steps

All steps are defined in `client/src/components/tourSteps.ts`. Each step includes a `target` selector, a short title, and a brief description. Update this file to change copy or reorder steps.

## Adding selectors

Ensure dashboard elements include class names that match the step targets. Current selectors:

- `.my-links-grid` – grid of saved links
- `.add-link-button` – button to add a new link
- `.dashboard-search` – search input for links
- `.notifications-icon` – notifications button in the nav bar
- `.profile-menu` – user profile/settings menu
- `.help-menu` – link to reopen the tour

## Restarting the tour

The tour runs automatically for new users. Use the "Take a tour" button (class `.help-menu`) to launch it again manually.
