import { useState } from "react";
import AdminLayout from "../../components/layout/AdminLayout";
import OverviewTab from "./OverviewTab";
import UsersTab from "./UsersTab";
import BatchesTab from "./BatchesTab";
import BlogsTab from "./BlogsTab";
import DonationsTab from "./DonationsTab";
import ChatTab from "./ChatTab";

export default function AdminDashboard() {
  const [tab, setTab] = useState("overview");

  return (
    <AdminLayout active={tab} onNavigate={setTab}>
      {tab === "overview" && <OverviewTab />}
      {tab === "users" && <UsersTab />}
      {tab === "batches" && <BatchesTab />}
      {tab === "blogs" && <BlogsTab />}
      {tab === "donations" && <DonationsTab />}
      {tab === "chat" && <ChatTab />}
    </AdminLayout>
  );
}
