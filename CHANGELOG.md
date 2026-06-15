# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-06-15

First public release.

### Added
- Multiple independent checklists per issue, each with its own title and progress bar.
- Manage checklists from both the issue view and the issue edit form, with both
  copies kept in sync in real time.
- In-place AJAX updates for every action (create, delete, add items, toggle) — no
  full page reload, so unsaved edits in the issue form are preserved.
- History tracking: every checklist change (add/remove checklist, add/remove item,
  check/uncheck) is recorded in the issue journal. Email notifications are
  suppressed for these entries to avoid flooding watchers.
- Bulk item entry: add several items at once, one per line.
- File import: load items from a plain-text `.txt`/`.csv` file.
- Real-time progress bar (checked vs. total items).
- Permission-aware controls (shown only to users who can edit the issue).
- English and Spanish translations.

[1.0.0]: https://github.com/flitz-svg/redmine_checklists/releases/tag/v1.0.0
