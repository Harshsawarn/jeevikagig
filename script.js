// --- Imports ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { getFirestore, collection, addDoc, query, where, onSnapshot, orderBy, doc, getDoc, setDoc, updateDoc, serverTimestamp, getDocs } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

// --- PASTE FIREBASE CONFIG HERE ---
const firebaseConfig = {
  apiKey: "AIzaSyCBMByhwBA3BS4W-7QXD8IOWMRiqZOJMPc",
  authDomain: "jeevikagig.firebaseapp.com",
  projectId: "jeevikagig",
  storageBucket: "jeevikagig.firebasestorage.app",
  messagingSenderId: "83058445362",
  appId: "1:83058445362:web:58e232d1c189889de1002b"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- State ---
let currentUser = null;
let userData = null;
let curLang = 'en';
let selectedRating = 0;

// --- Translations ---
const translations = {
    en: { home:"Home", work:"Work", stats:"Stats", sanchay:"Sanchay", profile:"Profile", welcome:"Namaste", needHelp:"Need help today?", needHelpDesc:"Find trusted Jeevika Didis nearby.", postJob:"+ Post Job", recent:"Recent Jobs", earnings:"Total Earnings", goal:"Goal", tips:"Savings Tips", tip1:"Save ₹20/day!", memberSince:"Member Since", jobsPosted:"Total Posted", spent:"Total Spent", reviews:"Reviews", rating:"Rating", skills:"Skills", edit:"Edit", logout:"Logout", login:"Login", register:"Register", uploadID:"Upload ID Card (Required)", idRequired:"ID Card Photo is Required!", completed:"Completed", pending:"Pending", markPaid:"Mark Paid", rate:"Rate Didi", recentAct:"Recent Activity", phone:"Phone", address:"Address", submitRate:"Submit Rating", chat:"Chat", paid:"Paid via" },
    hi: { home:"होम", work:"काम", stats:"आंकड़े", sanchay:"संचय", profile:"प्रोफाइल", welcome:"नमस्ते", needHelp:"मदद चाहिए?", needHelpDesc:"भरोसेमंद दीदी बुलाएं।", postJob:"+ काम डालें", recent:"नया काम", earnings:"कुल कमाई", goal:"लक्ष्य", tips:"बचत के उपाय", tip1:"रोज ₹20 बचाएं!", memberSince:"सदस्यता", jobsPosted:"कुल काम", spent:"खर्च", reviews:"समीक्षा", rating:"रेटिंग", skills:"हुनर", edit:"बदलें", logout:"लॉग आउट", login:"लॉग इन", register:"रजिस्टर", uploadID:"आईडी कार्ड फोटो डालें", idRequired:"आईडी कार्ड फोटो जरूरी है!", completed:"पूरा हुआ", pending:"बाकी है", markPaid:"पैसे दिए", rate:"रेटिंग दें", recentAct:"हाल की गतिविधि", phone:"फोन", address:"पता", submitRate:"रेटिंग भेजें", chat:"बातचीत", paid:"भुगतान" },
    bho: { home:"घर", work:"काम", stats:"हिसाब", sanchay:"गुल्लक", profile:"पहचान", welcome:"प्रणाम", needHelp:"मदद चाही?", needHelpDesc:"दीदी लोग आ जइहें।", postJob:"+ काम डालीं", recent:"नया काम", earnings:"कमाई", goal:"सपना", tips:"बचत", tip1:"₹20 रोज बचाईं!", memberSince:"जुडल बानी", jobsPosted:"कुल काम", spent:"खर्च भइल", reviews:"राय", rating:"नंबर", skills:"हुनर", edit:"बदलीं", logout:"बाहर जाईं", login:"लॉग इन", register:"खाता", uploadID:"आईडी फोटो लगावल जरूरी बा", idRequired:"आईडी फोटो जरूरी बा!", completed:"हो गइल", pending:"बाकी बा", markPaid:"पैसा दे दिहनी", rate:"नंबर दीं", recentAct:"हाल के काम", phone:"फोन", address:"पता", submitRate:"नंबर भेजीं", chat:"बतियाईं", paid:"पैसा मिलल" }
};
const t = (k) => translations[curLang][k] || translations['en'][k];

// --- Helpers ---
const fileToBase64 = (file) => new Promise((res, rej) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => res(reader.result);
    reader.onerror = error => rej(error);
});

