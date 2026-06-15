class IssueChecklistItemsController < ApplicationController
  include RedmineChecklists::IssueJournaling

  before_action :require_login
  before_action :find_checklist, only: [:create, :bulk_create]
  before_action :find_item,      only: [:destroy, :toggle]
  before_action :authorize_edit

  def create
    @item = @checklist.issue_checklist_items.build(item_params)
    if @item.save
      add_checklist_journal(@issue, l(:text_journal_items_added, title: @checklist.title, items: @item.subject))
      respond_with_checklists
    else
      respond_with_error(@item.errors.full_messages.join(', '))
    end
  end

  def bulk_create
    raw = if params.dig(:checklist_item, :file).present?
      params[:checklist_item][:file].read.force_encoding('UTF-8')
    else
      params.dig(:checklist_item, :subjects).to_s
    end

    subjects = raw.split(/\r?\n/).map(&:strip).reject(&:empty?)

    return respond_with_error(l(:error_checklist_no_items)) if subjects.empty?

    subjects.each { |s| @checklist.issue_checklist_items.create!(subject: s.slice(0, 255)) }
    add_checklist_journal(@issue, l(:text_journal_items_added, title: @checklist.title, items: subjects.join(', ')))
    respond_with_checklists
  rescue ActiveRecord::RecordInvalid => e
    respond_with_error(e.message)
  end

  def destroy
    @checklist = @item.issue_checklist
    subject    = @item.subject
    @item.destroy
    add_checklist_journal(@issue, l(:text_journal_item_removed, title: @checklist.title, item: subject))
    respond_with_checklists
  end

  def toggle
    @checklist = @item.issue_checklist
    @item.toggle!
    key = @item.checked ? :text_journal_item_checked : :text_journal_item_unchecked
    add_checklist_journal(@issue, l(key, title: @checklist.title, item: @item.subject))
    render json: {
      checked:       @item.checked,
      progress:      @checklist.progress_percent,
      checked_count: @checklist.checked_count,
      total_count:   @checklist.total_count
    }
  rescue ActiveRecord::RecordInvalid => e
    render json: { error: e.message }, status: :unprocessable_entity
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

  def find_checklist
    @checklist = IssueChecklist.find(params[:checklist_id])
    @issue     = @checklist.issue
  rescue ActiveRecord::RecordNotFound
    render_404
  end

  def find_item
    @item  = IssueChecklistItem.find(params[:id])
    @issue = @item.issue_checklist.issue
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
