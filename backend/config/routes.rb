Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

  namespace :api do
    resource :registration, only: :create
    resource :session, only: %i[create destroy]
    resource :profile, only: %i[show update destroy] do
      post :route_raise
    end

    get "dashboard", to: "dashboard#show"
    get "allocation", to: "allocations#show"
    get "calculators/compound", to: "calculators#compound"

    resources :accounts, except: %i[new edit]
    resources :holdings, except: %i[new edit]
    resources :debts, except: %i[new edit] do
      get :plan, on: :collection
    end
    resources :expenses, except: %i[new edit] do
      collection do
        post :import
        get :summary
      end
    end
    resources :automation_rules, except: %i[new edit] do
      collection do
        patch :reorder
        post :template
      end
    end
    resources :net_worth_snapshots, only: %i[index create]
    resources :goals, except: %i[new edit]
    resources :income_experiments, except: %i[new edit]
    resources :save_splurge_items, only: %i[index create destroy]
    resources :reviews, except: %i[new edit]
  end
end
