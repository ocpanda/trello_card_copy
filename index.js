async function hyperlinkCopy(title, url) {
  return new Promise((resolve, reject) => {
    try {
      const text = new Blob([title], { type: 'text/plain' })
      const href = new Blob([`<a href="${url}">${title}</a>`], {
        type: 'text/html'
      });

      const item = new window.ClipboardItem({
        'text/plain': Promise.resolve(text),
        'text/html': Promise.resolve(href)
      })
      navigator.clipboard.write([item]).then(() => {
        resolve(true)
      })
    } catch (error) {
      console.error('Could not copy text: ', error)
      reject(false)
    }
  })
}

class Trello {
  #target
  #customNodes

  constructor() {
    this.#initTarget()
    this.#customNodes = {}
  }

  #initTarget() {
    const _self = this

    this.#target = new Proxy({}, {
      get: function (obj, prop) {
        return obj[prop]
      },
      set: function (obj, prop, target) {
        if (prop in _self.#customNodes) {
          const node = _self.#customNodes[prop](prop)

          if (node !== undefined) {
            target.insertBefore(node, target.firstChild)
          }
        }
        obj[prop] = target

        return true
      },
    })
  }

  adaption(prop, equipment) {
    this.#target[prop] = equipment
  }

  installCustom(prop, equipment) {
    this.#customNodes[prop] = equipment
  }

  detailCardListener(instance, func) {
    window.addEventListener("message", (event) => {
      const eventFunnels = [
        function isTargetTrello() {
          const regexp = new RegExp(/\/\/trello.com/g)
          return regexp.test(event.origin)
        },
        function isOnDetailCard() {
          const detailCard = event.target.document.querySelector('.card-detail-window')
          return ![undefined, null].includes(detailCard)
        }
      ]

      if (eventFunnels.some(funnel => funnel() === false)) {
        return
      }

      if (func) func.apply(instance)
    })
  }

  listeners() {
    this.detailCardListener()
  }
}

class TrelloLinkCopy extends Trello {
  #prop

  constructor() {
    super()
    this.#prop = 'linkCopy'
    this.listeners()
    this.installCustom(this.#prop, this.#makeNode)
  }

  listeners() {
    this.detailCardListener(this, this.#adaptTarget)
  }

  #adaptTarget() {
    this.adaption(this.#prop, document.querySelector('.window-sidebar'))
  }

  #makeNode(prop) {
    if (document.querySelector(`.${prop}`)) return undefined

    const copyButton = document.createElement('a')
    copyButton.className = `button-link ${prop}`
    copyButton.innerHTML = 'Copy hyperlink'

    copyButton.onclick = async function copyWithHyperlink(e) {
      // make title
      const titleNode = document.querySelector('.window-title')
      if (!titleNode) return
      const title = titleNode.querySelector('h2').innerHTML

      // make link
      let link = window.location.href.split('/')
      if (link[link.length - 1].match(/[\?%]/g)) link.pop()
      link = link.join('/')

      // copy to clipboard
      const isSuccess = await hyperlinkCopy(title, link)

      if (isSuccess) {
        copyButton.innerHTML = 'Successfully copied'
        setTimeout(() => {
          copyButton.innerHTML = 'Copy hyperlink'
        }, 3000)
      }

      e.preventDefault()
    }
    return copyButton
  }
}

; (function () {
  new TrelloLinkCopy()
})()
