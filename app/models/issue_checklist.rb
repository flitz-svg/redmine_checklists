class IssueChecklist < ActiveRecord::Base
  belongs_to :issue
  has_many   :issue_checklist_items, -> { order(:position) }, dependent: :destroy

  validates :title,    presence: true, length: { maximum: 255 }
  validates :issue_id, presence: true

  before_create :set_position

  def checked_count
    if issue_checklist_items.loaded?
      issue_checklist_items.count(&:checked)
    else
      issue_checklist_items.where(checked: true).count
    end
  end

  def total_count
    issue_checklist_items.loaded? ? issue_checklist_items.length : issue_checklist_items.count
  end

  def progress_percent
    return 0 if total_count.zero?
    (checked_count.to_f / total_count * 100).round
  end

  private

  def set_position
    last = self.class.where(issue_id: issue_id).maximum(:position) || -1
    self.position = last + 1
  end
end
