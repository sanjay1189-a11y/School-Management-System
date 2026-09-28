const pages = {
  dashboard:["Dashboard","School overview and statistics"],
  students:["Student Management","Add, edit, delete and view students"],
  teachers:["Teacher Management","Manage teachers, subjects and assigned classes"],
  classes:["Class & Section Management","Create classes and assign teachers"],
  attendance:["Attendance","Mark daily attendance and view reports"],
  grades:["Grade Management","Manage marks and student grades"],
  fees:["Fee Management","Manage fee records and payment status"],
  timetable:["Timetable","Create and view class schedules"],
  receipts:["Fee Receipts","Generate and print student fee receipts"],
  photos:["Student Photos","Manage student profile photos"],
  notifications:["Notifications","View important school updates"]
};
let currentPage = "dashboard";

document.addEventListener("DOMContentLoaded",()=>{
  if(window.EduAuth && !EduAuth.currentUser()){ location.replace("login.html"); return; }
  document.querySelectorAll(".nav-item").forEach(btn=>btn.addEventListener("click",()=>navigate(btn.dataset.page)));
  document.getElementById("mobileMenu").onclick=()=>document.getElementById("sidebar").classList.toggle("open");
  const savedTheme=localStorage.getItem("edumanage_theme");
  if(savedTheme==="dark")document.body.classList.add("dark");
  document.getElementById("themeBtn").onclick=()=>{document.body.classList.toggle("dark");localStorage.setItem("edumanage_theme",document.body.classList.contains("dark")?"dark":"light");};
  document.getElementById("logoutBtn").onclick=()=>{EduAuth?.clearSession?.();location.replace("login.html?loggedout=1");};
  document.getElementById("today").textContent=new Date().toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"});
  renderDashboard();
});

function navigate(page){
  currentPage=page;
  document.querySelectorAll(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.page===page));
  document.getElementById("pageTitle").textContent=pages[page][0];
  document.getElementById("pageSubtitle").textContent=pages[page][1];
  document.getElementById("sidebar").classList.remove("open");
  const renderer={dashboard:renderDashboard,students:renderStudents,teachers:renderTeachers,classes:renderClasses,
    attendance:renderAttendance,grades:renderGrades,fees:renderFees,timetable:renderTimetable,receipts:window.renderReceipts,photos:window.renderPhotos,notifications:window.renderNotifications,
    reports:window.renderReports,exams:window.renderExams,communications:window.renderCommunications}[page];
  if(renderer) renderer();
}

function renderDashboard(){
  const paid=DB.fees.filter(f=>f.status==="Paid").reduce((s,f)=>s+Number(f.amount),0);
  const pending=DB.fees.filter(f=>f.status==="Pending").reduce((s,f)=>s+Number(f.amount),0);
  const present=attendancePercent();
  const attendanceValue=present==="—" ? 0 : Number(present);
  const classCount=DB.classes.length;
  const feeTotal=paid+pending;
  const paidPercent=feeTotal ? Math.round(paid/feeTotal*100) : 0;

  document.getElementById("content").innerHTML=`
    <div class="welcome">
      <div><h2>Good day, ${esc(window.EduAuth?.currentUser?.()?.name||"Admin")} 👋</h2><p>Here's what's happening across your school today.</p></div>
      <div class="welcome-badge">Academic Session 2026–27</div>
    </div>

    <div class="stats">
      <div class="stat-card">
        <div class="stat-top"><span class="label">Total Students</span><div class="stat-icon">👨‍🎓</div></div>
        <div class="value">${DB.students.length}</div><span class="hint up">● Active student records</span>
      </div>
      <div class="stat-card">
        <div class="stat-top"><span class="label">Total Teachers</span><div class="stat-icon">👩‍🏫</div></div>
        <div class="value">${DB.teachers.length}</div><span class="hint up">● Teaching staff</span>
      </div>
      <div class="stat-card">
        <div class="stat-top"><span class="label">Attendance Today</span><div class="stat-icon">✓</div></div>
        <div class="value">${present==="—" ? "—" : present+"%"}</div><span class="hint">${present==="—" ? "Not marked yet" : "Present rate today"}</span>
      </div>
      <div class="stat-card">
        <div class="stat-top"><span class="label">Pending Fees</span><div class="stat-icon">₹</div></div>
        <div class="value">₹${pending.toLocaleString("en-IN")}</div><span class="hint">${DB.fees.filter(f=>f.status==="Pending").length} pending record(s)</span>
      </div>
    </div>

    <div class="dashboard-grid">
      <div>
        <div class="card">
          <div class="card-head"><div><h2>Quick Actions</h2><small>Common administrative tasks</small></div></div>
          <div class="card-body">
            <div class="quick-grid">
              <button class="quick-btn" onclick="openStudentModal()"><span>＋</span> Add Student</button>
              <button class="quick-btn" onclick="openTeacherModal()"><span>＋</span> Add Teacher</button>
              <button class="quick-btn" onclick="navigate('attendance')"><span>✓</span> Mark Attendance</button>
              <button class="quick-btn" onclick="openFeeModal()"><span>₹</span> Add Fee Record</button>
            </div>
          </div>
        </div>

        <div class="card" style="margin-top:18px">
          <div class="card-head"><div><h2>Recent Students</h2><small>Latest student records</small></div><button class="btn btn-secondary btn-sm" onclick="navigate('students')">View all</button></div>
          ${studentTable(DB.students.slice(-5).reverse(),false)}
        </div>
      </div>

      <div>
        <div class="card">
          <div class="card-head"><div><h2>School Overview</h2><small>Current records</small></div></div>
          <div class="card-body">
            <div class="progress-row"><div class="progress-label"><span>Fee Collection</span><span>${paidPercent}%</span></div><div class="progress"><span style="width:${paidPercent}%"></span></div></div>
            <div class="progress-row"><div class="progress-label"><span>Attendance</span><span>${present==="—" ? "—" : attendanceValue+"%"}</span></div><div class="progress"><span style="width:${attendanceValue}%"></span></div></div>
            <div class="progress-row"><div class="progress-label"><span>Classes & Sections</span><span>${classCount}</span></div><div class="progress"><span style="width:${Math.min(classCount*12.5,100)}%"></span></div></div>
          </div>
        </div>

        <div class="card" style="margin-top:18px">
          <div class="card-head"><div><h2>Recent Activity</h2><small>System activity</small></div></div>
          <div class="card-body">
            <div class="activity"><div class="activity-dot"></div><div><strong>${DB.students.length} student records</strong><p>Available in Student Management</p></div></div>
            <div class="activity"><div class="activity-dot"></div><div><strong>${DB.teachers.length} teacher records</strong><p>Teaching staff currently listed</p></div></div>
            <div class="activity"><div class="activity-dot"></div><div><strong>${DB.fees.length} fee records</strong><p>Payment records maintained locally</p></div></div>
          </div>
        </div>
      </div>
    </div>`;
}
function attendancePercent(){
  const today=new Date().toISOString().slice(0,10);
  const a=DB.attendance.filter(x=>x.date===today);
  if(!a.length) return "—";
  return Math.round(a.filter(x=>x.status==="Present").length/a.length*100);
}

