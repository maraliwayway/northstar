require "csv"
require "bigdecimal"
require "date"

module Finance
  # Reads a bank or credit-card CSV export and returns money going out.
  # Handles headed files (RBC, Scotiabank, most credit cards) and TD's
  # header-less "date, description, debit, credit, balance" layout.
  class StatementParser
    Row = Struct.new(:spent_on, :description, :amount_cents, keyword_init: true)

    DATE_HEADERS = ["date", "transaction date", "posted date", "posting date", "trans. date"].freeze
    DESC_HEADERS = ["description", "description 1", "merchant", "payee", "details", "name", "memo"].freeze
    AMOUNT_HEADERS = ["amount", "cad$", "amount (cad)", "transaction amount", "amount cad"].freeze
    DEBIT_HEADERS = ["debit", "withdrawal", "withdrawals", "money out", "debit amount"].freeze
    DATE_FORMATS = ["%Y-%m-%d", "%m/%d/%Y", "%d/%m/%Y", "%Y/%m/%d", "%m/%d/%y", "%b %d, %Y", "%d-%b-%Y"].freeze

    attr_reader :errors

    def initialize(text)
      @text = text.to_s.sub("\uFEFF", "")
      @errors = []
    end

    def rows
      table = CSV.parse(@text, liberal_parsing: true).reject { |r| r.compact.empty? }
      return [] if table.empty?

      header = table.first.map { |h| h.to_s.strip.downcase }
      if header.any? { |h| DATE_HEADERS.include?(h) }
        parse_headed(header, table.drop(1))
      else
        parse_td_style(table)
      end
    rescue CSV::MalformedCSVError => e
      @errors << "That file isn't valid CSV (#{e.message})."
      []
    end

    private

    def parse_headed(header, body)
      date_i = index_for(header, DATE_HEADERS)
      desc_indexes = header.each_index.select { |i| header[i].start_with?("description") || DESC_HEADERS.include?(header[i]) }
      debit_i = index_for(header, DEBIT_HEADERS)
      amount_i = index_for(header, AMOUNT_HEADERS)

      if desc_indexes.empty? || (debit_i.nil? && amount_i.nil?)
        @errors << "Couldn't find description and amount columns. Expected headers like Date, Description, Amount."
        return []
      end

      if debit_i
        body.filter_map { |r| build(r[date_i], desc_indexes.map { |i| r[i] }, money(r[debit_i])) }
      else
        amounts = body.map { |r| money(r[amount_i]) }.compact
        # Bank accounts show spending as negatives; many card exports show charges as positives.
        outflow_negative = amounts.count(&:negative?) >= amounts.count(&:positive?)
        body.filter_map do |r|
          value = money(r[amount_i])
          next if value.nil?

          spend = outflow_negative ? -value : value
          build(r[date_i], desc_indexes.map { |i| r[i] }, spend)
        end
      end
    end

    def parse_td_style(table)
      table.filter_map { |r| build(r[0], [r[1]], money(r[2])) }
    end

    def build(raw_date, desc_parts, cents)
      return nil if cents.nil? || cents <= 0

      date = parse_date(raw_date)
      description = desc_parts.compact.map(&:strip).reject(&:empty?).join(" ")
      return nil if date.nil? || description.empty?

      Row.new(spent_on: date, description: description[0, 200], amount_cents: cents)
    end

    def index_for(header, names)
      header.index { |h| names.include?(h) }
    end

    def money(raw)
      text = raw.to_s.strip
      return nil if text.empty?

      negative = text.start_with?("-") || (text.start_with?("(") && text.end_with?(")"))
      digits = text.gsub(/[^\d.]/, "")
      return nil if digits.empty?

      cents = (BigDecimal(digits) * 100).round.to_i
      negative ? -cents : cents
    rescue ArgumentError
      nil
    end

    def parse_date(raw)
      text = raw.to_s.strip
      DATE_FORMATS.each do |fmt|
        return Date.strptime(text, fmt)
      rescue Date::Error
        next
      end
      nil
    end
  end
end
