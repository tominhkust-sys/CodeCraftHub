// ===== Configuration =====
const API_URL = 'https://Tominhkust.pythonanywhere.com/api/courses'

const STATUS_MAP = {
  '未开始': { label: '未开始', class: 'badge-not-started' },
  '进行中': { label: '进行中', class: 'badge-in-progress' },
  '已完成': { label: '已完成', class: 'badge-completed' },
}

// ===== State =====
let courses = []

// ===== DOM Helpers =====
const $ = (sel) => document.querySelector(sel)
const el = (tag, props = {}, children = []) => {
  const node = document.createElement(tag)
  Object.entries(props).forEach(([k, v]) => {
    if (k === 'class') node.className = v
    else if (k === 'dataset') Object.entries(v).forEach(([dk, dv]) => (node.dataset[dk] = dv))
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v)
    else node[k] = v
  })
  children.forEach((c) => {
    if (c == null) return
    node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c)
  })
  return node
}

// ===== Toast System =====
function showToast(message, type = 'success') {
  const container = getToastContainer()
  const toast = el('div', { className: `toast toast-${type}` }, [
    el('span', { textContent: type === 'success' ? '✓' : '✕' }),
    el('span', { textContent: message }),
  ])
  container.appendChild(toast)
  setTimeout(() => {
    toast.classList.add('removing')
    toast.addEventListener('animationend', () => toast.remove(), { once: true })
  }, 3000)
}

function getToastContainer() {
  let container = $('.toast-container')
  if (!container) {
    container = el('div', { className: 'toast-container' })
    document.body.appendChild(container)
  }
  return container
}

// ===== API Layer =====
async function apiRequest(method, path = '', body = null) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
  }
  if (body) options.body = JSON.stringify(body)
  const url = path ? `${API_URL}/${path}` : API_URL
  const res = await fetch(url, options)
  if (!res.ok) {
    let msg = `Request failed (${res.status})`
    try {
      const err = await res.json()
      msg = err.message || err.error || msg
    } catch { /* use default */ }
    throw new Error(msg)
  }
  if (res.status === 204) return null
  return res.json()
}

async function fetchCourses() {
  return apiRequest('GET')
}

async function createCourse(data) {
  return apiRequest('POST', '', data)
}

async function updateCourse(id, data) {
  return apiRequest('PUT', id, data)
}

async function deleteCourse(id) {
  return apiRequest('DELETE', id)
}

// ===== Rendering =====
function renderApp() {
  $('#app').innerHTML = ''
  $('#app').appendChild(buildHeader())
  $('#app').appendChild(buildStats())
  $('#app').appendChild(buildCourseSection())
}

function buildHeader() {
  return el('header', { className: 'header' }, [
    el('div', { className: 'header-left' }, [
      el('div', { className: 'header-logo', textContent: '📚' }),
      el('div', { className: 'header-title' }, [
        el('h1', { textContent: 'CodeCraftHub' }),
        el('p', { textContent: 'Track your learning journey' }),
      ]),
    ]),
    el('div', { className: 'header-actions' }, [
      el('button', {
        className: 'btn btn-ghost',
        textContent: '↻ Refresh',
        onclick: () => loadCourses(),
      }),
      el('button', {
        className: 'btn btn-primary',
        textContent: '+ Add Course',
        onclick: () => openModal(),
      }),
    ]),
  ])
}

function buildStats() {
  const counts = {
    total: courses.length,
    notStarted: courses.filter((c) => c.status === '未开始').length,
    inProgress: courses.filter((c) => c.status === '进行中').length,
    completed: courses.filter((c) => c.status === '已完成').length,
  }
  return el('div', { className: 'stats' }, [
    statCard('📘', counts.total, 'Total Courses', 'var(--color-primary)'),
    statCard('⚪', counts.notStarted, 'Not Started', 'var(--color-text-muted)'),
    statCard('🔶', counts.inProgress, 'In Progress', 'var(--color-warning)'),
    statCard('✅', counts.completed, 'Completed', 'var(--color-success)'),
  ])
}