function studentAvatar(s, large=false){
  const initials = String(s.name||"?").split(" ").map(x=>x[0]).slice(0,2).join("").toUpperCase();
  const cls = large ? "student-avatar large" : "student-avatar";
  return s.photo ? `<img class="${cls}" src="${esc(s.photo)}" alt="${esc(s.name)}">` : `<div class="${cls}">${esc(initials)}</div>`;
}

function studentTable(list, actions=true){
  if(!list.length) return `<div class="empty-state"><div class="empty-icon">👨‍🎓</div><strong>No students found</strong><p>Try changing your search or add a new student.</p></div>`;
  return `<div class="table-wrap"><table class="data-table"><thead><tr>
    <th>Student</th><th>Class</th><th>Section</th><th>Roll No.</th><th>Parent / Guardian</th><th>Contact</th><th>Status</th>${actions?"<th>Actions</th>":""}
  </tr></thead><tbody>
    ${list.map(s=>`<tr>
      <td><div class="person-cell">${studentAvatar(s)}<div><strong>${esc(s.name)}</strong><small>Student ID #${esc(s.id)}</small></div></div></td>
      <td>${esc(s.className)}</td><td>${esc(s.section)}</td><td>${esc(s.roll)}</td>
      <td>${esc(s.parent)}</td><td>${esc(s.phone)}</td>
      <td><span class="badge ${s.status==="Inactive"?"danger":"success"}">${esc(s.status||"Active")}</span></td>
      ${actions?`<td><div class="action-group">
        <button class="btn btn-secondary btn-sm" onclick="viewStudent(${s.id})">View</button>
        <button class="btn btn-secondary btn-sm" onclick="editStudent(${s.id})">Edit</button>
        <button class="btn btn-danger btn-sm" onclick="deleteStudent(${s.id})">Delete</button>
      </div></td>`:""}
    </tr>`).join("")}
  </tbody></table></div>`;
}

function renderStudents(){
  const classes=[...new Set(DB.students.map(s=>s.className).filter(Boolean))].sort();
  const sections=[...new Set(DB.students.map(s=>s.section).filter(Boolean))].sort();
  document.getElementById("content").innerHTML=`
    <div class="page-toolbar">
      <div>
        <div class="page-kicker">STUDENT DIRECTORY</div>
        <h2 class="section-title">All Students</h2>
        <p class="section-subtitle">${DB.students.length} student records in the system</p>
      </div>
      <button class="btn btn-primary" onclick="openStudentModal()">＋ Add Student</button>
    </div>
    <div class="filter-card">
      <div class="filter-search"><span>⌕</span><input id="studentSearch" class="search-clean" placeholder="Search by name, ID, parent or phone..." oninput="filterStudents()"></div>
      <select id="studentClassFilter" class="filter-select" onchange="filterStudents()"><option value="">All Classes</option>${classes.map(c=>`<option>${esc(c)}</option>`).join("")}</select>
      <select id="studentSectionFilter" class="filter-select" onchange="filterStudents()"><option value="">All Sections</option>${sections.map(s=>`<option>${esc(s)}</option>`).join("")}</select>
      <select id="studentStatusFilter" class="filter-select" onchange="filterStudents()"><option value="">All Status</option><option>Active</option><option>Inactive</option></select>
    </div>
    <div class="card">
      <div class="card-head"><div><h2>Student Records</h2><small id="studentCount">${DB.students.length} records</small></div></div>
      <div id="studentCard">${studentTable(DB.students)}</div>
    </div>`;
}
function filterStudents(){
  const q=(document.getElementById("studentSearch")?.value||"").toLowerCase();
  const cls=document.getElementById("studentClassFilter")?.value||"";
  const sec=document.getElementById("studentSectionFilter")?.value||"";
  const status=document.getElementById("studentStatusFilter")?.value||"";
  const list=DB.students.filter(s=>{
    const text=Object.values(s).join(" ").toLowerCase();
    return text.includes(q)&&(!cls||s.className===cls)&&(!sec||s.section===sec)&&(!status||(s.status||"Active")===status);
  });
  document.getElementById("studentCard").innerHTML=studentTable(list);
  document.getElementById("studentCount").textContent=`${list.length} record${list.length===1?"":"s"}`;
}
function openStudentModal(id=null){
  const s=id?DB.students.find(x=>x.id===id):{status:"Active"};
  showModal(id?"Edit Student":"Add Student",`
    <form id="studentForm">
      <div class="profile-form-head">
        ${studentAvatar(s,true)}
        <div><strong>${id?"Update student profile":"Create student profile"}</strong><p>Enter the student's academic and guardian details.</p></div>
      </div>
      <div class="form-grid">
        ${field("name","Student Name",s.name,true)}
        ${field("className","Class",s.className,true)}
        ${field("section","Section",s.section,true)}
        ${field("roll","Roll Number",s.roll,true,"number")}
        ${field("parent","Parent / Guardian",s.parent,true)}
        ${field("phone","Parent Phone",s.phone,true)}
        ${field("address","Address",s.address,false)}
        <div class="form-group"><label>Status</label><select name="status"><option ${s.status!=="Inactive"?"selected":""}>Active</option><option ${s.status==="Inactive"?"selected":""}>Inactive</option></select></div>
        ${field("photo","Photo URL (optional)",s.photo,false)}
      </div>
      <div class="modal-actions"><button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button><button type="submit" class="btn btn-primary">${id?"Update Student":"Add Student"}</button></div>
    </form>`);
  document.getElementById("studentForm").onsubmit=e=>{
    e.preventDefault();
    const f=Object.fromEntries(new FormData(e.target));
    f.id=id||nextId(DB.students); f.roll=Number(f.roll);
    if(id) DB.students=DB.students.map(x=>x.id===id?f:x); else DB.students.push(f);
    saveData(); closeModal(); renderStudents(); showToast(id?"Student updated successfully":"Student added successfully");
  };
}
function viewStudent(id){
  const s=DB.students.find(x=>x.id===id); if(!s)return;
  const grades=DB.grades.filter(g=>Number(g.studentId)===Number(id));
  const fees=DB.fees.filter(f=>Number(f.studentId)===Number(id));
  const attendance=DB.attendance.filter(a=>Number(a.studentId)===Number(id));
  const present=attendance.filter(a=>a.status==="Present").length;
  const att=attendance.length?Math.round(present/attendance.length*100):"—";
  const avg=gradeAverage(grades);
  const feePending=feeTotal(fees.filter(f=>feeStatus(f)!=="Paid"));
  const gradeRows=grades.length?grades.slice(0,5).map(g=>{const grade=g.grade||calculateGrade(g.marks);return `<tr><td>${esc(g.subject)}</td><td>${Number(g.marks)}/100</td><td><span class="badge ${gradeBadgeClass(grade)}">${esc(grade)}</span></td></tr>`;}).join(""):`<tr><td colspan="3">No grades recorded.</td></tr>`;
  const feeRows=fees.length?fees.slice(0,5).map(f=>`<tr><td>${esc(feeType(f))}</td><td>₹${Number(f.amount||0).toLocaleString("en-IN")}</td><td><span class="badge ${feeStatus(f)==="Paid"?"success":"warning"}">${esc(feeStatus(f))}</span></td></tr>`).join(""):`<tr><td colspan="3">No fee records.</td></tr>`;
  showModal("Student Profile",`<div class="student-profile">
    <div class="profile-banner">${studentAvatar(s,true)}<div><h2>${esc(s.name)}</h2><p>${esc(s.className)} • Section ${esc(s.section)} • Roll ${esc(s.roll)}</p><span class="badge ${s.status==="Inactive"?"danger":"success"}">${esc(s.status||"Active")}</span></div></div>
    <div class="profile-stats"><div><small>Attendance</small><strong>${att}${att==="—"?"":"%"}</strong></div><div><small>Grade Average</small><strong>${grades.length?avg+"%":"—"}</strong></div><div><small>Pending Fees</small><strong>₹${feePending.toLocaleString("en-IN")}</strong></div></div>
    <div class="detail-grid"><div><small>Parent / Guardian</small><strong>${esc(s.parent)}</strong></div><div><small>Phone</small><strong>${esc(s.phone)}</strong></div><div><small>Address</small><strong>${esc(s.address||"—")}</strong></div><div><small>Student ID</small><strong>#${esc(s.id)}</strong></div></div>
    <div class="profile-section"><div class="profile-section-head"><div><h3>Recent Grades</h3><small>${grades.length} assessment${grades.length===1?"":"s"}</small></div>${grades.length?`<button class="btn btn-secondary btn-sm" onclick="closeModal();viewGradeReport(${s.id})">View Report</button>`:""}</div><div class="report-table"><table class="data-table"><thead><tr><th>Subject</th><th>Marks</th><th>Grade</th></tr></thead><tbody>${gradeRows}</tbody></table></div></div>
    <div class="profile-section"><div class="profile-section-head"><div><h3>Fee Summary</h3><small>${fees.length} payment record${fees.length===1?"":"s"}</small></div>${fees.length?`<button class="btn btn-secondary btn-sm" onclick="closeModal();viewFeeHistory(${s.id})">View History</button>`:""}</div><div class="report-table"><table class="data-table"><thead><tr><th>Fee Type</th><th>Amount</th><th>Status</th></tr></thead><tbody>${feeRows}</tbody></table></div></div>
    <div class="modal-actions"><button class="btn btn-secondary" onclick="closeModal()">Close</button><button class="btn btn-primary" onclick="closeModal();editStudent(${s.id})">Edit Profile</button></div>
  </div>`);
}
function editStudent(id){openStudentModal(id)}
function deleteStudent(id){
  const s=DB.students.find(x=>x.id===id);
  if(!s)return;
  if(confirm(`Delete ${s.name}? This will remove the student record.`)){
    DB.students=DB.students.filter(x=>x.id!==id); saveData(); renderStudents(); showToast("Student deleted");
  }
}

