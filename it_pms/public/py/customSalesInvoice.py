import frappe
from erpnext.accounts.doctype.sales_invoice.sales_invoice import SalesInvoice


class customSalesInvoice(SalesInvoice):
    @frappe.whitelist()
    def fetchMilestonePaymentStatus(self):
        payment_entry_records = frappe.get_list(
            "Payment Entry",
            filters={"reference_name": self.name},
            fields=["name"],
        )

        for milestone_row in self.custom_milestone:
            milestone = milestone_row.milestone
            milestone_amount = milestone_row.amount
            for payment_entry in payment_entry_records:
                references = frappe.get_all(
                    "Payment Entry Reference",
                    filters={"parent": payment_entry["name"]},
                    fields=["custom_milestone", "allocated_amount"],
                )

                if references:
                    for ref in references:
                        if ref.custom_milestone == milestone:
                            if milestone_amount == ref.allocated_amount:
                                milestone_row.payment_status = "Paid"
                                break
                            elif milestone_amount > ref.allocated_amount:
                                milestone_row.payment_status = "Partially Paid"
                                break
                            else:
                                pass
        self.save()
