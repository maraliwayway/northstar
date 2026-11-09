module Finance
  # Sorts a transaction into the four buckets from the 90-day spending audit.
  # Personal rules (learned when you re-label a merchant) always win.
  module Categorizer
    CATEGORIES = %w[required leak future guilt_free].freeze

    KEYWORDS = {
      "future" => %w[wealthsimple questrade tfsa rrsp fhsa transfer to savings investment loan\ payment],
      "required" => %w[rent mortgage hydro bc\ hydro fortis telus rogers bell shaw freedom\ mobile insurance icbc
                       compass translink superstore save-on-foods safeway no\ frills walmart costco pharmacy
                       shoppers london\ drugs tuition petro chevron esso shell],
      "leak" => %w[uber\ eats doordash skip\ the\ dishes subscription netflix disney crave prime\ video
                   apple.com/bill google\ storage amazon temu shein late\ fee overdraft nsf interest\ charge],
      "guilt_free" => %w[spotify restaurant cafe coffee starbucks tim\ hortons cineplex concert ticketmaster
                         gym climbing book travel airbnb air\ canada westjet]
    }.freeze

    module_function

    def normalize(description)
      description.to_s.downcase.gsub(/[#*\d]+/, " ").squeeze(" ").strip
    end

    def call(description, rules = {})
      text = normalize(description)
      rules.to_h.each do |pattern, category|
        return category if pattern.to_s.length > 2 && text.include?(pattern.to_s) && CATEGORIES.include?(category)
      end
      KEYWORDS.each do |category, words|
        return category if words.any? { |w| text.include?(w) }
      end
      "required"
    end
  end
end