function renderTeachers(){
  document.getElementById("content").innerHTML=`
    <div class="page-toolbar">
      <div><div class="page-kicker">STAFF DIRECTORY</div><h2 class="section-title">All Teachers</h2><p class="section-subtitle">${DB.teachers.length} teacher records in the system</p></div>
      <button class="btn btn-primary" onclick="openTeacherModal()">＋ Add Teacher</button>
    </div>
    <div class="filter-card">
      <div class="filter-search"><span>⌕</span><input id="teacherSearch" class="search-clean" placeholder="Search by name, subject, email..." oninput="filterTeachers()"></div>
      <select id="teacherSubjectFilter" class="filter-select" onchange="filterTeachers()"><option value="">All Subjects</option>${[...new Set(DB.teachers.map(t=>t.subject).filter(Boolean))].sort().map(x=>`<option>${esc(x)}</option>`).join("")}</select>
      <select id="teacherStatusFilter" class="filter-select" onchange="filterTeachers()"><option value="">All Status</option><option>Active</option><option>Inactive</option></select>
    </div>
    <div class="card" id="teacherCard">${teacherTable(DB.teachers)}</div>`;
}
function teacherTable(list){
  if(!list.length)return `<div class="empty-state"><div class="empty-icon">👩‍🏫</div><strong>No teachers found</strong><p>Try changing your filters or add a new teacher.</p></div>`;
  return `<div class="table-wrap"><table class="data-table"><thead><tr><th>Teacher</th><th>Subject</th><th>Classes</th><th>Phone</th><th>Email</th><th>Status</th><th>Actions</th></tr></thead><tbody>
  ${list.map(t=>`<tr><td><div class="person-cell">${teacherAvatar(t)}<div><strong>${esc(t.name)}</strong><small>Staff ID #${esc(t.id)}</small></div></div></td><td>${esc(t.subject)}</td><td>${esc(t.classes)}</td><td>${esc(t.phone)}</td><td>${esc(t.email)}</td><td><span class="badge ${(t.status||"Active")==="Inactive"?"danger":"success"}">${esc(t.status||"Active")}</span></td><td><div class="action-group"><button class="btn btn-secondary btn-sm" onclick="viewTeacher(${t.id})">View</button><button class="btn btn-secondary btn-sm" onclick="editTeacher(${t.id})">Edit</button><button class="btn btn-danger btn-sm" onclick="deleteTeacher(${t.id})">Delete</button></div></td></tr>`).join("")}
  </tbody></table></div>`;
}
function teacherAvatar(t){
  const initials=String(t.name||"?").split(" ").map(x=>x[0]).slice(0,2).join("").toUpperCase();
  return `<div class="teacher-avatar">${esc(initials)}</div>`;
}
function filterTeachers(){
  const q=(document.getElementById("teacherSearch")?.value||"").toLowerCase();
  const subject=document.getElementById("teacherSubjectFilter")?.value||"";
  const status=document.getElementById("teacherStatusFilter")?.value||"";
  const list=DB.teachers.filter(t=>Object.values(t).join(" ").toLowerCase().includes(q)&&(!subject||t.subject===subject)&&(!status||(t.status||"Active")===status));
  document.getElementById("teacherCard").innerHTML=teacherTable(list);
}
function openTeacherModal(id=null){
  const t=id?DB.teachers.find(x=>x.id===id):{status:"Active"};
  showModal(id?"Edit Teacher":"Add Teacher",`
    <form id="teacherForm">
      <div class="profile-form-head">${teacherAvatar(t)}<div><strong>${id?"Update teacher profile":"Create teacher profile"}</strong><p>Enter staff and teaching assignment details.</p></div></div>
      <div class="form-grid">
        ${field("name","Teacher Name",t.name,true)}
        ${field("subject","Subject",t.subject,true)}
        ${field("classes","Classes Assigned",t.classes,true)}
        ${field("phone","Phone",t.phone,true)}
        ${field("email","Email",t.email,true,"email")}
        <div class="form-group"><label>Status</label><select name="status"><option ${t.status!=="Inactive"?"selected":""}>Active</option><option ${t.status==="Inactive"?"selected":""}>Inactive</option></select></div>
      </div>
      <div class="modal-actions"><button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary">${id?"Update Teacher":"Add Teacher"}</button></div>
    </form>`);
  document.getElementById("teacherForm").onsubmit=e=>{
    e.preventDefault(); const f=Object.fromEntries(new FormData(e.target)); f.id=id||nextId(DB.teachers);
    if(id)DB.teachers=DB.teachers.map(x=>x.id===id?f:x);else DB.teachers.push(f);
    saveData();closeModal();renderTeachers();showToast(id?"Teacher updated successfully":"Teacher added successfully");
  };
}
function viewTeacher(id){
  const t=DB.teachers.find(x=>x.id===id);if(!t)return;
  const assigned=DB.classes.filter(c=>c.teacher===t.name);
  showModal("Teacher Profile",`<div class="student-profile">
    <div class="profile-banner">${teacherAvatar(t)}<div><h2>${esc(t.name)}</h2><p>${esc(t.subject)}</p><span class="badge ${(t.status||"Active")==="Inactive"?"danger":"success"}">${esc(t.status||"Active")}</span></div></div>
    <div class="profile-stats"><div><small>Subject</small><strong>${esc(t.subject)}</strong></div><div><small>Assigned Classes</small><strong>${assigned.length||"—"}</strong></div><div><small>Staff ID</small><strong>#${esc(t.id)}</strong></div></div>
    <div class="detail-grid"><div><small>Email</small><strong>${esc(t.email)}</strong></div><div><small>Phone</small><strong>${esc(t.phone)}</strong></div><div><small>Classes</small><strong>${esc(t.classes)}</strong></div></div>
    <div class="modal-actions"><button class="btn btn-secondary" onclick="closeModal()">Close</button><button class="btn btn-primary" onclick="closeModal();editTeacher(${t.id})">Edit Profile</button></div>
  </div>`);
}
function editTeacher(id){openTeacherModal(id)}
function deleteTeacher(id){
  const t=DB.teachers.find(x=>x.id===id);if(!t)return;
  if(confirm(`Delete ${t.name}?`)){DB.teachers=DB.teachers.filter(x=>x.id!==id);saveData();renderTeachers();showToast("Teacher deleted");}
}

function renderClasses(){
  const totalStrength=DB.classes.reduce((s,c)=>s+Number(c.strength||0),0);
  document.getElementById("content").innerHTML=`
    <div class="page-toolbar">
      <div><div class="page-kicker">ACADEMIC STRUCTURE</div><h2 class="section-title">Classes & Sections</h2><p class="section-subtitle">${DB.classes.length} class and section records</p></div>
      <button class="btn btn-primary" onclick="openClassModal()">＋ Add Class</button>
    </div>
    <div class="stats compact-stats">
      <div class="stat-card"><div class="stat-top"><span class="label">Classes</span><div class="stat-icon">🏫</div></div><div class="value">${DB.classes.length}</div><span class="hint">Configured sections</span></div>
      <div class="stat-card"><div class="stat-top"><span class="label">Student Capacity</span><div class="stat-icon">👥</div></div><div class="value">${totalStrength}</div><span class="hint">Across listed sections</span></div>
      <div class="stat-card"><div class="stat-top"><span class="label">Teachers Assigned</span><div class="stat-icon">👩‍🏫</div></div><div class="value">${new Set(DB.classes.map(c=>c.teacher).filter(Boolean)).size}</div><span class="hint">Class teachers</span></div>
    </div>
    <div class="filter-card">
      <div class="filter-search"><span>⌕</span><input id="classSearch" class="search-clean" placeholder="Search class, section or teacher..." oninput="filterClasses()"></div>
      <select id="classFilter" class="filter-select" onchange="filterClasses()"><option value="">All Classes</option>${[...new Set(DB.classes.map(c=>c.className))].sort().map(x=>`<option>${esc(x)}</option>`).join("")}</select>
    </div>
    <div class="card" id="classCard">${classTable(DB.classes)}</div>`;
}
function classTable(list){
  if(!list.length)return `<div class="empty-state"><div class="empty-icon">🏫</div><strong>No classes found</strong><p>Add a class or change your filters.</p></div>`;
  return `<div class="table-wrap"><table class="data-table"><thead><tr><th>Class</th><th>Section</th><th>Class Teacher</th><th>Students</th><th>Capacity</th><th>Actions</th></tr></thead><tbody>
    ${list.map(c=>{
      const actual=DB.students.filter(s=>s.className===c.className&&s.section===c.section).length;
      const capacity=Number(c.strength||0);
      return `<tr><td><strong>${esc(c.className)}</strong></td><td><span class="badge warning">${esc(c.section)}</span></td><td>${esc(c.teacher||"Not assigned")}</td><td>${actual}</td><td>${capacity}</td><td><div class="action-group"><button class="btn btn-secondary btn-sm" onclick="viewClass(${c.id})">View</button><button class="btn btn-secondary btn-sm" onclick="editClass(${c.id})">Edit</button><button class="btn btn-danger btn-sm" onclick="deleteClass(${c.id})">Delete</button></div></td></tr>`;
    }).join("")}
  </tbody></table></div>`;
}
function filterClasses(){
  const q=(document.getElementById("classSearch")?.value||"").toLowerCase();
  const cls=document.getElementById("classFilter")?.value||"";
  const list=DB.classes.filter(c=>Object.values(c).join(" ").toLowerCase().includes(q)&&(!cls||c.className===cls));
  document.getElementById("classCard").innerHTML=classTable(list);
}
function openClassModal(id=null){
  const c=id?DB.classes.find(x=>x.id===id):{};
  const teachers=DB.teachers.filter(t=>(t.status||"Active")==="Active");
  showModal(id?"Edit Class & Section":"Add Class & Section",`
    <form id="classForm">
      <div class="profile-form-head"><div class="teacher-avatar">🏫</div><div><strong>${id?"Update class configuration":"Create a class section"}</strong><p>Assign a class teacher and set the section capacity.</p></div></div>
      <div class="form-grid">
        ${field("className","Class",c.className,true)}
        ${field("section","Section",c.section,true)}
        <div class="form-group"><label>Class Teacher</label><select name="teacher"><option value="">Not assigned</option>${teachers.map(t=>`<option ${c.teacher===t.name?"selected":""}>${esc(t.name)}</option>`).join("")}</select></div>
        ${field("strength","Student Capacity",c.strength,true,"number")}
      </div>
      <div class="modal-actions"><button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary">${id?"Update Class":"Add Class"}</button></div>
    </form>`);
  document.getElementById("classForm").onsubmit=e=>{
    e.preventDefault();const f=Object.fromEntries(new FormData(e.target));f.id=id||nextId(DB.classes);f.strength=Number(f.strength);
    if(id)DB.classes=DB.classes.map(x=>x.id===id?f:x);else DB.classes.push(f);
    saveData();closeModal();renderClasses();showToast(id?"Class updated successfully":"Class added successfully");
  };
}
function viewClass(id){
  const c=DB.classes.find(x=>x.id===id);if(!c)return;
  const students=DB.students.filter(s=>s.className===c.className&&s.section===c.section);
  showModal("Class Details",`<div class="student-profile">
    <div class="profile-banner"><div class="teacher-avatar">🏫</div><div><h2>${esc(c.className)} — ${esc(c.section)}</h2><p>Class Teacher: ${esc(c.teacher||"Not assigned")}</p></div></div>
    <div class="profile-stats"><div><small>Students</small><strong>${students.length}</strong></div><div><small>Capacity</small><strong>${esc(c.strength)}</strong></div><div><small>Available</small><strong>${Math.max(0,Number(c.strength)-students.length)}</strong></div></div>
    <div class="card" style="box-shadow:none"><div class="card-head"><h2>Students in Section</h2></div>${studentTable(students,false)}</div>
    <div class="modal-actions"><button class="btn btn-secondary" onclick="closeModal()">Close</button></div>
  </div>`);
}
function editClass(id){openClassModal(id)}
function deleteClass(id){
  const c=DB.classes.find(x=>x.id===id);if(!c)return;
  const count=DB.students.filter(s=>s.className===c.className&&s.section===c.section).length;
  if(count>0){showToast("Cannot delete: students are assigned to this section");return;}
  if(confirm(`Delete ${c.className} ${c.section}?`)){DB.classes=DB.classes.filter(x=>x.id!==id);saveData();renderClasses();showToast("Class deleted");}
}

function getAttendanceDate(){
  return document.getElementById("attendanceDate")?.value || new Date().toISOString().slice(0,10);
}
function getAttendanceStudents(){
  const cls=document.getElementById("attendanceClass")?.value||"";
  const sec=document.getElementById("attendanceSection")?.value||"";
  return DB.students.filter(s=>(!cls||s.className===cls)&&(!sec||s.section===sec));
}
function renderAttendance(){
  const today=new Date().toISOString().slice(0,10);
  const classes=[...new Set(DB.students.map(s=>s.className))].sort();
  const sections=[...new Set(DB.students.map(s=>s.section))].sort();
  const selectedDate=window.attendanceSelectedDate||today;
  window.attendanceSelectedDate=selectedDate;
  document.getElementById("content").innerHTML=`
    <div class="page-toolbar">
      <div><div class="page-kicker">DAILY RECORDS</div><h2 class="section-title">Attendance</h2><p class="section-subtitle">Mark and review student attendance by date.</p></div>
      <button class="btn btn-primary" onclick="saveAttendance()">✓ Save Attendance</button>
    </div>
    <div class="filter-card attendance-filters">
      <div class="form-group-inline"><label>Date</label><input id="attendanceDate" type="date" value="${selectedDate}" onchange="changeAttendanceDate(this.value)"></div>
      <select id="attendanceClass" class="filter-select" onchange="attendanceFilterChanged()"><option value="">All Classes</option>${classes.map(c=>`<option>${esc(c)}</option>`).join("")}</select>
      <select id="attendanceSection" class="filter-select" onchange="attendanceFilterChanged()"><option value="">All Sections</option>${sections.map(s=>`<option>${esc(s)}</option>`).join("")}</select>
      <button class="btn btn-secondary" onclick="markAllAttendance(true)">✓ Mark All Present</button>
      <button class="btn btn-secondary" onclick="markAllAttendance(false)">× Mark All Absent</button>
    </div>
    <div class="attendance-summary" id="attendanceSummary"></div>
    <div class="card"><div class="card-head"><div><h2>Student Attendance</h2><small>Green = present, grey = absent</small></div></div><div class="attendance-grid" id="attendanceGrid"></div></div>
    <div class="card" style="margin-top:18px"><div class="card-head"><div><h2>Attendance History</h2><small>Saved records by date</small></div></div><div id="attendanceHistory">${attendanceHistoryTable()}</div></div>`;
  refreshAttendanceGrid();
}
function changeAttendanceDate(value){window.attendanceSelectedDate=value;renderAttendance();}
function attendanceFilterChanged(){refreshAttendanceGrid();}
function refreshAttendanceGrid(){
  const grid=document.getElementById("attendanceGrid"); if(!grid)return;
  const students=getAttendanceStudents(),date=getAttendanceDate();
  const saved=DB.attendance.filter(a=>a.date===date);
  if(!students.length){grid.innerHTML=`<div class="empty-state"><div class="empty-icon">✓</div><strong>No students match this filter</strong><p>Choose another class or section.</p></div>`;updateAttendanceSummary([],date);return;}
  grid.innerHTML=students.map(s=>{
    const rec=saved.find(a=>a.studentId===s.id);
    const present=rec?rec.status==="Present":false;
    return `<div class="student-att attendance-student"><div class="person-cell">${studentAvatar(s)}<div><strong>${esc(s.name)}</strong><small>${esc(s.className)} • ${esc(s.section)} • Roll ${esc(s.roll)}</small></div></div><label class="switch"><input type="checkbox" data-att="${s.id}" ${present?"checked":""}><span class="slider"></span></label></div>`;
  }).join("");
  updateAttendanceSummary(students,date);
}
function updateAttendanceSummary(students,date){
  const el=document.getElementById("attendanceSummary");if(!el)return;
  const checks=[...document.querySelectorAll("[data-att]")];
  const present=checks.filter(x=>x.checked).length,total=checks.length;
  const pct=total?Math.round(present/total*100):0;
  const saved=DB.attendance.filter(a=>a.date===date);
  el.innerHTML=`<div class="att-stat"><span>Selected Students</span><strong>${total}</strong></div><div class="att-stat"><span>Present</span><strong>${present}</strong></div><div class="att-stat"><span>Absent</span><strong>${Math.max(0,total-present)}</strong></div><div class="att-stat"><span>Present Rate</span><strong>${pct}%</strong></div><div class="att-note">${saved.length?"Saved records exist for this date. Changes will overwrite them when you save.":"No saved attendance for this date yet."}</div>`;
  checks.forEach(x=>x.onchange=()=>updateAttendanceSummary(students,date));
}
function markAllAttendance(present){
  document.querySelectorAll("[data-att]").forEach(x=>x.checked=present);
  updateAttendanceSummary(getAttendanceStudents(),getAttendanceDate());
}
function saveAttendance(){
  const date=getAttendanceDate(),students=getAttendanceStudents();
  if(!students.length){showToast("No students selected");return;}
  const ids=new Set(students.map(s=>s.id));
  DB.attendance=DB.attendance.filter(a=>!(a.date===date&&ids.has(a.studentId)));
  document.querySelectorAll("[data-att]").forEach(x=>DB.attendance.push({id:nextId(DB.attendance),studentId:Number(x.dataset.att),date,status:x.checked?"Present":"Absent"}));
  saveData();showToast(`Attendance saved for ${date}`);refreshAttendanceGrid();document.getElementById("attendanceHistory").innerHTML=attendanceHistoryTable();
}
function attendanceHistoryTable(){
  if(!DB.attendance.length)return `<div class="empty-state"><div class="empty-icon">📅</div><strong>No attendance history</strong><p>Save attendance to create a history record.</p></div>`;
  const dates=[...new Set(DB.attendance.map(a=>a.date))].sort().reverse();
  return `<div class="table-wrap"><table class="data-table"><thead><tr><th>Date</th><th>Present</th><th>Absent</th><th>Attendance Rate</th><th>Records</th></tr></thead><tbody>${dates.slice(0,15).map(date=>{
    const rows=DB.attendance.filter(a=>a.date===date),p=rows.filter(a=>a.status==="Present").length,rate=Math.round(p/rows.length*100);
    return `<tr><td><strong>${date}</strong></td><td><span class="badge success">${p}</span></td><td><span class="badge danger">${rows.length-p}</span></td><td><strong>${rate}%</strong></td><td>${rows.length}</td></tr>`;
  }).join("")}</tbody></table></div>`;
}

function calculateGrade(marks){
  marks=Number(marks);
  if(marks>=90)return "A+";
  if(marks>=80)return "A";
  if(marks>=70)return "B+";
  if(marks>=60)return "B";
  if(marks>=50)return "C";
  return "F";
}
function gradeBadgeClass(grade){
  if(grade==="A+"||grade==="A")return "success";
  if(grade==="F")return "danger";
  return "warning";
}
function gradeAverage(rows){
  return rows.length?Math.round(rows.reduce((sum,g)=>sum+Number(g.marks||0),0)/rows.length):0;
}
function gradeTable(list){
  if(!list.length)return `<div class="empty-state"><div class="empty-icon">📚</div><strong>No grade records found</strong><p>Add marks or change the filters to see academic records.</p></div>`;
  return `<div class="table-wrap"><table class="data-table"><thead><tr><th>Student</th><th>Class</th><th>Subject</th><th>Marks</th><th>Grade</th><th>Actions</th></tr></thead><tbody>${list.map(g=>{
    const s=DB.students.find(x=>x.id===Number(g.studentId));
    const grade=g.grade||calculateGrade(g.marks);
    return `<tr><td><div class="person-cell">${s?studentAvatar(s):`<div class="student-avatar">?</div>`}<div><strong>${esc(s?.name||"Unknown Student")}</strong><small>Student ID #${esc(s?.id??g.studentId)}</small></div></div></td><td>${esc(s?.className||"—")} ${s?.section?`<small class="muted-inline">(${esc(s.section)})</small>`:""}</td><td><strong>${esc(g.subject||"—")}</strong></td><td><strong>${Number(g.marks||0)}/100</strong></td><td><span class="badge ${gradeBadgeClass(grade)}">${esc(grade)}</span></td><td><div class="action-group"><button class="btn btn-secondary btn-sm" onclick="viewGradeReport(${Number(g.studentId)})">Report</button><button class="btn btn-secondary btn-sm" onclick="editGrade(${g.id})">Edit</button><button class="btn btn-danger btn-sm" onclick="deleteGrade(${g.id})">Delete</button></div></td></tr>`;
  }).join("")}</tbody></table></div>`;
}
function renderGrades(){
  const avg=gradeAverage(DB.grades);
  const passed=DB.grades.filter(g=>Number(g.marks)>=50).length;
  const passRate=DB.grades.length?Math.round(passed/DB.grades.length*100):0;
  const assessed=new Set(DB.grades.map(g=>Number(g.studentId))).size;
  const subjects=[...new Set(DB.grades.map(g=>g.subject).filter(Boolean))].sort();
  const classes=[...new Set(DB.students.map(s=>s.className).filter(Boolean))].sort();
  document.getElementById("content").innerHTML=`
    <div class="page-toolbar"><div><div class="page-kicker">ACADEMIC PERFORMANCE</div><h2 class="section-title">Grade Management</h2><p class="section-subtitle">Record marks, calculate grades automatically and review student performance.</p></div><button class="btn btn-primary" onclick="openGradeModal()">＋ Add Grade</button></div>
    <div class="stats compact-stats grade-stats">
      <div class="stat-card"><div class="stat-top"><span class="label">Grade Records</span><div class="stat-icon">📘</div></div><div class="value">${DB.grades.length}</div><span class="hint">Subject assessments</span></div>
      <div class="stat-card"><div class="stat-top"><span class="label">Average Marks</span><div class="stat-icon">%</div></div><div class="value">${avg}%</div><span class="hint">Across all assessments</span></div>
      <div class="stat-card"><div class="stat-top"><span class="label">Pass Rate</span><div class="stat-icon">✓</div></div><div class="value">${passRate}%</div><span class="hint">Marks 50 and above</span></div>
      <div class="stat-card"><div class="stat-top"><span class="label">Students Assessed</span><div class="stat-icon">👨‍🎓</div></div><div class="value">${assessed}</div><span class="hint">Unique students</span></div>
    </div>
    <div class="filter-card">
      <div class="filter-search"><span>⌕</span><input id="gradeSearch" class="search-clean" placeholder="Search student or subject..." oninput="filterGrades()"></div>
      <select id="gradeClassFilter" class="filter-select" onchange="filterGrades()"><option value="">All Classes</option>${classes.map(c=>`<option>${esc(c)}</option>`).join("")}</select>
      <select id="gradeSubjectFilter" class="filter-select" onchange="filterGrades()"><option value="">All Subjects</option>${subjects.map(x=>`<option>${esc(x)}</option>`).join("")}</select>
      <select id="gradeFilter" class="filter-select" onchange="filterGrades()"><option value="">All Grades</option>${["A+","A","B+","B","C","F"].map(x=>`<option>${x}</option>`).join("")}</select>
    </div>
    <div class="card"><div class="card-head"><div><h2>Assessment Records</h2><small id="gradeCount">${DB.grades.length} record${DB.grades.length===1?"":"s"}</small></div><div class="grade-scale"><span>A+ 90–100</span><span>A 80–89</span><span>B+ 70–79</span><span>B 60–69</span><span>C 50–59</span><span>F &lt;50</span></div></div><div id="gradeCard">${gradeTable(DB.grades)}</div></div>`;
}
function filterGrades(){
  const q=(document.getElementById("gradeSearch")?.value||"").toLowerCase();
  const cls=document.getElementById("gradeClassFilter")?.value||"";
  const subject=document.getElementById("gradeSubjectFilter")?.value||"";
  const grade=document.getElementById("gradeFilter")?.value||"";
  const list=DB.grades.filter(g=>{
    const s=DB.students.find(x=>x.id===Number(g.studentId));
    const text=`${s?.name||""} ${g.subject||""} ${g.marks||""} ${g.grade||calculateGrade(g.marks)}`.toLowerCase();
    return text.includes(q)&&(!cls||s?.className===cls)&&(!subject||g.subject===subject)&&(!grade||(g.grade||calculateGrade(g.marks))===grade);
  });
  document.getElementById("gradeCard").innerHTML=gradeTable(list);
  document.getElementById("gradeCount").textContent=`${list.length} record${list.length===1?"":"s"}`;
}
function openGradeModal(id=null){
  const g=id?DB.grades.find(x=>x.id===id):{};
  if(id&&!g)return;
  showModal(id?"Edit Grade":"Add Grade",`<form id="gradeForm"><div class="form-grid">
    <div class="form-group"><label>Student</label><select name="studentId" required>${DB.students.map(s=>`<option value="${s.id}" ${Number(s.id)===Number(g.studentId)?"selected":""}>${esc(s.name)} — ${esc(s.className||"")} ${esc(s.section||"")}</option>`).join("")}</select></div>
    <div class="form-group"><label>Subject</label><select name="subject" required>${["Mathematics","Science","English","Computer Science","Social Studies","Hindi","Bengali","Physics","Chemistry","Other"].map(x=>`<option ${x===(g.subject||"Mathematics")?"selected":""}>${x}</option>`).join("")}</select></div>
    ${field("marks","Marks (0–100)",g.marks??"",true,"number")}
    <div class="form-group"><label>Calculated Grade</label><div id="gradePreview" class="grade-preview">${g.marks!==undefined?calculateGrade(g.marks):"—"}</div></div>
  </div><div class="modal-actions"><button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary">${id?"Update Grade":"Save Grade"}</button></div></form>`);
  const marksInput=document.querySelector('#gradeForm input[name="marks"]');
  const preview=document.getElementById("gradePreview");
  marksInput.min=0;marksInput.max=100;marksInput.step="1";
  marksInput.oninput=()=>{const value=marksInput.value;preview.textContent=value===""?"—":calculateGrade(value);};
  document.getElementById("gradeForm").onsubmit=e=>{
    e.preventDefault();const f=Object.fromEntries(new FormData(e.target));f.studentId=Number(f.studentId);f.marks=Number(f.marks);
    if(!Number.isFinite(f.marks)||f.marks<0||f.marks>100){showToast("Marks must be between 0 and 100");return;}
    f.grade=calculateGrade(f.marks);f.id=id||nextId(DB.grades);
    if(id)DB.grades=DB.grades.map(x=>x.id===id?f:x);else DB.grades.push(f);
    saveData();closeModal();renderGrades();showToast(id?"Grade updated successfully":"Grade added successfully");
  };
}
function editGrade(id){openGradeModal(id)}
function viewGradeReport(studentId){
  const s=DB.students.find(x=>x.id===Number(studentId));
  if(!s)return;
  const rows=DB.grades.filter(g=>Number(g.studentId)===Number(studentId));
  const avg=gradeAverage(rows),passed=rows.filter(g=>Number(g.marks)>=50).length;
  const reportRows=rows.length?rows.map(g=>{const grade=g.grade||calculateGrade(g.marks);return `<tr><td>${esc(g.subject)}</td><td>${Number(g.marks)}/100</td><td><span class="badge ${gradeBadgeClass(grade)}">${esc(grade)}</span></td></tr>`;}).join(""):`<tr><td colspan="3">No assessments recorded.</td></tr>`;
  const body=`<div class="student-profile"><div class="profile-banner">${studentAvatar(s,true)}<div><h2>${esc(s.name)}</h2><p>${esc(s.className)} • Section ${esc(s.section)} • Roll ${esc(s.roll)}</p></div></div><div class="profile-stats"><div><small>Assessments</small><strong>${rows.length}</strong></div><div><small>Average</small><strong>${avg}%</strong></div><div><small>Pass Rate</small><strong>${rows.length?Math.round(passed/rows.length*100):0}%</strong></div></div><div class="report-table"><table class="data-table"><thead><tr><th>Subject</th><th>Marks</th><th>Grade</th></tr></thead><tbody>${reportRows}</tbody></table></div><div class="modal-actions"><button class="btn btn-secondary" onclick="closeModal()">Close</button></div></div>`;
  showModal("Student Grade Report",body);
}
function deleteGrade(id){
  const g=DB.grades.find(x=>x.id===id);if(!g)return;
  if(confirm("Delete this grade record?")){DB.grades=DB.grades.filter(x=>x.id!==id);saveData();renderGrades();showToast("Grade record deleted");}
}

