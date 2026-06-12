Redmine::Plugin.register :redmine_checklists do
  name        'Redmine Checklists'
  description 'Checklists independientes para peticiones de Redmine'
  version     '1.0.0'

  requires_redmine version_or_higher: '5.0'
end

require File.join(File.dirname(__FILE__), 'lib', 'redmine_checklists', 'hooks')
require File.join(File.dirname(__FILE__), 'lib', 'redmine_checklists', 'controller_hooks')

Rails.application.config.after_initialize do
  Issue.class_eval do
    has_many :issue_checklists, -> { order(:position) },
             class_name: 'IssueChecklist', dependent: :destroy unless reflect_on_association(:issue_checklists)
  end
end
