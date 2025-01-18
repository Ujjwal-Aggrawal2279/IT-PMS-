frappe.ui.form.on("Project", {
  refresh(frm) {
    frm.call("paymentStatus");
  },
});
