const subjects = document.querySelector('#subjects');
const formMessage = document.querySelector('#formMessage');
const lookupMessage = document.querySelector('#lookupMessage');
const resultView = document.querySelector('#resultView');

function addSubjectRow(name = '', mark = '') {
  const row = document.createElement('div');
  row.className = 'subject-row';
  row.innerHTML = `
    <label>Subject<input class="subject-name" type="text" value="${name}" placeholder="e.g. Mathematics" required></label>
    <label>Mark<input class="subject-mark" type="number" min="0" max="100" step="0.01" value="${mark}" placeholder="0-100" required></label>
    <button class="remove-button" type="button" aria-label="Remove subject">x</button>`;
  row.querySelector('.remove-button').addEventListener('click', () => {
    if (subjects.children.length > 1) row.remove();
  });
  subjects.append(row);
}

function showMessage(element, message = '') {
  element.textContent = message;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[character]));
}

function renderResult(result) {
  resultView.className = 'result-view';
  resultView.innerHTML = `
    <div class="result-header"><div><h3>${escapeHtml(result.student.name)}</h3><p>Student ID ${result.student.id}${result.student.email ? ` &middot; ${escapeHtml(result.student.email)}` : ''}</p></div><span class="badge ${result.status === 'FAIL' ? 'fail' : ''}">${result.status} / Grade ${result.grade}</span></div>
    <div class="metrics"><div class="metric"><strong>${result.total}</strong><span>Total marks</span></div><div class="metric"><strong>${result.average}</strong><span>Average</span></div><div class="metric"><strong>${result.percentage}%</strong><span>Percentage</span></div></div>
    <table class="result-table"><thead><tr><th>Subject</th><th>Mark</th></tr></thead><tbody>${result.subjects.map((item) => `<tr><td>${escapeHtml(item.subject)}</td><td>${item.mark}</td></tr>`).join('')}</tbody></table>
    <div class="summary-grid"><div class="summary-card"><span>Highest mark</span><strong>${result.highest.mark} <small>(${escapeHtml(result.highest.subject)})</small></strong></div><div class="summary-card"><span>Lowest mark</span><strong>${result.lowest.mark} <small>(${escapeHtml(result.lowest.subject)})</small></strong></div></div>`;
}

function renderClassSummary(summary) {
  resultView.className = 'result-view';
  resultView.innerHTML = `<div class="result-header"><div><h3>Class summary</h3><p>Current calculated records</p></div></div><div class="summary-grid"><div class="summary-card"><span>Total students</span><strong>${summary.totalStudents}</strong></div><div class="summary-card"><span>Passed students</span><strong>${summary.passedStudents}</strong></div><div class="summary-card"><span>Failed students</span><strong>${summary.failedStudents}</strong></div><div class="summary-card"><span>Class average</span><strong>${summary.averageClassPercentage}%</strong></div></div>${summary.highestScorer ? `<div class="summary-card" style="margin-top:9px"><span>Highest scorer</span><strong>${escapeHtml(summary.highestScorer.student.name)} <small>${summary.highestScorer.percentage}%</small></strong></div>` : ''}`;
}

async function api(url, options) {
  const response = await fetch(url, options);
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || 'Request failed.');
  return body;
}

document.querySelector('#addSubject').addEventListener('click', () => addSubjectRow());
document.querySelector('#studentForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  showMessage(formMessage, 'Saving...');
  const subjectRows = [...subjects.querySelectorAll('.subject-row')];
  const payload = { name: document.querySelector('#studentName').value, email: document.querySelector('#studentEmail').value || undefined, subjects: subjectRows.map((row) => ({ name: row.querySelector('.subject-name').value, mark: Number(row.querySelector('.subject-mark').value) })) };
  try { const result = await api('/api/students', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); document.querySelector('#studentId').value = result.student.id; renderResult(result); showMessage(formMessage, 'Saved successfully.'); } catch (error) { showMessage(formMessage, error.message); }
});

document.querySelector('#loadResult').addEventListener('click', async () => {
  const id = document.querySelector('#studentId').value;
  if (!id) return showMessage(lookupMessage, 'Enter a student ID first.');
  showMessage(lookupMessage, 'Loading...');
  try { renderResult(await api(`/api/students/${id}/result`)); showMessage(lookupMessage); } catch (error) { showMessage(lookupMessage, error.message); }
});

document.querySelector('#loadSummary').addEventListener('click', async () => {
  showMessage(lookupMessage, 'Loading class summary...');
  try { renderClassSummary(await api('/api/summary')); showMessage(lookupMessage); } catch (error) { showMessage(lookupMessage, error.message); }
});

addSubjectRow('Mathematics');
addSubjectRow('Science');
api('/health').then(() => { document.querySelector('#statusDot').classList.add('online'); document.querySelector('#statusText').textContent = 'API connected'; }).catch(() => { document.querySelector('#statusText').textContent = 'API offline'; });