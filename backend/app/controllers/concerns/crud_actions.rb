# Shared REST actions for resources that belong to the signed-in user.
# Including controllers define `scope`, `record_params` and optionally `ordering`.
module CrudActions
  extend ActiveSupport::Concern

  included do
    before_action :set_record, only: %i[show update destroy]
  end

  def index
    render json: scope.order(ordering)
  end

  def show
    render json: @record
  end

  def create
    record = scope.new(record_params)
    if record.save
      render json: record, status: :created
    else
      render_errors(record)
    end
  end

  def update
    if @record.update(record_params)
      render json: @record
    else
      render_errors(@record)
    end
  end

  def destroy
    @record.destroy!
    head :no_content
  end

  private

  def set_record
    @record = scope.find(params[:id])
  end

  def ordering
    { created_at: :asc }
  end
end
