frappe.ui.form.on("Quotation", {
  refresh(frm) {
    if (frm.doc.docstatus == 1) {
      frm.add_custom_button(
        __("Proforma Invoice"),
        () => {
          make_proforma_invoice(frm);
        },
        __("Create")
      );
    }
  },
});

function make_proforma_invoice(frm) {
  frappe.model.open_mapped_doc({
    method:
      "it_pms.it_pms.doctype.proforma_invoice.proforma_invoice.make_proforma_invoice",
    frm: frm,
  });
}