function feeType(f){return f.type||f.feeType||"Other";}
function feeStatus(f){return f.status||"Pending";}
function feeTotal(list){return list.reduce((s,f)=>s+Number(f.amount||0),0);}
function feeTable(list){
  if(!list.length)return `<div class="empty-state"><div class="empty-icon">₹</div><strong>No fee records found</strong><p>Add a fee record or change the filters.</p></div>`;
  return `<div class="table-wrap"><table class="data-table"><thead><tr><th>Student</th><th>Class</th><th>Fee Type</th><th>Amount</th><th>Payment Date</th><th>Status</th><th>Actions</th></tr></thead><tbody>${list.map(f=>{
    const s=DB.students.find(x=>x.id===Number(f.studentId)),status=feeStatus(f),type=feeType(f);
    return `<tr><td><div class="person-cell">${s?studentAvatar(s):`<div class="student-avatar">?</div>`}<div><strong>${esc(s?.name||"Unknown Student")}</strong><small>Student ID #${esc(s?.id??f.studentId)}</small></div></div></td><td>${esc(s?.className||"—")} ${s?.section?`<small class="muted-inline">(${esc(s.section)})</small>`:""}</td><td>${esc(type)}</td><td><strong>₹${Number(f.amount||0).toLocaleString("en-IN")}</strong></td><td>${esc(f.paidDate||"—")}</td><td><span class="badge ${status==="Paid"?"success":"warning"}">${esc(status)}</span></td><td><div class="action-group">${status!=="Paid"?`<button class="btn btn-secondary btn-sm" onclick="markFeePaid(${f.id})">Mark Paid</button>`:""}<button class="btn btn-secondary btn-sm" onclick="viewFeeHistory(${Number(f.studentId)})">History</button><button class="btn btn-secondary btn-sm" onclick="editFee(${f.id})">Edit</button><button class="btn btn-danger btn-sm" onclick="deleteFee(${f.id})">Delete</button></div></td></tr>`;
  }).join("")}</tbody></table></div>`;
}
function renderFees(){
  const total=feeTotal(DB.fees),paid=feeTotal(DB.fees.filter(f=>feeStatus(f)==="Paid")),pending=feeTotal(DB.fees.filter(f=>feeStatus(f)!=="Paid"));
  const rate=total?Math.round(paid/total*100):0;
  const types=[...new Set(DB.fees.map(f=>feeType(f)).filter(Boolean))].sort();
  const classes=[...new Set(DB.students.map(s=>s.className).filter(Boolean))].sort();
  document.getElementById("content").innerHTML=`
    <div class="page-toolbar"><div><div class="page-kicker">FINANCE & COLLECTIONS</div><h2 class="section-title">Fee Management</h2><p class="section-subtitle">Track fee charges, payments, pending balances and student payment history.</p></div><button class="btn btn-primary" onclick="openFeeModal()">＋ Add Fee Record</button></div>
    <div class="stats compact-stats fee-stats">
      <div class="stat-card"><div class="stat-top"><span class="label">Total Billed</span><div class="stat-icon">₹</div></div><div class="value">₹${total.toLocaleString("en-IN")}</div><span class="hint">All fee records</span></div>
      <div class="stat-card"><div class="stat-top"><span class="label">Collected</span><div class="stat-icon">✓</div></div><div class="value">₹${paid.toLocaleString("en-IN")}</div><span class="hint">${rate}% collection rate</span></div>
      <div class="stat-card"><div class="stat-top"><span class="label">Pending</span><div class="stat-icon">!</div></div><div class="value">₹${pending.toLocaleString("en-IN")}</div><span class="hint">Awaiting payment</span></div>
      <div class="stat-card"><div class="stat-top"><span class="label">Fee Records</span><div class="stat-icon">▤</div></div><div class="value">${DB.fees.length}</div><span class="hint">Payment entries</span></div>
    </div>
    <div class="filter-card"><div class="filter-search"><span>⌕</span><input id="feeSearch" class="search-clean" placeholder="Search student, fee type or amount..." oninput="filterFees()"></div><select id="feeClassFilter" class="filter-select" onchange="filterFees()"><option value="">All Classes</option>${classes.map(c=>`<option>${esc(c)}</option>`).join("")}</select><select id="feeTypeFilter" class="filter-select" onchange="filterFees()"><option value="">All Fee Types</option>${types.map(x=>`<option>${esc(x)}</option>`).join("")}</select><select id="feeStatusFilter" class="filter-select" onchange="filterFees()"><option value="">All Status</option><option>Paid</option><option>Pending</option></select></div>
    <div class="card"><div class="card-head"><div><h2>Fee Records</h2><small id="feeCount">${DB.fees.length} record${DB.fees.length===1?"":"s"}</small></div><div class="collection-mini"><span>Collection</span><strong>${rate}%</strong></div></div><div id="feeCard">${feeTable(DB.fees)}</div></div>`;
}
function filterFees(){
  const q=(document.getElementById("feeSearch")?.value||"").toLowerCase(),cls=document.getElementById("feeClassFilter")?.value||"",type=document.getElementById("feeTypeFilter")?.value||"",status=document.getElementById("feeStatusFilter")?.value||"";
  const list=DB.fees.filter(f=>{const s=DB.students.find(x=>x.id===Number(f.studentId)),text=`${s?.name||""} ${feeType(f)} ${f.amount||""} ${feeStatus(f)}`.toLowerCase();return text.includes(q)&&(!cls||s?.className===cls)&&(!type||feeType(f)===type)&&(!status||feeStatus(f)===status);});
  document.getElementById("feeCard").innerHTML=feeTable(list);document.getElementById("feeCount").textContent=`${list.length} record${list.length===1?"":"s"}`;
}
function openFeeModal(id=null){
  const f=id?DB.fees.find(x=>x.id===id):{};if(id&&!f)return;
  const defaultDate=new Date().toISOString().slice(0,10);
  showModal(id?"Edit Fee Record":"Add Fee Record",`<form id="feeForm"><div class="form-grid">
    <div class="form-group"><label>Student</label><select name="studentId" required>${DB.students.map(s=>`<option value="${s.id}" ${Number(s.id)===Number(f.studentId)?"selected":""}>${esc(s.name)} — ${esc(s.className||"")} ${esc(s.section||"")}</option>`).join("")}</select></div>
    <div class="form-group"><label>Fee Type</label><select name="type" required>${["Tuition Fee","Transport Fee","Exam Fee","Other"].map(x=>`<option ${x===feeType(f)?"selected":""}>${x}</option>`).join("")}</select></div>
    ${field("amount","Amount (₹)",f.amount??"",true,"number")}
    ${field("paidDate","Payment Date",f.paidDate||defaultDate,false,"date")}
    <div class="form-group"><label>Status</label><select name="status"><option ${feeStatus(f)==="Paid"?"selected":""}>Paid</option><option ${feeStatus(f)!=="Paid"?"selected":""}>Pending</option></select></div>
    ${field("notes","Notes (optional)",f.notes||"",false)}
  </div><div class="modal-actions"><button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary">${id?"Update Fee":"Save Fee"}</button></div></form>`);
  const form=document.getElementById("feeForm");
  form.onsubmit=e=>{e.preventDefault();const x=Object.fromEntries(new FormData(e.target));x.id=id||nextId(DB.fees);x.studentId=Number(x.studentId);x.amount=Number(x.amount);if(!Number.isFinite(x.amount)||x.amount<=0){showToast("Enter a valid fee amount");return;}if(x.status!=="Paid")x.paidDate="";if(id)DB.fees=DB.fees.map(item=>item.id===id?x:item);else DB.fees.push(x);saveData();closeModal();renderFees();showToast(id?"Fee record updated successfully":"Fee record added successfully");};
}
function editFee(id){openFeeModal(id)}
function markFeePaid(id){const f=DB.fees.find(x=>x.id===id);if(!f)return;f.status="Paid";f.paidDate=new Date().toISOString().slice(0,10);saveData();renderFees();showToast("Fee marked as paid");}
function viewFeeHistory(studentId){
  const s=DB.students.find(x=>x.id===Number(studentId));
  if(!s)return;
  const rows=DB.fees.filter(f=>Number(f.studentId)===Number(studentId));
  const total=feeTotal(rows),paid=feeTotal(rows.filter(f=>feeStatus(f)==="Paid")),pending=total-paid;
  const historyRows=rows.length?rows.map(f=>`<tr><td>${esc(feeType(f))}</td><td>₹${Number(f.amount||0).toLocaleString("en-IN")}</td><td>${esc(f.paidDate||"—")}</td><td><span class="badge ${feeStatus(f)==="Paid"?"success":"warning"}">${esc(feeStatus(f))}</span></td></tr>`).join(""):`<tr><td colspan="4">No fee records found.</td></tr>`;
  const body=`<div class="student-profile"><div class="profile-banner">${studentAvatar(s,true)}<div><h2>${esc(s.name)}</h2><p>${esc(s.className)} • Section ${esc(s.section)} • Roll ${esc(s.roll)}</p></div></div><div class="profile-stats"><div><small>Total Billed</small><strong>₹${total.toLocaleString("en-IN")}</strong></div><div><small>Paid</small><strong>₹${paid.toLocaleString("en-IN")}</strong></div><div><small>Pending</small><strong>₹${pending.toLocaleString("en-IN")}</strong></div></div><div class="report-table"><table class="data-table"><thead><tr><th>Fee Type</th><th>Amount</th><th>Date</th><th>Status</th></tr></thead><tbody>${historyRows}</tbody></table></div><div class="modal-actions"><button class="btn btn-secondary" onclick="closeModal()">Close</button></div></div>`;
  showModal("Student Fee History",body);
}
function deleteFee(id){const f=DB.fees.find(x=>x.id===id);if(!f)return;if(confirm("Delete this fee record?")){DB.fees=DB.fees.filter(x=>x.id!==id);saveData();renderFees();showToast("Fee record deleted");}}

