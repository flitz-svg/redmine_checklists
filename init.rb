Redmine::Plugin.register :redmine_checklists do
  name        'Redmine Checklists'
  description 'Checklists independientes para peticiones de Redmine'
  version     '1.0.0'

  requires_redmine version_or_higher: '5.0'
end

require File.join(File.dirname(__FILE__), 'lib', 'redmine_checklists', 'hooks')

Rails.application.config.after_initialize do
  Issue.class_eval do
    has_many :checklists, -> { order(:position) }, dependent: :destroy,
             class_name: 'Checklist' unless reflect_on_association(:checklists)
  end
end
