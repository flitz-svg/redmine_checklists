class CreateChecklists < ActiveRecord::Migration[7.2]
  def change
    create_table :checklists do |t|
      t.integer :issue_id, null: false
      t.string  :title,    null: false, limit: 255
      t.integer :position, null: false, default: 0
      t.timestamps null: false
    end

    add_index :checklists, :issue_id
  end
end
