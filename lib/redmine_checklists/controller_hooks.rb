module RedmineChecklists
  class ControllerHooks < Redmine::Hook::Listener
    def controller_issues_new_after_save(context = {})
      process_checklists_data(context[:issue], context[:params])
    end

    private

    def process_checklists_data(issue, params)
      return unless issue&.persisted?

      raw = params.dig(:issue, :checklists_data).to_s
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
    rescue JSON::ParserError, ActiveRecord::RecordInvalid => e
      Rails.logger.error "[RedmineChecklists] Failed to process checklists on issue create: #{e.message}"
    end
  end
end
