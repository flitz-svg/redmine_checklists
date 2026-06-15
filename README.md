# redmine_checklists ✅

> A Redmine plugin that adds independent, multi-checklist support to issues — manage them from the issue view or while editing, with every change tracked in the issue history.

[![Ruby](https://img.shields.io/badge/Ruby-3.0%2B-red?logo=ruby&logoColor=white)](https://www.ruby-lang.org/)
[![Redmine](https://img.shields.io/badge/Redmine-5.x%20%7C%206.x-blue?logo=redmine&logoColor=white)](https://www.redmine.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/flitz-svg/redmine_checklists/pulls)

---

## What is redmine_checklists?

`redmine_checklists` lets each issue hold several independent checklists, each with its own title, progress bar and list of items. Checklists can be managed from anywhere on the issue and every change is recorded, so nothing slips through the cracks.

| Where | What you can do |
|------|-------------|
| **Issue view** | See all checklists with a live progress bar; add, check/uncheck, and remove items |
| **Issue edit form** | Manage the same checklists while editing the issue — both copies stay in sync in real time |
| **Issue history** | Every checklist change is logged automatically as a journal entry |

---

## Features

- ✅ **Multiple checklists per issue** — create as many as you need inside a single issue
- ✅ **Manage from anywhere** — add, edit, check and delete from the issue view *and* the edit form, kept in sync
- ✅ **In-place updates** — every action runs via AJAX with no page reload, so unsaved edits in the issue form are never lost
- ✅ **History tracking** — add/remove checklist, add/remove item and check/uncheck are written to the issue journal (email notifications suppressed to avoid flooding watchers)
- ✅ **Bulk item entry** — add several items at once, one per line
- ✅ **File import** — load items from a plain-text `.txt`/`.csv` file
- ✅ **Real-time progress bar** — checked vs. total items, updated instantly
- ✅ **Permission-aware** — edit controls shown only to users who can edit the issue
- ✅ **Multilingual** — English and Spanish included

---

## Requirements

- Redmine **5.0 or higher** (tested on 5.x and 6.x stable)
- Ruby **3.0+**
- Rails **7.0+** (bundled with Redmine)

---

## Installation

```bash
# 1. Clone the plugin into your Redmine plugins directory
cd /path/to/redmine/plugins
git clone https://github.com/flitz-svg/redmine_checklists.git

# 2. Run the database migrations
cd /path/to/redmine
bundle exec rake redmine:plugins:migrate RAILS_ENV=production

# 3. Restart Redmine
touch /path/to/redmine/tmp/restart.txt
# or depending on your server:
# sudo systemctl restart redmine
# sudo service apache2 restart
```

> **Assets:** if your Redmine serves assets through the Rails asset pipeline
> (digested filenames under `/assets/...`), recompile after upgrading the plugin
> so the new JS/CSS is picked up:
>
> ```bash
> bundle exec rake assets:precompile RAILS_ENV=production && touch tmp/restart.txt
> ```
>
> A hard refresh (Ctrl/Cmd + Shift + R) clears any cached copy in the browser.

### Uninstall

```bash
bundle exec rake redmine:plugins:migrate NAME=redmine_checklists VERSION=0 RAILS_ENV=production
```

Then remove the plugin folder and restart Redmine.

---

## Usage

The **Checklists** section appears below the issue details, and also inside the
issue form when you create or edit an issue.

### Create a checklist

Click **Add checklist**, enter a title, and click **Create checklist**.

### Add items

Click **Add items** inside a checklist block. A panel opens with:

- A **textarea** — type one item per line, then click **Save**.
- An **Import from file** button — select a `.txt`/`.csv` file; its lines are
  loaded into the textarea automatically. Review and click **Save**.

### Toggle / delete

- Click a checkbox to mark an item done — the progress bar updates instantly.
- Hover an item and click the trash icon to delete it.
- Hover a checklist header and click the trash icon to delete the whole checklist.

All of these are available from within the issue edit form too, and every change
is logged in the issue's **History** tab.

---

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a branch: `git checkout -b feature/my-improvement`
3. Commit your changes: `git commit -m 'feat: clear description'`
4. Open a Pull Request describing the problem it solves

For bugs, open an [issue](https://github.com/flitz-svg/redmine_checklists/issues) with:
- Redmine and Ruby versions (`bundle exec ruby -v`)
- Operating system and version
- Exact steps to reproduce the error
- Full error message

---

## License

MIT License

Copyright (c) 2026 flitz-svg

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

---

<p align="center">
Made with ❤️ for the Redmine community · <a href="https://github.com/flitz-svg/redmine_checklists/issues">Report a bug</a> · <a href="https://github.com/flitz-svg/redmine_checklists/issues">Request a feature</a>
</p>