document.getElementById('lang-selector').addEventListener('change', (e) => {
    curLang = e.target.value;
    if(currentUser) { renderNavigation(userData.role); switchTab('home'); } else renderLogin();
});

// --- Auth & Init ---
onAuthStateChanged(auth, async (user) => {
    currentUser = user;
    if (user) {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) {
            userData = snap.data();
            renderNavigation(userData.role);
            switchTab('home');
        }
    } else {
        document.getElementById('bottom-nav').classList.add('hidden');
        renderLogin();
    }
});

function renderNavigation(role) {
    const nav = document.getElementById('bottom-nav');
    nav.classList.remove('hidden');
    nav.innerHTML = `
        <button class="nav-btn" onclick="switchTab('home')" id="btn-home"><i class="fa-solid fa-house"></i> ${t('home')}</button>
        <button class="nav-btn" onclick="switchTab('gigs')" id="btn-gigs"><i class="fa-solid fa-layer-group"></i> ${t('work')}</button>
        ${role === 'customer' 
          ? `<button class="nav-btn" onclick="switchTab('dashboard')" id="btn-dashboard"><i class="fa-solid fa-chart-pie"></i> ${t('stats')}</button>` 
          : `<button class="nav-btn" onclick="switchTab('sanchay')" id="btn-sanchay"><i class="fa-solid fa-piggy-bank"></i> ${t('sanchay')}</button>`
        }
        <button class="nav-btn" onclick="switchTab('profile')" id="btn-profile"><i class="fa-solid fa-user"></i> ${t('profile')}</button>
    `;
}

window.switchTab = (tab) => {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    const btn = document.getElementById(`btn-${tab}`);
    if(btn) btn.classList.add('active');

    if (tab === 'home') renderHome();
    else if (tab === 'gigs') renderGigs();
    else if (tab === 'sanchay') renderSanchay();
    else if (tab === 'dashboard') renderCustomerDashboard();
    else if (tab === 'profile') renderProfile();
};

// --- 1. HOME ---
function renderHome() {
    const content = document.getElementById('app-content');
    if (userData.role === 'customer') {
        content.innerHTML = `
            <h2>${t('welcome')} ${userData.name.split(' ')[0]} 👋</h2>
            <div class="card" style="background:#2E7D32; color:white; border:none;">
                <h3>${t('needHelp')}</h3><p style="color:#E8F5E9;">${t('needHelpDesc')}</p>
                <button style="background:white; color:#2E7D32;" onclick="renderPostGigForm()">${t('postJob')}</button>
            </div>
            <h3>${t('recent')}</h3><div id="home-list">Loading...</div>`;
        listenForGigs('customer', 'home-list');
    } else {
        content.innerHTML = `<h2>${t('recent')} 📍</h2><div id="home-list">Loading...</div>`;
        listenForGigs('jeevika', 'home-list');
    }
}

// --- 2. GIGS ---
function renderGigs() {
    document.getElementById('app-content').innerHTML = `<h2>${t('work')}</h2><div id="work-list"></div>`;
    listenForGigs(userData.role === 'customer' ? 'customer_all' : 'jeevika_assigned', 'work-list');
}

