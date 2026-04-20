module RedmineChecklists
  module IssuePatch
    def self.included(base)
      base.has_many :checklists, -> { order(:position) }, dependent: :destroy
    end
  end
end
