module RedmineChecklists
  # Shared helper to record checklist changes in the issue history,
  # so every change is tracked just like any other ticket update.
  module IssueJournaling
    private

    # Adds a note to the issue's journal. Email notifications are suppressed
    # on purpose: a checkbox toggle should leave a trace in the history,
    # not flood watchers with mail.
    def add_checklist_journal(issue, note)
      return if issue.blank? || note.blank?

      journal = Journal.new(journalized: issue, user: User.current, notes: note)
      journal.notify = false if journal.respond_to?(:notify=)
      journal.save
    rescue => e
      Rails.logger.error "[RedmineChecklists] Failed to write journal: #{e.message}"
    end
  end
end
