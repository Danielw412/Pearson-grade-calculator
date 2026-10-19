import { calculateGrade, GradeInputError } from './calculate.mjs';

const $ = (selector) => document.querySelector(selector);
const form = $('#grade-form');
const pastTests = $('#past-tests');
const dialog = $('#help-dialog');
const result = $('#result');
const emptyResult = $('#empty-result');
let nextTestId = 0;
let hasCalculated = false;
let announcementTimer;
let helpTrigger;
const number = (value) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(value);
const fixed = (value) => value.toFixed(2);

function addTest(earned = '', possible = '', focus = false) {
  const id = nextTestId++;
  const row = document.createElement('div');
  row.className = 'past-test';
  row.dataset.id = id;
  row.innerHTML = `<div class="past-test-inputs">
    <div><label for="test-${id}-earned">Points earned</label><input id="test-${id}-earned" name="test-${id}-earned" type="number" inputmode="decimal" min="0" step="any" placeholder="e.g. 84.2" aria-describedby="past-hint test-${id}-error"></div>
    <div><label for="test-${id}-possible">Out of</label><input id="test-${id}-possible" name="test-${id}-possible" type="number" inputmode="decimal" min="0" step="any" placeholder="e.g. 96" aria-describedby="past-hint test-${id}-error"></div>
    <button class="remove-test" type="button" aria-label="Remove past test">×</button>
    </div><p class="field-error" id="test-${id}-error" hidden></p>`;
  pastTests.append(row);
  row.querySelector('[id$="-earned"]').value = earned;
  row.querySelector('[id$="-possible"]').value = possible;
  relabelTests();
  if (focus) row.querySelector('input').focus();
  return row;
}

function relabelTests() {
  [...pastTests.children].forEach((row, index) => {
    row.querySelector('[id$="-earned"]').setAttribute('aria-label', `Past test ${index + 1} points earned`);
    row.querySelector('[id$="-possible"]').setAttribute('aria-label', `Past test ${index + 1} points possible`);
    row.querySelector('.remove-test').setAttribute('aria-label', `Remove past test ${index + 1}`);
  });
}

function readInput() {
  const tests = [];
  for (const row of pastTests.children) {
    const earned = row.querySelector('[id$="-earned"]');
    const possible = row.querySelector('[id$="-possible"]');
    if (earned.value === '' && possible.value === '' && !earned.validity.badInput && !possible.validity.badInput) continue;
    tests.push({ id: row.dataset.id, earned: earned.valueAsNumber, possible: possible.valueAsNumber });
  }
  return { overall: $('#overall').valueAsNumber, homework: $('#homework').valueAsNumber, latestPossible: $('#latest').valueAsNumber, tests };
}

function clearErrors() {
  form.querySelectorAll('[aria-invalid]').forEach((input) => input.removeAttribute('aria-invalid'));
  form.querySelectorAll('.field-error, .form-error').forEach((error) => { error.hidden = true; error.textContent = ''; });
}

function showError(error, focus) {
  if (error.field === 'form') {
    $('#form-error').textContent = error.message;
    $('#form-error').hidden = false;
    if (focus) $('#form-error').scrollIntoView({ block: 'nearest' });
    return;
  }
  const input = document.getElementById(error.field);
  const errorId = error.field.startsWith('test-') ? error.field.replace(/-(earned|possible)$/, '-error') : `${error.field}-error`;
  const errorElement = document.getElementById(errorId);
  if (input) input.setAttribute('aria-invalid', 'true');
  if (errorElement) { errorElement.textContent = error.message; errorElement.hidden = false; }
  if (focus && input) input.focus();
}

function showEmpty(incomplete = false) {
  result.hidden = true;
  emptyResult.hidden = false;
  $('#empty-title').textContent = incomplete ? 'The numbers aren’t numbering.' : 'Your estimated grade goes here.';
  emptyResult.querySelector('p').textContent = incomplete ? 'Check the highlighted fields. Even Danny needs the right numbers.' : 'Feed me the numbers. I’ll do the annoying part.';
  $('#empty-example').hidden = incomplete;
  $('#result-announcement').textContent = '';
}

function renderResult(score, announce = true) {
  emptyResult.hidden = true;
  result.hidden = false;
  $('#result-percent').textContent = `${fixed(score.percent)}%`;
  $('#result-points').textContent = `${fixed(score.earned)} out of ${number(score.latestPossible)} points`;
  $('#weighted-total').textContent = `${fixed(score.weightedTotal)} / 80`;
  $('#weighted-homework').textContent = `${fixed(score.homework)} / 30`;
  $('#test-average').textContent = `${fixed(score.testAverage * 100)}%`;
  clearTimeout(announcementTimer);
  if (announce) announcementTimer = setTimeout(() => { $('#result-announcement').textContent = `Estimated test grade: ${fixed(score.percent)} percent. ${fixed(score.earned)} out of ${number(score.latestPossible)} points.`; }, 350);
}

