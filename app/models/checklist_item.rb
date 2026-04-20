class ChecklistItem < ActiveRecord::Base
  belongs_to :checklist

  validates :subject,      presence: true, length: { maximum: 255 }
  validates :checklist_id, presence: true

  acts_as_list scope: :checklist

  def toggle!
    update!(checked: !checked)
  end
end
