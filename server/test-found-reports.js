import path from 'path';
import fs from 'fs';
import http from 'http';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const testDbPath = path.resolve(__dirname, 'data/test-found-reports.db');

// Set isolated test database path before loading app and sqlite modules
process.env.DB_PATH = testDbPath;

// Copy existing database as initial fixture
const mainDbPath = path.resolve(__dirname, 'data/campus-find.db');
if (fs.existsSync(mainDbPath)) {
  fs.copyFileSync(mainDbPath, testDbPath);
}

const { default: app } = await import('./src/app.js');
const { getDb } = await import('./src/db/sqlite.js');

async function runTests() {
  const server = http.createServer(app);

  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;
  console.log(`[Test Runner] Found Reports Server listening on ${baseUrl}`);

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      failed++;
    }
  }

  async function login(username, password) {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const setCookie = res.headers.get('set-cookie');
    const data = await res.json();
    return { status: res.status, data, cookie: setCookie };
  }

  console.log('\n======================================================');
  console.log('PART 1: AUTHENTICATION & PERMISSIONS FOR FOUND REPORTS');
  console.log('======================================================');

  // Test 1: Unauthenticated requests rejected
  const unauthedPost = await fetch(`${baseUrl}/api/items/1/found-reports`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ location: 'Library', additional_details: 'Details' })
  });
  assert(unauthedPost.status === 401, 'Test 1a: Unauthenticated POST /api/items/1/found-reports returns 401');

  const unauthedGetOwner = await fetch(`${baseUrl}/api/found-reports/owner`);
  assert(unauthedGetOwner.status === 401, 'Test 1b: Unauthenticated GET /api/found-reports/owner returns 401');

  const unauthedConfirm = await fetch(`${baseUrl}/api/found-reports/1/confirm`, { method: 'POST' });
  assert(unauthedConfirm.status === 401, 'Test 1c: Unauthenticated POST /api/found-reports/1/confirm returns 401');

  // Log in student1, student2, student3, student4
  const s1 = await login('student1', 'demo123');
  const s2 = await login('student2', 'demo123');
  const s3 = await login('student3', 'demo123');
  const s4 = await login('student4', 'demo123');

  assert(s1.status === 200 && s2.status === 200, 'Test 2: Demo accounts student1 and student2 logged in');

  console.log('\n======================================================');
  console.log('PART 2: CREATE LOST ITEM & SUBMIT FOUND REPORTS');
  console.log('======================================================');

  // Student 1 creates a Lost item (White MacBook Mouse)
  const createItemRes = await fetch(`${baseUrl}/api/items`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      cookie: s1.cookie
    },
    body: JSON.stringify({
      name: 'White MacBook Mouse (Magic Mouse 2)',
      category: 'electronics',
      location: 'Central Library, 2nd floor silent zone',
      status: 'Lost',
      description: 'Lost on Thursday afternoon while studying. Has a tiny scuff on lower curve.'
    })
  });
  const createdItemData = await createItemRes.json();
  const lostItem = createdItemData.data;
  assert(
    createItemRes.status === 201 && lostItem.owner_student_id === 'STU001' && lostItem.status === 'Lost',
    `Workflow 1: student1 created Lost item #${lostItem.id} ("${lostItem.name}")`
  );

  // Student 1 attempts to submit a found report on their OWN listing -> 403 Forbidden
  const selfReportRes = await fetch(`${baseUrl}/api/items/${lostItem.id}/found-reports`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      cookie: s1.cookie
    },
    body: JSON.stringify({
      location: 'Central Library Desk',
      additional_details: 'I found my own mouse'
    })
  });
  assert(selfReportRes.status === 403, 'Workflow 2: student1 prevented from submitting found report on own lost item (HTTP 403)');

  // Field validation checks:
  // Missing location
  const badLocRes = await fetch(`${baseUrl}/api/items/${lostItem.id}/found-reports`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie: s2.cookie },
    body: JSON.stringify({ location: '   ', additional_details: 'Found near desk' })
  });
  assert(badLocRes.status === 400, 'Workflow 3a: Empty location rejected with HTTP 400');

  // Missing additional details
  const badDetailsRes = await fetch(`${baseUrl}/api/items/${lostItem.id}/found-reports`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie: s2.cookie },
    body: JSON.stringify({ location: 'Central Library 2nd Floor', additional_details: '' })
  });
  assert(badDetailsRes.status === 400, 'Workflow 3b: Empty additional details rejected with HTTP 400');

  // Student 2 submits valid report
  const report1Res = await fetch(`${baseUrl}/api/items/${lostItem.id}/found-reports`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      cookie: s2.cookie
    },
    body: JSON.stringify({
      location: 'Central Library, 2nd floor desk #14',
      additional_details: 'Found plugged into library monitor USB hub. White surface with slight scuff.'
    })
  });
  const report1Data = await report1Res.json();
  const report1 = report1Data.data;
  assert(
    report1Res.status === 201 &&
    report1.status === 'Pending' &&
    report1.finder_student_id === 'STU002' &&
    report1.finder_name === 'Student Two',
    `Workflow 4: student2 submitted found report #${report1.id} with status "Pending"`
  );

  // Student 2 attempts to submit duplicate pending report on same item -> 400
  const duplicateReportRes = await fetch(`${baseUrl}/api/items/${lostItem.id}/found-reports`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie: s2.cookie },
    body: JSON.stringify({
      location: 'Same desk',
      additional_details: 'Submitting duplicate'
    })
  });
  assert(duplicateReportRes.status === 400, 'Workflow 5: Duplicate pending report by same finder rejected (HTTP 400)');

  // Student 3 submits another report on the same lost item
  const report2Res = await fetch(`${baseUrl}/api/items/${lostItem.id}/found-reports`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie: s3.cookie },
    body: JSON.stringify({
      location: 'Library checkout counter',
      additional_details: 'A student handed it to front desk staff'
    })
  });
  const report2Data = await report2Res.json();
  const report2 = report2Data.data;
  assert(
    report2Res.status === 201 && report2.status === 'Pending' && report2.finder_student_id === 'STU003',
    `Workflow 6: student3 submitted second found report #${report2.id}`
  );

  console.log('\n======================================================');
  console.log('PART 3: OWNER DASHBOARD REVIEW & NOTIFICATIONS');
  console.log('======================================================');

  // Student 2 (non-owner) cannot view reports for student1's item -> 403 Forbidden
  const unauthorizedViewRes = await fetch(`${baseUrl}/api/items/${lostItem.id}/found-reports`, {
    headers: { cookie: s2.cookie }
  });
  assert(unauthorizedViewRes.status === 403, 'Workflow 7: student2 cannot view reports on student1 listing (HTTP 403)');

  // Student 1 (owner) views reports for their item -> 200
  const ownerItemReportsRes = await fetch(`${baseUrl}/api/items/${lostItem.id}/found-reports`, {
    headers: { cookie: s1.cookie }
  });
  const ownerItemReports = await ownerItemReportsRes.json();
  assert(
    ownerItemReportsRes.status === 200 && ownerItemReports.data.length === 2,
    `Workflow 8: Listing owner (student1) can view all 2 reports for item #${lostItem.id}`
  );

  // Student 1 views owner reports dashboard endpoint
  const ownerAllReportsRes = await fetch(`${baseUrl}/api/found-reports/owner`, {
    headers: { cookie: s1.cookie }
  });
  const ownerAllReports = await ownerAllReportsRes.json();
  assert(
    ownerAllReportsRes.status === 200 && ownerAllReports.pending_count === 2,
    `Workflow 9: Owner dashboard returns pending_count=2 across listings`
  );

  // Student 1 checks persistent notifications
  const ownerNotifsRes = await fetch(`${baseUrl}/api/notifications`, {
    headers: { cookie: s1.cookie }
  });
  const ownerNotifs = await ownerNotifsRes.json();
  assert(
    ownerNotifsRes.status === 200 && ownerNotifs.data.length >= 2 && ownerNotifs.unread_count >= 2,
    `Workflow 10: Listing owner received database-backed notifications for incoming found reports`
  );

  console.log('\n======================================================');
  console.log('PART 4: REJECTION WORKFLOW');
  console.log('======================================================');

  // Student 2 cannot reject student 3's report -> 403
  const badRejectRes = await fetch(`${baseUrl}/api/found-reports/${report2.id}/reject`, {
    method: 'POST',
    headers: { cookie: s2.cookie }
  });
  assert(badRejectRes.status === 403, 'Workflow 11a: Non-owner cannot reject report (HTTP 403)');

  // Student 1 rejects student 3's report -> 200
  const rejectRes = await fetch(`${baseUrl}/api/found-reports/${report2.id}/reject`, {
    method: 'POST',
    headers: { cookie: s1.cookie }
  });
  const rejectData = await rejectRes.json();
  assert(
    rejectRes.status === 200 && rejectData.data.status === 'Rejected' && rejectData.data.decided_at !== null,
    `Workflow 11b: Listing owner rejected report #${report2.id} (status: "Rejected")`
  );

  // Verify item remains active Lost
  const itemAfterRejectRes = await fetch(`${baseUrl}/api/items/${lostItem.id}`);
  const itemAfterReject = (await itemAfterRejectRes.json()).data;
  assert(itemAfterReject.status === 'Lost', 'Workflow 11c: Lost item remains active with status "Lost" after rejection');

  // Student 3 checks their submitted reports -> report shows Rejected
  const s3MyReportsRes = await fetch(`${baseUrl}/api/found-reports/my`, {
    headers: { cookie: s3.cookie }
  });
  const s3MyReports = (await s3MyReportsRes.json()).data;
  const s3RejectedReport = s3MyReports.find((r) => r.id === report2.id);
  assert(
    s3RejectedReport && s3RejectedReport.status === 'Rejected',
    'Workflow 11d: Finder (student3) sees "Rejected" status in my submitted reports'
  );

  // Student 4 can now submit a report because item is still active
  const report3Res = await fetch(`${baseUrl}/api/items/${lostItem.id}/found-reports`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie: s4.cookie },
    body: JSON.stringify({
      location: 'Central Library Room 202',
      additional_details: 'Spotted another mouse'
    })
  });
  assert(report3Res.status === 201, 'Workflow 11e: student4 successfully submitted new report after previous rejection');
  const report3 = (await report3Res.json()).data;

  console.log('\n======================================================');
  console.log('PART 5: CONFIRMATION & PHYSICAL REUNION WORKFLOW');
  console.log('======================================================');

  // Non-owner (student3) cannot confirm report1 -> 403
  const badConfirmRes = await fetch(`${baseUrl}/api/found-reports/${report1.id}/confirm`, {
    method: 'POST',
    headers: { cookie: s3.cookie }
  });
  assert(badConfirmRes.status === 403, 'Workflow 12a: Non-owner cannot confirm report (HTTP 403)');

  // Listing owner (student1) confirms student2's report
  const confirmRes = await fetch(`${baseUrl}/api/found-reports/${report1.id}/confirm`, {
    method: 'POST',
    headers: { cookie: s1.cookie }
  });
  const confirmData = await confirmRes.json();
  assert(
    confirmRes.status === 200 &&
    confirmData.data.report.status === 'Confirmed' &&
    confirmData.data.report.decided_at !== null,
    `Workflow 12b: Owner confirmed report #${report1.id} (status: "Confirmed")`
  );

  // Check item status is now "Claimed" (Reunited Archive status)
  const itemAfterConfirmRes = await fetch(`${baseUrl}/api/items/${lostItem.id}`);
  const itemAfterConfirm = (await itemAfterConfirmRes.json()).data;
  assert(
    itemAfterConfirm.status === 'Claimed',
    'Workflow 12c: Lost item is immediately marked "Claimed" (Reunited Archive status)'
  );

  // Verify item disappeared from active Lost items list
  const activeLostItemsRes = await fetch(`${baseUrl}/api/items?status=Lost`);
  const activeLostItems = (await activeLostItemsRes.json()).data;
  assert(
    !activeLostItems.some((i) => i.id === lostItem.id),
    'Workflow 12d: Item disappeared from active Lost items list'
  );

  // Verify item appears in Reunited Archive list
  const reunitedItemsRes = await fetch(`${baseUrl}/api/items?status=Claimed`);
  const reunitedItems = (await reunitedItemsRes.json()).data;
  assert(
    reunitedItems.some((i) => i.id === lostItem.id),
    'Workflow 12e: Item is present in Reunited Archive list'
  );

  // Verify other pending reports on this item (report3 by student4) were automatically closed/rejected
  const s4ReportsRes = await fetch(`${baseUrl}/api/found-reports/my`, {
    headers: { cookie: s4.cookie }
  });
  const s4Reports = (await s4ReportsRes.json()).data;
  const s4Report = s4Reports.find((r) => r.id === report3.id);
  assert(
    s4Report && s4Report.status === 'Rejected',
    'Workflow 12f: Other pending report on same item was atomically closed/rejected'
  );

  // Verify confirmed finder (student2) sees "Confirmed" status
  const s2ReportsRes = await fetch(`${baseUrl}/api/found-reports/my`, {
    headers: { cookie: s2.cookie }
  });
  const s2Reports = (await s2ReportsRes.json()).data;
  const s2Report = s2Reports.find((r) => r.id === report1.id);
  assert(
    s2Report && s2Report.status === 'Confirmed',
    'Workflow 12g: Confirmed finder (student2) sees "Confirmed" status in my submitted reports'
  );

  // Verify persistent notification received by confirmed finder (student2)
  const s2NotifsRes = await fetch(`${baseUrl}/api/notifications`, {
    headers: { cookie: s2.cookie }
  });
  const s2Notifs = (await s2NotifsRes.json()).data;
  assert(
    s2Notifs.some((n) => n.type === 'found_report_confirmed' && n.report_id === report1.id),
    'Workflow 12h: Confirmed finder received persistent notification of confirmation'
  );

  console.log('\n======================================================');
  console.log('PART 6: EDGE CASES & CONCURRENCY CHECKS');
  console.log('======================================================');

  // Repeated confirm on already-decided report rejected -> 400
  const repeatConfirmRes = await fetch(`${baseUrl}/api/found-reports/${report1.id}/confirm`, {
    method: 'POST',
    headers: { cookie: s1.cookie }
  });
  assert(repeatConfirmRes.status === 400, 'Workflow 13a: Repeated confirm of already-decided report rejected (HTTP 400)');

  // Repeated reject on already-decided report rejected -> 400
  const repeatRejectRes = await fetch(`${baseUrl}/api/found-reports/${report1.id}/reject`, {
    method: 'POST',
    headers: { cookie: s1.cookie }
  });
  assert(repeatRejectRes.status === 400, 'Workflow 13b: Repeated reject of already-decided report rejected (HTTP 400)');

  // Submitting report on already reunited item rejected -> 400
  const reportOnReunitedRes = await fetch(`${baseUrl}/api/items/${lostItem.id}/found-reports`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie: s3.cookie },
    body: JSON.stringify({ location: 'Anywhere', additional_details: 'Test' })
  });
  assert(reportOnReunitedRes.status === 400, 'Workflow 13c: Report submission on already-reunited item rejected (HTTP 400)');

  // Verify SQLite database persistence directly
  const db = getDb();
  const dbReport = db.prepare('SELECT * FROM found_reports WHERE id = ?').get(report1.id);
  assert(
    dbReport && dbReport.status === 'Confirmed' && dbReport.finder_student_id === 'STU002',
    'Workflow 14: Found reports persist directly in SQLite database table'
  );

  console.log('\n======================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================');

  server.close();
  // Clean up test DB
  try {
    if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
  } catch {}

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((err) => {
  console.error('[Test Error]:', err);
  process.exit(1);
});
