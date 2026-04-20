/* global RedmineChecklists */
var RedmineChecklists = (function () {
  'use strict';

  function csrfToken() {
    var meta = document.querySelector('meta[name="csrf-token"]');
    return meta ? meta.getAttribute('content') : '';
  }

  function updateProgress(checklistId, percent, checked, total) {
    var fill  = document.getElementById('checklist-progress-fill-' + checklistId);
    var label = document.querySelector('#checklist-' + checklistId + ' .checklist-block-progress-label');

    if (fill)  fill.style.width = percent + '%';
    if (label) label.textContent = checked + '/' + total;

    // Rebuild the bar if it was missing (first item added)
    if (!fill && total > 0) {
      var fillDiv = document.createElement('div');
      fillDiv.className = 'checklist-progress-fill';
      fillDiv.id        = 'checklist-progress-fill-' + checklistId;
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
      headers: {
        'X-CSRF-Token': csrfToken(),
        'Accept':       'application/json'
      }
    })
    .then(function (response) {
      if (!response.ok) throw new Error('toggle_failed');
      return response.json();
    })
    .then(function (data) {
      var li = document.getElementById('checklist-item-' + itemId);
      if (li) {
        if (data.checked) {
          li.classList.add('checklist-item--checked');
        } else {
          li.classList.remove('checklist-item--checked');
        }
      }
      updateProgress(checklistId, data.progress, null, null);
      // Refresh label counts via a secondary fetch if needed
      if (data.checked_count !== undefined) {
        updateProgress(checklistId, data.progress, data.checked_count, data.total_count);
      }
    })
    .catch(function () {
      checkbox.checked = !checkbox.checked;
      var li = document.getElementById('checklist-item-' + itemId);
      if (li) li.classList.toggle('checklist-item--checked');
    });
  }

  function inlineEditTitle(checklistId) {
    var titleSpan = document.querySelector('.checklist-block-title[data-checklist-id="' + checklistId + '"]');
    var editForm  = document.getElementById('checklist-title-form-' + checklistId);
    if (!titleSpan || !editForm) return;

    titleSpan.style.display = 'none';
    editForm.style.display  = '';
    editForm.querySelector('.checklist-title-input').focus();
  }

  function cancelEditTitle(checklistId) {
    var titleSpan = document.querySelector('.checklist-block-title[data-checklist-id="' + checklistId + '"]');
    var editForm  = document.getElementById('checklist-title-form-' + checklistId);
    if (!titleSpan || !editForm) return;

    editForm.style.display  = 'none';
    titleSpan.style.display = '';
  }

  function bindEvents() {
    var container = document.getElementById('checklists-section');
    if (!container) return;

    // Show the "new checklist" form
    container.addEventListener('click', function (e) {
      var target = e.target;

      if (target.id === 'btn-add-checklist' || target.closest('#btn-add-checklist')) {
        e.preventDefault();
        var newForm = document.getElementById('checklist-new-form');
        var wrapper = newForm ? newForm.closest('.checklist-new-form') : null;
        if (wrapper) wrapper.style.display = '';
        if (newForm) {
          newForm.querySelector('.checklist-new-title-input').focus();
          target.style.display = 'none';
        }
      }

      // Cancel new checklist
      if (target.id === 'btn-cancel-checklist' || target.closest('#btn-cancel-checklist')) {
        e.preventDefault();
        var newForm2 = document.getElementById('checklist-new-form');
        var wrapper2 = newForm2 ? newForm2.closest('.checklist-new-form') : null;
        if (wrapper2) wrapper2.style.display = 'none';
        var addBtn = document.getElementById('btn-add-checklist');
        if (addBtn) addBtn.style.display = '';
      }

      // Inline edit title button
      var editBtn = target.closest('.checklist-edit-title-btn');
      if (editBtn) {
        e.preventDefault();
        inlineEditTitle(editBtn.dataset.checklistId);
      }

      // Cancel inline edit
      if (target.closest('.checklist-cancel-edit')) {
        e.preventDefault();
        var form = target.closest('.checklist-inline-edit');
        if (form) cancelEditTitle(form.id.replace('checklist-title-form-', ''));
      }
    });

    // Toggle checkbox
    container.addEventListener('change', function (e) {
      if (e.target.classList.contains('checklist-item-toggle')) {
        var checkbox    = e.target;
        var itemId      = checkbox.dataset.itemId;
        var checklistId = checkbox.dataset.checklistId;
        toggleItem(itemId, checklistId, checkbox);
      }
    });

    // Enter key on add-item input submits the form
    container.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && e.target.classList.contains('checklist-item-input')) {
        e.preventDefault();
        var form = e.target.closest('form');
        if (form) form.requestSubmit();
      }
      if (e.key === 'Escape' && e.target.classList.contains('checklist-new-title-input')) {
        var cancelBtn = document.getElementById('btn-cancel-checklist');
        if (cancelBtn) cancelBtn.click();
      }
    });
  }

  function init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', bindEvents);
    } else {
      bindEvents();
    }
  }

  init();

  return { updateProgress: updateProgress };
})();
