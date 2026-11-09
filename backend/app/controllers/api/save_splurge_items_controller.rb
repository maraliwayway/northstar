module Api
  class SaveSplurgeItemsController < ApplicationController
    include CrudActions

    private

    def scope
      current_user.save_splurge_items
    end

    def record_params
      params.require(:save_splurge_item).permit(:kind, :label)
    end
  end
end
