class IssueChecklistsController < ApplicationController
  before_action :require_login
  before_action :find_issue,     only: [:create]
  before_action :find_checklist, only: [:destroy]
  before_action :authorize_edit

  def create
    @checklist = @issue.issue_checklists.build(checklist_params)
    if @checklist.save
      redirect_to issue_path(@issue)
    else
      redirect_to issue_path(@issue),
                  flash: { error: @checklist.errors.full_messages.join(', ') }
    end
  end

  def destroy
    @issue = @checklist.issue
    @checklist.destroy
    redirect_to issue_path(@issue)
  end

  private

  def find_issue
    @issue = Issue.find(params[:issue_id])
  rescue ActiveRecord::RecordNotFound
    render_404
  end

  def find_checklist
    @checklist = IssueChecklist.find(params[:id])
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