function renderTimetable(){
  const days=["Monday","Tuesday","Wednesday","Thursday","Friday"];
  const slots=["09:00 - 10:00","10:00 - 11:00","11:00 - 12:00","12:00 - 01:00"];
  document.getElementById("content").innerHTML=`<div class="toolbar"><div></div><button class="btn btn-primary" onclick="openTimetableModal()">+ Add Period</button></div><div class="card" style="overflow:auto"><div class="schedule"><div class="head">Time</div>${days.map(d=>`<div class="head">${d}</div>`).join("")}${slots.map(time=>`<div class="period">${time}</div>${days.map(day=>{const x=DB.timetable.find(t=>t.day===day&&t.time===time);return `<div>${x?`<strong>${esc(x.subject)}</strong><small style="display:block;color:var(--muted)">${esc(x.className)}<br>${esc(x.teacher)}</small>`:"—"}</div>`}).join("")}`).join("")}</div></div>`;
}
function openTimetableModal(){
  showModal("Add Timetable Period",`<form id="ttForm"><div class="form-grid"><div class="form-group"><label>Day</label><select name="day">${["Monday","Tuesday","Wednesday","Thursday","Friday"].map(x=>`<option>${x}</option>`).join("")}</select></div>${field("time","Time","09:00 - 10:00",true)}${field("subject","Subject","",true)}${field("teacher","Teacher","",true)}${field("className","Class & Section","",true)}</div><div class="modal-actions"><button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary">Save</button></div></form>`);
  document.getElementById("ttForm").onsubmit=e=>{e.preventDefault();const f=Object.fromEntries(new FormData(e.target));DB.timetable.push(f);saveData();closeModal();renderTimetable();showToast("Period added");};
}

function field(name,label,value="",required=false,type="text"){
  return `<div class="form-group"><label>${label}</label><input name="${name}" type="${type}" value="${esc(value)}" ${required==="true"||required===true?"required":""}></div>`;
}
function showModal(title,body){document.getElementById("modalRoot").innerHTML=`<div class="modal-backdrop" onclick="if(event.target===this)closeModal()"><div class="modal"><div class="modal-head"><h2>${title}</h2><button class="btn btn-secondary btn-sm" onclick="closeModal()">✕</button></div><div class="modal-body">${body}</div></div></div>`;}
function closeModal(){document.getElementById("modalRoot").innerHTML="";}
function showToast(msg){const t=document.getElementById("toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2200);}
