import frappe
from erpnext.projects.doctype.project.project import Project
from frappe.model.document import Document


class customProject(Project):
    def update_project(self):
        super(customProject, self).update_project()

    @frappe.whitelist()
    def paymentStatus(self):
        related_sales_invoices = frappe.get_list(
            "Sales Invoice", filters={"project": self.name}, fields=["name"]
        )
        if related_sales_invoices:
            sales_invoice_name = related_sales_invoices[0].get("name")
            record_details = frappe.get_doc("Sales Invoice", sales_invoice_name)
            for self_milestone in self.custom_milestones:
                for record_milestone in record_details.get("custom_milestone", []):
                    if self_milestone.milestone == record_milestone.milestone:
                        self_milestone.payment_status = record_milestone.payment_status
            self.save()
            frappe.db.commit()

        milestones = [milestone.milestone for milestone in self.custom_milestones]
        projectTasks = frappe.get_list(
            "Task",
            filters={"project": self.name},
            fields=["name", "custom_milestone", "status"],
        )
        filtered_tasks = [
            task for task in projectTasks if task.get("custom_milestone") in milestones
        ]
        completed_filtered_tasks = [
            task for task in filtered_tasks if task.status == "Completed"
        ]
        final_output = {}
        for milestone in milestones:
            milestone_tasks = [
                task for task in filtered_tasks if task["custom_milestone"] == milestone
            ]
            completed_tasks = [
                task
                for task in completed_filtered_tasks
                if task["custom_milestone"] == milestone
            ]
            total_tasks = len(milestone_tasks)
            completed_percentage = (
                (len(completed_tasks) / total_tasks * 100) if total_tasks > 0 else 0
            )
            final_output[milestone] = completed_percentage
        for self_milestone in self.custom_milestones:
            if self_milestone.milestone in final_output:
                self_milestone.progress = final_output[self_milestone.milestone]
        self.save()
        frappe.db.commit()      
