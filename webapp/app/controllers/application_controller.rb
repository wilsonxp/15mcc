class ApplicationController < ActionController::Base

  protect_from_forgery

  rescue_from CanCan::AccessDenied do |exception|
    redirect_to root_url, :alert => exception.message
  end
  
  def after_sign_in_path_for(resource)
    if resource.is_a?(User) && resource.banned?
      sign_out resource
      banned_path
    else
      super
    end
  end

  protected

  def verify_captcha(model)
    unless user_signed_in?
      if verify_recaptcha(:model => model)
        return true
      else
        return false
      end
    else
      return true
    end
  end
  
  # Método para decirle a Varnish qué tiene que cachear
  def set_http_cache(period, visibility = false)
    expires_in period, :public => visibility, 'max-stale' => 0
  end

  # http://stackoverflow.com/questions/2385799/how-to-redirect-to-a-404-in-rails
  def render_404
    respond_to do |format|
      format.html { render :file => "#{Rails.root}/public/404.html", :layout => false, :status => :not_found }
      format.xml  { head :not_found }
      format.any  { head :not_found }
    end
  end

end
