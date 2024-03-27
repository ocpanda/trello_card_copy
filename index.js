const copyToClipboard = (message, text, element) => {
  navigator.clipboard.writeText(text).then(function () {
    element.innerHTML = 'Successfully copied'
    setTimeout(() => {
      element.innerHTML = `Copy ${message}`
    }, 3000)
    console.log(`Successfully copied ${message} to clipboard`);
  }).catch(function (error) {
    console.error('Could not copy text: ', error);
  });
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

class TrelloTitleCopy extends Trello {
  #prop

  constructor() {
    super()
    this.#prop = 'titleCopy'
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
    copyButton.innerHTML = 'Copy title'

    copyButton.onclick = function copyWithHyperlink(e) {
      // make title
      const titleNode = document.querySelector('.window-title')
      if (!titleNode) return
      const title = titleNode.querySelector('h2').innerHTML

      // copy to clipboard
      copyToClipboard('title', title, copyButton)

      e.preventDefault()
    }
    return copyButton
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
    copyButton.innerHTML = 'Copy link'

    copyButton.onclick = function copyWithHyperlink(e) {
      // make link
      let link = window.location.href.split('/')
      link.pop()
      link = link.join('/')

      // copy to clipboard
      copyToClipboard('link', link, copyButton)

      e.preventDefault()
    }
    return copyButton
  }
}

; (function () {
  new TrelloTitleCopy()
  new TrelloLinkCopy()
})()
