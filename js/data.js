const defaultData = {
  students: [
    {id:1,name:"Aarav Sen",className:"Class 8",section:"A",roll:12,parent:"Sanjay Sen",phone:"9876543210",address:"Kolkata",status:"Active",photo:""},
    {id:2,name:"Ananya Das",className:"Class 7",section:"B",roll:8,parent:"Rina Das",phone:"9876543211",address:"Howrah",status:"Active",photo:""},
    {id:3,name:"Rohan Roy",className:"Class 10",section:"A",roll:5,parent:"Amit Roy",phone:"9876543212",address:"Durgapur",status:"Active",photo:""},
    {id:4,name:"Priya Ghosh",className:"Class 9",section:"C",roll:18,parent:"Mita Ghosh",phone:"9876543213",address:"Kolkata",status:"Active",photo:""}
  ],
  teachers: [
    {id:1,name:"Dr. Amit Kumar",subject:"Mathematics",classes:"Class 8, 9",phone:"9000000001",email:"amit@school.com"},
    {id:2,name:"Ms. Riya Sen",subject:"Science",classes:"Class 7, 8",phone:"9000000002",email:"riya@school.com"},
    {id:3,name:"Mr. Arjun Das",subject:"English",classes:"Class 9, 10",phone:"9000000003",email:"arjun@school.com"}
  ],
  classes: [
    {id:1,className:"Class 7",section:"A",teacher:"Ms. Riya Sen",strength:32},
    {id:2,className:"Class 8",section:"A",teacher:"Dr. Amit Kumar",strength:35},
    {id:3,className:"Class 9",section:"B",teacher:"Mr. Arjun Das",strength:29},
    {id:4,className:"Class 10",section:"A",teacher:"Dr. Amit Kumar",strength:31}
  ],
  attendance: [],
  grades: [
    {id:1,studentId:1,subject:"Mathematics",marks:87,grade:"A"},
    {id:2,studentId:2,subject:"Science",marks:78,grade:"B+"},
    {id:3,studentId:3,subject:"English",marks:92,grade:"A+"}
  ],
  fees: [
    {id:1,studentId:1,type:"Tuition Fee",amount:2500,paidDate:"2026-09-05",status:"Paid"},
    {id:2,studentId:2,type:"Transport Fee",amount:1200,paidDate:"2026-09-08",status:"Paid"},
    {id:3,studentId:3,type:"Tuition Fee",amount:2500,paidDate:"",status:"Pending"}
  ],
  timetable: [
    {day:"Monday",time:"09:00 - 10:00",subject:"Mathematics",teacher:"Dr. Amit Kumar",className:"Class 8 A"},
    {day:"Tuesday",time:"10:00 - 11:00",subject:"Science",teacher:"Ms. Riya Sen",className:"Class 8 A"},
    {day:"Wednesday",time:"11:00 - 12:00",subject:"English",teacher:"Mr. Arjun Das",className:"Class 9 B"}
  ]
};

function loadData(){
  const saved = localStorage.getItem("edumanage_data");
  if(!saved){
    localStorage.setItem("edumanage_data", JSON.stringify(defaultData));
    return structuredClone(defaultData);
  }
  const parsed = JSON.parse(saved);
  parsed.students = (parsed.students || []).map(s => ({status:"Active",photo:"",...s}));
  parsed.teachers = (parsed.teachers || []).map(t => ({status:"Active",...t}));
  return parsed;
}
let DB = loadData();
function saveData(){ localStorage.setItem("edumanage_data", JSON.stringify(DB)); }
function nextId(arr){ return arr.length ? Math.max(...arr.map(x=>Number(x.id)||0))+1 : 1; }
function esc(v){ return String(v ?? "").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m])); }
