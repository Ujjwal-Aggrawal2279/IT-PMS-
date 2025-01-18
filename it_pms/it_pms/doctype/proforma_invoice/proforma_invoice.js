// Copyright (c) 2025, Ujjwal Aggrawal and contributors
// For license information, please see license.txt
cur_frm.cscript.tax_table = "Sales Taxes and Charges";

erpnext.accounts.taxes.setup_tax_validations(
  "Sales Taxes and Charges Template"
);
erpnext.accounts.taxes.setup_tax_filters("Sales Taxes and Charges");
erpnext.sales_common.setup_selling_controller();
frappe.ui.form.on("Proforma Invoice", {
  setup(frm) {
    frm.set_query("quotation_to", function () {
      return {
        filters: {
          name: ["in", ["Customer", "Lead", "Prospect"]],
        },
      };
    });
    frm.set_df_property("packed_items", "cannot_add_rows", true);
    frm.set_df_property("packed_items", "cannot_delete_rows", true);
    frm.set_query(
      "serial_and_batch_bundle",
      "packed_items",
      (doc, cdt, cdn) => {
        let row = locals[cdt][cdn];
        return {
          filters: {
            item_code: row.item_code,
            voucher_type: doc.doctype,
            voucher_no: ["in", [doc.name, ""]],
            is_cancelled: 0,
          },
        };
      }
    );
  },
  refresh: function (frm) {
    frm.trigger("set_label");
    frm.trigger("set_dynamic_field_label");
    let sbb_field = frm.get_docfield("packed_items", "serial_and_batch_bundle");
    if (sbb_field) {
      sbb_field.get_route_options_for_new_doc = (row) => {
        return {
          item_code: row.doc.item_code,
          warehouse: row.doc.warehouse,
          voucher_type: frm.doc.doctype,
        };
      };
    }
  },
  quotation_to: function (frm) {
    frm.trigger("set_label");
    frm.trigger("toggle_reqd_lead_customer");
    frm.trigger("set_dynamic_field_label");
    frm.set_value("customer_name", "");
  },
  set_label: function (frm) {
    frm.fields_dict.customer_address.set_label(
      __(frm.doc.quotation_to + " Address")
    );
  },
});

erpnext.selling.ProformaInvoiceController = class ProformaInvoiceController extends (
  erpnext.selling.SellingController
) {
  onload(doc, dt, dn) {
    super.onload(doc, dt, dn);
  }
  party_name() {
    var me = this;
    erpnext.utils.get_party_details(this.frm, null, null, function () {
      me.apply_price_list();
    });

    if (me.frm.doc.quotation_to == "Lead" && me.frm.doc.party_name) {
      me.frm.trigger("get_lead_details");
    }
  }
  refresh(doc, dt, dn) {
    super.refresh(doc, dt, dn);
    frappe.dynamic_link = {
      doc: this.frm.doc,
      fieldname: "party_name",
      doctype: doc.quotation_to,
    };
    if (doc.docstatus == 1) {
      {
        this.frm.add_custom_button(
          __("Sales Order"),
          () => this.make_sales_order(),
          __("Create")
        );
      }
    }
  }
  make_sales_order() {
    var me = this;

    let has_alternative_item = this.frm.doc.items.some(
      (item) => item.is_alternative
    );
    if (has_alternative_item) {
      this.show_alternative_items_dialog();
    } else {
      frappe.model.open_mapped_doc({
        method:
          "it_pms.it_pms.doctype.proforma_invoice.proforma_invoice.make_sales_order",
        frm: me.frm,
      });
    }
  }
  set_dynamic_field_label() {
    if (this.frm.doc.quotation_to == "Customer") {
      this.frm.set_df_property("party_name", "label", "Customer");
      this.frm.fields_dict.party_name.get_query = null;
    } else if (this.frm.doc.quotation_to == "Lead") {
      this.frm.set_df_property("party_name", "label", "Lead");
      this.frm.fields_dict.party_name.get_query = function () {
        return { query: "erpnext.controllers.queries.lead_query" };
      };
    } else if (this.frm.doc.quotation_to == "Prospect") {
      this.frm.set_df_property("party_name", "label", "Prospect");
      this.frm.fields_dict.party_name.get_query = null;
    }
  }
  toggle_reqd_lead_customer() {
    var me = this;
    this.frm.toggle_reqd("party_name", this.frm.doc.quotation_to);
    this.frm.set_query("customer_address", this.address_query);
    this.frm.set_query("shipping_address_name", this.address_query);
  }
  address_query(doc) {
    return {
      query: "frappe.contacts.doctype.address.address.address_query",
      filters: {
        link_doctype: frappe.dynamic_link.doctype,
        link_name: doc.party_name,
      },
    };
  }
  validate_company_and_party(party_field) {
    if (!this.frm.doc.quotation_to) {
      frappe.msgprint(
        __("Please select a value for {0} quotation_to {1}", [
          this.frm.doc.doctype,
          this.frm.doc.name,
        ])
      );
      return false;
    } else if (this.frm.doc.quotation_to == "Lead") {
      return true;
    } else {
      return super.validate_company_and_party(party_field);
    }
  }

  get_lead_details() {
    var me = this;
    if (!this.frm.doc.quotation_to === "Lead") {
      return;
    }

    frappe.call({
      method: "erpnext.crm.doctype.lead.lead.get_lead_details",
      args: {
        lead: this.frm.doc.party_name,
        posting_date: this.frm.doc.posting_date,
        company: this.frm.doc.company,
      },
      callback: function (r) {
        if (r.message) {
          me.frm.updating_party_details = true;
          me.frm.set_value(r.message);
          me.frm.refresh();
          me.frm.updating_party_details = false;
        }
      },
    });
  }
};

cur_frm.script_manager.make(erpnext.selling.ProformaInvoiceController);
frappe.ui.form.on(
  "Quotation Item",
  "items_on_form_rendered",
  "packed_items_on_form_rendered",
  function (frm, cdt, cdn) {
    // enable tax_amount field if Actual
  }
);

frappe.ui.form.on("Quotation Item", "stock_balance", function (frm, cdt, cdn) {
  var d = frappe.model.get_doc(cdt, cdn);
  frappe.route_options = { item_code: d.item_code };
  frappe.set_route("query-report", "Stock Balance");
});
