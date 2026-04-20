RedmineApp::Application.routes.draw do
  post   'issues/:issue_id/checklists',    to: 'issue_checklists#create',      as: :issue_checklists
  delete 'checklists/:id',                 to: 'issue_checklists#destroy',      as: :checklist

  post   'checklists/:checklist_id/items', to: 'issue_checklist_items#create',  as: :checklist_checklist_items
  delete 'checklist_items/:id',            to: 'issue_checklist_items#destroy', as: :checklist_item
  patch  'checklist_items/:id/toggle',     to: 'issue_checklist_items#toggle',  as: :toggle_checklist_item
end
