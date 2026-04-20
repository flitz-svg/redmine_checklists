class ChecklistItemsController < ApplicationController
  before_action :require_login
  before_action :find_checklist, only: [:create]
  before_action :find_item,      only: [:destroy, :toggle]
  before_action :authorize_edit

  def create
    @item = @checklist.checklist_items.build(item_params)
    if @item.save
      respond_to do |format|
        format.js
        format.html { redirect_to issue_path(@checklist.issue) }
      end
    else
      respond_to do |format|
        format.js   { render :error, status: :unprocessable_entity }
        format.html { redirect_to issue_path(@checklist.issue), alert: @item.errors.full_messages.join(', ') }
      end
    end
  end

  def destroy
    @checklist = @item.checklist
    @item.destroy
    respond_to do |format|
      format.js
      format.html { redirect_to issue_path(@checklist.issue) }
    end
  end

  def toggle
    @checklist = @item.checklist
    @item.toggle!
    render json: { checked: @item.checked, progress: @checklist.progress_percent }
  rescue ActiveRecord::RecordInvalid => e
    render json: { error: e.message }, status: :unprocessable_entity
  end

  private

  def find_checklist
    @checklist = Checklist.find(params[:checklist_id])
    @issue     = @checklist.issue
  rescue ActiveRecord::RecordNotFound
    render_404
  end

  def find_item
    @item  = ChecklistItem.find(params[:id])
    @issue = @item.checklist.issue
  rescue ActiveRecord::RecordNotFound
    render_404
  end

  def authorize_edit
    unless @issue.visible? && @issue.editable?
      render_403
    end
  end

  def item_params
    params.require(:checklist_item).permit(:subject)
  end
end