// --- 3. CUSTOMER DASHBOARD ---
window.renderCustomerDashboard = async () => {
    const content = document.getElementById('app-content');
    content.innerHTML = `<div style="text-align:center;">Loading stats...</div>`;

    const q = query(collection(db, "gigs"), where("customerId", "==", currentUser.uid));
    const snap = await getDocs(q);
    
    let total=0, spent=0, done=0, pending=0;
    const gigs = [];

    snap.forEach(d => { 
        const data = d.data();
        gigs.push(data);
        total++; 
        if(data.status === 'completed') { spent += data.price; done++; } 
        else { pending++; }
    });

    // Recent Activity List
    let recentHtml = '';
    gigs.slice(-3).reverse().forEach(g => {
        recentHtml += `
            <div class="activity-item">
                <div class="activity-left"><h4>${g.title}</h4><span>${g.status.toUpperCase()}</span></div>
                <div class="activity-right">₹${g.price}</div>
            </div>`;
    });

    content.innerHTML = `
        <h2>${t('stats')} Dashboard</h2>
        <div class="stats-grid">
            <div class="stat-card green"><span class="num">${done}</span><h4>${t('completed')}</h4></div>
            <div class="stat-card orange"><span class="num">${pending}</span><h4>${t('pending')}</h4></div>
            <div class="stat-card blue"><span class="num">${total}</span><h4>${t('jobsPosted')}</h4></div>
            <div class="stat-card"><span class="num">₹${spent}</span><h4>${t('spent')}</h4></div>
        </div>
        <div class="card"><h3>${t('recentAct')}</h3>${recentHtml || '<p>No activity yet.</p>'}</div>
    `;
};

// --- 4. SANCHAY ---
window.renderSanchay = async () => {
    const goal = userData.sanchayGoal || 5000;
    const goalName = userData.sanchayGoalName || "Sewing Machine";
    const earn = userData.earnings || 0;
    const pct = Math.min((earn/goal)*100, 100);
    
    document.getElementById('app-content').innerHTML = `
        <h2>${t('sanchay')}</h2>
        <div class="card" style="text-align:center;">
            <p>${t('earnings')}</p>
            <div style="font-size:2.5rem; font-weight:700; color:#2E7D32;">₹${earn}</div>
            <div style="background:#eee;height:10px;border-radius:5px;margin:15px 0;overflow:hidden;"><div style="background:#FF9800;width:${pct}%;height:100%"></div></div>
            <div style="display:flex;justify-content:space-between;font-size:0.85rem;margin-top:10px;">
                <span>${t('goal')}: ${goalName} (₹${goal})</span>
                <span style="color:#FF9800;cursor:pointer;font-weight:bold;" onclick="editGoal()"><i class="fa-solid fa-pen"></i> ${t('edit')}</span>
            </div>
        </div>
        <h3>${t('tips')}</h3>
        <div class="card" style="background:#FFFDE7;"><i class="fa-solid fa-coins" style="color:#FF9800"></i> ${t('tip1')}</div>
    `;
};
window.editGoal = async () => { const name = prompt("Goal Name:", userData.sanchayGoalName); const amt = prompt("Amount:", userData.sanchayGoal); if(name&&amt){ await updateDoc(doc(db,"users",currentUser.uid),{sanchayGoalName:name, sanchayGoal:Number(amt)}); userData.sanchayGoalName=name; userData.sanchayGoal=Number(amt); renderSanchay(); }};

