Redmine::Plugin.register :redmine_checklists do
  name        'Redmine Checklists'
  description 'Independent, multi-checklist support for issues, with history tracking.'
  version     '1.0.0'
  author      'flitz-svg'
  url         'https://github.com/flitz-svg/redmine_checklists'
  author_url  'https://github.com/flitz-svg'

  requires_redmine version_or_higher: '5.0'
end

require File.join(File.dirname(__FILE__), 'lib', 'redmine_checklists', 'issue_journaling')
require File.join(File.dirname(__FILE__), 'lib', 'redmine_checklists', 'hooks')
require File.join(File.dirname(__FILE__), 'lib', 'redmine_checklists', 'controller_hooks')

Rails.application.config.after_initialize do
  Issue.class_eval do
    has_many :issue_checklists, -> { order(:position) },
             class_name: 'IssueChecklist', dependent: :destroy unless reflect_on_association(:issue_checklists)
  end
end
