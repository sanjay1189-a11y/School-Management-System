/* Final polish / bonus modules for EduManage. */
(function(){
  pages.reports=['Reports & Export','Generate printable summaries and download CSV reports'];
  pages.exams=['Exam Schedule','Plan examinations, dates, subjects and venues'];
  pages.communications=['Parent Communication','Record and manage parent messages'];
  DB.exams=Array.isArray(DB.exams)?DB.exams:[];
  DB.messages=Array.isArray(DB.messages)?DB.messages:[];
  DB.timetable=(DB.timetable||[]).map((x,i)=>({...x,id:Number(x.id)||i+1}));
  saveData();

  function user(){return window.EduAuth?.currentUser?.()||{name:'Admin User',role:'Admin'};}
  function role(){return user().role||'Admin';}
  function can(action){
    const r=String(role()||'Admin').trim().toLowerCase();
    if(action==='manage')return ['admin','teacher'].includes(r);
    if(action==='academic')return ['admin','teacher'].includes(r);
    return true;
  }
  function safeDownload(name,content,type='text/csv;charset=utf-8'){
    const blob=new Blob([content],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),500);
  }
  function csv(rows){
    return rows.map(row=>row.map(v=>`"${String(v??'').replace(/"/g,'""')}"`).join(',')).join('\n');
  }
  function printHtml(title,body){
    const w=window.open('','_blank','width=900,height=700');
    if(!w){showToast('Allow pop-ups to print this report');return;}
    w.document.write(`<!doctype html><html><head><title>${esc(title)}</title><style>body{font-family:Arial,sans-serif;padding:30px;color:#222}h1{font-size:24px}p{color:#666}table{width:100%;border-collapse:collapse;margin-top:20px}th,td{border:1px solid #ddd;padding:9px;text-align:left;font-size:12px}th{background:#fff7df} .meta{margin:10px 0 20px;padding:12px;background:#fafafa;border:1px solid #eee}</style></head><body><h1>${esc(title)}</h1><div class="meta">EduManage • ${new Date().toLocaleDateString('en-IN')} • ${esc(user().name||'')}</div>${body}<script>window.onload=()=>window.print();<\/script></body></html>`);w.document.close();
  }

  window.exportStudentsCSV=()=>safeDownload('students-report.csv',csv([['ID','Name','Class','Section','Roll','Parent/Guardian','Phone','Status'],...DB.students.map(s=>[s.id,s.name,s.className,s.section,s.roll,s.parent,s.phone,s.status||'Active'])]));
  window.exportTeachersCSV=()=>safeDownload('teachers-report.csv',csv([['ID','Name','Subject','Classes','Phone','Email','Status'],...DB.teachers.map(t=>[t.id,t.name,t.subject,t.classes,t.phone,t.email,t.status||'Active'])]));
  window.exportGradesCSV=()=>safeDownload('grades-report.csv',csv([['Student','Class','Section','Subject','Marks','Grade'],...DB.grades.map(g=>{const s=DB.students.find(x=>x.id===Number(g.studentId));return [s?.name||'Unknown',s?.className||'',s?.section||'',g.subject,g.marks,g.grade||calculateGrade(g.marks)]})]));
  window.exportFeesCSV=()=>safeDownload('fees-report.csv',csv([['Student','Class','Fee Type','Amount','Payment Date','Status'],...DB.fees.map(f=>{const s=DB.students.find(x=>x.id===Number(f.studentId));return [s?.name||'Unknown',s?.className||'',feeType(f),f.amount,f.paidDate||'',feeStatus(f)]})]));
  window.exportAttendanceCSV=()=>safeDownload('attendance-report.csv',csv([['Date','Student','Class','Section','Status'],...DB.attendance.map(a=>{const s=DB.students.find(x=>x.id===Number(a.studentId));return [a.date,s?.name||'Unknown',s?.className||'',s?.section||'',a.status]})]));
  window.printStudentsReport=()=>printHtml('Student Report',`<table><thead><tr><th>ID</th><th>Name</th><th>Class</th><th>Section</th><th>Roll</th><th>Status</th></tr></thead><tbody>${DB.students.map(s=>`<tr><td>${s.id}</td><td>${esc(s.name)}</td><td>${esc(s.className)}</td><td>${esc(s.section)}</td><td>${esc(s.roll)}</td><td>${esc(s.status||'Active')}</td></tr>`).join('')}</tbody></table>`);
  window.printFeeReport=()=>printHtml('Fee Collection Report',`<p>Total billed: ₹${feeTotal(DB.fees).toLocaleString('en-IN')} • Collected: ₹${feeTotal(DB.fees.filter(f=>feeStatus(f)==='Paid')).toLocaleString('en-IN')} • Pending: ₹${feeTotal(DB.fees.filter(f=>feeStatus(f)!=='Paid')).toLocaleString('en-IN')}</p><table><thead><tr><th>Student</th><th>Fee</th><th>Amount</th><th>Status</th></tr></thead><tbody>${DB.fees.map(f=>{const s=DB.students.find(x=>x.id===Number(f.studentId));return `<tr><td>${esc(s?.name||'Unknown')}</td><td>${esc(feeType(f))}</td><td>₹${Number(f.amount||0).toLocaleString('en-IN')}</td><td>${esc(feeStatus(f))}</td></tr>`}).join('')}</tbody></table>`);
  window.printGradeReport=()=>printHtml('Academic Grade Report',`<table><thead><tr><th>Student</th><th>Subject</th><th>Marks</th><th>Grade</th></tr></thead><tbody>${DB.grades.map(g=>{const s=DB.students.find(x=>x.id===Number(g.studentId));return `<tr><td>${esc(s?.name||'Unknown')}</td><td>${esc(g.subject)}</td><td>${g.marks}/100</td><td>${esc(g.grade||calculateGrade(g.marks))}</td></tr>`}).join('')}</tbody></table>`);

  function renderReports(){
    document.getElementById('content').innerHTML=`<div class="page-toolbar"><div><div class="page-kicker">REPORTING CENTER</div><h2 class="section-title">Reports & Export</h2><p class="section-subtitle">Download CSV data or generate print-ready school reports.</p></div></div>
    <div class="stats compact-stats"><div class="stat-card"><div class="stat-top"><span class="label">Students</span><div class="stat-icon">👨‍🎓</div></div><div class="value">${DB.students.length}</div><span class="hint">Student records</span></div><div class="stat-card"><div class="stat-top"><span class="label">Assessments</span><div class="stat-icon">📝</div></div><div class="value">${DB.grades.length}</div><span class="hint">Grade records</span></div><div class="stat-card"><div class="stat-top"><span class="label">Fees</span><div class="stat-icon">₹</div></div><div class="value">${DB.fees.length}</div><span class="hint">Payment records</span></div><div class="stat-card"><div class="stat-top"><span class="label">Attendance</span><div class="stat-icon">✓</div></div><div class="value">${DB.attendance.length}</div><span class="hint">Saved attendance rows</span></div></div>
    <div class="report-grid"><div class="card"><div class="card-head"><div><h2>CSV Export</h2><small>Open these files in Excel or Google Sheets.</small></div></div><div class="report-actions"><button class="report-action" onclick="exportStudentsCSV()">👨‍🎓 Students <span>CSV</span></button><button class="report-action" onclick="exportTeachersCSV()">👩‍🏫 Teachers <span>CSV</span></button><button class="report-action" onclick="exportGradesCSV()">📝 Grades <span>CSV</span></button><button class="report-action" onclick="exportFeesCSV()">₹ Fees <span>CSV</span></button><button class="report-action" onclick="exportAttendanceCSV()">✓ Attendance <span>CSV</span></button></div></div><div class="card"><div class="card-head"><div><h2>Print Reports</h2><small>Use the browser's Save as PDF option.</small></div></div><div class="report-actions"><button class="report-action" onclick="printStudentsReport()">Student Report <span>Print</span></button><button class="report-action" onclick="printGradeReport()">Grade Report <span>Print</span></button><button class="report-action" onclick="printFeeReport()">Fee Report <span>Print</span></button></div></div></div>`;
  }

  window.renderReports=renderReports;

  function renderExams(){
    const exams=DB.exams.slice().sort((a,b)=>(a.date||'').localeCompare(b.date||''));
    document.getElementById('content').innerHTML=`<div class="page-toolbar"><div><div class="page-kicker">ACADEMIC CALENDAR</div><h2 class="section-title">Exam Schedule</h2><p class="section-subtitle">Plan examination dates, subjects, classes and venues.</p></div>${can('manage')?'<button class="btn btn-primary" onclick="openExamModal()">＋ Add Exam</button>':''}</div><div class="card"><div class="card-head"><div><h2>Upcoming & Scheduled Exams</h2><small>${exams.length} scheduled exam${exams.length===1?'':'s'}</small></div></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Date</th><th>Exam</th><th>Subject</th><th>Class</th><th>Time</th><th>Venue</th>${can('manage')?'<th>Actions</th>':''}</tr></thead><tbody>${exams.length?exams.map(x=>`<tr><td><strong>${esc(x.date)}</strong></td><td>${esc(x.name)}</td><td>${esc(x.subject)}</td><td>${esc(x.className)}</td><td>${esc(x.time)}</td><td>${esc(x.venue)}</td>${can('manage')?`<td><div class="action-group"><button class="btn btn-secondary btn-sm" onclick="openExamModal(${x.id})">Edit</button><button class="btn btn-danger btn-sm" onclick="deleteExam(${x.id})">Delete</button></div></td>`:''}</tr>`).join(''):`<tr><td colspan="${can('manage')?7:6}"><div class="empty-state">📅<strong>No exams scheduled</strong><p>Add an exam to build the academic calendar.</p></div></td></tr>`}</tbody></table></div></div>`;
  }
  window.renderExams=renderExams;
  window.openExamModal=function(id=null){
    if(!can('manage')){showToast('Only Admin or Teacher can manage the exam schedule');return}
    const x=id?DB.exams.find(e=>e.id===id):{};showModal(id?'Edit Exam':'Add Exam',`<form id="examForm"><div class="form-grid">${field('name','Exam Name',x.name||'Mid-Term Examination',true)}${field('subject','Subject',x.subject||'',true)}${field('className','Class & Section',x.className||'',true)}${field('date','Date',x.date||new Date().toISOString().slice(0,10),true,'date')}${field('time','Time',x.time||'10:00 - 12:00',true)}${field('venue','Venue',x.venue||'Main Hall',true)}</div><div class="modal-actions"><button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary">${id?'Update Exam':'Save Exam'}</button></div></form>`);document.getElementById('examForm').onsubmit=e=>{e.preventDefault();const f=Object.fromEntries(new FormData(e.target));f.id=id||nextId(DB.exams);if(id)DB.exams=DB.exams.map(v=>v.id===id?f:v);else DB.exams.push(f);saveData();closeModal();renderExams();showToast(id?'Exam updated':'Exam scheduled')};
  };
  window.deleteExam=function(id){if(!can('manage'))return;const x=DB.exams.find(e=>e.id===id);if(x&&confirm(`Delete ${x.name}?`)){DB.exams=DB.exams.filter(e=>e.id!==id);saveData();renderExams();showToast('Exam deleted')}};

  function renderCommunications(){
    const messages=DB.messages.slice().sort((a,b)=>(b.date||'').localeCompare(a.date||''));
    document.getElementById('content').innerHTML=`<div class="page-toolbar"><div><div class="page-kicker">FAMILY ENGAGEMENT</div><h2 class="section-title">Parent Communication</h2><p class="section-subtitle">Keep a simple local record of notices and parent messages.</p></div>${can('manage')||role()==='Teacher'?'<button class="btn btn-primary" onclick="openMessageModal()">＋ New Message</button>':''}</div><div class="card"><div class="card-head"><div><h2>Communication Log</h2><small>${messages.length} message${messages.length===1?'':'s'}</small></div></div><div class="message-list">${messages.length?messages.map(m=>`<article class="message-card"><div class="message-meta"><strong>${esc(m.subject)}</strong><span>${esc(m.date||'')}</span></div><p>${esc(m.body)}</p><small>To: ${esc(m.recipient||'All Parents')} • ${esc(m.sender||'School')}</small>${(can('manage')||role()==='Teacher')?`<button class="btn btn-danger btn-sm message-delete" onclick="deleteMessage(${m.id})">Delete</button>`:''}</article>`).join(''):`<div class="empty-state">💬<strong>No messages yet</strong><p>Create a message to start the communication log.</p></div>`}</div></div>`;
  }
  window.renderCommunications=renderCommunications;
  window.openMessageModal=function(){if(!(can('manage')||role()==='Teacher'))return;showModal('New Parent Message',`<form id="messageForm"><div class="form-grid">${field('subject','Subject','School Notice',true)}${field('recipient','Recipient','All Parents',true)}<div class="form-group full"><label>Message</label><textarea name="body" rows="5" required placeholder="Write the message..."></textarea></div></div><div class="modal-actions"><button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary">Send Message</button></div></form>`);document.getElementById('messageForm').onsubmit=e=>{e.preventDefault();const f=Object.fromEntries(new FormData(e.target));f.id=nextId(DB.messages);f.date=new Date().toISOString().slice(0,10);f.sender=user().name;DB.messages.unshift(f);saveData();closeModal();renderCommunications();showToast('Message saved')};};
  window.deleteMessage=function(id){if(!(can('manage')||role()==='Teacher'))return;if(confirm('Delete this message?')){DB.messages=DB.messages.filter(m=>m.id!==id);saveData();renderCommunications();showToast('Message deleted')}};

  function renderTimetableFinal(){
    const days=['Monday','Tuesday','Wednesday','Thursday','Friday'],slots=['09:00 - 10:00','10:00 - 11:00','11:00 - 12:00','12:00 - 01:00'];
    document.getElementById('content').innerHTML=`<div class="page-toolbar"><div><div class="page-kicker">WEEKLY SCHEDULE</div><h2 class="section-title">Timetable</h2><p class="section-subtitle">View and manage the weekly class schedule.</p></div>${can('manage')?'<button class="btn btn-primary" onclick="openTimetableModal()">＋ Add Period</button>':''}</div><div class="card" style="overflow:auto"><div class="schedule"><div class="head">Time</div>${days.map(d=>`<div class="head">${d}</div>`).join('')}${slots.map(time=>`<div class="period">${time}</div>${days.map(day=>{const x=DB.timetable.find(t=>t.day===day&&t.time===time);return `<div class="schedule-cell">${x?`<strong>${esc(x.subject)}</strong><small>${esc(x.className)}<br>${esc(x.teacher||'')}</small><span class="schedule-actions">${can('manage')?`<button onclick="editTimetable(${x.id||0})">Edit</button><button onclick="deleteTimetable(${x.id||0})">×</button>`:''}</span>`:'—'}</div>`}).join('')}`).join('')}</div></div>`;
  }
  window.renderTimetable=renderTimetableFinal;
  window.openTimetableModal=function(id=null){
    if(!can('manage')){showToast('Only Admin can manage the timetable');return}
    const old=id?DB.timetable.find(x=>Number(x.id)===Number(id)):{};const days=['Monday','Tuesday','Wednesday','Thursday','Friday'];const slots=['09:00 - 10:00','10:00 - 11:00','11:00 - 12:00','12:00 - 01:00'];showModal(id?'Edit Timetable Period':'Add Timetable Period',`<form id="ttForm"><div class="form-grid"><div class="form-group"><label>Day</label><select name="day">${days.map(x=>`<option ${x===old.day?'selected':''}>${x}</option>`).join('')}</select></div><div class="form-group"><label>Time</label><select name="time">${slots.map(x=>`<option ${x===old.time?'selected':''}>${x}</option>`).join('')}</select></div>${field('subject','Subject',old.subject||'',true)}${field('teacher','Teacher',old.teacher||'',true)}${field('className','Class & Section',old.className||'',true)}</div><div class="modal-actions"><button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary">${id?'Update':'Save'}</button></div></form>`);document.getElementById('ttForm').onsubmit=e=>{e.preventDefault();const f=Object.fromEntries(new FormData(e.target));f.id=id||nextId(DB.timetable);const duplicate=DB.timetable.find(x=>x.day===f.day&&x.time===f.time&&Number(x.id)!==Number(id));if(duplicate){showToast('That time slot is already occupied');return}if(id)DB.timetable=DB.timetable.map(x=>Number(x.id)===Number(id)?f:x);else DB.timetable.push(f);saveData();closeModal();renderTimetableFinal();showToast(id?'Period updated':'Period added')};
  };
  window.editTimetable=id=>{if(id)openTimetableModal(id)};
  window.deleteTimetable=id=>{if(!can('manage'))return;const x=DB.timetable.find(t=>Number(t.id)===Number(id));if(x&&confirm('Delete this timetable period?')){DB.timetable=DB.timetable.filter(t=>Number(t.id)!==Number(id));saveData();renderTimetableFinal();showToast('Period deleted')}};


  /* Phase 6 — Reporting Center upgrade */
  const reportState={type:'students',className:'',status:'',from:'',to:''};
  function reportStudent(id){return DB.students.find(s=>Number(s.id)===Number(id));}
  function reportClassOptions(){return [...new Set(DB.students.map(s=>s.className).filter(Boolean))].sort((a,b)=>String(a).localeCompare(String(b)));}
  function inDateRange(value,from,to){if(!value)return !from&&!to; if(from&&value<from)return false; if(to&&value>to)return false; return true;}
  function filteredReportData(){
    const {type,className,status,from,to}=reportState;
    if(type==='students') return DB.students.filter(s=>(!className||s.className===className)&&(!status||(s.status||'Active')===status));
    if(type==='teachers') return DB.teachers.filter(t=>!status||(t.status||'Active')===status);
    if(type==='grades') return DB.grades.filter(g=>{const s=reportStudent(g.studentId);return (!className||s?.className===className)&&inDateRange(g.date||'',from,to);});
    if(type==='fees') return DB.fees.filter(f=>{const s=reportStudent(f.studentId);return (!className||s?.className===className)&&(!status||feeStatus(f)===status)&&inDateRange(f.paidDate||'',from,to);});
    return DB.attendance.filter(a=>{const s=reportStudent(a.studentId);return (!className||s?.className===className)&&(!status||String(a.status||'')===status)&&inDateRange(a.date||'',from,to);});
  }
  function reportRows(){
    const rows=filteredReportData();
    if(reportState.type==='students') return [['ID','Name','Class','Section','Roll','Parent/Guardian','Phone','Status'],...rows.map(s=>[s.id,s.name,s.className,s.section,s.roll,s.parent,s.phone,s.status||'Active'])];
    if(reportState.type==='teachers') return [['ID','Name','Subject','Classes','Phone','Email','Status'],...rows.map(t=>[t.id,t.name,t.subject,t.classes,t.phone,t.email,t.status||'Active'])];
    if(reportState.type==='grades') return [['Student','Class','Section','Subject','Marks','Grade'],...rows.map(g=>{const s=reportStudent(g.studentId);return [s?.name||'Unknown',s?.className||'',s?.section||'',g.subject,g.marks,g.grade||calculateGrade(g.marks)]})];
    if(reportState.type==='fees') return [['Student','Class','Fee Type','Amount','Payment Date','Status'],...rows.map(f=>{const s=reportStudent(f.studentId);return [s?.name||'Unknown',s?.className||'',feeType(f),f.amount,f.paidDate||'',feeStatus(f)]})];
    return [['Date','Student','Class','Section','Status'],...rows.map(a=>{const s=reportStudent(a.studentId);return [a.date,s?.name||'Unknown',s?.className||'',s?.section||'',a.status]})];
  }
  function reportTitle(){return ({students:'Student Report',teachers:'Teacher Report',grades:'Academic Grade Report',fees:'Fee Collection Report',attendance:'Attendance Report'})[reportState.type];}
  function exportCurrentReport(){safeDownload(reportTitle().toLowerCase().replace(/[^a-z0-9]+/g,'-')+'.csv',csv(reportRows()));showToast(`${reportTitle()} CSV downloaded`);}
  function printCurrentReport(){
    const rows=reportRows();
    const head=rows[0],body=rows.slice(1);
    const table=`<table><thead><tr>${head.map(x=>`<th>${esc(x)}</th>`).join('')}</tr></thead><tbody>${body.map(r=>`<tr>${r.map(x=>`<td>${esc(x)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
    const filterText=[reportState.className&&`Class: ${reportState.className}`,reportState.status&&`Status: ${reportState.status}`,reportState.from&&`From: ${reportState.from}`,reportState.to&&`To: ${reportState.to}`].filter(Boolean).join(' • ');
    printHtml(reportTitle(),`${filterText?`<p>${esc(filterText)}</p>`:''}<p>Records: ${body.length}</p>${table}`);
  }
  function renderReportsV6(){
    const rows=filteredReportData();
    const classes=reportClassOptions();
    const statusOptions=reportState.type==='fees'?['Paid','Pending']:reportState.type==='attendance'?['Present','Absent']:reportState.type==='students'?['Active','Inactive']:reportState.type==='teachers'?['Active','Inactive']:[];
    const typeOptions=[['students','Students'],['teachers','Teachers'],['grades','Grades'],['fees','Fees'],['attendance','Attendance']];
    let statA=rows.length,statB='—',statC='—',statD='—';
    if(reportState.type==='grades'){const marks=rows.map(x=>Number(x.marks)||0);statB=marks.length?`${Math.round(marks.reduce((a,b)=>a+b,0)/marks.length)}/100`:'—';statC=`${marks.filter(x=>x>=50).length}/${marks.length||0}`;statD=`${new Set(rows.map(x=>x.studentId)).size}`;}
    if(reportState.type==='fees'){const billed=rows.reduce((a,x)=>a+Number(x.amount||0),0),paid=rows.filter(x=>feeStatus(x)==='Paid').reduce((a,x)=>a+Number(x.amount||0),0);statB=`₹${billed.toLocaleString('en-IN')}`;statC=`₹${paid.toLocaleString('en-IN')}`;statD=billed?`${Math.round(paid/billed*100)}%`:'0%';}
    if(reportState.type==='attendance'){const present=rows.filter(x=>String(x.status)==='Present').length;statB=`${present}/${rows.length||0}`;statC=rows.length?`${Math.round(present/rows.length*100)}%`:'—';statD=new Set(rows.map(x=>x.studentId)).size;}
    document.getElementById('content').innerHTML=`
      <div class="page-toolbar"><div><div class="page-kicker">REPORTING CENTER • PHASE 6</div><h2 class="section-title">Reports & Export</h2><p class="section-subtitle">Filter school records, export CSV files, or print a PDF-ready report.</p></div></div>
      <div class="card report-filter-card"><div class="report-filter-grid">
        <div class="form-group"><label>Report</label><select id="reportType">${typeOptions.map(([v,l])=>`<option value="${v}" ${v===reportState.type?'selected':''}>${l}</option>`).join('')}</select></div>
        <div class="form-group"><label>Class</label><select id="reportClass"><option value="">All Classes</option>${classes.map(c=>`<option ${c===reportState.className?'selected':''}>${esc(c)}</option>`).join('')}</select></div>
        ${statusOptions.length?`<div class="form-group"><label>Status</label><select id="reportStatus"><option value="">All Statuses</option>${statusOptions.map(x=>`<option ${x===reportState.status?'selected':''}>${x}</option>`).join('')}</select></div>`:'<div class="form-group"><label>Status</label><select id="reportStatus"><option value="">All Statuses</option></select></div>'}
        <div class="form-group"><label>From</label><input id="reportFrom" type="date" value="${reportState.from}"></div>
        <div class="form-group"><label>To</label><input id="reportTo" type="date" value="${reportState.to}"></div>
        <div class="report-filter-actions"><button class="btn btn-primary" id="applyReport">Apply Filters</button><button class="btn btn-secondary" id="resetReport">Reset</button></div>
      </div></div>
      <div class="stats compact-stats report-stats"><div class="stat-card"><div class="stat-top"><span class="label">Records</span><div class="stat-icon">▤</div></div><div class="value">${statA}</div><span class="hint">Matching records</span></div><div class="stat-card"><div class="stat-top"><span class="label">Metric 1</span><div class="stat-icon">◈</div></div><div class="value">${statB}</div><span class="hint">Based on selected report</span></div><div class="stat-card"><div class="stat-top"><span class="label">Metric 2</span><div class="stat-icon">✓</div></div><div class="value">${statC}</div><span class="hint">Current filtered data</span></div><div class="stat-card"><div class="stat-top"><span class="label">Metric 3</span><div class="stat-icon">#</div></div><div class="value">${statD}</div><span class="hint">Report-specific metric</span></div></div>
      <div class="card"><div class="card-head"><div><h2>${reportTitle()}</h2><small>${rows.length} matching record${rows.length===1?'':'s'}</small></div><div class="report-toolbar-actions"><button class="btn btn-secondary" id="exportCurrent">↓ Export CSV</button><button class="btn btn-primary" id="printCurrent">▣ Print / Save PDF</button></div></div>
      <div class="report-preview"><div class="report-preview-label">Preview</div><div class="table-wrap"><table class="data-table"><thead><tr>${reportRows()[0].map(x=>`<th>${esc(x)}</th>`).join('')}</tr></thead><tbody>${rows.length?reportRows().slice(1,31).map(r=>`<tr>${r.map(x=>`<td>${esc(x)}</td>`).join('')}</tr>`).join(''):`<tr><td colspan="${reportRows()[0].length}"><div class="empty-state"><div class="empty-icon">📄</div><strong>No records match these filters</strong><p>Change the filters and apply them again.</p></div></td></tr>`}</tbody></table></div>${rows.length>30?`<small class="report-preview-note">Showing first 30 rows in the preview. Export CSV or print to include all ${rows.length} records.</small>`:''}</div></div>`;
    document.getElementById('reportType').onchange=e=>{reportState.type=e.target.value;reportState.status='';reportState.from='';reportState.to='';renderReportsV6();};
    document.getElementById('applyReport').onclick=()=>{reportState.className=document.getElementById('reportClass').value;reportState.status=document.getElementById('reportStatus').value;reportState.from=document.getElementById('reportFrom').value;reportState.to=document.getElementById('reportTo').value;if(reportState.from&&reportState.to&&reportState.from>reportState.to){showToast('From date cannot be after To date');return;}renderReportsV6();};
    document.getElementById('resetReport').onclick=()=>{Object.assign(reportState,{className:'',status:'',from:'',to:''});renderReportsV6();};
    document.getElementById('exportCurrent').onclick=exportCurrentReport;
    document.getElementById('printCurrent').onclick=printCurrentReport;
  }
  window.renderReports=renderReportsV6;

  document.addEventListener('DOMContentLoaded',()=>{
    const u=EduAuth.currentUser();
    if(!u){location.replace('login.html');return;}
    EduAuth.applyRoleAccess();
  });

  /* Phase 7 — Bonus school features: receipts, photos and notifications */
  pages.receipts=['Fee Receipts','Generate and print student fee receipts'];
  pages.photos=['Student Photos','Manage student profile photos'];
  pages.notifications=['Notifications','View important school updates'];

  function receiptRows(){
    return DB.fees.filter(f=>feeStatus(f)==='Paid').map(f=>{const st=reportStudent(f.studentId);return {fee:f,student:st};});
  }
  function renderReceipts(){
    const paid=receiptRows();
    document.getElementById('content').innerHTML=`<div class="page-toolbar"><div><div class="page-kicker">FINANCE • BONUS</div><h2 class="section-title">Fee Receipts</h2><p class="section-subtitle">Generate a clean printable receipt for completed fee payments.</p></div></div>
      <div class="stats compact-stats"><div class="stat-card"><div class="stat-top"><span class="label">Paid Records</span><div class="stat-icon">✓</div></div><div class="value">${paid.length}</div><span class="hint">Receipts available</span></div><div class="stat-card"><div class="stat-top"><span class="label">Collected</span><div class="stat-icon">₹</div></div><div class="value">₹${paid.reduce((a,x)=>a+Number(x.fee.amount||0),0).toLocaleString('en-IN')}</div><span class="hint">Paid fee amount</span></div></div>
      <div class="card"><div class="card-head"><div><h2>Receipt History</h2><small>Select a payment and print the receipt.</small></div></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Receipt</th><th>Student</th><th>Class</th><th>Fee Type</th><th>Amount</th><th>Date</th><th>Action</th></tr></thead><tbody>${paid.length?paid.map(x=>`<tr><td><strong>RCPT-${String(x.fee.id).padStart(4,'0')}</strong></td><td>${esc(x.student?.name||'Unknown')}</td><td>${esc(x.student?.className||'')}</td><td>${esc(feeType(x.fee))}</td><td>₹${Number(x.fee.amount||0).toLocaleString('en-IN')}</td><td>${esc(x.fee.paidDate||'')}</td><td><button class="btn btn-primary btn-sm" onclick="printFeeReceipt(${x.fee.id})">Print Receipt</button></td></tr>`).join(''):`<tr><td colspan="7"><div class="empty-state">🧾<strong>No paid fee receipts yet</strong><p>Mark a fee as Paid in Fee Management to generate a receipt.</p></div></td></tr>`}</tbody></table></div></div>`;
  }
  function printFeeReceipt(id){
    const f=DB.fees.find(x=>Number(x.id)===Number(id)); if(!f||feeStatus(f)!=='Paid'){showToast('Only paid fees can have receipts');return;}
    const st=reportStudent(f.studentId)||{}; const no=`RCPT-${String(f.id).padStart(4,'0')}`;
    printHtml(`Fee Receipt ${no}`,`<div class="receipt-box"><div class="receipt-brand"><h2>EduManage School</h2><p>Official Fee Payment Receipt</p></div><div class="receipt-meta"><div><strong>Receipt No.</strong><br>${no}</div><div><strong>Payment Date</strong><br>${esc(f.paidDate||new Date().toISOString().slice(0,10))}</div></div><table><tbody><tr><th>Student</th><td>${esc(st.name||'')}</td></tr><tr><th>Class & Section</th><td>${esc(st.className||'')} ${esc(st.section||'')}</td></tr><tr><th>Fee Type</th><td>${esc(feeType(f))}</td></tr><tr><th>Amount Paid</th><td><strong>₹${Number(f.amount||0).toLocaleString('en-IN')}</strong></td></tr><tr><th>Status</th><td>PAID</td></tr></tbody></table><p class="receipt-thanks">Thank you for your payment.</p></div>`);
  }
  window.renderReceipts=renderReceipts; window.printFeeReceipt=printFeeReceipt;

  function renderPhotos(){
    const students=DB.students.slice().sort((a,b)=>String(a.name).localeCompare(String(b.name)));
    document.getElementById('content').innerHTML=`<div class="page-toolbar"><div><div class="page-kicker">STUDENT PROFILES • BONUS</div><h2 class="section-title">Student Photos</h2><p class="section-subtitle">Add a photo to a student profile. Images are stored locally in the browser.</p></div></div>
      <div class="card"><div class="card-head"><div><h2>Photo Manager</h2><small>Use a small JPG/PNG image for best results.</small></div></div><div class="photo-manager">${students.map(s=>`<div class="photo-card"><div class="photo-preview">${s.photo?`<img src="${esc(s.photo)}" alt="${esc(s.name)}">`:`<span>${esc(String(s.name||'?').split(/\s+/).map(x=>x[0]).slice(0,2).join('').toUpperCase())}</span>`}</div><strong>${esc(s.name)}</strong><small>${esc(s.className||'')} ${esc(s.section||'')}</small><label class="btn btn-secondary btn-sm photo-upload-label">${s.photo?'Change Photo':'Upload Photo'}<input type="file" accept="image/png,image/jpeg,image/webp" onchange="handleStudentPhoto(${s.id},this.files[0])" hidden></label>${s.photo?`<button class="btn btn-danger btn-sm" onclick="removeStudentPhoto(${s.id})">Remove</button>`:''}</div>`).join('')}</div></div>`;
  }
  function handleStudentPhoto(id,file){
    if(!file)return; if(file.size>2*1024*1024){showToast('Please choose an image smaller than 2 MB');return;}
    const reader=new FileReader(); reader.onload=()=>{const st=DB.students.find(x=>Number(x.id)===Number(id));if(!st)return;st.photo=reader.result;saveData();renderPhotos();showToast('Student photo updated')}; reader.readAsDataURL(file);
  }
  function removeStudentPhoto(id){const st=DB.students.find(x=>Number(x.id)===Number(id));if(!st)return;st.photo='';saveData();renderPhotos();showToast('Student photo removed');}
  window.renderPhotos=renderPhotos; window.handleStudentPhoto=handleStudentPhoto; window.removeStudentPhoto=removeStudentPhoto;

  function notificationItems(){
    const items=[];
    const pending=DB.fees.filter(f=>feeStatus(f)!=='Paid');
    if(pending.length)items.push({type:'finance',title:`${pending.length} pending fee record${pending.length===1?'':'s'}`,body:`₹${pending.reduce((a,f)=>a+Number(f.amount||0),0).toLocaleString('en-IN')} remains pending.`,date:new Date().toISOString().slice(0,10)});
    const upcoming=DB.exams.filter(e=>e.date&&e.date>=new Date().toISOString().slice(0,10)).sort((a,b)=>a.date.localeCompare(b.date)).slice(0,3);
    upcoming.forEach(e=>items.push({type:'exam',title:`Upcoming exam: ${e.subject}`,body:`${e.name} • ${e.className} • ${e.date} • ${e.time}`,date:e.date}));
    const today=new Date().toISOString().slice(0,10), att=DB.attendance.filter(a=>a.date===today);
    if(att.length)items.push({type:'attendance',title:'Today attendance is recorded',body:`${att.filter(a=>a.status==='Present').length} of ${att.length} attendance entries are Present.`,date:today});
    if(!items.length)items.push({type:'info',title:'Everything is up to date',body:'No urgent school notifications are currently available.',date:today});
    return items;
  }
  function renderNotifications(){
    const items=notificationItems();
    document.getElementById('content').innerHTML=`<div class="page-toolbar"><div><div class="page-kicker">SCHOOL UPDATES • BONUS</div><h2 class="section-title">Notifications</h2><p class="section-subtitle">Important updates generated from your local school records.</p></div></div><div class="notification-list">${items.map((n,i)=>`<article class="notification-card ${esc(n.type)}"><div class="notification-icon">${n.type==='finance'?'₹':n.type==='exam'?'📅':n.type==='attendance'?'✓':'ℹ'}</div><div><strong>${esc(n.title)}</strong><p>${esc(n.body)}</p><small>${esc(n.date)}</small></div></article>`).join('')}</div>`;
  }
  window.renderNotifications=renderNotifications;

})();
