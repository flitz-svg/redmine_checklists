module RedmineChecklists
  class ControllerHooks < Redmine::Hook::Listener
    def controller_issues_new_after_save(context = {})
      process_checklists_data(context[:issue], context[:params])
    rescue => e
      Rails.logger.error "[RedmineChecklists] Unexpected error in after_save hook: #{e.message}\n#{e.backtrace&.first(5)&.join("\n")}"
    end

    private

    def process_checklists_data(issue, params)
      return unless issue.is_a?(Issue) && issue.persisted?

      raw = params[:checklists_data].to_s
      return if raw.blank? || raw == '[]'

      data = JSON.parse(raw)
      return unless data.is_a?(Array)

      data.each do |cl|
        title = cl['title'].to_s.strip.slice(0, 255)
        next if title.empty?

        checklist = issue.issue_checklists.create!(title: title)

        Array(cl['items']).each do |subject|
          s = subject.to_s.strip.slice(0, 255)
          next if s.empty?
          checklist.issue_checklist_items.create!(subject: s)
        end
      end
    rescue => e
      Rails.logger.error "[RedmineChecklists] Failed to process checklists on issue create: #{e.message}\n#{e.backtrace&.first(3)&.join("\n")}"
    end
  end
end