function calculate({ focusErrors = false, moveToResult = false } = {}) {
  clearTimeout(announcementTimer);
  clearErrors();
  try {
    const score = calculateGrade(readInput());
    renderResult(score);
    if (moveToResult && window.matchMedia('(max-width: 640px)').matches) $('#result-panel').focus();
    return true;
  } catch (error) {
    if (!(error instanceof GradeInputError)) throw error;
    showEmpty(true);
    showError(error, focusErrors);
    if (focusErrors) $('#result-announcement').textContent = error.message;
    return false;
  }
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  hasCalculated = true;
  calculate({ focusErrors: true, moveToResult: true });
});
form.addEventListener('input', () => { if (hasCalculated) calculate(); });
$('#add-test').addEventListener('click', () => addTest('', '', true));
pastTests.addEventListener('click', (event) => {
  const remove = event.target.closest('.remove-test');
  if (!remove) return;
  const row = remove.closest('.past-test');
  const focusTarget = row.nextElementSibling?.querySelector('input') ?? row.previousElementSibling?.querySelector('input') ?? $('#add-test');
  row.remove();
  relabelTests();
  focusTarget.focus();
  if (hasCalculated) calculate();
});

function loadExample() {
  clearErrors();
  $('#overall').value = '93.25';
  $('#homework').value = '30';
  $('#latest').value = '71';
  pastTests.replaceChildren();
  addTest('84.2', '96');
  hasCalculated = true;
  calculate({ moveToResult: true });
}
$('#try-example').addEventListener('click', loadExample);
$('#empty-example').addEventListener('click', loadExample);
$('#reset').addEventListener('click', () => {
  clearTimeout(announcementTimer);
  form.reset();
  pastTests.replaceChildren();
  addTest();
  hasCalculated = false;
  clearErrors();
  showEmpty();
  $('#overall').focus();
});

const help = {
  overall: {
    title: '1. Find your overall grade',
    description: 'Open Student Gradebook. Under Overall Score, copy the large percentage inside the circle. Enter the percentage as shown, including decimal places.',
    source: '#guide-overview svg', viewBox: '55 155 655 155', className: 'help-overall',
    caption: 'In this example, enter <strong>93.25</strong> in Overall grade. The 74.6 / 80 is the weighted point total, not the percentage.',
  },
  homework: {
    title: '2. Find your homework points',
    description: 'Open Student Gradebook, then click Calculation below Overall Score. In the expanded table, find the Homework row and read the Points Earned column. This is your homework contribution out of 30.',
    source: '#guide-overview svg', viewBox: '65 225 1135 245',
    caption: 'Enter <strong>30</strong> from <strong>30.00 pts</strong>. Use the Points Earned value. The Category Scores value (80/80 here) is the raw homework score.',
  },
  tests: {
    title: '3. Find your past test scores',
    description: 'In Student Gradebook, find every already-graded test. Under Correct/Total, the first number is points earned and the second is points possible. Enter a separate row for each test.',
    source: '#guide-tests svg', viewBox: '32 437 820 102',
    caption: 'For <strong>84.2/96</strong>, enter <strong>84.2</strong> in Points earned and <strong>96</strong> in Out of. Leave past tests blank if this is your first test.',
  },
  latest: {
    title: '4. Find the latest test’s total',
    description: 'Enter the maximum possible points from your test or your teacher’s instructions. The total is not shown in this screenshot while the score is hidden. For a calculator and no-calculator test, add both sections’ maximum points together.',
    source: '#guide-latest svg', viewBox: '32 0 820 186',
    caption: 'In this example, both sections together are worth <strong>71 points</strong>. Enter <strong>71</strong> to estimate their combined score.',
  },
};

document.querySelectorAll('[data-help]').forEach((button) => button.addEventListener('click', () => {
  const content = help[button.dataset.help];
  helpTrigger = button;
  $('#help-title').textContent = content.title;
  $('#help-description').textContent = content.description;
  $('#help-caption').innerHTML = content.caption;
  const image = $(content.source).cloneNode(true);
  image.setAttribute('viewBox', content.viewBox);
  image.removeAttribute('class');
  if (content.className) image.classList.add(content.className);
  // IDs must remain unique while the source screenshot is still in the document.
  image.querySelectorAll('[id]').forEach((node) => { const oldId = node.id; node.id = `help-${oldId}`; });
  image.setAttribute('aria-labelledby', `${image.querySelector('title').id} ${image.querySelector('desc').id}`);
  $('#help-image').replaceChildren(image);
  dialog.showModal();
}));
function closeHelp() { dialog.close(); }
$('#close-help').addEventListener('click', closeHelp);
$('#got-it').addEventListener('click', closeHelp);
dialog.addEventListener('close', () => helpTrigger?.focus());
dialog.addEventListener('click', (event) => {
  if (event.target !== dialog) return;
  const rect = dialog.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeHelp();
});

const tabs = [...document.querySelectorAll('[role="tab"]')];
function selectTab(tab) {
  tabs.forEach((item) => {
    const selected = item === tab;
    item.setAttribute('aria-selected', String(selected));
    item.tabIndex = selected ? 0 : -1;
    document.getElementById(item.getAttribute('aria-controls')).hidden = !selected;
  });
}
tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectTab(tab));
  tab.addEventListener('keydown', (event) => {
    let next;
    if (event.key === 'ArrowRight') next = tabs[(index + 1) % tabs.length];
    if (event.key === 'ArrowLeft') next = tabs[(index + tabs.length - 1) % tabs.length];
    if (event.key === 'Home') next = tabs[0];
    if (event.key === 'End') next = tabs.at(-1);
    if (next) { event.preventDefault(); selectTab(next); next.focus(); }
  });
});
addTest();
