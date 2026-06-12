module RedmineChecklists
  class Hooks < Redmine::Hook::ViewListener
    render_on :view_issues_show_details_bottom, partial: 'checklists/section'
    render_on :view_issues_form_details_bottom, partial: 'checklists/section_form'
  end
end
