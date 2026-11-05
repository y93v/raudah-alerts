/* global firebase */
(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  const labels={miss:'I miss you',need:'I need you',call:'Call me',urgent:'I need you now',custom:'Personal note'};
  const state={roomId:'main',unsub:null,db:null};
  const connection=$('connection');
  function setConnection(online){connection.textContent=online?'Connected securely':'Connection unavailable';connection.className='connection '+(online?'online':'offline')}
  function showError(message){$('auth-error').textContent=message}
  function friendlyError(error){const map={'auth/too-many-requests':'Too many attempts. Please try again later.','auth/network-request-failed':'Could not connect. Check your internet connection.'};return map[error.code]||'Could not open the space. Please try again.'}
  function formatDate(ts){if(!ts)return 'Just now';const d=ts.toDate?ts.toDate():new Date(ts);return new Intl.DateTimeFormat('en',{dateStyle:'short',timeStyle:'short'}).format(d)}
  function renderHistory(snapshot){const box=$('history');if(snapshot.empty){box.innerHTML='<p class="empty-state">Your signals will appear here.</p>';return}box.innerHTML='';snapshot.forEach(doc=>{const m=doc.data(),item=document.createElement('div');item.className='history-item '+(m.type==='urgent'?'urgent':'');item.innerHTML='<span><strong></strong>'+(m.message?`<br><small>${escapeHtml(m.message)}</small>`:'')+'</span><time></time>';item.querySelector('strong').textContent=labels[m.type]||'Personal note';item.querySelector('time').textContent=formatDate(m.createdAt);box.appendChild(item)})}
  function escapeHtml(value){const d=document.createElement('div');d.textContent=value;return d.innerHTML}
  function watchMessages(){if(state.unsub)state.unsub();state.unsub=state.db.collection('rooms').doc(state.roomId).collection('messages').orderBy('createdAt','desc').limit(12).onSnapshot(renderHistory,()=>setConnection(false))}
  async function send(type,message){const user=firebase.auth().currentUser;if(!user)return;const payload={type,senderUid:user.uid,senderName:user.displayName||'Raudah',message:(message||'').trim().slice(0,280),createdAt:firebase.firestore.FieldValue.serverTimestamp()};try{await state.db.collection('rooms').doc(state.roomId).collection('messages').add(payload);$('sent-state').textContent='Your signal was sent.';setTimeout(()=>$('sent-state').textContent='',4500)}catch(e){$('sent-state').textContent='Could not send. Check the connection and try again.'}}
  function showApp(){ $('auth-card').classList.add('hidden');$('app-card').classList.remove('hidden');$('welcome').textContent='A quiet little line between us';watchMessages() }
  function hideApp(){$('auth-card').classList.remove('hidden');$('app-card').classList.add('hidden');if(state.unsub)state.unsub()}
  function initReveal(){const reveal=document.querySelector('.tagline-reveal');if(!reveal||!('IntersectionObserver' in window))return reveal.classList.add('in-view');const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){reveal.classList.add('in-view');observer.disconnect()}}),{threshold:.5});observer.observe(reveal)}
  try{if(!window.FIREBASE_CONFIG||window.FIREBASE_CONFIG.apiKey==='YOUR_WEB_API_KEY')throw new Error('config');firebase.initializeApp(window.FIREBASE_CONFIG);state.db=firebase.firestore();firebase.auth().onAuthStateChanged(user=>user?showApp(user):hideApp());setConnection(navigator.onLine);window.addEventListener('online',()=>setConnection(true));window.addEventListener('offline',()=>setConnection(false));initReveal()}catch(e){showError('Firebase is not configured yet. Copy firebase-config.example.js to firebase-config.js and add your project values.');setConnection(false)}
  const ACCESS_CODE='2004';
  $('auth-form').addEventListener('submit',async e=>{e.preventDefault();showError('');const code=$('access-code').value.trim();if(!/^\d{4}$/.test(code)){showError('Please enter four numbers.');return}if(code!==ACCESS_CODE){showError('That is not our little code.');$('access-code').select();return}try{await firebase.auth().signInAnonymously()}catch(err){showError(friendlyError(err))}});
  document.querySelectorAll('.signal-card').forEach(button=>button.addEventListener('click',()=>send(button.dataset.type,'')));
  $('custom-form').addEventListener('submit',async e=>{e.preventDefault();const text=$('custom-message').value;if(text.trim()){await send('custom',text);$('custom-message').value=''}});
  $('logout').addEventListener('click',()=>firebase.auth().signOut());$('refresh').addEventListener('click',()=>{if(firebase.auth().currentUser)watchMessages()});$('privacy-note').addEventListener('click',()=>{$('sent-state').textContent='Only signed in members of this room can read or send signals.';setTimeout(()=>$('sent-state').textContent='',4500)});
})();
