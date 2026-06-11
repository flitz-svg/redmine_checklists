var RedmineChecklists = (function () {
  'use strict';

  function csrfToken() {
    var meta = document.querySelector('meta[name="csrf-token"]');
    return meta ? meta.getAttribute('content') : '';
  }

  function updateProgress(checklistId, percent, checkedCount, totalCount) {
    document.querySelectorAll('[id="checklist-progress-fill-' + checklistId + '"]').forEach(function (fill) {
      fill.style.width = percent + '%';
    });

    document.querySelectorAll('[id="checklist-' + checklistId + '"] .checklist-block-progress-label').forEach(function (label) {
      label.textContent = checkedCount + '/' + totalCount;
    });

    if (totalCount > 0) {
      document.querySelectorAll('[id="checklist-' + checklistId + '"]').forEach(function (block) {
        if (!block.querySelector('.checklist-progress-fill')) {
          var fillDiv = document.createElement('div');
          fillDiv.className   = 'checklist-progress-fill';
          fillDiv.id          = 'checklist-progress-fill-' + checklistId;
          fillDiv.style.width = percent + '%';
          var bar = document.createElement('div');
          bar.className = 'checklist-progress-bar';
          bar.appendChild(fillDiv);
          var header = block.querySelector('.checklist-block-header');
          if (header) header.insertAdjacentElement('afterend', bar);
        }
      });
    }
  }

  function toggleItem(itemId, checklistId, checkbox) {
    fetch('/checklist_items/' + itemId + '/toggle', {
      method:  'PATCH',
      headers: { 'X-CSRF-Token': csrfToken(), 'Accept': 'application/json' }
    })
    .then(function (r) {
      if (!r.ok) throw new Error('failed');
      return r.json();
    })
    .then(function (data) {
      document.querySelectorAll('[id="checklist-item-' + itemId + '"]').forEach(function (li) {
        li.classList.toggle('checklist-item--checked', data.checked);
      });
      updateProgress(checklistId, data.progress, data.checked_count, data.total_count);
    })
    .catch(function () {
      checkbox.checked = !checkbox.checked;
    });
  }

  function openPanel(panelId) {
    var panel = document.getElementById(panelId);
    if (!panel) return;
    panel.style.display = '';
    var textarea = panel.querySelector('textarea');
    if (textarea) textarea.focus();
  }

  function closePanel(panelId) {
    var panel = document.getElementById(panelId);
    if (!panel) return;
    panel.style.display = 'none';
    var textarea = panel.querySelector('textarea');
    if (textarea) textarea.value = '';
    var fileInput = panel.querySelector('input[type="file"]');
    if (fileInput) fileInput.value = '';
  }

  function readFileIntoTextarea(fileInput) {
    var file = fileInput.files[0];
    if (!file) return;
    var textareaId = fileInput.dataset.textarea;
    var textarea   = textareaId ? document.getElementById(textareaId) : null;
    if (!textarea) return;

    var reader = new FileReader();
    reader.onload = function (e) {
      var existing = textarea.value.trim();
      var incoming = e.target.result.trim();
      textarea.value = existing ? existing + '\n' + incoming : incoming;
      textarea.focus();
    };
    reader.readAsText(file, 'UTF-8');
    fileInput.value = '';
  }

  function bindSection(section) {
    section.addEventListener('click', function (e) {
      var t = e.target;

      /* ── Add checklist button ─────────────────────────────────────────────── */
      var addBtn = t.classList.contains('checklists-add-btn')
        ? t
        : (t.closest && t.closest('.checklists-add-btn'));
      if (addBtn) {
        e.preventDefault();
        var form = document.getElementById(addBtn.dataset.target);
        if (form) { form.style.display = ''; form.querySelector('input[type=text]').focus(); }
        addBtn.style.display = 'none';
        return;
      }

      /* ── Cancel new checklist form ────────────────────────────────────────── */
      var cancelBtn = t.classList.contains('checklists-cancel-btn')
        ? t
        : (t.closest && t.closest('.checklists-cancel-btn'));
      if (cancelBtn) {
        e.preventDefault();
        var form = document.getElementById(cancelBtn.dataset.form);
        var btn  = document.getElementById(cancelBtn.dataset.btn);
        if (form) form.style.display = 'none';
        if (btn)  btn.style.display  = '';
        return;
      }

      /* ── Bulk add panel open ──────────────────────────────────────────────── */
      var toggleEl = t.classList.contains('checklist-add-toggle')
        ? t
        : (t.closest && t.closest('.checklist-add-toggle'));
      if (toggleEl) {
        e.preventDefault();
        openPanel(toggleEl.dataset.panel);
        var row = toggleEl.closest('.checklist-add-toggle-row');
        if (row) row.style.display = 'none';
        return;
      }

      /* ── Bulk add panel close ─────────────────────────────────────────────── */
      var cancelEl = t.classList.contains('checklist-add-cancel')
        ? t
        : (t.closest && t.closest('.checklist-add-cancel'));
      if (cancelEl) {
        e.preventDefault();
        closePanel(cancelEl.dataset.panel);
        var area = cancelEl.closest('.checklist-add-area');
        if (area) {
          var toggleRow = area.querySelector('.checklist-add-toggle-row');
          if (toggleRow) toggleRow.style.display = '';
        }
      }
    });

    section.addEventListener('change', function (e) {
      /* ── Item checkbox toggle ─────────────────────────────────────────────── */
      if (e.target.classList.contains('checklist-item-toggle')) {
        toggleItem(e.target.dataset.itemId, e.target.dataset.checklistId, e.target);
        return;
      }

      /* ── File import ──────────────────────────────────────────────────────── */
      if (e.target.classList.contains('checklist-file-input')) {
        readFileIntoTextarea(e.target);
      }
    });
  }

  function bindEvents() {
    document.querySelectorAll('.checklists-section').forEach(bindSection);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindEvents);
  } else {
    bindEvents();
  }

  return { updateProgress: updateProgress };
})();
