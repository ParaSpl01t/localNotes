const app = {
	init() {
		Element.prototype.qs = Element.prototype.querySelector
		Element.prototype.qsa = Element.prototype.querySelectorAll
		window.dqs = e => document.querySelector(e)
		window.dqsa = e => document.querySelectorAll(e)
		app.login.init()
		dqs('#toggleNav').onclick = e => {
			dqs('aside').classList.toggle('asidehide')
		}
		dqs('#upload').onclick = e => {
			app.file.save()
		}
		dqs('#newFile').onclick = e => {
			app.file.new()
		}
		app.file.init()
	},
	login: {
		init() {
			dqs('#showLogin').onclick = e => {
				app.login.show('Github token and Gist ID', {
					focus: 'token',
					prefill: 'true',
				})
			}
			if (!localStorage.skip) app.login.check()
		},
		check() {
			if (localStorage.token && localStorage.gist) {
				app.refresh()
			} else {
				app.login.show('Please add Github token and Gist ID')
			}
		},
		show(msg, o = {}) {
			o.focus = o.focus || 'token'
			o.prefill = o.prefill || 'false'

			let login = dqs('.login')

			let saveInfo = login.qs('#saveInfo')

			let tokenInput = login.qs('[name=token]')
			let gistInput = login.qs('[name=gist]')

			if (o.prefill == 'true') {
				tokenInput.value = localStorage.token
				gistInput.value = localStorage.gist
			}

			login.classList.remove('hide')
			login.qs('.msg').innerHTML = msg

			login.qs(`[name=${o.focus}]`).focus()

			saveInfo.onclick = e => {
				localStorage.token = tokenInput.value
				localStorage.gist = gistInput.value
				app.refresh()
				login.classList.add('hide')
			}
		},
	},
	file: {
		init() {
			let editor = dqs('textarea')
			editor.onkeyup = e => {
				app.file.lines()
				let fd = JSON.parse(localStorage.files)
				fd[editor.dataset.filename].content = editor.value
				localStorage.files = JSON.stringify(fd)
			}
		},
		new() {
			let filename = prompt('Enter the name of the file')
			filename = filename?.trim()
			if (filename) {
				let fd = JSON.parse(localStorage.files)
				fd[filename] = {}
				fd[filename].content = 'New'
				localStorage.files = JSON.stringify(fd)
			}
			app.loadList()
			app.file.load(filename)
		},
		load(file) {
			let editor = dqs('textarea')
			let content = JSON.parse(localStorage.files)[file].content

			editor.value = content
			editor.dataset.filename = file
			editor.dataset.newname = file

			app.file.lines()
		},
		lines() {
			let editor = dqs('textarea')
			let lines = editor.value.split('\n').length
			const bytes = new TextEncoder().encode(editor.value).length
			dqs('footer>.details').innerHTML = `Lines : ${lines}, Size : ${
				bytes <= 500 ? bytes + ' B' : (bytes / 1000).toFixed(1) + ' KB'
			}`
		},
		save() {
			let btn = dqs('#save')

			let editor = dqs('textarea')
			let newname = editor.dataset.newname

			let updated = {
				files: JSON.parse(localStorage.files),
			}

			updated.files['localnotes'] = {
				content: String(Math.random()),
			}

			fetch('https://api.github.com/gists/' + localStorage.gist, {
				body: JSON.stringify(updated),
				headers: {
					Accept: 'application/vnd.github+json',
					Authorization: 'Bearer ' + localStorage.token,
					'Content-Type': 'application/x-www-form-urlencoded',
				},
				method: 'PATCH',
			})
				.then(res => res.json())
				.then(data => {
					editor.dataset.filename = newname
					editor.dataset.newname = newname
				})
		},
	},
	refresh() {
		fetch('https://api.github.com/gists/' + localStorage.gist, {
			headers: {
				Accept: 'application/vnd.github+json',
				Authorization: 'Bearer ' + localStorage.token,
			},
		})
			.then(res => res.json())
			.then(data => {
				app.handleData(data)
			})
	},
	handleData(data) {
		if (data.message) {
			if (data.message === 'Not Found') {
				app.login.show('Gist ID is not Valid', {
					focus: 'gist',
					prefill: 'true',
				})
			} else if (data.message === 'Bad credentials') {
				app.login.show('Token is not valid', {
					focus: 'token',
					prefill: 'true',
				})
			}
		} else {
			let files = data.files
			let cache = {}
			Object.keys(files).map(key => {
				cache[key] = {
					filename: files[key].filename,
					content: files[key].content,
				}
			})
			localStorage.files = JSON.stringify(cache)
			app.loadList()
		}
	},
	loadList() {
		let files = JSON.parse(localStorage.files)
		let list = dqs('aside')

		list.innerHTML = ''
		Object.keys(files).forEach(file => {
			if (file !== 'localnotes')
				list.insertAdjacentHTML(
					'afterbegin',
					`<button onclick="app.file.load('${file}')" class="file">${file}</button>`
				)
		})
	},
}

document.addEventListener('DOMContentLoaded', e => {
	app.init()
})
