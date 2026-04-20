class ChecklistsController < ApplicationController
  before_action :require_login
  before_action :find_issue,     only: [:create]
  before_action :find_checklist, only: [:update, :destroy]
  before_action :authorize_edit

  def create
    @checklist = @issue.checklists.build(checklist_params)
    if @checklist.save
      respond_to do |format|
        format.js
        format.html { redirect_to issue_path(@issue) }
      end
    else
      respond_to do |format|
        format.js   { render :error, status: :unprocessable_entity }
        format.html { redirect_to issue_path(@issue), alert: @checklist.errors.full_messages.join(', ') }
      end
    end
  end

  def update
    if @checklist.update(checklist_params)
      respond_to do |format|
        format.json { render json: { title: @checklist.title } }
        format.html { redirect_to issue_path(@checklist.issue) }
      end
    else
      respond_to do |format|
        format.json { render json: { errors: @checklist.errors.full_messages }, status: :unprocessable_entity }
        format.html { redirect_to issue_path(@checklist.issue), alert: @checklist.errors.full_messages.join(', ') }
      end
    end
  end

  def destroy
    @issue = @checklist.issue
    @checklist.destroy
    respond_to do |format|
      format.js
      format.html { redirect_to issue_path(@issue) }
    end
  end

  private

  def find_issue
    @issue = Issue.find(params[:issue_id])
  rescue ActiveRecord::RecordNotFound
    render_404
  end

  def find_checklist
    @checklist = Checklist.find(params[:id])
    @issue     = @checklist.issue
  rescue ActiveRecord::RecordNotFound
    render_404
  end

  def authorize_edit
    unless @issue.visible? && @issue.editable?
      render_403
    end
  end

  def checklist_params
    params.require(:checklist).permit(:title)
  end
end
