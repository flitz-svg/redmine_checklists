class IssueChecklistItem < ActiveRecord::Base
  belongs_to :issue_checklist

  validates :subject,           presence: true, length: { maximum: 255 }
  validates :issue_checklist_id, presence: true

  before_create :set_position

  def toggle!
    update!(checked: !checked)
  end

  private

  def set_position
    last = self.class.where(issue_checklist_id: issue_checklist_id).maximum(:position) || -1
    self.position = last + 1
  end
end