function statCard(icon, count, label, color) {
  return el('div', { className: 'stat-card' }, [
    el('div', { className: 'stat-icon', style: `background:${color}22;color:${color};`, textContent: icon }),
    el('div', { className: 'stat-info' }, [
      el('span', { textContent: String(count) }),
      el('small', { textContent: label }),
    ]),
  ])
}

function buildCourseSection() {
  const section = el('div', { className: 'course-section' })
  section.appendChild(renderCourseGrid())
  return section
}

function renderCourseGrid() {
  const grid = el('div', { className: 'course-grid' })
  if (courses.length === 0) {
    return el('div', { className: 'empty-state' }, [
      el('div', { className: 'empty-state-icon', textContent: '📭' }),
      el('h3', { textContent: 'No courses yet' }),
      el('p', { textContent: 'Click "Add Course" to start tracking your learning.' }),
    ])
  }
  courses.forEach((course, i) => {
    grid.appendChild(buildCourseCard(course, i))
  })
  return grid
}

function buildCourseCard(course, index) {
  const statusInfo = STATUS_MAP[course.status] || STATUS_MAP['未开始']
  const formattedDate = formatDate(course.target_date)

  return el('div', { className: 'course-card', style: `animation-delay:${index * 0.05}s` }, [
    el('div', { className: 'course-card-top' }, [
      el('div', { className: 'course-name', textContent: course.name }),
      el('div', { className: 'course-actions' }, [
        el('button', {
          className: 'btn btn-ghost btn-icon',
          textContent: '✎',
          title: 'Edit',
          onclick: () => openModal(course),
        }),
        el('button', {
          className: 'btn btn-danger btn-icon',
          textContent: '🗑',
          title: 'Delete',
          onclick: () => handleDelete(course),
        }),
      ]),
    ]),
    el('div', { className: 'course-description', textContent: course.description || 'No description' }),
    el('div', { className: 'course-meta' }, [
      el('div', { className: 'course-date' }, [
        el('span', { textContent: '📅' }),
        el('span', { textContent: formattedDate }),
      ]),
      el('span', { className: `badge ${statusInfo.class}`, textContent: statusInfo.label }),
    ]),
  ])
}

function formatDate(dateStr) {
  if (!dateStr) return 'No date'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

// ===== Modal (Create / Edit) =====
let currentEditingId = null

function openModal(course = null) {
  closeModal()
  currentEditingId = course ? course.id : null
  const isEdit = !!course

  const overlay = el('div', { className: 'modal-overlay', id: 'modal-overlay' })
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal()
  })

  const modal = el('div', { className: 'modal' }, [
    el('div', { className: 'modal-header' }, [
      el('h2', { textContent: isEdit ? 'Edit Course' : 'Add Course' }),
      el('button', { className: 'modal-close', textContent: '×', onclick: closeModal }),
    ]),
    el('div', { className: 'modal-body' }, [
      buildFormGroup('name', 'Course Name', 'text', course?.name || '', 'Enter course name'),
      buildFormGroup('description', 'Description', 'textarea', course?.description || '', 'Enter course description'),
      buildFormGroup('target_date', 'Target Date', 'date', course?.target_date || '', ''),
      buildStatusGroup(course?.status || '未开始'),
    ]),
    el('div', { className: 'modal-footer' }, [
      el('button', { className: 'btn btn-ghost', textContent: 'Cancel', onclick: closeModal }),
      el('button', { className: 'btn btn-primary', textContent: isEdit ? 'Save Changes' : 'Create Course', onclick: handleSubmit }),
    ]),
  ])

  overlay.appendChild(modal)
  document.body.appendChild(overlay)

  setTimeout(() => $('#name-input')?.focus(), 100)
}

function buildFormGroup(name, label, type, value, placeholder) {
  const group = el('div', { className: 'form-group' }, [
    el('label', { textContent: label }),
  ])
  const input =
    type === 'textarea'
      ? el('textarea', { id: `${name}-input`, placeholder, value })
      : el('input', { id: `${name}-input`, type, value, placeholder })
  group.appendChild(input)
  group.appendChild(el('div', { className: 'form-error', id: `${name}-error` }))
  return group
}

