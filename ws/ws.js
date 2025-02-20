const clientId = randomId(7)
document.getElementById('clientId').textContent = clientId

const commonServers = [
  'ws://127.0.0.1:1218',
  'ws://192.168.1.80:1218',
  'wss://127.0.0.1:1218',
  'wss://192.168.1.80:1218'
]
const urlInput = document.getElementById('urlInput')
const autocompleteList = document.getElementById('autocompleteList')
const output = document.getElementById('output')
let currentIndex = -1
let currentMatchedItems = []
let history = JSON.parse(localStorage.getItem('serverHistory')) || []

urlInput.addEventListener('input', (e) => {
  currentIndex = -1
  
  const value = e.target.value.trim()
  autocompleteList.innerHTML = ''
  if (!value) return

  const allSuggestions = Array.from(new Set([...history, ...commonServers]))

  const matched = allSuggestions.filter(item => 
    item.toLowerCase().includes(value.toLowerCase())
  )

  matched.forEach(item => {
    const div = document.createElement('div')
    div.className = 'autocomplete-item'
    div.textContent = item
    div.onclick = () => {
      urlInput.value = item
      autocompleteList.innerHTML = ''
      saveToHistory(item)
    }
    autocompleteList.appendChild(div)
  })
})

urlInput.addEventListener('blur', () => {
  setTimeout(() => {
    autocompleteList.innerHTML = ''
  }, 200)
})

urlInput.addEventListener('keydown', (e) => {
  const items = autocompleteList.querySelectorAll('.autocomplete-item')
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    currentIndex = (currentIndex >= items.length - 1) ? 0 : currentIndex + 1
    updateSelection(items)
  }
  
  if (e.key === 'ArrowUp') {
    e.preventDefault()
    currentIndex = (currentIndex <= 0) ? items.length - 1 : currentIndex - 1
    updateSelection(items)
  }
  
  if (e.key === 'Enter') {
    e.preventDefault()
    if (currentIndex > -1 && items[currentIndex]) {
        items[currentIndex].click()
    }
  }
})

function appendOutput(text) {
  output.textContent += text + '\n'
}

function openSignaling (url) {
  appendOutput('Connecting to ' + url)
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url)

    ws.onopen = () => resolve(ws)
    ws.onerror = () => {
      reject(new Error('WebSocket error'))
    }
    ws.onclose = () => {
      appendOutput('WebSocket disconnected')
    }
    ws.onmessage = (e) => {
      if (typeof (e.data) !== 'string') return

      appendOutput(e.data)
    }
  })
}

function randomId (length) {
  // base58
  const characters = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
  const pickRandom = () => characters.charAt(Math.floor(Math.random() * characters.length))
  return [...Array(length)].map(pickRandom).join('')
}

function saveToHistory(item) {
  if (!history.includes(item)) {
    history.unshift(item)
    localStorage.setItem('serverHistory', JSON.stringify(history))
  }
}

function start() {
  let prefix = urlInput.value
  if (prefix.length < 8) return
  if (!prefix.endsWith('/')) prefix += '/'
  const url = prefix + clientId
  openSignaling(url).then((ws) => {
    appendOutput('WebSocket connected, signaling ready')
    saveToHistory(urlInput.value)
  }).catch((err) => {
    appendOutput(err)
  })
}

function updateSelection(items) {
  items.forEach(item => item.classList.remove('active'))
  
  if (items[currentIndex]) {
    items[currentIndex].classList.add('active')
    items[currentIndex].scrollIntoView({
      block: 'nearest',
      behavior: 'auto'
    })
  }
}