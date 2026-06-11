var RedmineChecklists = (function () {
  'use strict';

  function csrfToken() {
    var meta = document.querySelector('meta[name="csrf-token"]');
    return meta ? meta.getAttribute('content') : '';
  }

  function updateProgress(checklistId, percent, checkedCount, totalCount) {
    var fill  = document.getElementById('checklist-progress-fill-' + checklistId);
    var label = document.querySelector('#checklist-' + checklistId + ' .checklist-block-progress-label');

    if (fill)  fill.style.width = percent + '%';
    if (label) label.textContent = checkedCount + '/' + totalCount;

    if (!fill && totalCount > 0) {
      var fillDiv = document.createElement('div');
      fillDiv.className   = 'checklist-progress-fill';
      fillDiv.id          = 'checklist-progress-fill-' + checklistId;
      fillDiv.style.width = percent + '%';
      var bar = document.createElement('div');
      bar.className = 'checklist-progress-bar';
      bar.appendChild(fillDiv);
      var header = document.querySelector('#checklist-' + checklistId + ' .checklist-block-header');
      if (header) header.insertAdjacentElement('afterend', bar);
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
      var li = document.getElementById('checklist-item-' + itemId);
      if (li) li.classList.toggle('checklist-item--checked', data.checked);
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

  function bindEvents() {
    var section = document.getElementById('checklists-section');
    if (!section) return;

    /* ── New checklist form toggle ─────────────────────────────────────────── */
    section.addEventListener('click', function (e) {
      var t = e.target;

      if (t.id === 'btn-add-checklist' || (t.closest && t.closest('#btn-add-checklist'))) {
        e.preventDefault();
        var form = document.getElementById('checklist-new-form');
        if (form) { form.style.display = ''; form.querySelector('input[type=text]').focus(); }
        document.getElementById('btn-add-checklist').style.display = 'none';
        return;
      }

      if (t.id === 'btn-cancel-checklist' || (t.closest && t.closest('#btn-cancel-checklist'))) {
        e.preventDefault();
        var form = document.getElementById('checklist-new-form');
        if (form) form.style.display = 'none';
        var btn = document.getElementById('btn-add-checklist');
        if (btn) btn.style.display = '';
        return;
      }

      /* ── Bulk add panel toggle ─────────────────────────────────────────── */
      var toggleEl = t.classList.contains('checklist-add-toggle')
        ? t
        : (t.closest && t.closest('.checklist-add-toggle'));
      if (toggleEl) {
        e.preventDefault();
        var panelId = toggleEl.dataset.panel;
        openPanel(panelId);
        toggleEl.closest('.checklist-add-toggle-row').style.display = 'none';
        return;
      }

      var cancelEl = t.classList.contains('checklist-add-cancel')
        ? t
        : (t.closest && t.closest('.checklist-add-cancel'));
      if (cancelEl) {
        e.preventDefault();
        var panelId = cancelEl.dataset.panel;
        closePanel(panelId);
        var area = cancelEl.closest('.checklist-add-area');
        if (area) {
          var toggleRow = area.querySelector('.checklist-add-toggle-row');
          if (toggleRow) toggleRow.style.display = '';
        }
      }
    });

    /* ── Checkbox toggle ───────────────────────────────────────────────────── */
    section.addEventListener('change', function (e) {
      if (e.target.classList.contains('checklist-item-toggle')) {
        toggleItem(e.target.dataset.itemId, e.target.dataset.checklistId, e.target);
        return;
      }

      /* ── File import ─────────────────────────────────────────────────────── */
      if (e.target.classList.contains('checklist-file-input')) {
        readFileIntoTextarea(e.target);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindEvents);
  } else {
    bindEvents();
  }

  return { updateProgress: updateProgress };
})();
