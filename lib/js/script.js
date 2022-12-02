const app = {
	init() {
		Element.prototype.qs = Element.prototype.querySelector
		Element.prototype.qsa = Element.prototype.querySelectorAll
		window.dqs = e => document.querySelector(e)
		window.dqsa = e => document.querySelectorAll(e)
	},
}

document.addEventListener('DOMContentLoaded', e => {
	app.init()
})
