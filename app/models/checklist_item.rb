class ChecklistItem < ActiveRecord::Base
  belongs_to :checklist

  validates :subject,      presence: true, length: { maximum: 255 }
  validates :checklist_id, presence: true

  before_create :set_position

  def toggle!
    update!(checked: !checked)
  end

  private

  def set_position
    last = self.class.where(checklist_id: checklist_id).maximum(:position) || -1
    self.position = last + 1
  end
end
