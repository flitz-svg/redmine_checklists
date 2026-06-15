class IssueChecklistsController < ApplicationController
  include RedmineChecklists::IssueJournaling

  before_action :require_login
  before_action :find_issue,     only: [:create]
  before_action :find_checklist, only: [:destroy]
  before_action :authorize_edit

  def create
    @checklist = @issue.issue_checklists.build(checklist_params)
    if @checklist.save
      add_checklist_journal(@issue, l(:text_journal_checklist_added, title: @checklist.title))
      respond_with_checklists
    else
      respond_with_error(@checklist.errors.full_messages.join(', '))
    end
  end

  def destroy
    @issue = @checklist.issue
    title  = @checklist.title
    @checklist.destroy
    add_checklist_journal(@issue, l(:text_journal_checklist_removed, title: title))
    respond_with_checklists
  end

  private

  # AJAX callers get the re-rendered checklist list (in-place update);
  # plain requests fall back to a redirect so the feature degrades gracefully.
  def respond_with_checklists
    if request.xhr?
      checklists = @issue.issue_checklists.includes(:issue_checklist_items).order(:position)
      html = render_to_string(partial: 'checklists/checklist',
                              collection: checklists, as: :checklist,
                              locals: { issue: @issue, can_edit: true }) || ''
      render plain: html, content_type: 'text/html'
    else
      redirect_to issue_path(@issue)
    end
  end

  def respond_with_error(message)
    if request.xhr?
      render plain: message, status: :unprocessable_entity
    else
      redirect_to issue_path(@issue), flash: { error: message }
    end
  end

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
