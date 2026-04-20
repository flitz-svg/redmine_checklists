RedmineApp::Application.routes.draw do
  post   'issues/:issue_id/checklists',        to: 'checklists#create',      as: :issue_checklists
  patch  'checklists/:id',                     to: 'checklists#update',      as: :checklist
  delete 'checklists/:id',                     to: 'checklists#destroy'

  post   'checklists/:checklist_id/items',     to: 'checklist_items#create', as: :checklist_checklist_items
  delete 'checklist_items/:id',                to: 'checklist_items#destroy', as: :checklist_item
  patch  'checklist_items/:id/toggle',         to: 'checklist_items#toggle', as: :toggle_checklist_item
end