function buildStatusGroup(currentValue) {
  const group = el('div', { className: 'form-group' }, [
    el('label', { textContent: 'Status' }),
  ])
  const select = el('select', { id: 'status-input' })
  Object.keys(STATUS_MAP).forEach((status) => {
    const opt = el('option', { value: status, textContent: status })
    if (status === currentValue) opt.selected = true
    select.appendChild(opt)
  })
  group.appendChild(select)
  group.appendChild(el('div', { className: 'form-error', id: 'status-error' }))
  return group
}

function closeModal() {
  $('#modal-overlay')?.remove()
  currentEditingId = null
}

// ===== Validation =====
function validateForm() {
  let valid = true
  const fields = ['name', 'description', 'target_date', 'status']
  fields.forEach(clearFieldError)

  const name = $('#name-input').value.trim()
  if (!name) {
    showFieldError('name', 'Course name is required')
    valid = false
  } else if (name.length > 100) {
    showFieldError('name', 'Name must be 100 characters or less')
    valid = false
  }

  const description = $('#description-input').value.trim()
  if (!description) {
    showFieldError('description', 'Description is required')
    valid = false
  }

  const targetDate = $('#target_date-input').value
  if (!targetDate) {
    showFieldError('target_date', 'Target date is required')
    valid = false
  } else if (!isValidDate(targetDate)) {
    showFieldError('target_date', 'Please enter a valid date (YYYY-MM-DD)')
    valid = false
  }

  const status = $('#status-input').value
  if (!STATUS_MAP[status]) {
    showFieldError('status', 'Please select a valid status')
    valid = false
  }

  return valid
}

function isValidDate(dateStr) {
  const regex = /^\d{4}-\d{2}-\d{2}$/
  if (!regex.test(dateStr)) return false
  const d = new Date(dateStr)
  return !isNaN(d.getTime())
}

function showFieldError(field, message) {
  const input = $(`#${field}-input`)
  const error = $(`#${field}-error`)
  if (input) input.classList.add('invalid')
  if (error) {
    error.textContent = message
    error.classList.add('show')
  }
}

function clearFieldError(field) {
  const input = $(`#${field}-input`)
  const error = $(`#${field}-error`)
  if (input) input.classList.remove('invalid')
  if (error) {
    error.textContent = ''
    error.classList.remove('show')
  }
}

// ===== Form Submission =====
async function handleSubmit() {
  if (!validateForm()) return

  const data = {
    name: $('#name-input').value.trim(),
    description: $('#description-input').value.trim(),
    target_date: $('#target_date-input').value,
    status: $('#status-input').value,
  }

  try {
    if (currentEditingId !== null) {
      await updateCourse(currentEditingId, data)
      showToast('Course updated successfully', 'success')
    } else {
      await createCourse(data)
      showToast('Course created successfully', 'success')
    }
    closeModal()
    await loadCourses()
  } catch (err) {
    showToast(err.message || 'Failed to save course', 'error')
  }
}

// ===== Delete Handler =====
async function handleDelete(course) {
  if (!confirm(`Delete "${course.name}"? This cannot be undone.`)) return
  try {
    await deleteCourse(course.id)
    showToast('Course deleted', 'success')
    await loadCourses()
  } catch (err) {
    showToast(err.message || 'Failed to delete course', 'error')
  }
}

// ===== Data Loading =====
async function loadCourses() {
  const section = $('.course-section')
  if (section) {
    section.innerHTML = ''
    section.appendChild(el('div', { className: 'loading-state' }, [
      el('div', { className: 'spinner' }),
      el('p', { textContent: 'Loading courses...' }),
    ]))
  }

  try {
    courses = await fetchCourses()
    if (!Array.isArray(courses)) courses = []
    renderApp()
  } catch (err) {
    courses = []
    renderApp()
    showToast(err.message || 'Failed to load courses. Is the API running?', 'error')
  }
}

// ===== Init =====
renderApp()
loadCourses()