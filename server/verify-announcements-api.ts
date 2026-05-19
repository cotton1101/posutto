const API_BASE = 'http://localhost:3001';

const testAPI = async () => {
    try {
        console.log("1. Creating announcement...");
        const createRes = await fetch(`${API_BASE}/api/admin/announcements`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: "Test Announcement",
                content: "This is a test announcement created by verify script.",
                type: "info"
            })
        });
        const created = await createRes.json();
        console.log("Created:", created);

        console.log("\n2. Getting admin announcements...");
        const adminListRes = await fetch(`${API_BASE}/api/admin/announcements`);
        const adminList = await adminListRes.json();
        console.log("Admin List Count:", adminList.length);

        console.log("\n3. Toggling status...");
        await fetch(`${API_BASE}/api/admin/announcements/${created.id}/toggle`, { method: 'PUT' });
        const toggledListRes = await fetch(`${API_BASE}/api/admin/announcements`);
        const toggledList = await toggledListRes.json();
        console.log("Is First One Active?", toggledList[0].is_active);

        console.log("\n4. Getting user announcements...");
        const userListRes = await fetch(`${API_BASE}/api/announcements`);
        const userList = await userListRes.json();
        console.log("User List Count (Active only):", userList.length);

        console.log("\n5. Deleting test announcement...");
        await fetch(`${API_BASE}/api/admin/announcements/${created.id}`, { method: 'DELETE' });
        console.log("Deleted.");

    } catch (err) {
        console.error("API Test Failed:", err);
    }
};

testAPI();
