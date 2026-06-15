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
      /* Sync every copy of this item across all sections on the page
         (the show page can show the checklist both up top and in the edit form). */
      document.querySelectorAll('#checklist-item-' + itemId).forEach(function (li) {
        li.classList.toggle('checklist-item--checked', data.checked);
      });
      document.querySelectorAll('.checklist-item-toggle[data-item-id="' + itemId + '"]').forEach(function (cb) {
        cb.checked = data.checked;
      });
      updateProgress(checklistId, data.progress, data.checked_count, data.total_count);
    })
    .catch(function () { checkbox.checked = !checkbox.checked; });
  }

  /* ── Section-scoped element lookup ─────────────────────────────────────────── */

  /* Two sections can be on the page at once (details + edit form), so the same
     element id may appear twice. Resolve ids within the clicked button's own
     section instead of globally. */
  function inSection(el, id) {
    var section = el.closest && el.closest('.checklists-section');
    return section ? section.querySelector('[id="' + id + '"]') : document.getElementById(id);
  }

  /* ── Bulk panel open / close ───────────────────────────────────────────────── */

  function openPanel(panel) {
    if (!panel) return;
    panel.style.display = '';
    var textarea = panel.querySelector('textarea');
    if (textarea) textarea.focus();
  }

  function closePanel(panel) {
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
      ? inSection(fileInput, fileInput.dataset.textarea)
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

  /* ── In-place list refresh (no full page reload) ───────────────────────────── */

  /* Server actions return the rendered checklist collection HTML. Swap it into
     every server-backed list container on the page so the details copy and the
     edit-form copy stay in sync. Section elements are never replaced, so their
     delegated event listeners keep working. */
  function refreshList(fromEl, html) {
    var lists = document.querySelectorAll('[id^="checklists-list-"]');
    if (!lists.length) { window.location.reload(); return; }
    lists.forEach(function (list) {
      /* The new-issue (virtual) list is client-managed — never overwrite it. */
      if (list.id === 'checklists-list-new') return;
      list.innerHTML = html;
    });
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
        openPanel(inSection(toggleEl, toggleEl.dataset.panel));
        var row = toggleEl.closest('.checklist-add-toggle-row');
        if (row) row.style.display = 'none';
        return;
      }

      /* Bulk add panel close */
      var cancelEl = t.classList.contains('checklist-add-cancel')
        ? t : (t.closest && t.closest('.checklist-add-cancel'));
      if (cancelEl) {
        e.preventDefault();
        closePanel(inSection(cancelEl, cancelEl.dataset.panel));
        var area = cancelEl.closest('.checklist-add-area');
        if (area) {
          var toggleRow = area.querySelector('.checklist-add-toggle-row');
          if (toggleRow) toggleRow.style.display = '';
        }
        return;
      }

      /* Delete checklist (AJAX, in-place) */
      var delCL = t.classList.contains('checklist-delete-btn')
        ? t : (t.closest && t.closest('.checklist-delete-btn'));
      if (delCL) {
        e.preventDefault();
        if (delCL.dataset.checklistConfirm && !window.confirm(delCL.dataset.checklistConfirm)) return;
        fetch(delCL.dataset.url, {
          method: 'DELETE',
          headers: { 'X-CSRF-Token': csrfToken(), 'X-Requested-With': 'XMLHttpRequest' }
        }).then(function (r) {
          if (!r.ok) throw new Error('failed');
          return r.text();
        }).then(function (html) { refreshList(delCL, html); })
          .catch(function () {});
        return;
      }

      /* Delete item (AJAX, in-place) */
      var delIt = t.classList.contains('checklist-item-del')
        ? t : (t.closest && t.closest('.checklist-item-del'));
      if (delIt) {
        e.preventDefault();
        if (delIt.dataset.checklistConfirm && !window.confirm(delIt.dataset.checklistConfirm)) return;
        fetch(delIt.dataset.url, {
          method: 'DELETE',
          headers: { 'X-CSRF-Token': csrfToken(), 'X-Requested-With': 'XMLHttpRequest' }
        }).then(function (r) {
          if (!r.ok) throw new Error('failed');
          return r.text();
        }).then(function (html) { refreshList(delIt, html); })
          .catch(function () {});
        return;
      }

      /* Save bulk items via AJAX (no nested form) */
      var bulkSave = t.classList.contains('checklist-bulk-save-btn')
        ? t : (t.closest && t.closest('.checklist-bulk-save-btn'));
      if (bulkSave) {
        e.preventDefault();
        var textarea  = inSection(bulkSave, bulkSave.dataset.textarea);
        var fileInput = inSection(bulkSave, bulkSave.dataset.file);
        var fd = new FormData();
        if (fileInput && fileInput.files[0]) {
          fd.append('checklist_item[file]', fileInput.files[0]);
        } else {
          fd.append('checklist_item[subjects]', textarea ? textarea.value : '');
        }
        bulkSave.disabled = true;
        fetch(bulkSave.dataset.url, {
          method: 'POST',
          headers: { 'X-CSRF-Token': csrfToken(), 'X-Requested-With': 'XMLHttpRequest' },
          body: fd
        }).then(function (r) {
          if (!r.ok) throw new Error('failed');
          return r.text();
        }).then(function (html) { refreshList(bulkSave, html); })
          .catch(function () { bulkSave.disabled = false; });
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
          headers: { 'X-CSRF-Token': csrfToken(), 'X-Requested-With': 'XMLHttpRequest' },
          body: fd2
        }).then(function (r) {
          if (!r.ok) throw new Error('failed');
          return r.text();
        }).then(function (html) {
          refreshList(createBtn, html);
          createBtn.disabled = false;
          if (titleInput) titleInput.value = '';
          /* Collapse the "new checklist" form and restore the add button */
          var section = createBtn.closest('.checklists-section');
          var formEl  = createBtn.closest('.checklist-new-form');
          if (formEl) formEl.style.display = 'none';
          if (section) {
            var addB = section.querySelector('.checklists-add-btn');
            if (addB) addB.style.display = '';
          }
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

    /* All handlers are delegated from `document` so they survive Redmine
       re-rendering the new-issue form via AJAX (project/tracker change wipes
       and re-inserts #all_attributes, which contains our section). */

    function onClick(e) {
      var t = e.target;
      if (!t.closest || !t.closest('#checklists-section-new')) return;

      /* Add checklist button (shared handler via checklists-add-btn class) */
      var addBtn = t.classList.contains('checklists-add-btn')
        ? t : t.closest('.checklists-add-btn');
      if (addBtn) {
        e.preventDefault();
        var form = document.getElementById(addBtn.dataset.target);
        if (form) { form.style.display = ''; var inp = form.querySelector('input[type=text]'); if (inp) inp.focus(); }
        addBtn.style.display = 'none';
        return;
      }

      /* Cancel new checklist (shared) */
      var cancelBtn = t.classList.contains('checklists-cancel-btn')
        ? t : t.closest('.checklists-cancel-btn');
      if (cancelBtn) {
        e.preventDefault();
        var cform = document.getElementById(cancelBtn.dataset.form);
        var cbtn  = document.getElementById(cancelBtn.dataset.btn);
        if (cform) cform.style.display = 'none';
        if (cbtn)  cbtn.style.display  = '';
        return;
      }

      /* Create virtual checklist */
      var createBtn = t.classList.contains('virtual-create-btn')
        ? t : t.closest('.virtual-create-btn');
      if (createBtn) {
        e.preventDefault();
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
        ? t : t.closest('.virtual-bulk-save-btn');
      if (bulkSave) {
        e.preventDefault();
        var idx = parseInt(bulkSave.dataset.idx, 10);
        var textarea = document.getElementById('vi-textarea-' + idx);
        if (!textarea) return;
        var subjects = textarea.value.split(/\r?\n/).map(function (s) { return s.trim(); }).filter(Boolean);
        if (subjects.length) addItems(idx, subjects);
        closePanel(inSection(bulkSave, 'vi-bulk-' + idx));
        var area = bulkSave.closest('.checklist-add-area');
        if (area) { var tr = area.querySelector('.checklist-add-toggle-row'); if (tr) tr.style.display = ''; }
        return;
      }

      /* Delete virtual checklist */
      var delCL = t.classList.contains('virtual-checklist-del')
        ? t : t.closest('.virtual-checklist-del');
      if (delCL) {
        e.preventDefault();
        removeChecklist(parseInt(delCL.dataset.idx, 10));
        return;
      }

      /* Delete virtual item */
      var delItem = t.classList.contains('virtual-item-del')
        ? t : t.closest('.virtual-item-del');
      if (delItem) {
        e.preventDefault();
        removeItem(parseInt(delItem.dataset.cidx, 10), parseInt(delItem.dataset.iidx, 10));
        return;
      }

      /* Bulk add panel open (shared) */
      var toggleEl = t.classList.contains('checklist-add-toggle')
        ? t : t.closest('.checklist-add-toggle');
      if (toggleEl) {
        e.preventDefault();
        openPanel(inSection(toggleEl, toggleEl.dataset.panel));
        var row = toggleEl.closest('.checklist-add-toggle-row');
        if (row) row.style.display = 'none';
        return;
      }

      /* Bulk add panel close (shared) */
      var cancelEl = t.classList.contains('checklist-add-cancel')
        ? t : t.closest('.checklist-add-cancel');
      if (cancelEl) {
        e.preventDefault();
        closePanel(inSection(cancelEl, cancelEl.dataset.panel));
        var carea = cancelEl.closest('.checklist-add-area');
        if (carea) { var ctr = carea.querySelector('.checklist-add-toggle-row'); if (ctr) ctr.style.display = ''; }
      }
    }

    function onChange(e) {
      if (!e.target.closest || !e.target.closest('#checklists-section-new')) return;
      if (e.target.classList.contains('checklist-file-input')) {
        readFileIntoTextarea(e.target);
      }
    }

    /* When Redmine re-renders the form via AJAX, the hidden field resets to
       "[]" and the list empties. Restore the in-memory state into the fresh DOM. */
    function restoreIfReplaced() {
      var field = document.getElementById('checklists-data-field');
      if (!field) return;
      if (field.value !== JSON.stringify(state)) rerender();
    }

    function init() {
      if (window._RC_virtualBound) return;
      window._RC_virtualBound = true;

      document.addEventListener('click', onClick);
      document.addEventListener('change', onChange);

      /* Serialize state right before the issue form submits (form element
         persists across AJAX updates, but bind on capture from document to be safe). */
      document.addEventListener('submit', function (e) {
        if (e.target && e.target.querySelector && e.target.querySelector('#checklists-data-field')) {
          syncHidden();
        }
      }, true);

      /* Watch the issue form for AJAX re-renders and restore visible state.
         Only on pages that actually have the form (new/edit), not on show. */
      var issueForm = document.getElementById('issue-form');
      if (issueForm && window.MutationObserver) {
        new MutationObserver(restoreIfReplaced).observe(issueForm, { childList: true, subtree: true });
      }
    }

    return { init: init };
  })();

  /* ── Bootstrap ─────────────────────────────────────────────────────────────── */

  function bindAllServerSections() {
    document.querySelectorAll('.checklists-section:not([data-virtual])').forEach(bindSection);
  }

  function bindEvents() {
    bindAllServerSections();
    VirtualChecklists.init();

    /* On the edit form, changing project/tracker makes Redmine re-render
       #all_attributes via AJAX, which replaces the server-backed section and
       drops its listeners. Re-bind whenever the form mutates. bindSection is
       idempotent (guarded by _checklistsBound), so this is safe to repeat. */
    var issueForm = document.getElementById('issue-form');
    if (issueForm && window.MutationObserver) {
      new MutationObserver(bindAllServerSections).observe(issueForm, { childList: true, subtree: true });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindEvents);
  } else {
    bindEvents();
  }

  return { updateProgress: updateProgress };
})();

} // end _RedmineChecklistsLoaded guard
