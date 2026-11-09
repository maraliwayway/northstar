require "test_helper"

class StatementParserTest < ActiveSupport::TestCase
  def test_rbc_style_export_keeps_only_outflows
    csv = <<~CSV
      "Account Type","Account Number","Transaction Date","Cheque Number","Description 1","Description 2","CAD$","USD$"
      Chequing,123,10/02/2026,,"UBER EATS","TORONTO",-34.50,
      Chequing,123,10/03/2026,,"PAYROLL","ACME",2100.00,
      Chequing,123,10/04/2026,,"BC HYDRO","",-88.12,
    CSV
    rows = Finance::StatementParser.new(csv).rows
    assert_equal 2, rows.size
    assert_equal 3_450, rows.first.amount_cents
    assert_equal "UBER EATS TORONTO", rows.first.description
    assert_equal Date.new(2026, 10, 2), rows.first.spent_on
  end

  def test_card_export_with_positive_charges
    csv = "Date,Description,Amount\n2026-10-01,Netflix,16.49\n2026-10-03,Payment received,-500.00\n2026-10-05,Spotify,11.99\n"
    rows = Finance::StatementParser.new(csv).rows
    assert_equal %w[Netflix Spotify], rows.map(&:description)
  end

  def test_td_headerless_layout
    csv = "10/01/2026,SAVE-ON-FOODS #123,64.10,,1200.00\n10/02/2026,E-TRANSFER IN,,50.00,1250.00\n"
    rows = Finance::StatementParser.new(csv).rows
    assert_equal 1, rows.size
    assert_equal 6_410, rows.first.amount_cents
  end

  def test_categorizer_prefers_personal_rules
    assert_equal "leak", Finance::Categorizer.call("UBER EATS 8841")
    assert_equal "guilt_free", Finance::Categorizer.call("UBER EATS 8841", { "uber eats" => "guilt_free" })
    assert_equal "required", Finance::Categorizer.call("Mystery merchant")
  end
end
