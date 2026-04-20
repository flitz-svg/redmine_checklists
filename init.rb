Redmine::Plugin.register :redmine_checklists do
  name        'Redmine Checklists'
  description 'Checklists independientes para peticiones de Redmine'
  version     '1.0.0'

  requires_redmine version_or_higher: '5.0'
end

Rails.application.config.to_prepare do
  require File.join(File.dirname(__FILE__), 'lib', 'redmine_checklists', 'issue_patch')
  require File.join(File.dirname(__FILE__), 'lib', 'redmine_checklists', 'hooks')

  Issue.include(RedmineChecklists::IssuePatch) unless Issue.include?(RedmineChecklists::IssuePatch)
end