// --- 5. PROFILE ---
window.renderProfile = async () => {
    let statsHtml = '';
    const phone = userData.phone || "Not Set";
    const address = userData.address || "Bihar, India";

    if (userData.role === 'customer') {
        const q = query(collection(db, "gigs"), where("customerId", "==", currentUser.uid));
        const snap = await getDocs(q);
        statsHtml = `<div class="card" style="text-align:center; color:#2E7D32;"><h3>${snap.size}</h3><p>${t('jobsPosted')}</p></div>`;
    } else {
        statsHtml = `<div class="stats-grid"><div class="stat-card"><span class="num">⭐ ${(userData.rating/(userData.reviewCount||1)).toFixed(1)}</span><h4>${t('rating')}</h4></div><div class="stat-card"><span class="num">${userData.reviewCount||0}</span><h4>${t('reviews')}</h4></div></div>`;
    }

    document.getElementById('app-content').innerHTML = `
        <div style="text-align:center;">
            <div style="width:80px;height:80px;background:#E8F5E9;border-radius:50%;margin:0 auto 10px;display:flex;align-items:center;justify-content:center;font-size:2.5rem;color:#2E7D32;">${userData.role==='jeevika'?'👩‍🌾':'👤'}</div>
            <h2>${userData.name}</h2>
            ${statsHtml}
            <div class="card" style="text-align:left;">
                <h3>Details</h3>
                <div class="activity-item"><div class="activity-left"><h4>${t('phone')}</h4><span>${phone}</span></div><i class="fa-solid fa-pen edit-icon" onclick="editInfo('phone')"></i></div>
                <div class="activity-item"><div class="activity-left"><h4>${t('address')}</h4><span>${address}</span></div><i class="fa-solid fa-pen edit-icon" onclick="editInfo('address')"></i></div>
                ${userData.role==='jeevika' ? `<div class="activity-item"><div class="activity-left"><h4>${t('skills')}</h4><span>${(userData.skills||[]).join(', ')||"None"}</span></div><i class="fa-solid fa-plus edit-icon" onclick="addSkill()"></i></div>` : ''}
            </div>
            <button class="danger-btn" onclick="handleLogout()">${t('logout')}</button>
        </div>
    `;
};
window.addSkill = async () => { const s = prompt("Add Skill:"); if(s) { const ns = [...(userData.skills||[]), s]; await updateDoc(doc(db,"users",currentUser.uid),{skills:ns}); userData.skills=ns; renderProfile(); }};
window.editInfo = async (field) => { const val = prompt(`Enter ${field}:`, userData[field] || ""); if(val) { await updateDoc(doc(db,"users",currentUser.uid), {[field]: val}); userData[field] = val; renderProfile(); } };

// --- GIGS LISTENER (FIXED CHAT BUTTON) ---
function listenForGigs(type, elId) {
    let q;
    if (type.includes('customer')) q = query(collection(db, "gigs"), where("customerId", "==", currentUser.uid));
    else if (type === 'jeevika') q = query(collection(db, "gigs"), where("status", "==", "open"));
    else if (type === 'jeevika_assigned') q = query(collection(db, "gigs"), where("jeevikaId", "==", currentUser.uid));

    onSnapshot(q, (snap) => {
        const el = document.getElementById(elId); if(!el) return;
        el.innerHTML = "";
        if (snap.empty) return el.innerHTML = `<p style="text-align:center;padding:20px;color:#999;">No jobs found.</p>`;
        
        snap.forEach(d => {
            const data = d.data();
            const div = document.createElement('div'); div.className = "card";
            
            // Badges
            let badge = `<span class="badge open">${data.status.toUpperCase()}</span>`;
            if(data.status==='assigned') badge = `<span class="badge pending">${data.status.toUpperCase()}</span>`;
            if(data.status==='completed') badge = `<span class="badge done">COMPLETED</span>`;

            let paymentInfo = '';
            if(data.status === 'completed' && data.paymentMode) {
                paymentInfo = `<div class="payment-info" style="font-size:0.8rem; background:#eee; padding:5px; margin-top:5px; border-radius:4px;"><i class="fa-solid fa-check"></i> ${t('paid')} ${data.paymentMode}</div>`;
            }

            // Button Logic
            let btn = '';
            if (userData.role === 'jeevika') {
                if(data.status==='open') btn = `<button class="primary-btn" onclick="accept('${d.id}')">Accept</button>`;
                else if(data.status==='assigned' || data.status==='completed') btn = `<button class="chat-btn" onclick="chat('${d.id}','${data.title}')">${t('chat')}</button>`;
            } else {
                if(data.status==='assigned') {
                    btn = `<div style="display:flex;gap:5px;">
                            <button class="chat-btn" onclick="chat('${d.id}','${data.title}')">${t('chat')}</button>
                            <button class="secondary-btn" onclick="complete('${d.id}','${data.jeevikaId}')">✓ ${t('markPaid')}</button>
                           </div>`;
                }
                else if(data.status==='completed') {
                    // Chat button restored alongside Rating
                    let rateBtn = !data.isReviewed ? `<button class="primary-btn" onclick="renderReviewForm('${d.id}','${data.jeevikaId}')">★ ${t('rate')}</button>` : `<span class="badge done" style="margin-left:5px;">Rated</span>`;
                    btn = `<div style="display:flex;gap:5px;margin-top:10px;"><button class="chat-btn" onclick="chat('${d.id}','${data.title}')">${t('chat')}</button>${rateBtn}</div>`;
                }
            }
            
            div.innerHTML = `${badge}<h3>${data.title}</h3><p>${data.desc}</p><div class="price-tag">₹${data.price}</div>${paymentInfo}${btn}`;
            el.appendChild(div);
        });
    });
}

