from io import BytesIO
from datetime import datetime
from decimal import Decimal

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_CENTER, TA_RIGHT


def generate_statement_pdf(account, transactions, from_date, to_date) -> BytesIO:
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=0.75 * inch,
        leftMargin=0.75 * inch,
        topMargin=0.75 * inch,
        bottomMargin=0.75 * inch,
    )

    styles = getSampleStyleSheet()
    gold = colors.HexColor("#C9A84C")
    navy = colors.HexColor("#0F1B35")

    title_style = ParagraphStyle(
        "VBTitle",
        fontSize=22,
        textColor=gold,
        fontName="Helvetica-Bold",
        spaceAfter=4,
    )
    heading_style = ParagraphStyle(
        "VBHeading",
        fontSize=12,
        textColor=navy,
        fontName="Helvetica-Bold",
        spaceAfter=6,
    )
    normal_style = ParagraphStyle(
        "VBNormal",
        fontSize=9,
        textColor=colors.HexColor("#374151"),
        spaceAfter=3,
    )
    small_style = ParagraphStyle(
        "VBSmall",
        fontSize=8,
        textColor=colors.grey,
        spaceAfter=2,
    )
    footer_style = ParagraphStyle(
        "VBFooter",
        fontSize=7,
        textColor=colors.grey,
        alignment=TA_CENTER,
    )

    elements = []

    # Header
    elements.append(Paragraph("VaultBank", title_style))
    elements.append(Paragraph("Account Statement", heading_style))
    elements.append(HRFlowable(width="100%", thickness=1, color=gold, spaceAfter=8))

    # Account info
    owner = account.owner
    owner_name = f"{owner.first_name} {owner.last_name}" if owner else "N/A"

    info_data = [
        ["Account Holder:", owner_name, "Statement Period:"],
        ["Account Number:", account.account_number, f"{from_date} to {to_date}"],
        ["Account Type:", account.account_type.capitalize(), ""],
        ["Currency:", account.currency, ""],
    ]

    info_table = Table(info_data, colWidths=[1.5 * inch, 2.5 * inch, 2.5 * inch])
    info_table.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTNAME", (2, 0), (2, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("TEXTCOLOR", (0, 0), (-1, -1), colors.HexColor("#374151")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    elements.append(info_table)
    elements.append(Spacer(1, 12))

    # Transactions table
    elements.append(Paragraph("Transaction History", heading_style))

    headers = ["Date", "Description", "Type", "Debit", "Credit", "Balance"]
    table_data = [headers]

    running_balance = Decimal("0")
    for txn in transactions:
        txn_type = txn.transaction_type.value.replace("_", " ").title()
        debit = ""
        credit = ""

        if txn.transaction_type.value == "deposit":
            credit = f"${txn.amount:,.2f}"
        else:
            debit = f"${txn.amount:,.2f}"

        bal = f"${txn.balance_after:,.2f}" if txn.balance_after else ""
        date_str = txn.created_at.strftime("%m/%d/%Y") if txn.created_at else ""
        desc = (txn.description or "")[:40]

        table_data.append([date_str, desc, txn_type, debit, credit, bal])

    col_widths = [0.9 * inch, 2.4 * inch, 1.0 * inch, 0.85 * inch, 0.85 * inch, 0.85 * inch]
    txn_table = Table(table_data, colWidths=col_widths, repeatRows=1)
    txn_table.setStyle(TableStyle([
        # Header row
        ("BACKGROUND", (0, 0), (-1, 0), navy),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 8),
        ("ALIGN", (0, 0), (-1, 0), "CENTER"),
        # Data rows
        ("FONTSIZE", (0, 1), (-1, -1), 7.5),
        ("TEXTCOLOR", (0, 1), (-1, -1), colors.HexColor("#374151")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F9FAFB")]),
        ("ALIGN", (3, 1), (5, -1), "RIGHT"),
        ("ALIGN", (0, 1), (0, -1), "CENTER"),
        ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#E5E7EB")),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
    ]))
    elements.append(txn_table)

    elements.append(Spacer(1, 20))
    elements.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#E5E7EB")))
    elements.append(Spacer(1, 8))

    # Footer
    footer_text = (
        "VaultBank is a registered financial institution. Member FDIC. "
        "This statement is for informational purposes only. "
        f"Generated on {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}."
    )
    elements.append(Paragraph(footer_text, footer_style))

    doc.build(elements)
    buffer.seek(0)
    return buffer
