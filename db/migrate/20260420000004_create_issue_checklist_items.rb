class CreateIssueChecklistItems < ActiveRecord::Migration[7.2]
  def change
    create_table :issue_checklist_items do |t|
      t.integer :issue_checklist_id, null: false
      t.string  :subject,            null: false, limit: 255
      t.boolean :checked,            null: false, default: false
      t.integer :position,           null: false, default: 0
      t.timestamps null: false
    end
    add_index :issue_checklist_items, :issue_checklist_id
  end
end
