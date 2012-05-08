Webapp::Application.routes.draw do

  get "contact" => 'contact#index'
  post "contact" => 'contact#create'

  Mercury::Engine.routes

  devise_for :users, :path_names => { :sign_in => 'login', :sign_out => 'logout', :sign_up => 'signup' },
    :controllers => { :omniauth_callbacks => "users/omniauth_callbacks" }
  get 'banned' => 'pages#banned', :as => 'banned'

  resources :videos do 
    member do
      post 'priority'
      post 'abuse'
    end
  end

  resources :images do
    member do
      get 'download'
      post 'priority'
      post 'abuse'
      get 'new_step'
      put 'create_step'
    end
  end

  resources :texts do 
    member do
      get 'download'
      post 'priority'
      post 'abuse'
    end
  end

  resources :audios do 
    member do
      get 'download'
      post 'priority'
      post 'abuse'
    end
  end

 # resources :nodes

 # resources :connections do
 #   get 'search', :on => :collection
 # end

  get 'bank' => 'pages#bank'
  #get 'bank/editor' => 'mapmind#editor'

  get 'tags/search' => 'tags#search'
  get 'tags' => 'tags#index'
  match '/tags/show/:tag' => "tags#show"
  match '/tags/small/:tags' => "tags#small"

  get 'maps' => 'maps#index'
  match '/maps/search/:address' => "maps#search"
  get 'timeline' => 'timeline#index'

  get 'search' => 'search#search'
  get 'search/ajax' => 'search#ajax'

  constraints(:username => /[A-Za-z0-9\._\-]+/) do
    get 'profile/:username' => 'pages#profile', :as => 'profile'
    get 'profile/:username/timeline' => 'pages#timeline', :as => 'profile_timeline'
  end

  get 'admin/users' => 'admin/users#index'
  get 'admin/users/search' => 'admin/users#search'
  put 'admin/users/:username/update' => 'admin/users#update', :as => 'admin_users_update'

  root :to => 'pages#index'

  resources :pages do  
    member { post :mercury_update }  
  end  

end
