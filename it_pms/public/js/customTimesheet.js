frappe.ui.form.on("Timesheet Detail", {
  is_billable: async function (frm, cdt, cdn) {
    let child = frappe.get_doc(cdt, cdn);
    if (child.is_billable && frm.doc.employee) {
      const result = await frappe.db.get_value(
        "Employee",
        { name: frm.doc.employee },
        "custom_billing_rate"
      );
      child.billing_rate = result.message?.custom_billing_rate || 0.0;
      frm.refresh_field("time_logs");
    }
  },
});
