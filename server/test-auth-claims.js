import path from 'path';
import fs from 'fs';
import http from 'http';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const testDbPath = path.resolve(__dirname, 'data/test-campus-find.db');

// Set isolated test database path before loading app and sqlite modules
process.env.DB_PATH = testDbPath;

// Copy existing database as initial fixture for regression checks
const mainDbPath = path.resolve(__dirname, 'data/campus-find.db');
if (fs.existsSync(mainDbPath)) {
  fs.copyFileSync(mainDbPath, testDbPath);
}

const { default: app } = await import('./src/app.js');
const { getDb } = await import('./src/db/sqlite.js');

const DEMO_ACCOUNTS = [
  { username: 'student1', password: 'demo123', studentId: 'STU001', fullName: 'Student One' },
  { username: 'student2', password: 'demo123', studentId: 'STU002', fullName: 'Student Two' },
  { username: 'student3', password: 'demo123', studentId: 'STU003', fullName: 'Student Three' },
  { username: 'student4', password: 'demo123', studentId: 'STU004', fullName: 'Student Four' },
  { username: 'student5', password: 'demo123', studentId: 'STU005', fullName: 'Student Five' }
];

async function runTests() {
  const server = http.createServer(app);

  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;
  console.log(`[Test Runner] Server listening on ${baseUrl}`);

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

  async function getMe(cookie) {
    const res = await fetch(`${baseUrl}/api/auth/me`, {
      headers: cookie ? { cookie } : {}
    });
    const data = await res.json();
    return { status: res.status, data };
  }

  async function logout(cookie) {
    const res = await fetch(`${baseUrl}/api/auth/logout`, {
      method: 'POST',
      headers: cookie ? { cookie } : {}
    });
    const data = await res.json();
    return { status: res.status, data };
  }

  console.log('\n======================================================');
  console.log('PART 1: AUTHENTICATION TESTS');
  console.log('======================================================');

  // Test 1: Unauthenticated session check
  const unauthedMe = await getMe(null);
  assert(unauthedMe.status === 401, 'Test 1: Unauthenticated GET /api/auth/me returns 401');

  // Test 2: Login with all 5 preset demo accounts
  for (const acc of DEMO_ACCOUNTS) {
    const res = await login(acc.username, acc.password);
    assert(
      res.status === 200 &&
      res.data.user?.studentId === acc.studentId &&
      res.data.user?.fullName === acc.fullName,
      `Test 2: Login as ${acc.username} succeeded with studentId=${acc.studentId}`
    );
  }

  // Test 3: Invalid username & invalid password
  const badUser = await login('nonexistent_user', 'demo123');
  assert(badUser.status === 401, 'Test 3a: Invalid username rejected with 401');

  const badPass = await login('student1', 'wrongpassword');
  assert(badPass.status === 401, 'Test 3b: Invalid password for student1 rejected with 401');

  // Test 4: Session restoration on refresh
  const s1Login = await login('student1', 'demo123');
  const s1Me = await getMe(s1Login.cookie);
  assert(
    s1Me.status === 200 && s1Me.data.user?.username === 'student1',
    'Test 4: Session restored successfully with valid cookie (student1)'
  );

  // Test 5: Logout invalidates session
  const logoutRes = await logout(s1Login.cookie);
  assert(logoutRes.status === 200, 'Test 5a: Logout request succeeded with 200');
  const meAfterLogout = await getMe(s1Login.cookie);
  assert(meAfterLogout.status === 401, 'Test 5b: Session is destroyed after logout (returns 401)');

  // Test 6: Protected endpoints fail when unauthenticated
  const unauthedPostItem = await fetch(`${baseUrl}/api/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Sneakers', category: 'clothing', location: 'Gym', status: 'Found' })
  });
  assert(unauthedPostItem.status === 401, 'Test 6a: POST /api/items rejected with 401 when unauthenticated');

  const unauthedClaim = await fetch(`${baseUrl}/api/items/1/claim`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ student_id: 'STU001', claimer_name: 'Test', verification_detail: 'Proof' })
  });
  assert(unauthedClaim.status === 401, 'Test 6b: POST /api/items/1/claim rejected with 401 when unauthenticated');

  const unauthedApprove = await fetch(`${baseUrl}/api/claims/1/approve`, { method: 'POST' });
  assert(unauthedApprove.status === 401, 'Test 6c: POST /api/claims/1/approve rejected with 401 when unauthenticated');

  // Test 7: Account switching does not retain previous identity
  const user3Login = await login('student3', 'demo123');
  const user3Me = await getMe(user3Login.cookie);
  assert(user3Me.data.user?.username === 'student3', 'Test 7a: Logged in as student3');

  const user4Login = await login('student4', 'demo123');
  const user4Me = await getMe(user4Login.cookie);
  assert(
    user4Me.data.user?.username === 'student4' && user4Me.data.user?.studentId === 'STU004',
    'Test 7b: Switched to student4 without retaining student3 identity'
  );

  console.log('\n======================================================');
  console.log('PART 2: CLAIM WORKFLOW TESTS');
  console.log('======================================================');

  // Step 1: Log in as student1
  const s1 = await login('student1', 'demo123');
  assert(s1.status === 200, 'Workflow 1: Logged in as student1');

  // Step 2: student1 creates a Found listing
  const createItemRes = await fetch(`${baseUrl}/api/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie: s1.cookie },
    body: JSON.stringify({
      name: 'Sony Noise-Canceling Earbuds (Navy)',
      category: 'electronics',
      location: 'Science Library Room 302',
      status: 'Found',
      description: 'Found on table 4 with blue silicon tips',
      desk_location: 'Science Library Desk'
    })
  });
  const createdItemData = await createItemRes.json();
  const itemId = createdItemData.data?.id;
  assert(
    createItemRes.status === 201 && itemId && createdItemData.data?.owner_student_id === 'STU001',
    `Workflow 2: student1 created Found item #${itemId} with owner_student_id='STU001'`
  );

  // Step 12 check: student1 cannot claim own listing
  const selfClaim = await fetch(`${baseUrl}/api/items/${itemId}/claim`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie: s1.cookie },
    body: JSON.stringify({
      student_id: 'STU001',
      claimer_name: 'Student One',
      verification_detail: 'It is mine'
    })
  });
  assert(selfClaim.status === 403, 'Workflow 12: student1 prevented from claiming own listing (HTTP 403)');

  // Step 3: Log in as student2
  const s2 = await login('student2', 'demo123');
  assert(s2.status === 200, 'Workflow 3: Logged in as student2');

  // Mismatched student ID validation check
  const badIdClaim = await fetch(`${baseUrl}/api/items/${itemId}/claim`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie: s2.cookie },
    body: JSON.stringify({
      student_id: 'STU999',
      claimer_name: 'Student Two',
      verification_detail: 'Blue tips'
    })
  });
  assert(badIdClaim.status === 400, 'Workflow Check: Mismatched Student ID rejected (HTTP 400)');

  // Step 4: student2 submits a valid claim
  const claimRes = await fetch(`${baseUrl}/api/items/${itemId}/claim`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie: s2.cookie },
    body: JSON.stringify({
      student_id: 'STU002',
      claimer_name: 'Student Two',
      verification_detail: 'Right earbud has small scratch near mic; paired with device named Galaxy S22'
    })
  });
  const claimJson = await claimRes.json();
  const claimId = claimJson.data?.id;
  assert(claimRes.status === 201 && claimId, `Workflow 4: student2 submitted claim #${claimId}`);

  // Step 5: Verify claim persists and has 'Pending' status
  assert(claimJson.data?.status === 'Pending', 'Workflow 5: Claim has status "Pending"');

  // Step 13 check: Duplicate pending claim prevention
  const dupClaim = await fetch(`${baseUrl}/api/items/${itemId}/claim`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie: s2.cookie },
    body: JSON.stringify({
      student_id: 'STU002',
      claimer_name: 'Student Two',
      verification_detail: 'Submitting duplicate proof'
    })
  });
  assert(dupClaim.status === 400, 'Workflow 13a: Duplicate pending claim by same student rejected (HTTP 400)');

  // Step 11 check: student2 cannot approve or reject claim on student1's listing
  const unauthApprove = await fetch(`${baseUrl}/api/claims/${claimId}/approve`, {
    method: 'POST',
    headers: { cookie: s2.cookie }
  });
  assert(unauthApprove.status === 403, 'Workflow 11a: student2 cannot approve claim on student1 listing (HTTP 403)');

  const unauthReject = await fetch(`${baseUrl}/api/claims/${claimId}/reject`, {
    method: 'POST',
    headers: { cookie: s2.cookie }
  });
  assert(unauthReject.status === 403, 'Workflow 11b: student2 cannot reject claim on student1 listing (HTTP 403)');

  // Step 6: Log out and log back in as student1
  const s1Relogin = await login('student1', 'demo123');
  assert(s1Relogin.status === 200, 'Workflow 6: Logged back in as student1');

  // Verify student1 can view claims on their listing
  const getClaimsRes = await fetch(`${baseUrl}/api/items/${itemId}/claims`, {
    headers: { cookie: s1Relogin.cookie }
  });
  const claimsList = await getClaimsRes.json();
  assert(
    getClaimsRes.status === 200 && claimsList.data?.length === 1 && claimsList.data[0].id === claimId,
    `Workflow Check: Listing owner can view claim #${claimId}`
  );

  // Step 7: student1 approves the claim
  const approveRes = await fetch(`${baseUrl}/api/claims/${claimId}/approve`, {
    method: 'POST',
    headers: { cookie: s1Relogin.cookie }
  });
  assert(approveRes.status === 200, 'Workflow 7: student1 approved the claim successfully');

  // Step 8: Verify item leaves Found and appears in Reunited Archive ('Claimed')
  const itemAfterApprove = await (await fetch(`${baseUrl}/api/items/${itemId}`)).json();
  assert(
    itemAfterApprove.data?.status === 'Claimed',
    'Workflow 8a: Item status is now "Claimed" (moved to Reunited Archive)'
  );

  const foundItems = await (await fetch(`${baseUrl}/api/items?status=Found`)).json();
  assert(
    !foundItems.data.some(i => i.id === itemId),
    'Workflow 8b: Item immediately leaves active Found listings'
  );

  const archiveItems = await (await fetch(`${baseUrl}/api/items?status=Claimed`)).json();
  assert(
    archiveItems.data.some(i => i.id === itemId),
    'Workflow 8c: Item is present in Reunited Archive listings'
  );

  // Step 13b check: Conflicting / repeated approvals prevented
  const repeatApprove = await fetch(`${baseUrl}/api/claims/${claimId}/approve`, {
    method: 'POST',
    headers: { cookie: s1Relogin.cookie }
  });
  assert(repeatApprove.status === 400, 'Workflow 13b: Repeated approval of already-decided claim rejected (HTTP 400)');

  // Cannot claim an already-reunited item
  const claimReunited = await fetch(`${baseUrl}/api/items/${itemId}/claim`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie: s2.cookie },
    body: JSON.stringify({
      student_id: 'STU002',
      claimer_name: 'Student Two',
      verification_detail: 'Attempt on reunited'
    })
  });
  assert(claimReunited.status === 400, 'Workflow 13c: Claim on already-reunited item rejected (HTTP 400)');

  // Step 9 & 10: Repeat workflow with another item, but REJECT claim instead
  console.log('\n--- Testing Rejection Workflow ---');

  // student1 creates second item
  const item2Res = await fetch(`${baseUrl}/api/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie: s1Relogin.cookie },
    body: JSON.stringify({
      name: 'Black Leather Bifold Wallet',
      category: 'bags-keys',
      location: 'Student Union Food Court',
      status: 'Found',
      description: 'Found under booth table 12'
    })
  });
  const item2 = (await item2Res.json()).data;
  assert(item2Res.status === 201 && item2?.id, `Workflow 9a: student1 created second item #${item2.id}`);

  // student3 submits claim
  const s3 = await login('student3', 'demo123');
  const claim2Res = await fetch(`${baseUrl}/api/items/${item2.id}/claim`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie: s3.cookie },
    body: JSON.stringify({
      student_id: 'STU003',
      claimer_name: 'Student Three',
      verification_detail: 'Contains library card ending in 4401'
    })
  });
  const claim2 = (await claim2Res.json()).data;
  assert(claim2Res.status === 201 && claim2?.id, `Workflow 9b: student3 submitted claim #${claim2.id}`);

  // student1 rejects claim
  const rejectRes = await fetch(`${baseUrl}/api/claims/${claim2.id}/reject`, {
    method: 'POST',
    headers: { cookie: s1Relogin.cookie }
  });
  assert(rejectRes.status === 200, 'Workflow 9c: student1 rejected the claim successfully');

  // Step 10: Verify rejected item remains in Found and does not appear in archive
  const item2AfterReject = await (await fetch(`${baseUrl}/api/items/${item2.id}`)).json();
  assert(
    item2AfterReject.data?.status === 'Found',
    'Workflow 10a: Rejected item remains in "Found" status'
  );

  const archiveAfterReject = await (await fetch(`${baseUrl}/api/items?status=Claimed`)).json();
  assert(
    !archiveAfterReject.data.some(i => i.id === item2.id),
    'Workflow 10b: Rejected item does NOT appear in Reunited Archive'
  );

  // Workflow can continue: student4 can submit another valid claim on item2
  const s4 = await login('student4', 'demo123');
  const claim3Res = await fetch(`${baseUrl}/api/items/${item2.id}/claim`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie: s4.cookie },
    body: JSON.stringify({
      student_id: 'STU004',
      claimer_name: 'Student Four',
      verification_detail: 'Has a MetroCard in the hidden cash pocket'
    })
  });
  assert(claim3Res.status === 201, 'Workflow 10c: Workflow continues: student4 successfully submitted new claim after rejection');

  // Step 14: Verify claims and items persist across server restart / database queries
  const db = getDb();
  const persistedClaim = db.prepare('SELECT * FROM claims WHERE id = ?').get(claimId);
  const persistedItem = db.prepare('SELECT * FROM items WHERE id = ?').get(itemId);
  assert(
    persistedClaim?.status === 'Approved' && persistedItem?.status === 'Claimed',
    'Workflow 14: Claims and items persist directly in SQLite database'
  );

  // Existing legacy items regression check
  const legacyItems = db.prepare('SELECT * FROM items WHERE owner_student_id IS NULL').all();
  assert(
    legacyItems.length > 0,
    `Regression Check: Legacy pre-existing items preserved unassigned (${legacyItems.length} records)`
  );

  console.log('\n======================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================');

  server.close();

  // Clean up isolated test database files so main database remains pristine
  try {
    const db = getDb();
    if (db) db.close();
    if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
    if (fs.existsSync(testDbPath + '-wal')) fs.unlinkSync(testDbPath + '-wal');
    if (fs.existsSync(testDbPath + '-shm')) fs.unlinkSync(testDbPath + '-shm');
  } catch (err) {
    // Ignore cleanup errors on process exit
  }

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
