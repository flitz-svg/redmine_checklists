module RedmineChecklists
  class Hooks < Redmine::Hook::ViewListener
    render_on :view_issues_show_details_bottom, partial: 'checklists/section'
  end
end