// --- ACTIONS & RATING ---
window.complete = async (gid,jid) => { 
    const mode = prompt("Payment Mode? (Cash / Online)");
    if(!mode) return; 
    await updateDoc(doc(db,"gigs",gid),{ status:"completed", paymentMode: mode }); 
    const u=doc(db,"users",jid); const s=await getDoc(u); 
    await updateDoc(u,{earnings:(s.data().earnings||0)+(await getDoc(doc(db,"gigs",gid))).data().price}); 
    renderReviewForm(gid, jid);
};

window.renderReviewForm = (gid, jid) => {
    selectedRating = 0;
    document.getElementById('app-content').innerHTML = `
        <div class="auth-box">
            <h3>${t('rate')}</h3>
            <div class="star-container">
                <span class="star" onclick="setStar(1)">★</span>
                <span class="star" onclick="setStar(2)">★</span>
                <span class="star" onclick="setStar(3)">★</span>
                <span class="star" onclick="setStar(4)">★</span>
                <span class="star" onclick="setStar(5)">★</span>
            </div>
            <button class="primary-btn" onclick="subRev('${gid}','${jid}')">${t('submitRate')}</button>
            <button class="secondary-btn" onclick="switchTab('gigs')">Cancel</button>
        </div>`;
};

window.setStar = (n) => {
    selectedRating = n;
    const stars = document.querySelectorAll('.star');
    stars.forEach((s, i) => { if(i<n) s.classList.add('active'); else s.classList.remove('active'); });
};

window.subRev = async (gid, jid) => { 
    if(selectedRating===0) return alert("Select stars");
    await updateDoc(doc(db,"users",jid),{rating:(userData.rating||0)+selectedRating, reviewCount:(userData.reviewCount||0)+1}); 
    await updateDoc(doc(db,"gigs",gid),{isReviewed:true}); 
    switchTab('home'); 
};

