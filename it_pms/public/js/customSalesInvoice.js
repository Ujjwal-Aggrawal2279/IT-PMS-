frappe.ui.form.on("Sales Invoice", {
  refresh(frm) {
    frm
      .call("fetchMilestonePaymentStatus")
      .then(frm.refresh_field("custom_milestone"));
  },
});
