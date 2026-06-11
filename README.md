# redmine_checklists

A Redmine plugin that adds independent checklists to issues.  
Multiple checklists can coexist within the same issue, each with its own title, progress bar, and item list.

---

## Features

- **Multiple checklists per issue** — create as many checklists as needed inside a single issue.
- **Bulk item entry** — type several items at once, one per line, and save them all in a single click.
- **File import** — upload a plain-text file (`.txt`) and each line becomes a checklist item.
- **Progress bar** — visual indicator of checked vs. total items, updated in real time without page reload.
- **Toggle items** — check/uncheck items via AJAX; the progress bar updates instantly.
- **Delete checklist** — remove an entire checklist (and all its items) with one click.
- **Permission-aware** — add/edit/delete actions are only shown to users with edit rights on the issue.
- **Multilingual** — English and Spanish included.

---

## Requirements

| Dependency | Version |
|---|---|
| Redmine | ≥ 5.0 |
| Ruby | ≥ 3.0 |
| Rails | ≥ 7.0 |

---

## Installation

1. Clone or copy this plugin into your Redmine `plugins/` directory:

   ```bash
   cd /path/to/redmine/plugins
   git clone https://github.com/flitz-svg/redmine_checklists.git
   ```

2. Run the database migrations:

   ```bash
   bundle exec rake redmine:plugins:migrate RAILS_ENV=production
   ```

3. Restart Redmine.

---

## Uninstall

```bash
bundle exec rake redmine:plugins:migrate NAME=redmine_checklists VERSION=0 RAILS_ENV=production
```

Then remove the plugin folder.

---

## Usage

Open any issue. The **Checklists** section appears below the issue details.

### Create a checklist

Click **Add checklist**, enter a title, and click **Create checklist**.

### Add items

Click **Add items** inside a checklist block. A panel opens with:

- A **textarea** — type one item per line, then click **Save**.
- An **Import from file** button — select a `.txt` file; its lines are loaded into the textarea automatically. Review and click **Save**.

### Toggle / delete

- Click a checkbox to mark an item done (progress bar updates in real time).
- Hover an item and click the **×** icon to delete it.
- Hover a checklist header and click the **×** icon to delete the entire checklist.

---

## File structure

```
redmine_checklists/
├── app/
│   ├── controllers/
│   │   ├── issue_checklists_controller.rb
│   │   └── issue_checklist_items_controller.rb
│   ├── models/
│   │   ├── issue_checklist.rb
│   │   └── issue_checklist_item.rb
│   └── views/
│       ├── checklists/
│       │   ├── _section.html.erb
│       │   ├── _checklist.html.erb
│       │   └── _new_form.html.erb
│       └── checklist_items/
│           └── _item.html.erb
├── assets/
│   ├── javascripts/redmine_checklists.js
│   └── stylesheets/redmine_checklists.css
├── config/
│   ├── locales/
│   │   ├── en.yml
│   │   └── es.yml
│   └── routes.rb
├── db/migrate/
├── lib/redmine_checklists/hooks.rb
├── init.rb
├── LICENSE
└── README.md
```

---

## License

MIT — see [LICENSE](LICENSE).
