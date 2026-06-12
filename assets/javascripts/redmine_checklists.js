if (!window._RedmineChecklistsLoaded) {
window._RedmineChecklistsLoaded = true;

var RedmineChecklists = (function () {
  'use strict';

  /* ── Helpers ───────────────────────────────────────────────────────────────── */

  function csrfToken() {
    var meta = document.querySelector('meta[name="csrf-token"]');
    return meta ? meta.getAttribute('content') : '';
  }

  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* ── Server-backed checklist progress update ───────────────────────────────── */

  function updateProgress(checklistId, percent, checkedCount, totalCount) {
    document.querySelectorAll('[id="checklist-progress-fill-' + checklistId + '"]').forEach(function (fill) {
      fill.style.width = percent + '%';
    });

    document.querySelectorAll('#checklist-' + checklistId + ' .checklist-block-progress-label').forEach(function (label) {
      label.textContent = checkedCount + '/' + totalCount;
    });

    if (totalCount > 0) {
      document.querySelectorAll('#checklist-' + checklistId).forEach(function (block) {
        if (!block.querySelector('.checklist-progress-fill')) {
          var fillDiv       = document.createElement('div');
          fillDiv.className = 'checklist-progress-fill';
          fillDiv.id        = 'checklist-progress-fill-' + checklistId;
          fillDiv.style.width = percent + '%';
          var bar           = document.createElement('div');
          bar.className     = 'checklist-progress-bar';
          bar.appendChild(fillDiv);
          var header = block.querySelector('.checklist-block-header');
          if (header) header.insertAdjacentElement('afterend', bar);
        }
      });
    }
  }

  /* ── Item AJAX toggle ──────────────────────────────────────────────────────── */

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
      document.querySelectorAll('#checklist-item-' + itemId).forEach(function (li) {
        li.classList.toggle('checklist-item--checked', data.checked);
      });
      updateProgress(checklistId, data.progress, data.checked_count, data.total_count);
    })
    .catch(function () { checkbox.checked = !checkbox.checked; });
  }

  /* ── Bulk panel open / close ───────────────────────────────────────────────── */

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

  /* ── File → textarea ───────────────────────────────────────────────────────── */

  function readFileIntoTextarea(fileInput) {
    var file = fileInput.files[0];
    if (!file) return;
    var textarea = fileInput.dataset.textarea
      ? document.getElementById(fileInput.dataset.textarea)
      : null;
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

  /* ── Navigate without triggering Redmine's beforeunload warning ───────────── */

  function navigate(url) {
    document.querySelectorAll(
      '.checklist-bulk-textarea, .checklist-new-title-input, .checklist-file-input'
    ).forEach(function (el) { el.value = ''; });
    window.location.href = url;
  }

  /* ── Server-backed section event binding ───────────────────────────────────── */

  function bindSection(section) {
    if (section._checklistsBound) return;
    section._checklistsBound = true;

    section.addEventListener('click', function (e) {
      var t = e.target;

      /* Add checklist button */
      var addBtn = t.classList.contains('checklists-add-btn')
        ? t : (t.closest && t.closest('.checklists-add-btn'));
      if (addBtn) {
        e.preventDefault();
        var form = document.getElementById(addBtn.dataset.target);
        if (form) { form.style.display = ''; form.querySelector('input[type=text]').focus(); }
        addBtn.style.display = 'none';
        return;
      }

      /* Cancel new checklist */
      var cancelBtn = t.classList.contains('checklists-cancel-btn')
        ? t : (t.closest && t.closest('.checklists-cancel-btn'));
      if (cancelBtn) {
        e.preventDefault();
        var form = document.getElementById(cancelBtn.dataset.form);
        var btn  = document.getElementById(cancelBtn.dataset.btn);
        if (form) form.style.display = 'none';
        if (btn)  btn.style.display  = '';
        return;
      }

      /* Bulk add panel open */
      var toggleEl = t.classList.contains('checklist-add-toggle')
        ? t : (t.closest && t.closest('.checklist-add-toggle'));
      if (toggleEl) {
        e.preventDefault();
        openPanel(toggleEl.dataset.panel);
        var row = toggleEl.closest('.checklist-add-toggle-row');
        if (row) row.style.display = 'none';
        return;
      }

      /* Bulk add panel close */
      var cancelEl = t.classList.contains('checklist-add-cancel')
        ? t : (t.closest && t.closest('.checklist-add-cancel'));
      if (cancelEl) {
        e.preventDefault();
        closePanel(cancelEl.dataset.panel);
        var area = cancelEl.closest('.checklist-add-area');
        if (area) {
          var toggleRow = area.querySelector('.checklist-add-toggle-row');
          if (toggleRow) toggleRow.style.display = '';
        }
        return;
      }

      /* Delete checklist (AJAX) */
      var delCL = t.classList.contains('checklist-delete-btn')
        ? t : (t.closest && t.closest('.checklist-delete-btn'));
      if (delCL) {
        e.preventDefault();
        if (delCL.dataset.confirm && !window.confirm(delCL.dataset.confirm)) return;
        fetch(delCL.dataset.url, {
          method: 'DELETE',
          headers: { 'X-CSRF-Token': csrfToken() }
        }).then(function (r) { if (r.ok) navigate(r.url); });
        return;
      }

      /* Delete item (AJAX) */
      var delIt = t.classList.contains('checklist-item-del')
        ? t : (t.closest && t.closest('.checklist-item-del'));
      if (delIt) {
        e.preventDefault();
        if (delIt.dataset.confirm && !window.confirm(delIt.dataset.confirm)) return;
        fetch(delIt.dataset.url, {
          method: 'DELETE',
          headers: { 'X-CSRF-Token': csrfToken() }
        }).then(function (r) { if (r.ok) navigate(r.url); });
        return;
      }

      /* Save bulk items via AJAX (no nested form) */
      var bulkSave = t.classList.contains('checklist-bulk-save-btn')
        ? t : (t.closest && t.closest('.checklist-bulk-save-btn'));
      if (bulkSave) {
        e.preventDefault();
        var textarea  = document.getElementById(bulkSave.dataset.textarea);
        var fileInput = document.getElementById(bulkSave.dataset.file);
        var fd = new FormData();
        if (fileInput && fileInput.files[0]) {
          fd.append('checklist_item[file]', fileInput.files[0]);
        } else {
          fd.append('checklist_item[subjects]', textarea ? textarea.value : '');
        }
        bulkSave.disabled = true;
        fetch(bulkSave.dataset.url, {
          method: 'POST',
          headers: { 'X-CSRF-Token': csrfToken() },
          body: fd
        }).then(function (r) {
          if (r.ok) { navigate(r.url); }
          else { bulkSave.disabled = false; }
        }).catch(function () { bulkSave.disabled = false; });
        return;
      }

      /* Create new checklist via AJAX (no nested form) */
      var createBtn = t.classList.contains('checklist-create-btn')
        ? t : (t.closest && t.closest('.checklist-create-btn'));
      if (createBtn) {
        e.preventDefault();
        var titleInput = document.getElementById(createBtn.dataset.title);
        var title = titleInput ? titleInput.value.trim() : '';
        if (!title) { if (titleInput) titleInput.focus(); return; }
        var fd2 = new FormData();
        fd2.append('checklist[title]', title);
        createBtn.disabled = true;
        fetch(createBtn.dataset.url, {
          method: 'POST',
          headers: { 'X-CSRF-Token': csrfToken() },
          body: fd2
        }).then(function (r) {
          if (r.ok) { navigate(r.url); }
          else { createBtn.disabled = false; }
        }).catch(function () { createBtn.disabled = false; });
        return;
      }
    });

    section.addEventListener('change', function (e) {
      if (e.target.classList.contains('checklist-item-toggle')) {
        toggleItem(e.target.dataset.itemId, e.target.dataset.checklistId, e.target);
        return;
      }
      if (e.target.classList.contains('checklist-file-input')) {
        readFileIntoTextarea(e.target);
      }
    });
  }

  /* ── Virtual checklists (new issue form) ───────────────────────────────────── */

  var VirtualChecklists = (function () {
    var state = []; // [{ title, items: [] }]

    function syncHidden() {
      var input = document.getElementById('checklists-data-field');
      if (input) input.value = JSON.stringify(state);
    }

    function i18n() {
      var s = document.getElementById('checklists-section-new');
      if (!s) return {};
      return {
        titlePlaceholder: s.dataset.i18nTitlePlaceholder || 'Checklist title…',
        addItems:         s.dataset.i18nAddItems         || 'Add items',
        itemsPlaceholder: s.dataset.i18nItemsPlaceholder || 'One item per line…',
        importFile:       s.dataset.i18nImportFile       || 'Import file',
        create:           s.dataset.i18nCreate           || 'Create checklist',
        save:             s.dataset.i18nSave             || 'Save',
        cancel:           s.dataset.i18nCancel           || 'Cancel',
        del:              s.dataset.i18nDelete           || 'Delete'
      };
    }

    function checklistHtml(idx) {
      var t = i18n();
      var cl = state[idx];
      var itemsHtml = cl.items.map(function (s, i) {
        return '<li class="checklist-item" id="vi-item-' + idx + '-' + i + '">' +
               '<span class="checklist-item-subject">' + escHtml(s) + '</span>' +
               '<button type="button" class="icon icon-del checklist-item-del virtual-item-del" ' +
               'data-cidx="' + idx + '" data-iidx="' + i + '" ' +
               'style="background:none;border:none;cursor:pointer;"></button></li>';
      }).join('');

      return '<div class="checklist-block" id="vi-checklist-' + idx + '">' +
             '<div class="checklist-block-header">' +
             '<span class="checklist-block-title">' + escHtml(cl.title) + '</span>' +
             '<span class="checklist-block-progress-label">0/' + cl.items.length + '</span>' +
             '<button type="button" class="icon icon-del checklist-delete-btn virtual-checklist-del" ' +
             'data-idx="' + idx + '" style="background:none;border:none;cursor:pointer;" ' +
             'title="' + escHtml(t.del) + '"></button>' +
             '</div>' +
             '<ul class="checklist-items">' + itemsHtml + '</ul>' +
             '<div class="checklist-add-area">' +
             '<div class="checklist-add-toggle-row">' +
             '<a href="#" class="checklist-add-toggle icon icon-add" data-panel="vi-bulk-' + idx + '">' +
             escHtml(t.addItems) + '</a></div>' +
             '<div class="checklist-add-panel" id="vi-bulk-' + idx + '" style="display:none;">' +
             '<textarea class="checklist-bulk-textarea" id="vi-textarea-' + idx + '" rows="4" ' +
             'placeholder="' + escHtml(t.itemsPlaceholder) + '"></textarea>' +
             '<div class="checklist-file-row">' +
             '<label class="checklist-file-label" for="vi-file-' + idx + '">' +
             escHtml(t.importFile) +
             '<input type="file" id="vi-file-' + idx + '" class="checklist-file-input" ' +
             'accept=".txt,.csv" data-textarea="vi-textarea-' + idx + '"></label></div>' +
             '<div class="checklist-add-actions">' +
             '<button type="button" class="button virtual-bulk-save-btn" data-idx="' + idx + '">' +
             escHtml(t.save) + '</button>' +
             '<a href="#" class="checklist-add-cancel" data-panel="vi-bulk-' + idx + '">' +
             escHtml(t.cancel) + '</a></div></div></div></div>';
    }

    function rerender() {
      var list = document.getElementById('checklists-list-new');
      if (!list) return;
      list.innerHTML = state.map(function (_, idx) { return checklistHtml(idx); }).join('');
      syncHidden();
    }

    function addChecklist(title) {
      state.push({ title: title.slice(0, 255), items: [] });
      rerender();
    }

    function removeChecklist(idx) {
      state.splice(idx, 1);
      rerender();
    }

    function addItems(idx, subjects) {
      subjects.forEach(function (s) { state[idx].items.push(s.slice(0, 255)); });
      rerender();
    }

    function removeItem(cidx, iidx) {
      state[cidx].items.splice(iidx, 1);
      rerender();
    }

    function bindSection(section) {
      section.addEventListener('click', function (e) {
        var t = e.target;

        /* Add checklist button (shared handler via checklists-add-btn class) */
        var addBtn = t.classList.contains('checklists-add-btn')
          ? t : (t.closest && t.closest('.checklists-add-btn'));
        if (addBtn) {
          e.preventDefault();
          var form = document.getElementById(addBtn.dataset.target);
          if (form) { form.style.display = ''; form.querySelector('input[type=text]').focus(); }
          addBtn.style.display = 'none';
          return;
        }

        /* Cancel new checklist (shared) */
        var cancelBtn = t.classList.contains('checklists-cancel-btn')
          ? t : (t.closest && t.closest('.checklists-cancel-btn'));
        if (cancelBtn) {
          e.preventDefault();
          var form = document.getElementById(cancelBtn.dataset.form);
          var btn  = document.getElementById(cancelBtn.dataset.btn);
          if (form) form.style.display = 'none';
          if (btn)  btn.style.display  = '';
          return;
        }

        /* Create virtual checklist */
        var createBtn = t.classList.contains('virtual-create-btn')
          ? t : (t.closest && t.closest('.virtual-create-btn'));
        if (createBtn) {
          var titleInput = document.getElementById('virtual-new-checklist-title');
          var title = titleInput ? titleInput.value.trim() : '';
          if (!title) { if (titleInput) titleInput.focus(); return; }
          addChecklist(title);
          var newForm = document.getElementById('checklist-new-form-new');
          var addBtnEl = document.getElementById('btn-add-checklist-new');
          if (newForm) newForm.style.display = 'none';
          if (addBtnEl) addBtnEl.style.display = '';
          if (titleInput) titleInput.value = '';
          return;
        }

        /* Virtual bulk save */
        var bulkSave = t.classList.contains('virtual-bulk-save-btn')
          ? t : (t.closest && t.closest('.virtual-bulk-save-btn'));
        if (bulkSave) {
          var idx = parseInt(bulkSave.dataset.idx, 10);
          var textarea = document.getElementById('vi-textarea-' + idx);
          if (!textarea) return;
          var subjects = textarea.value.split(/\r?\n/).map(function (s) { return s.trim(); }).filter(Boolean);
          if (subjects.length) addItems(idx, subjects);
          closePanel('vi-bulk-' + idx);
          var area = bulkSave.closest('.checklist-add-area');
          if (area) { var tr = area.querySelector('.checklist-add-toggle-row'); if (tr) tr.style.display = ''; }
          return;
        }

        /* Delete virtual checklist */
        var delCL = t.classList.contains('virtual-checklist-del')
          ? t : (t.closest && t.closest('.virtual-checklist-del'));
        if (delCL) {
          e.preventDefault();
          removeChecklist(parseInt(delCL.dataset.idx, 10));
          return;
        }

        /* Delete virtual item */
        var delItem = t.classList.contains('virtual-item-del')
          ? t : (t.closest && t.closest('.virtual-item-del'));
        if (delItem) {
          e.preventDefault();
          removeItem(parseInt(delItem.dataset.cidx, 10), parseInt(delItem.dataset.iidx, 10));
          return;
        }

        /* Bulk add panel open (shared) */
        var toggleEl = t.classList.contains('checklist-add-toggle')
          ? t : (t.closest && t.closest('.checklist-add-toggle'));
        if (toggleEl) {
          e.preventDefault();
          openPanel(toggleEl.dataset.panel);
          var row = toggleEl.closest('.checklist-add-toggle-row');
          if (row) row.style.display = 'none';
          return;
        }

        /* Bulk add panel close (shared) */
        var cancelEl = t.classList.contains('checklist-add-cancel')
          ? t : (t.closest && t.closest('.checklist-add-cancel'));
        if (cancelEl) {
          e.preventDefault();
          closePanel(cancelEl.dataset.panel);
          var area = cancelEl.closest('.checklist-add-area');
          if (area) { var tr = area.querySelector('.checklist-add-toggle-row'); if (tr) tr.style.display = ''; }
        }
      });

      section.addEventListener('change', function (e) {
        if (e.target.classList.contains('checklist-file-input')) {
          readFileIntoTextarea(e.target);
        }
      });

      /* Serialize before Redmine form submit */
      var issueForm = section.closest('form');
      if (issueForm) {
        issueForm.addEventListener('submit', function () { syncHidden(); });
      }
    }

    function init() {
      var section = document.getElementById('checklists-section-new');
      if (!section) return;
      bindSection(section);
    }

    return { init: init };
  })();

  /* ── Bootstrap ─────────────────────────────────────────────────────────────── */

  function bindEvents() {
    document.querySelectorAll('.checklists-section:not([data-virtual])').forEach(bindSection);
    VirtualChecklists.init();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindEvents);
  } else {
    bindEvents();
  }

  return { updateProgress: updateProgress };
})();

} // end _RedmineChecklistsLoaded guard
