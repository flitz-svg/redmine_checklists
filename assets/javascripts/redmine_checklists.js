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

  function bindEvents() {
    var section = document.getElementById('checklists-section');
    if (!section) return;

    section.addEventListener('click', function (e) {
      var t = e.target;

      if (t.id === 'btn-add-checklist' || (t.closest && t.closest('#btn-add-checklist'))) {
        e.preventDefault();
        var form = document.getElementById('checklist-new-form');
        if (form) { form.style.display = ''; form.querySelector('input[type=text]').focus(); }
        document.getElementById('btn-add-checklist').style.display = 'none';
      }

      if (t.id === 'btn-cancel-checklist' || (t.closest && t.closest('#btn-cancel-checklist'))) {
        e.preventDefault();
        var form = document.getElementById('checklist-new-form');
        if (form) form.style.display = 'none';
        var btn = document.getElementById('btn-add-checklist');
        if (btn) btn.style.display = '';
      }
    });

    section.addEventListener('change', function (e) {
      if (e.target.classList.contains('checklist-item-toggle')) {
        toggleItem(e.target.dataset.itemId, e.target.dataset.checklistId, e.target);
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