window.renderPostGigForm = () => document.getElementById('app-content').innerHTML=`<div class="auth-box"><h2>${t('postJob')}</h2><input id="t" placeholder="Title"><input id="p" placeholder="Price"><button class="primary-btn" onclick="post()">Post</button><button class="secondary-btn" onclick="switchTab('home')">Cancel</button></div>`;
window.post = async () => { await addDoc(collection(db,"gigs"),{title:document.getElementById('t').value, desc:"Details...", price:Number(document.getElementById('p').value), customerId:currentUser.uid, status:"open", createdAt:serverTimestamp()}); switchTab('home'); };
window.accept = async (id) => { if(confirm("Accept?")) { await updateDoc(doc(db,"gigs",id),{status:"assigned", jeevikaId:currentUser.uid}); switchTab('gigs'); }};
window.chat = (gid, title) => { document.getElementById('app-content').innerHTML = `<div class="chat-container"><div style="padding:10px;border-bottom:1px solid #eee;"><strong>${title}</strong> <button style="float:right;width:auto;padding:2px 8px;" onclick="switchTab('gigs')">X</button></div><div id="ml" style="flex:1;overflow-y:auto;padding:10px;"></div><div style="padding:10px;display:flex;"><input id="mi"><button class="primary-btn" style="width:auto;margin:0 0 0 5px;" onclick="snd('${gid}')">➤</button></div></div>`; onSnapshot(query(collection(db,"gigs",gid,"messages"), orderBy("createdAt","asc")), s => { const l=document.getElementById('ml'); l.innerHTML=""; s.forEach(d=> l.innerHTML+=`<div class="msg-bubble ${d.data().senderId===currentUser.uid?'sent':'received'}">${d.data().text}</div>`); l.scrollTop=l.scrollHeight; }); };
window.snd = async (gid) => { const t=document.getElementById('mi').value; if(t) await addDoc(collection(db,"gigs",gid,"messages"),{text:t, senderId:currentUser.uid, createdAt:serverTimestamp()}); document.getElementById('mi').value=""; };

// --- AUTH ---
window.renderLogin = () => document.getElementById('app-content').innerHTML=`<div class="auth-box"><h2>${t('login')}</h2><input id="em" placeholder="Email"><input id="pw" type="password" placeholder="Password"><button class="primary-btn" onclick="log()">${t('login')}</button><p style="margin-top:10px;"><span onclick="renderReg()" style="color:#2E7D32;cursor:pointer;">${t('register')}</span></p></div>`;
window.renderReg = () => { document.getElementById('app-content').innerHTML=`<div class="auth-box"><h2>${t('register')}</h2><input id="rn" placeholder="Name"><select id="rr" onchange="toggleIdUpload(this.value)"><option value="jeevika">Jeevika Didi</option><option value="customer">Customer</option></select><div id="id-upload-box" class="upload-box" onclick="document.getElementById('id-file').click()"><i class="fa-solid fa-camera"></i> <span id="id-text">${t('uploadID')}</span><input type="file" id="id-file" accept="image/*" style="display:none;" onchange="previewID(this)"></div><img id="id-preview" style="width:100px; height:60px; object-fit:cover; display:none; margin:10px auto; border-radius:5px;"><input id="re" placeholder="Email"><input id="rp" type="password" placeholder="Password"><button class="primary-btn" onclick="reg()">${t('register')}</button><p style="margin-top:10px;"><span onclick="renderLogin()" style="color:#2E7D32;cursor:pointer;">${t('login')}</span></p></div>`; toggleIdUpload('jeevika'); };
window.toggleIdUpload = (val) => { document.getElementById('id-upload-box').style.display = (val === 'jeevika') ? 'flex' : 'none'; };
window.previewID = (input) => { if(input.files[0]) { const r = new FileReader(); r.onload=(e)=>{document.getElementById('id-preview').src=e.target.result;document.getElementById('id-preview').style.display='block';}; r.readAsDataURL(input.files[0]); }};
window.reg = async () => { const r=document.getElementById('rr').value; let b=null; if(r==='jeevika'){const f=document.getElementById('id-file').files[0]; if(!f) return alert(t('idRequired')); b=await fileToBase64(f);} try{const c=await createUserWithEmailAndPassword(auth,document.getElementById('re').value,document.getElementById('rp').value); await setDoc(doc(db,"users",c.user.uid),{name:document.getElementById('rn').value,role:r,earnings:0,idPhoto:b,createdAt:serverTimestamp()});}catch(e){alert(e.message)} };
window.log = () => signInWithEmailAndPassword(auth, document.getElementById('em').value, document.getElementById('pw').value).catch(e=>alert(e.message));
window.handleLogout = () => signOut(auth).then(()=>location.reload());